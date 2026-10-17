# Prompts del Día 1 — Motor de cálculo

Pegalos uno a la vez. Cada uno en **Plan Mode** (Shift+Tab en el panel del agente):
leé el plan, corregilo si hace falta y solo ahí aprobá.

---

## Prompt 1 — Esqueleto del monorepo

```
Lee AGENTS.md y docs/SPEC-engine.md.

Crea el esqueleto del monorepo, SIN lógica de negocio todavía:
- pnpm workspaces + Turborepo, Node 22, TypeScript strict, ESM.
- Paquete packages/engine con nombre @avalancha/engine, Vitest configurado,
  scripts test y typecheck.
- Scripts raíz: test y typecheck vía turbo.
- Un test trivial que pase, para validar que todo corre.

No toques packages/engine/test/fixtures/ ni tools/.
Al final ejecuta pnpm install y pnpm test y muéstrame la salida.
```

Commit sugerido: `chore: scaffold pnpm + turborepo monorepo`

---

## Prompt 2 — Tests de los casos dorados (en rojo)

```
Lee docs/SPEC-engine.md secciones 6, 7 y 8.

Escribe SOLO los tests (todavía sin implementación) en packages/engine/test/:
1. rates.test.ts: toMonthlyRate contra rateConversions del fixture, tolerancia 1e-12.
2. golden.test.ts: por cada caso y cada estrategia de golden-cases.json, llama simulate()
   y compara exacto status, warnings, months, totalInterest, totalPaid, payoffOrder y
   minimumRequired cuando aplique. Compara firstMonths contra schedule[0..1].
   Mapea la clave "minimum-only" del fixture a strategy 'minimum-only'.
3. Usa test.each para que cada combinación caso×estrategia sea un test con nombre legible.

Crea src/index.ts exportando las firmas de la sección 7 con "throw new Error('not implemented')".
Corre los tests: deben compilar y FALLAR. Muéstrame la salida.

Ajustes:
- Para importar el JSON, habilita "resolveJsonModule": true en tsconfig si hace falta,
  y verifica que pnpm typecheck pase.
- Define un tipo TypeScript para la forma del fixture en test/; nada de any ni casts a any.

```

Commit sugerido: `test(engine): add golden cases as failing specs`

---

## Prompt 3 — Implementación

```
Implementa el motor en packages/engine/src siguiendo docs/SPEC-engine.md al pie de la letra:
- rates.ts: toMonthlyRate
- validation.ts: INVALID_INPUT e INVALID_BUDGET
- priority.ts: orden por estrategia con los desempates de la sección 4
- simulate.ts: el algoritmo mensual de la sección 5, NOT_PAYABLE a los 600 meses,
  warnings MINIMUM_BELOW_INTEREST
- compare.ts: compareStrategies
- index.ts: solo re-exporta la API pública

Reglas: funciones puras, cero dependencias, nada de any.
Si un test falla, arregla el motor; nunca el fixture. Si crees que la spec está mal,
detente y explícame por qué antes de cambiar nada.
Corre pnpm test y pnpm typecheck al final.
```

Commit sugerido: `feat(engine): implement debt payoff simulation`

---

## Prompt 4 — Tests de validación (los que el fixture no cubre)

```
Agrega tests unitarios para INVALID_INPUT (sección 6 de la spec): ids duplicados,
montos no enteros, montos <= 0, tasa negativa o > 2, cero deudas y más de 20 deudas.
Agrega también un test de desempate de prioridad para avalanche y snowball.

Cambio de contrato en las validaciones. Primero la spec, después el código:

1. Actualiza docs/SPEC-engine.md §6: cada issue de INVALID_INPUT pasa a ser
   { path: string; code: ValidationCode }, sin message. Define ValidationCode como unión:
   'DUPLICATE_ID' | 'NOT_POSITIVE_INTEGER' | 'NOT_FINITE' | 'RATE_OUT_OF_RANGE'
   | 'NO_DEBTS' | 'TOO_MANY_DEBTS'. Documenta también las decisiones 1, 2, 3 y 5
   que tomaste (presupuesto validado siempre, NaN/Infinity, orden por código de
   carácter, pago en el mes 600 = PAID_OFF).
2. Implementa el cambio en validation.ts y types.ts. Los textos en español serán
   responsabilidad de la UI, no del motor.
3. Prompt 4 de docs/prompts/01-engine.md: tests de INVALID_INPUT que verifiquen path y
   code (nunca textos), más los tests de desempate de prioridad.

No toques golden-cases.json. Corre pnpm test y pnpm typecheck al final.
```

Commit sugerido: `test(engine): cover input validation and tie-breaking`

---

## Para revisar vos (la parte de aprender)

- [ ] En `rates.ts`: ¿usa `(1 + EA) ** (1/12) - 1` y no `EA / 12`?
- [ ] En `simulate.ts`: ¿el orden es intereses → mínimos → excedente?
- [ ] ¿Dónde se libera la cuota de una deuda cerrada? (Pista: en ningún lado explícito, y está bien. ¿Por qué?)
- [ ] Corré `tres-deudas-clasico` y compará: ¿cuánto ahorra la avalancha frente a la bola de nieve, y cuánto frente a solo mínimos?
