import type { StrategyComparison } from '@avalancha/engine';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { formatMonthYear, monthToDate } from '../format/dates.js';
import { formatMoney } from '../format/money.js';
import { resultMessages } from '../i18n/resultMessages.js';
import { STRATEGIES } from '../plan/strategies.js';
import type { StrategyKey } from '../plan/strategies.js';
import { interestSummary } from '../plan/summary.js';
import type { InterestSummary } from '../plan/summary.js';
import styles from './FreedomHero.module.css';
import { HEIGHT, WIDTH, mountainGeometry } from './mountainGeometry.js';

interface FreedomHeroProps {
  comparison: StrategyComparison;
  selected: StrategyKey;
  firstPayment: string;
  /** Solo el primer resultado dibuja la cresta (SPEC-web §5.1). */
  animate: boolean;
}

const strategyName = (key: StrategyKey) =>
  STRATEGIES.find((strategy) => strategy.key === key)?.name ?? key;

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

/** Ancla la etiqueta a la izquierda o a la derecha según su lado del gráfico. */
function horizontalAnchor(xPercent: number): CSSProperties {
  return xPercent <= 50 ? { left: `${xPercent}%` } : { right: `${100 - xPercent}%` };
}

/** Muestra de línea con el mismo color, trazo y grosor que la cresta. */
function StrokeSwatch({ strategy }: { strategy: StrategyKey }) {
  return (
    <svg className={styles.swatch} viewBox="0 0 28 10">
      <g className={styles[strategy]}>
        <line className={styles.crest} x1={2} y1={5} x2={26} y2={5} />
      </g>
    </svg>
  );
}

export function FreedomHero({ comparison, selected, firstPayment, animate }: FreedomHeroProps) {
  // Se fija al montar: si cambian los datos durante la animación, no se corta ni se repite.
  const [animateOnMount] = useState(animate);
  const geometry = mountainGeometry(comparison, selected);
  const summary = interestSummary(comparison, selected);
  if (geometry === null || summary === null) return null;

  const { marker, summit } = geometry;
  const dateOf = (month: number) => formatMonthYear(monthToDate(firstPayment, month));
  const freedomDate = dateOf(marker.month);

  return (
    <figure className={styles.hero}>
      <div className={styles.chart} aria-hidden="true">
        <svg
          className={animateOnMount ? `${styles.svg} ${styles.draw}` : styles.svg}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="presentation"
        >
          <line className={styles.baseline} x1={0} y1={HEIGHT} x2={WIDTH} y2={HEIGHT} />
          <line className={styles.guide} x1={marker.x} y1={HEIGHT} x2={marker.x} y2={0} />
          {geometry.crests.map((crest) => (
            <g
              key={crest.key}
              data-strategy={crest.key}
              className={`${styles[crest.key]} ${crest.area ? styles.selected : ''}`}
            >
              {crest.area && <path className={styles.area} d={crest.area} />}
              <path className={styles.crest} d={crest.line} />
            </g>
          ))}
          <circle className={styles.marker} cx={marker.x} cy={HEIGHT} r={7} />
        </svg>
        <p className={styles.summit} style={{ top: `${summit.yPercent}%` }}>
          Hoy: {formatMoney(summit.balance)}
        </p>
        <p
          className={marker.xPercent <= 50 ? styles.label : `${styles.label} ${styles.labelEnd}`}
          style={horizontalAnchor(marker.xPercent)}
        >
          <span className={styles.labelKicker}>Libre en</span>
          <span className={styles.labelDate}>{freedomDate}</span>
        </p>
        {geometry.endLabels.map((label) => (
          <p
            key={label.month}
            data-end-label={label.keys.join(' ')}
            className={styles.endLabel}
            style={{ ...horizontalAnchor(label.xPercent), bottom: `${0.5 + label.row * 1.75}rem` }}
          >
            {label.keys.map((key) => (
              <StrokeSwatch key={key} strategy={key} />
            ))}
            {label.keys.map(strategyName).join(' y ')}: {dateOf(label.month)}
          </p>
        ))}
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
