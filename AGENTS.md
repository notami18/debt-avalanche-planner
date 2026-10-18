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
- `apps/web`: Vite + React, CSS Modules con tokens en variables CSS, Vitest + Testing Library.
  Especificada en `docs/SPEC-web.md`. Leé esa spec antes de tocar la web.

## Estructura
```
packages/engine/
  src/            dominio: tasas, simulación, estrategias, validación
  test/           tests Vitest + fixtures/golden-cases.json
apps/web/
  src/            UI: plan/ (estado y adaptador al motor), format/, i18n/, components/, styles/
docs/             SPEC-engine.md, SPEC-web.md y prompts de trabajo
tools/golden-generator/  implementación de referencia en Python (NO tocar, ver abajo)
```

## Comandos
```
pnpm install
pnpm dev           # turbo run dev (app web en modo desarrollo)
pnpm build
pnpm test          # turbo run test
pnpm -F @avalancha/engine test
pnpm -F @avalancha/web test
pnpm typecheck
```

## Frontera entre web y motor
- La web importa solo la API pública de `@avalancha/engine`. Ninguna fórmula financiera vive
  en la web: si hace falta una, se agrega al motor (spec → tests → código).
- La web no duplica validaciones de negocio: muestra los `ValidationIssue` del motor.

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
- En la web: nada de analítica, CDNs ni fuentes cargadas desde terceros en tiempo de ejecución.
