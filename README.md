# Avalancha 🏔️

[![Deploy](https://github.com/notami18/debt-avalanche-planner/actions/workflows/deploy.yml/badge.svg)](https://github.com/notami18/debt-avalanche-planner/actions/workflows/deploy.yml)

**Pruébala:** <https://notami18.github.io/debt-avalanche-planner/>

Simulador para salir de deudas, hecho para personas en Colombia. Escribes tus deudas
(saldo, tasa y cuota mínima) y cuánto puedes pagar al mes, y la app te dice **cuándo
quedas libre y cuánto te ahorras en intereses** según cómo repartas el dinero:

- **Avalancha:** lo que sobra va a la deuda con la tasa más alta. Es la que menos
  intereses paga.
- **Bola de nieve:** lo que sobra va a la deuda con el saldo más pequeño. Cierras deudas
  antes.
- **Solo mínimos:** el punto de comparación, para ver cuánto cuesta no hacer nada más.

Tasas en efectiva anual (E.A.) o mes vencido (M.V.), pesos enteros y fechas reales a
partir del mes de tu primer pago. Es un simulador educativo, no asesoría financiera.

## Privacidad

Tus datos nunca salen de tu navegador.

- No hay backend, cuentas, analítica ni cookies. La app no hace peticiones de red con tus
  datos, y la fuente (Archivo) viene empaquetada con la app, no de un CDN.
- Lo que escribes se guarda solo en el `localStorage` de tu navegador (clave
  `avalancha:plan:v1`), para que no lo pierdas al recargar.
- **"Borrar mis datos"** limpia el formulario y ese almacenamiento.

## Cómo correrla

Necesitas Node.js 22 y pnpm.

```bash
pnpm install
pnpm dev         # app web en modo desarrollo (Vite)
pnpm test        # tests del motor y de la web (Vitest)
pnpm typecheck
pnpm build       # build de producción en apps/web/dist
```

## Estructura

- `packages/engine`: el motor de simulación, TypeScript puro y sin dependencias.
  Especificado en [`docs/SPEC-engine.md`](docs/SPEC-engine.md) y verificado contra casos
  dorados generados por una implementación independiente en Python.
- `apps/web`: la interfaz (Vite + React). Especificada en
  [`docs/SPEC-web.md`](docs/SPEC-web.md). No tiene fórmulas financieras: todo el cálculo
  lo hace el motor.

## Estado

- [x] `packages/engine`: motor de simulación
- [x] `apps/web`: interfaz

Guía para agentes de IA (Cursor, Claude Code): [`AGENTS.md`](AGENTS.md).
