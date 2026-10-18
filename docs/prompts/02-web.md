# Prompts del Día 2 — Interfaz web

Igual que ayer: uno a la vez, en **modo plan**, leé el plan antes de aprobar y commiteá al
final de cada uno. Todos asumen que el agente leyó `AGENTS.md` y `docs/SPEC-web.md`.

Orden: 5 (motor) → 6 (esqueleto web) → 7 (formulario) → 8 (resultados) → 9 (detalle y
test dorado de la UI) → 10 (pulido y despliegue, opcional).

---

## Prompt 5 — Motor: tasa mensual → efectiva anual

La UI va a dejar escribir la tasa como la trae el extracto (M.V.). Esa conversión es
matemática financiera, así que va en el motor y no en la web.

```
Lee docs/SPEC-engine.md §3 y §7.

1. Spec primero: en §3 agrega la conversión inversa
   tasaEA = (1 + tasaMensual)^12 − 1
   y en §7 agrega a la API pública: toAnnualEffectiveRate(monthlyRate: number): number
   Nota en la spec: la ida y vuelta EA → mensual → EA puede diferir en ~1e-16 por
   punto flotante (ej. 0.28 vuelve como 0.2799999999999998); la UI redondea al mostrar.
2. Tests en test/rates.test.ts: para cada rateConversions del fixture,
   toAnnualEffectiveRate(monthlyRate) ≈ annualEffectiveRate con tolerancia 1e-12,
   y toAnnualEffectiveRate(0) === 0.
3. Implementa en rates.ts y exporta desde index.ts.

No toques golden-cases.json. Corre pnpm test y pnpm typecheck.
```

Commit: `feat(engine): add monthly to effective annual rate conversion`

**Revisá:** ¿el test usa tolerancia y no igualdad exacta? ¿Por qué hace falta?

---

## Prompt 6 — Esqueleto de apps/web

```
Lee AGENTS.md y docs/SPEC-web.md §2 y §6.

Crea apps/web, SIN funcionalidad todavía:
- Vite + React + TypeScript (versiones estables actuales), paquete @avalancha/web,
  dependencia "@avalancha/engine": "workspace:*".
- tsconfig que extienda ../../tsconfig.base.json, agregando lib DOM y DOM.Iterable,
  jsx react-jsx y los tipos de vite/client.
- Vitest con jsdom, @testing-library/react y @testing-library/jest-dom.
- Fuente Archivo autoalojada con @fontsource-variable/archivo.
- src/styles/tokens.css con los tokens de color de SPEC-web §6 (claro y oscuro con
  prefers-color-scheme) y global.css con tipografía base, tabular-nums y foco visible.
- turbo.json: tareas "dev" (cache false, persistent true) y "build"
  (dependsOn ^build, outputs dist/**). Scripts raíz "dev" y "build".
- App.tsx: solo el título "Avalancha" y, para probar la conexión con el motor, el número
  de meses que da compareStrategies para el ejemplo tres-deudas-clasico de SPEC-web §3.
- Un test que renderice App y verifique que aparece "17".

Corre pnpm install, pnpm test, pnpm typecheck y pnpm build, y muéstrame la salida.
Al final dime el comando para abrir la app en el navegador.
```

Commit: `feat(web): 🧑‍💻 scaffold vite react app wired to engine`

**Revisá:** abrí la app con `pnpm dev`. Cambiá algo en `packages/engine/src` y fijate si la
web se recarga sola. (Debería: el motor exporta su código fuente directamente.)

---

## Prompt 7 — Formulario, estado y persistencia

```
Ajuste a la spec (primero en docs/SPEC-web.md §3, después en el código):
- Los errores de un campo se muestran solo después de que el usuario lo tocó (blur)
  o cuando intenta ver resultados. Una deuda recién agregada, vacía, no muestra errores.
- Mientras haya errores, los resultados quedan en pausa sin gritar: el estado vacío
  o "Completa los datos de tus deudas para ver tu plan".

Lee docs/SPEC-web.md §2, §3 y §7. Implementa la captura de datos, todavía sin resultados:

- plan/types.ts: el estado del formulario guarda strings (lo que el usuario escribió),
  tipo de tasa 'EA' | 'MV' por deuda y primer pago como 'YYYY-MM'.
- plan/reducer.ts: agregar, editar y quitar deudas (máx. 20), presupuesto, primer pago,
  cargar ejemplo y borrar todo.
- plan/toEngineInput.ts: adaptador puro formulario → { debts: Debt[]; monthlyBudget }.
  · Dinero: quita "$", espacios y puntos de miles. Si queda una coma, es decimal y el
    resultado no será entero (el motor lo reportará). Vacío → NaN.
  · Tasa: acepta coma o punto decimal, divide entre 100; si es MV usa
    toAnnualEffectiveRate del motor.
  · Conserva el orden y no filtra filas: el índice i del motor debe ser la fila i del
    formulario, para que los path de los ValidationIssue apunten al campo correcto.
- i18n/validationMessages.ts: Record<ValidationCode, string> con textos claros en español.
- Persistencia en localStorage (clave avalancha:plan:v1, con version), todo en try/catch.
- Componentes DebtList, DebtRow, BudgetField y el selector de primer pago, con los
  errores del motor junto a cada campo (aria-describedby).

Tests:
- toEngineInput con test.each: "4.500.000", "$ 4.500.000", "4500000", "", "1000,5",
  tasas "28", "28,5", "28.5", y una tasa MV que convierta a la EA esperada.
- Persistencia: JSON corrupto o versión distinta → arranca vacío sin lanzar error.

No calcules todavía los resultados en la UI. Corre pnpm test y pnpm typecheck.
```

Commit: `feat(web): 🧑‍💻 capture debts and budget with local persistence`

**Revisá:** ¿hay alguna validación de negocio duplicada en la web (por ejemplo, "si
saldo <= 0")? No debería: eso lo dice el motor.

---

## Prompt 8 — Resultados: la montaña y la comparación

```
Lee docs/SPEC-web.md §4, §5 (puntos 1 y 2) y §6.

- plan/balanceSeries.ts: a partir de schedule, el saldo total por mes, empezando en el
  mes 0 con la suma de los saldos iniciales. Con tests.
- format/dates.ts: convierte el "mes N" del motor en fecha a partir del primer pago
  (el mes 1 es el mes del primer pago). Con tests, incluido el cambio de año.
- Calcula compareStrategies con useMemo sobre la salida de toEngineInput.
- FreedomHero: SVG propio, sin librerías de gráficas, como describe §5.1. Una cresta por
  estrategia; la seleccionada rellena; las otras en línea discontinua y punteada.
  Marcador y fecha donde la seleccionada llega a cero. figcaption con el mismo mensaje.
  La única animación de la app: la cresta se dibuja una vez; nada con
  prefers-reduced-motion.
- StrategyTable: tabla con las tres estrategias según §5.2; clic en una fila la
  selecciona.
- Estados de §4: vacío, INVALID_INPUT, INVALID_BUDGET y NOT_PAYABLE.

Corre pnpm test y pnpm typecheck. Dime cómo verlo con pnpm dev.
```

Commit: `feat(web): show payoff date, balance mountain and strategy comparison`

**Revisá:** cargá el ejemplo y compará contra los casos dorados: avalancha 17 meses y
$2.844.122 de intereses; bola de nieve $2.874.112; solo mínimos 33 meses y $5.642.360.

---

## Prompt 9 — Detalle y test dorado de la UI

```
Lee docs/SPEC-web.md §4 y §5 (puntos 3, 4 y 5).

- PayoffTimeline (lista ordenada), Schedule (details con 24 meses y "Mostrar todos los
  meses"), TrapNotice para MINIMUM_BELOW_INTEREST y la nota al pie.
- Test de integración en apps/web/test/golden-ui.test.tsx:
  · Importa packages/engine/test/fixtures/golden-cases.json y toma el caso
    tres-deudas-clasico.
  · Verifica que los datos de "Cargar ejemplo" coinciden con ese caso (nombre, saldo,
    tasa y cuota mínima; los ids pueden ser distintos).
  · Renderiza App, haz clic en "Cargar ejemplo" y verifica que la tabla muestra, para
    las tres estrategias, los meses y los intereses totales del fixture, formateados con
    los helpers de format/. Normaliza el espacio no separable de la moneda.
- Un test de TrapNotice con el caso trampa-de-minimos.

No toques golden-cases.json. Corre pnpm test y pnpm typecheck.
```

Commit: `feat(web): add payoff timeline, schedule and golden ui test`

**Revisá:** este test conecta los tres niveles: generador de Python → motor → pantalla. Si
pasa, lo que ve el usuario es lo mismo que calculó la implementación independiente.

---

## Prompt 10 (opcional) — Pulido y despliegue

```
Revisión de calidad de apps/web contra docs/SPEC-web.md §6 y §7:
- Responsive en 360px sin scroll horizontal; columna fija del formulario en ≥ 960px.
- Navegación completa con teclado y foco visible; labels y aria-describedby correctos.
- Contraste AA en claro y oscuro; la montaña distinguible sin depender del color.
- Textos: tuteo, botones que dicen lo que hacen, sin MAYÚSCULAS ni flechas.
Lista lo que encuentres antes de cambiar nada y espera mi aprobación.
Después actualiza el README con qué es la app, cómo correrla y la nota de privacidad.
```

Commit: `chore(web): polish accessibility and responsive layout`

Para publicarla gratis: conectá el repo en Cloudflare Pages o Vercel con comando de build
`pnpm build` y carpeta de salida `apps/web/dist`.
