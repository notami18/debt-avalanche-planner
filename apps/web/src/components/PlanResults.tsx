import type { StrategyComparison } from '@avalancha/engine';
import { useEffect, useRef } from 'react';
import { resultMessages } from '../i18n/resultMessages.js';
import type { StrategyKey } from '../plan/strategies.js';
import { FreedomHero, NotPayableHero } from './FreedomHero.js';
import styles from './PlanResults.module.css';
import { StrategyTable } from './StrategyTable.js';

interface PlanResultsProps {
  hasDebts: boolean;
  comparison: StrategyComparison;
  selected: StrategyKey;
  onSelect: (key: StrategyKey) => void;
  firstPayment: string;
}

// SPEC-web §4: el estado general se lee de avalancha; cada estrategia, por separado.
function pausedMessage(hasDebts: boolean, comparison: StrategyComparison): string | null {
  const { avalanche } = comparison;
  if (!hasDebts) return resultMessages.empty;
  if (avalanche.status === 'INVALID_INPUT') return resultMessages.incomplete;
  if (avalanche.status === 'INVALID_BUDGET') {
    return resultMessages.budgetTooLow(avalanche.minimumRequired);
  }
  return null;
}

export function PlanResults({
  hasDebts,
  comparison,
  selected,
  onSelect,
  firstPayment,
}: PlanResultsProps) {
  const paused = pausedMessage(hasDebts, comparison);
  // La cresta se dibuja solo la primera vez que aparece un resultado.
  const hasShownResult = useRef(false);
  const animate = paused === null && !hasShownResult.current;

  useEffect(() => {
    if (paused === null) hasShownResult.current = true;
  }, [paused]);

  return (
    <section className={styles.results} aria-labelledby="results-title">
      <h2 id="results-title" className={styles.title}>
        Tu plan
      </h2>
      {paused !== null ? (
        <p role="status">{paused}</p>
      ) : (
        <>
          {comparison[selected].status === 'PAID_OFF' ? (
            <FreedomHero
              comparison={comparison}
              selected={selected}
              firstPayment={firstPayment}
              animate={animate}
            />
          ) : (
            <NotPayableHero />
          )}
          <StrategyTable
            comparison={comparison}
            selected={selected}
            onSelect={onSelect}
            firstPayment={firstPayment}
          />
        </>
      )}
    </section>
  );
}
