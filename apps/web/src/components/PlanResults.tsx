import type { Debt, StrategyComparison } from '@avalancha/engine';
import type { RefObject } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { resultMessages } from '../i18n/resultMessages.js';
import type { StrategyKey } from '../plan/strategies.js';
import buttons from '../styles/buttons.module.css';
import { FreedomHero, NotPayableHero } from './FreedomHero.js';
import { PayoffTimeline } from './PayoffTimeline.js';
import styles from './PlanResults.module.css';
import { Schedule } from './Schedule.js';
import { StrategyTable } from './StrategyTable.js';
import { TrapNotice } from './TrapNotice.js';

interface PlanResultsProps {
  /** "Ver mi plan" lleva el foco a este título. */
  titleRef?: RefObject<HTMLHeadingElement | null>;
  debts: readonly Debt[];
  comparison: StrategyComparison;
  selected: StrategyKey;
  onSelect: (key: StrategyKey) => void;
  firstPayment: string;
  onAddDebt: () => void;
  onLoadExample: () => void;
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
  titleRef,
  debts,
  comparison,
  selected,
  onSelect,
  firstPayment,
  onAddDebt,
  onLoadExample,
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
      <h2 id="results-title" ref={titleRef} className={styles.title} tabIndex={-1}>
        Tu plan
      </h2>
      {debts.length === 0 ? (
        <div className={styles.empty}>
          <p role="status">{resultMessages.empty}</p>
          <div className={styles.emptyActions}>
            <button type="button" className={buttons.button} onClick={onAddDebt}>
              Agregar deuda
            </button>
            <button type="button" className={buttons.button} onClick={onLoadExample}>
              Cargar ejemplo
            </button>
          </div>
        </div>
      ) : paused !== null ? (
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
