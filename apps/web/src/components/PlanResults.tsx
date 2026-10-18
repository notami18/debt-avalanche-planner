import type { Debt, StrategyComparison } from '@avalancha/engine';
import { useEffect, useMemo, useRef } from 'react';
import { resultMessages } from '../i18n/resultMessages.js';
import type { StrategyKey } from '../plan/strategies.js';
import { FreedomHero, NotPayableHero } from './FreedomHero.js';
import { PayoffTimeline } from './PayoffTimeline.js';
import styles from './PlanResults.module.css';
import { Schedule } from './Schedule.js';
import { StrategyTable } from './StrategyTable.js';
import { TrapNotice } from './TrapNotice.js';

interface PlanResultsProps {
  debts: readonly Debt[];
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
  debts,
  comparison,
  selected,
  onSelect,
  firstPayment,
}: PlanResultsProps) {
  const paused = pausedMessage(debts.length > 0, comparison);
  const debtNames = useMemo(() => new Map(debts.map((debt) => [debt.id, debt.name])), [debts]);
  // La cresta se dibuja solo la primera vez que aparece un resultado.
  const hasShownResult = useRef(false);
  const animate = paused === null && !hasShownResult.current;

  useEffect(() => {
    if (paused === null) hasShownResult.current = true;
  }, [paused]);

  const result = comparison[selected];

  return (
    <section className={styles.results} aria-labelledby="results-title">
      <h2 id="results-title" className={styles.title}>
        Tu plan
      </h2>
      {paused !== null ? (
        <p role="status">{paused}</p>
      ) : (
        <>
          {result.status === 'PAID_OFF' ? (
            <FreedomHero
              comparison={comparison}
              selected={selected}
              firstPayment={firstPayment}
              animate={animate}
            />
          ) : (
            <NotPayableHero />
          )}
          {(result.status === 'PAID_OFF' || result.status === 'NOT_PAYABLE') && (
            <TrapNotice warnings={result.warnings} debtNames={debtNames} />
          )}
          <StrategyTable
            comparison={comparison}
            selected={selected}
            onSelect={onSelect}
            firstPayment={firstPayment}
          />
          {result.status === 'PAID_OFF' && (
            <>
              <PayoffTimeline
                payoffOrder={result.payoffOrder}
                debtNames={debtNames}
                firstPayment={firstPayment}
              />
              <Schedule
                // Al cambiar de estrategia, el cronograma vuelve a 24 meses.
                key={selected}
                schedule={result.schedule}
                debtNames={debtNames}
                firstPayment={firstPayment}
              />
            </>
          )}
        </>
      )}
    </section>
  );
}
