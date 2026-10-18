# SPEC — Motor de simulación de deudas (`packages/engine`)

> Fuente de verdad del dominio. Si el código y esta spec no coinciden, gana la spec
> (o se actualiza la spec primero, con intención, y se regeneran los casos dorados).

## 1. Propósito

Dado un conjunto de deudas, un presupuesto mensual y una estrategia, simular mes a mes
cómo se pagan y responder: **¿en cuántos meses quedo libre, cuánto pago de intereses
y en qué orden se cierra cada deuda?**

El motor es TypeScript puro: sin I/O, sin dependencias de runtime, sin fechas reales
(trabaja con "mes 1, mes 2…"; la UI convierte a calendario).

## 2. Modelo de dominio

```ts
type Strategy = 'avalanche' | 'snowball' | 'minimum-only';

interface Debt {
  id: string;                  // único dentro del plan
  name: string;
  balance: number;             // saldo actual, pesos COP enteros (> 0)
  annualEffectiveRate: number; // tasa efectiva anual como decimal: 0.28 = 28 % E.A.
  minimumPayment: number;      // cuota mínima mensual, pesos enteros (> 0)
}

interface PlanInput {
  debts: Debt[];               // 1..20 deudas
  monthlyBudget: number;       // total disponible al mes para TODAS las deudas, pesos enteros
  strategy: Strategy;
}
```

### Reglas de dinero
- Todo valor monetario es **entero en pesos**. Nada de centavos ni floats acumulados.
- Las tasas sí son `number` decimales; el único redondeo ocurre al calcular el interés del mes.
- Redondeo: **half-up a peso entero** (`Math.round` para valores positivos).

## 3. Conversión de tasas

En Colombia las tasas se anuncian en **efectiva anual (E.A.)**, pero el interés se causa cada mes.

```
tasaMensual = (1 + EA)^(1/12) − 1
```

⚠️ **No** es `EA / 12`. Ejemplo: 28 % E.A. → 2,0785 % mensual (no 2,333 %).
Los valores esperados están en `rateConversions` de los casos dorados (tolerancia `1e-12`).

Conversión inversa, para cuando el extracto trae la tasa **mes vencido (M.V.)**:

```
tasaEA = (1 + tasaMensual)^12 − 1
```

La ida y vuelta E.A. → mensual → E.A. puede diferir en el orden de `1e-15` por punto flotante
(ej. `0.28` vuelve como `0.2799999999999998`). Por eso los tests comparan con tolerancia
`1e-12` y la UI redondea al mostrar.

## 4. Orden de prioridad (se calcula UNA vez, al inicio)

| Estrategia | Criterio principal | Desempate 1 | Desempate 2 |
|---|---|---|---|
| `avalanche` | mayor `annualEffectiveRate` | menor `balance` inicial | `id` ascendente |
| `snowball` | menor `balance` inicial | mayor `annualEffectiveRate` | `id` ascendente |
| `minimum-only` | `id` ascendente | — | — |

El orden es fijo durante toda la simulación (así funciona el método clásico).
"`id` ascendente" compara por código de carácter, no por idioma (ver §6, decisión 3).

## 5. Algoritmo mensual

Para `mes = 1, 2, …` mientras quede alguna deuda con saldo > 0:

1. **Intereses.** Para cada deuda activa: `interés = round(saldo × tasaMensual)`; `saldo += interés`.
2. **Mínimos.** Para cada deuda activa, en orden de prioridad: `pago = min(cuotaMínima, saldo)`.
   Se descuenta del saldo y del disponible del mes (`disponible` arranca en `monthlyBudget`).
3. **Excedente en cascada** (solo `avalanche` y `snowball`): el disponible restante va a la
   primera deuda activa según prioridad; si la cierra, lo que sobra pasa a la siguiente, etc.
4. Una deuda queda **pagada** el mes en que su saldo llega a 0.

Consecuencia clave (el "efecto avalancha"): como el presupuesto es constante, la cuota mínima
de una deuda cerrada se libera y se suma automáticamente al excedente de los meses siguientes.

`minimum-only` es la **línea base** para comparar: paga solo los mínimos, **ignora
`monthlyBudget`** y la plata liberada NO se redistribuye.

## 6. Validaciones y estados

```ts
type SimulationResult =
  | { status: 'PAID_OFF'; warnings: Warning[]; months: number; totalInterest: number;
      totalPaid: number; payoffOrder: { debtId: string; month: number }[];
      schedule: MonthRow[] }
  | { status: 'NOT_PAYABLE'; monthsSimulated: 600; warnings: Warning[] }
  | { status: 'INVALID_BUDGET'; minimumRequired: number }
  | { status: 'INVALID_INPUT'; issues: ValidationIssue[] };

type ValidationCode =
  | 'DUPLICATE_ID' | 'NOT_POSITIVE_INTEGER' | 'NOT_FINITE'
  | 'RATE_OUT_OF_RANGE' | 'NO_DEBTS' | 'TOO_MANY_DEBTS';

interface ValidationIssue { path: string; code: ValidationCode } // sin texto: la UI traduce

interface MonthRow {
  month: number;
  rows: { debtId: string; openingBalance: number; interest: number;
          payment: number; closingBalance: number }[]; // solo deudas activas ese mes, en orden de prioridad
}

type Warning = { code: 'MINIMUM_BELOW_INTEREST'; debtId: string };
```

- `INVALID_INPUT`: ids duplicados, montos no enteros o ≤ 0, tasa < 0 o > 2 (200 % E.A.),
  0 deudas o más de 20. Se valida antes que todo lo demás. El motor devuelve solo `path` y
  `code`; los textos en español son responsabilidad de la UI.
- `INVALID_BUDGET`: `monthlyBudget < Σ cuotaMínima` (no aplica a `minimum-only`).
- `NOT_PAYABLE`: tras **600 meses** (50 años) aún queda saldo.
- `MINIMUM_BELOW_INTEREST`: la cuota mínima ≤ interés del primer mes
  (`round(balanceInicial × tasaMensual)`). Lista ordenada por `id`. Es una alerta, no un error.
- `payoffOrder`: ordenado por mes; empates en el mismo mes según el orden de prioridad.

### Códigos de `INVALID_INPUT`

| Regla | `path` | `code` |
|---|---|---|
| 0 deudas | `debts` | `NO_DEBTS` |
| Más de 20 deudas | `debts` | `TOO_MANY_DEBTS` |
| `id` repetido (2.ª aparición en adelante) | `debts[i].id` | `DUPLICATE_ID` |
| `balance`, `minimumPayment` o `monthlyBudget` es `NaN` o ±`Infinity` | `debts[i].balance`, `debts[i].minimumPayment`, `monthlyBudget` | `NOT_FINITE` |
| Esos mismos campos finitos pero no enteros, o ≤ 0 | ídem | `NOT_POSITIVE_INTEGER` |
| `annualEffectiveRate` es `NaN` o ±`Infinity` | `debts[i].annualEffectiveRate` | `NOT_FINITE` |
| `annualEffectiveRate` < 0 o > 2 | `debts[i].annualEffectiveRate` | `RATE_OUT_OF_RANGE` |

Se reportan **todos** los problemas (no solo el primero), como máximo uno por campo, en este
orden fijo: cantidad de `debts`, luego `monthlyBudget`, luego cada deuda en el orden de entrada
(`id`, `balance`, `minimumPayment`, `annualEffectiveRate`).

### Decisiones

1. **Presupuesto validado siempre.** `monthlyBudget` debe ser entero > 0 en todas las
   estrategias, incluso en `minimum-only`, aunque esa estrategia luego lo ignore.
2. **`NaN` e `Infinity`.** Un número no finito produce `NOT_FINITE`, distinto de los errores de
   rango (`RATE_OUT_OF_RANGE`) o de entero (`NOT_POSITIVE_INTEGER`).
3. **Orden de `id` por código de carácter.** "`id` ascendente" (§4 y §6) compara unidades de
   código UTF-16 (`<` / `>`), **no** `localeCompare`. Así, `'B' < 'a'` y `'d10' < 'd9'`.
   Es determinista e independiente del idioma del navegador.
5. **Pago en el mes 600 = `PAID_OFF`.** Si la última deuda se cierra justo en el mes 600, el
   resultado es `PAID_OFF` con `months: 600`. `NOT_PAYABLE` solo aplica si queda saldo al
   terminar el mes 600.

## 7. API pública del paquete

```ts
toMonthlyRate(annualEffectiveRate: number): number
toAnnualEffectiveRate(monthlyRate: number): number
simulate(input: PlanInput): SimulationResult
compareStrategies(debts: Debt[], monthlyBudget: number): {
  avalanche: SimulationResult;
  snowball: SimulationResult;
  minimumOnly: SimulationResult;
}
```

## 8. Casos dorados

`packages/engine/test/fixtures/golden-cases.json` fue generado por una implementación de referencia independiente
(`tools/golden-generator/`). Cada caso trae `debts`, `monthlyBudget` y el resultado esperado para las tres
estrategias. Los tests comparan **exacto** (pesos enteros): `status`, `warnings`, `months`,
`totalInterest`, `totalPaid`, `payoffOrder` y las filas de los meses en `firstMonths`
contra `schedule[0..1]`.

| Caso | Qué enseña |
|---|---|
| `un-credito-simple` | Con una sola deuda las tres estrategias son idénticas |
| `tres-deudas-clasico` | Avalancha ahorra intereses; bola de nieve cierra la primera deuda antes |
| `mismo-orden` | Si la deuda más chica también es la más cara, avalancha = bola de nieve |
| `trampa-de-minimos` | Mínimo ≤ interés: la deuda nunca se paga |
| `presupuesto-insuficiente` | Validación del presupuesto |

> Si algún día un caso difiere en exactamente 1 peso en un interés, sospechar de
> redondeo de punto flotante en un valor que cae justo en ,5 antes de culpar a la lógica.

## 9. Simplificaciones conocidas (v1)

- Cuota mínima fija (en tarjetas reales varía con el saldo).
- Tasas constantes (sin cambios de tasa ni tope de usura variable).
- Sin cuota de manejo, seguros ni compras diferidas a cuotas dentro de una tarjeta.
- Cadencia mensual. La cadencia quincenal (pagos día 5 y día 20) queda para v2.

## 10. Glosario para aprender

- **E.A. (efectiva anual):** lo que realmente crece una deuda en un año, ya con capitalización.
- **Tasa mensual vencida:** la que se aplica cada mes; se deriva de la E.A. con la fórmula de §3.
- **Amortización:** la parte de la cuota que baja capital (cuota − interés).
- **Avalancha:** atacar primero la deuda más cara. Óptima en plata.
- **Bola de nieve:** atacar primero la deuda más pequeña. Victorias rápidas y motivación.
- **Costo de oportunidad:** lo que dejás de ganar por usar la plata en otra cosa.
