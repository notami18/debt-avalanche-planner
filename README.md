# Avalancha 🏔️

Simulador para salir de deudas comparando dos estrategias:

- **Avalancha:** primero la deuda con la tasa más alta (ahorra más intereses).
- **Bola de nieve:** primero la deuda más pequeña (victorias rápidas).

Hecho para Colombia: tasas en efectiva anual (E.A.), pesos enteros, y tus datos nunca
salen de tu navegador.

## Estado

- [ ] `packages/engine` — motor de simulación (ver `docs/SPEC-engine.md`)
- [ ] `apps/web` — interfaz

## Desarrollo

```bash
pnpm install
pnpm test
```

Guía para agentes de IA (Cursor, Claude Code): [`AGENTS.md`](AGENTS.md).
