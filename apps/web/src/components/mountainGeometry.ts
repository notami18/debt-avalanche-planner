import type { StrategyComparison } from '@avalancha/engine';
import { balanceSeries } from '../plan/balanceSeries.js';
import { STRATEGIES } from '../plan/strategies.js';
import type { StrategyKey } from '../plan/strategies.js';

export const WIDTH = 640;
export const HEIGHT = 280;
// Margen abajo y a la derecha: el marcador (r = 7 + trazo) no sale cortado del viewBox.
const MARGIN = 12;
export const BASELINE = HEIGHT - MARGIN;
const PLOT_RIGHT = WIDTH - MARGIN;
// Espacio libre arriba para las etiquetas "Libre en …" y "Hoy: …".
const HEADROOM = 110;
// Etiquetas finales más cerca que esto (en % del ancho) se apilan en otra fila.
const LABEL_GAP_PERCENT = 40;

export interface Crest {
  key: StrategyKey;
  line: string;
  /** Solo la seleccionada se rellena. */
  area: string | null;
}

export interface EndLabel {
  keys: StrategyKey[];
  month: number;
  xPercent: number;
  row: number;
}

export interface MountainGeometry {
  maxMonths: number;
  maxBalance: number;
  /** La seleccionada va al final, para quedar encima. */
  crests: Crest[];
  marker: { x: number; xPercent: number; month: number };
  summit: { balance: number; yPercent: number };
  /** No seleccionadas que terminan el mismo mes que la seleccionada: van sin etiqueta. */
  tiedWith: StrategyKey[];
  endLabels: EndLabel[];
}

/** X hasta la cresta más larga; Y hasta el punto más alto de todas (un saldo puede subir). */
export function mountainScale(series: readonly (readonly number[])[]) {
  return {
    maxMonths: Math.max(...series.map((points) => points.length - 1)),
    maxBalance: Math.max(...series.flat()),
  };
}

function groupEndLabels(
  ends: readonly { key: StrategyKey; months: number }[],
  xPercent: (month: number) => number,
) {
  const byMonth = new Map<number, StrategyKey[]>();
  for (const { key, months } of ends) byMonth.set(months, [...(byMonth.get(months) ?? []), key]);

  const labels: EndLabel[] = [];
  for (const [month, keys] of [...byMonth].sort(([a], [b]) => a - b)) {
    const x = xPercent(month);
    const row = labels.filter((label) => Math.abs(label.xPercent - x) < LABEL_GAP_PERCENT).length;
    labels.push({ keys, month, xPercent: x, row });
  }
  return labels;
}

// SPEC-web §5.1: solo las estrategias PAID_OFF forman crestas.
export function mountainGeometry(
  comparison: StrategyComparison,
  selected: StrategyKey,
): MountainGeometry | null {
  const selectedResult = comparison[selected];
  if (selectedResult.status !== 'PAID_OFF') return null;

  const paid = STRATEGIES.flatMap(({ key }) => {
    const result = comparison[key];
    return result.status === 'PAID_OFF'
      ? [{ key, months: result.months, series: balanceSeries(result.schedule) }]
      : [];
  });
  const { maxMonths, maxBalance } = mountainScale(paid.map((crest) => crest.series));
  const x = (month: number) => (month / maxMonths) * PLOT_RIGHT;
  const y = (balance: number) => BASELINE - (balance / maxBalance) * (BASELINE - HEADROOM);
  const line = (series: number[]) =>
    series
      .map((balance, month) => `${month === 0 ? 'M' : 'L'}${x(month).toFixed(1)} ${y(balance).toFixed(1)}`)
      .join(' ');

  const ordered = [
    ...paid.filter((crest) => crest.key !== selected),
    ...paid.filter((crest) => crest.key === selected),
  ];
  const crests = ordered.map(({ key, months, series }) => {
    const path = line(series);
    return {
      key,
      line: path,
      area: key === selected ? `${path} L${x(months).toFixed(1)} ${BASELINE} L0 ${BASELINE} Z` : null,
    };
  });

  const toPercent = (month: number) => (x(month) / WIDTH) * 100;
  const initialBalance = paid.find((crest) => crest.key === selected)?.series[0] ?? 0;
  const others = paid.filter((crest) => crest.key !== selected);
  const isTied = (crest: { months: number }) => crest.months === selectedResult.months;

  return {
    maxMonths,
    maxBalance,
    crests,
    marker: {
      x: x(selectedResult.months),
      xPercent: toPercent(selectedResult.months),
      month: selectedResult.months,
    },
    summit: { balance: initialBalance, yPercent: (y(initialBalance) / HEIGHT) * 100 },
    tiedWith: others.filter(isTied).map((crest) => crest.key),
    endLabels: groupEndLabels(
      others.filter((crest) => !isTied(crest)),
      toPercent,
    ),
  };
}
