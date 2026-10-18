# SPEC — Interfaz web (`apps/web`)

> Fuente de verdad de la UI. El motor (`@avalancha/engine`) hace toda la matemática;
> la web solo captura datos, los traduce al modelo del motor y muestra resultados.

## 1. Brief

- **Para quién:** personas asalariadas en Colombia con varias deudas (tarjetas, libre
  inversión, vehículo) que quieren saber cuándo quedan libres y cómo pagar menos intereses.
- **El trabajo principal de la pantalla:** responder en un vistazo
  **"¿cuándo quedo libre de deudas y cuánto me ahorro haciéndolo bien?"**
- **El trabajo secundario:** enseñar. Cada concepto financiero (E.A., trampa de mínimos,
  avalancha vs. bola de nieve) se explica en una línea, justo donde aparece.
- **Privacidad:** local-first. Nada sale del navegador. Sin analítica, sin fuentes ni
  scripts de terceros en tiempo de ejecución.

## 2. Arquitectura

```
apps/web/src/
  main.tsx, App.tsx
  plan/         estado del formulario (useReducer), adaptador formulario → motor, persistencia
  format/       moneda COP, porcentajes y fechas en es-CO
  i18n/         textos de validación: Record<ValidationCode, string>
  components/   DebtList, DebtRow, BudgetField, FreedomHero (montaña), StrategyTable,
                PayoffTimeline, Schedule, TrapNotice
  styles/       tokens.css (variables), global.css; un .module.css por componente
```

Reglas:
- La web importa **solo** la API pública de `@avalancha/engine`. Cero fórmulas financieras
  en la web: si hace falta una nueva (p. ej. M.V. → E.A.), va al motor con spec y tests.
- El formulario guarda **lo que el usuario escribió** (strings). Un adaptador puro
  (`plan/toEngineInput.ts`) lo convierte a `Debt[]` + `monthlyBudget`. Ese adaptador
  tiene tests unitarios. (Es el puerto/adaptador de la arquitectura hexagonal.)
- El motor ya valida: la web **no duplica validaciones de negocio**. Muestra los
  `ValidationIssue` del motor mapeando `path` → campo y `code` → texto en español.
- `i18n/validationMessages.ts` es un `Record<ValidationCode, string>`: si mañana el motor
  agrega un código, el typecheck de la web falla hasta que alguien escriba el texto.
- Cálculo en vivo con `useMemo` sobre la entrada ya convertida. Sin debounce: 20 deudas ×
  600 meses es trivial.

## 3. Captura de datos

### Cada deuda
| Campo | Entrada | Notas |
|---|---|---|
| Nombre | texto | Si está vacío, se muestra "Deuda 1", "Deuda 2"… |
| Saldo | pesos | `inputMode="numeric"`. Acepta `4.500.000`, `4500000` o `$4.500.000`. |
| Tasa | porcentaje | Acepta coma o punto decimal (`28,5` o `28.5`). |
| Tipo de tasa | E.A. / M.V. | Por defecto E.A. Si es M.V., se convierte con la función del motor. |
| Cuota mínima | pesos | Igual que saldo. |

- Ids con `crypto.randomUUID()`. Máximo 20 deudas (el botón de agregar se desactiva).
- Texto de ayuda del tipo de tasa: *"Tu extracto suele traer las dos. La E.A. es la que
  realmente crece tu deuda en un año."*

### Plan
- **Presupuesto mensual:** "¿Cuánto puedes destinar en total a tus deudas cada mes?"
- **Primer pago:** selector de mes y año; por defecto, el mes siguiente al actual. Con él,
  el "mes N" del motor se convierte en fecha: `marzo de 2028`.
- **Botón "Cargar ejemplo":** llena el caso ficticio `tres-deudas-clasico` de los casos
  dorados (Tarjeta A, Libre inversión, Tarjeta B; presupuesto $1.300.000).
- **Botón "Borrar mis datos":** limpia el formulario y el almacenamiento, con confirmación.

### Persistencia
- `localStorage`, clave `avalancha:plan:v1`, objeto `{ version: 1, ... }` con lo que el
  usuario escribió.
- Toda lectura y escritura dentro de `try/catch`. Si falla o la forma no coincide, se
  arranca vacío sin romper la app.

## 4. Estados del resultado

Se calculan las tres estrategias con `compareStrategies`. El usuario elige cuál ver en
detalle (por defecto, avalancha).

| Resultado del motor | Qué muestra la UI |
|---|---|
| Sin deudas | Estado vacío: *"Agrega tu primera deuda o carga un ejemplo para ver cómo funciona."* |
| `INVALID_INPUT` | Mensaje en el campo exacto (según `path`). Resultados en pausa. |
| `INVALID_BUDGET` | En el presupuesto: *"Para cubrir los mínimos necesitas al menos $X al mes."* |
| `NOT_PAYABLE` | Hero alterno: *"Con estos pagos, esta deuda no se termina de pagar."* + `TrapNotice`. |
| `PAID_OFF` | Hero con la fecha de libertad, comparación, orden de pago y cronograma. |

`TrapNotice` (warning `MINIMUM_BELOW_INTEREST`): nombra la deuda y explica en una línea:
*"La cuota mínima de Tarjeta grande no alcanza a cubrir los intereses del mes: la deuda
crece aunque pagues."*

## 5. Pantalla de resultados

1. **FreedomHero — la montaña.** El elemento memorable de la app. Un SVG propio (sin
   librería de gráficas) con el saldo total mes a mes: una cresta por estrategia que baja
   hasta cero. La estrategia seleccionada se rellena; las otras van en línea. Donde la
   seleccionada toca cero, un marcador con la fecha: **"Libre en marzo de 2028"**, en la
   tipografía grande. Debajo, una línea: *"Pagarás $2.844.122 en intereses: $2.798.238
   menos que pagando solo los mínimos."*
   - Accesible: `<figure>` con `<figcaption>` que dice lo mismo en texto.
   - Una sola animación en toda la app: la cresta se dibuja una vez al aparecer el primer
     resultado. Desactivada con `prefers-reduced-motion`.
2. **StrategyTable.** Una tabla, no tarjetas. Filas: Avalancha, Bola de nieve, Solo
   mínimos. Columnas: Libre en · Meses · Intereses totales · Ahorro frente a solo mínimos.
   La fila seleccionada se resalta; clic en una fila la selecciona. Una línea por
   estrategia explicando qué hace.
3. **PayoffTimeline.** Lista ordenada (sí es una secuencia): qué deuda se cierra y cuándo.
4. **Schedule.** `<details>` cerrado por defecto: "Ver el plan mes a mes". Tabla con mes,
   deuda, saldo inicial, interés, pago, saldo final. Muestra 24 meses y un botón
   "Mostrar todos los meses".
5. **Nota al pie:** *"Avalancha es un simulador educativo, no asesoría financiera. Tu banco
   puede calcular distinto: cuotas de manejo, seguros o cambios de tasa."*

## 6. Diseño

### Concepto
La deuda es una montaña y pagarla es bajarla. La app usa el vocabulario visual de la
alta montaña: nieve, pizarra, glaciar y la señal ámbar de los boletines de avalanchas.
La montaña del hero es lo único llamativo; todo lo demás es sobrio y numérico.

### Color (tokens en `styles/tokens.css`)
| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--nieve` | `#F2F5F7` | `#14222C` | Fondo |
| `--pizarra` | `#1C2A35` | `#E6EDF1` | Texto principal |
| `--roca` | `#6E7D89` | `#93A3AF` | Texto secundario, "Solo mínimos" |
| `--glaciar` | `#2C6A8A` | `#6FB1D2` | Acento, avalancha, foco |
| `--hielo` | `#A9C8D8` | `#3C6278` | Bola de nieve, rellenos suaves |
| `--senal` | `#D99A1E` | `#E8B54A` | Alertas (trampa de mínimos) |

- Modo oscuro con `prefers-color-scheme`; el `body` siempre con fondo explícito.
- Contraste AA mínimo en todo texto. El color nunca es la única señal: las líneas de la
  montaña también se distinguen por grosor y trazo (sólida, discontinua, punteada).

### Tipografía
- **Una sola familia: Archivo** (variable, con eje de ancho), autoalojada con
  `@fontsource-variable/archivo` para no llamar a Google en tiempo de ejecución.
- La fecha de libertad en Archivo **expandida** (`font-stretch: 125%`) y peso 800; el resto
  en ancho normal. El contraste de ancho es la personalidad, no una segunda fuente.
- Todos los números con `font-variant-numeric: tabular-nums`; en tablas, alineados a la
  derecha.
- Escala modular 1.25. Líneas de texto de menos de 70 caracteres.

### Layout
```
Escritorio (≥ 960px)
┌──────────────────────────────────────────────────────────┐
│ Avalancha                Tus datos se quedan en este navegador │
├────────────────────┬─────────────────────────────────────┤
│ Tus deudas         │  ╱╲                                  │
│  Tarjeta A   ...   │ ╱  ╲___                              │
│  Libre inv.  ...   │        ╲____                         │
│  + Agregar deuda   │             ╲____● Libre en          │
│                    │                    marzo de 2028     │
│ Presupuesto        │  Pagarás $2.844.122 en intereses...  │
│ Primer pago        │                                      │
│ (columna fija)     │  Estrategia   Libre en  Meses  ...   │
│                    │  1. Tarjeta A, abril de 2027 ...     │
│                    │  ▸ Ver el plan mes a mes             │
└────────────────────┴─────────────────────────────────────┘
Móvil: una columna; formulario arriba, resultados abajo; márgenes laterales de 16px.
```
Todo alineado a la izquierda. La columna del formulario es `position: sticky` en escritorio.

### Lo que NO va
Tarjetas idénticas con sombra para todo, degradados decorativos, etiquetas en
MAYÚSCULAS, flechas `→` en los botones, animaciones de entrada en cada sección, fuentes
monoespaciadas para datos.

### Calidad mínima
Responsive hasta 360px sin scroll horizontal, foco de teclado visible (`--glaciar`),
todos los inputs con `<label>`, errores conectados con `aria-describedby`,
`prefers-reduced-motion` respetado.

## 7. Voz y textos

- Español de Colombia, tuteo, frases cortas, en positivo y en voz activa.
- Los botones dicen lo que hacen: "Agregar deuda", "Cargar ejemplo", "Borrar mis datos".
- Los errores dicen qué pasó y cómo arreglarlo; nunca piden disculpas.
- Formato: dinero con `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP',
  maximumFractionDigits: 0 })`; fechas con `Intl.DateTimeFormat('es-CO', { month: 'long',
  year: 'numeric' })`.
  - ⚠️ El formato de moneda es-CO separa el `$` con un **espacio no separable** (` `):
    `"$ 2.844.122"`. Los tests deben normalizarlo o buscar con regex.

## 8. Fuera de alcance (v1)

Cuentas de usuario, sincronización, backend, cadencia quincenal, cuotas de manejo,
exportar a PDF/Excel.
