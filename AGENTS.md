# AGENTS.md — Avalancha

Simulador de pago de deudas (estrategias avalancha y bola de nieve) pensado para personas
en Colombia. Proyecto personal de aprendizaje: finanzas + desarrollo asistido por IA.

## Principios
- **Local-first:** los datos del usuario nunca salen de su navegador. No hay backend en v1.
- **El motor es la fuente de verdad:** `packages/engine` es dominio puro y está especificado en
  `docs/SPEC-engine.md`. Leé la spec antes de tocar el motor.
- **Tests primero:** los casos dorados de `packages/engine/test/fixtures/golden-cases.json` son
  el árbitro. Nunca modifiques ese archivo para que un test pase.

## Stack
- Monorepo **pnpm + Turborepo**, Node.js 22, TypeScript `strict`, ESM.
- `packages/engine`: TypeScript sin dependencias de runtime. Tests con **Vitest**.
- `apps/web` (después): Vite + React.

## Estructura
```
packages/engine/
  src/            dominio: tasas, simulación, estrategias, validación
  test/           tests Vitest + fixtures/golden-cases.json
docs/             SPEC-engine.md y prompts de trabajo
tools/golden-generator/  implementación de referencia en Python (NO tocar, ver abajo)
```

## Comandos
```
pnpm install
pnpm test          # turbo run test
pnpm -F @avalancha/engine test
pnpm typecheck
```

## Convenciones
- Commits en inglés, **Conventional Commits** (`feat(engine): ...`, `test(engine): ...`).
- Código e identificadores en inglés; textos de la UI y documentación en español.
- Funciones puras y pequeñas; nada de clases si una función basta.
- Nada de `any`. Tipos de resultado como uniones discriminadas por `status`.

## Prohibido
- **No leer, portar ni traducir `tools/golden-generator/`.** Es una implementación independiente a
  propósito: si el motor coincide con ella sin haberla copiado, los números son confiables.
  El motor se implementa desde `docs/SPEC-engine.md`.
- No editar `golden-cases.json` a mano.
- No usar datos financieros reales de nadie en el repo (ni fixtures, ni ejemplos, ni seeds).
- No agregar dependencias de runtime al motor.
