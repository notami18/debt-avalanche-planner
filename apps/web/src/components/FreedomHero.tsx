import type { StrategyComparison } from '@avalancha/engine';
import { useState } from 'react';
import { formatMonthYear, monthToDate } from '../format/dates.js';
import { formatMoney } from '../format/money.js';
import { resultMessages } from '../i18n/resultMessages.js';
import { balanceSeries } from '../plan/balanceSeries.js';
import { STRATEGIES } from '../plan/strategies.js';
import type { StrategyKey } from '../plan/strategies.js';
import { interestSummary } from '../plan/summary.js';
import type { InterestSummary } from '../plan/summary.js';
import styles from './FreedomHero.module.css';

interface FreedomHeroProps {
  comparison: StrategyComparison;
  selected: StrategyKey;
  firstPayment: string;
  /** Solo el primer resultado dibuja la cresta (SPEC-web §5.1). */
  animate: boolean;
}

const WIDTH = 640;
const HEIGHT = 280;
// Espacio libre arriba para la etiqueta de la fecha.
const HEADROOM = 72;

function interestSentence(summary: InterestSummary): string {
  const interest = `Pagarás ${formatMoney(summary.interest)} en intereses`;
  switch (summary.kind) {
    case 'savings':
      return `${interest}: ${formatMoney(summary.savings)} menos que pagando solo los mínimos.`;
    case 'same':
      return `${interest}, lo mismo que pagando solo los mínimos.`;
    case 'minimumNeverEnds':
      return `${interest}. ${resultMessages.minimumNeverEnds}`;
    case 'plain':
      return `${interest}.`;
  }
}

export function FreedomHero({ comparison, selected, firstPayment, animate }: FreedomHeroProps) {
  // Se fija al montar: si cambian los datos durante la animación, no se corta ni se repite.
  const [animateOnMount] = useState(animate);
  const result = comparison[selected];
  const summary = interestSummary(comparison, selected);
  if (result.status !== 'PAID_OFF' || summary === null) return null;

  // Solo las estrategias que pagan; el eje X va hasta la más larga.
  const crests = STRATEGIES.flatMap((strategy) => {
    const crest = comparison[strategy.key];
    return crest.status === 'PAID_OFF'
      ? [{ key: strategy.key, series: balanceSeries(crest.schedule) }]
      : [];
  });
  const maxMonths = Math.max(...crests.map((crest) => crest.series.length - 1));
  const maxBalance = Math.max(...crests.map((crest) => crest.series[0] ?? 0));
  const x = (month: number) => (month / maxMonths) * WIDTH;
  const y = (balance: number) => HEIGHT - (balance / maxBalance) * (HEIGHT - HEADROOM);
  const line = (series: number[]) =>
    series
      .map((balance, month) => `${month === 0 ? 'M' : 'L'}${x(month).toFixed(1)} ${y(balance).toFixed(1)}`)
      .join(' ');

  // La seleccionada se dibuja al final, encima de las demás.
  const ordered = [
    ...crests.filter((crest) => crest.key !== selected),
    ...crests.filter((crest) => crest.key === selected),
  ];
  const markerX = x(result.months);
  const markerPercent = (markerX / WIDTH) * 100;
  const freedomDate = formatMonthYear(monthToDate(firstPayment, result.months));
  const labelPosition =
    markerPercent <= 50 ? { left: `${markerPercent}%` } : { right: `${100 - markerPercent}%` };

  return (
    <figure className={styles.hero}>
      <div className={styles.chart} aria-hidden="true">
        <svg
          className={animateOnMount ? `${styles.svg} ${styles.draw}` : styles.svg}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="presentation"
        >
          <line className={styles.baseline} x1={0} y1={HEIGHT} x2={WIDTH} y2={HEIGHT} />
          <line className={styles.guide} x1={markerX} y1={HEIGHT} x2={markerX} y2={0} />
          {ordered.map((crest) => {
            const path = line(crest.series);
            const isSelected = crest.key === selected;
            return (
              <g
                key={crest.key}
                data-strategy={crest.key}
                className={`${styles[crest.key]} ${isSelected ? styles.selected : ''}`}
              >
                {isSelected && (
                  <path
                    className={styles.area}
                    d={`${path} L${x(crest.series.length - 1).toFixed(1)} ${HEIGHT} L0 ${HEIGHT} Z`}
                  />
                )}
                <path className={styles.crest} d={path} />
              </g>
            );
          })}
          <circle className={styles.marker} cx={markerX} cy={HEIGHT} r={7} />
        </svg>
        <p
          className={markerPercent <= 50 ? styles.label : `${styles.label} ${styles.labelEnd}`}
          style={labelPosition}
        >
          <span className={styles.labelKicker}>Libre en</span>
          <span className={styles.labelDate}>{freedomDate}</span>
        </p>
      </div>
      <figcaption className={styles.caption}>
        <span className={styles.visuallyHidden}>Libre en {freedomDate}. </span>
        {interestSentence(summary)}
      </figcaption>
    </figure>
  );
}

export function NotPayableHero() {
  return (
    <div className={styles.hero}>
      <p className={styles.notPayable}>{resultMessages.notPayable}</p>
    </div>
  );
}
