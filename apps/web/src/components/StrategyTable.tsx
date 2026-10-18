import type { StrategyComparison } from '@avalancha/engine';
import { formatMonthYear, monthToDate } from '../format/dates.js';
import { formatMoney } from '../format/money.js';
import { resultMessages } from '../i18n/resultMessages.js';
import { STRATEGIES } from '../plan/strategies.js';
import type { StrategyKey } from '../plan/strategies.js';
import { savingsVsMinimum } from '../plan/summary.js';
import styles from './StrategyTable.module.css';

interface StrategyTableProps {
  comparison: StrategyComparison;
  selected: StrategyKey;
  onSelect: (key: StrategyKey) => void;
  firstPayment: string;
}

const EMPTY = '—';

export function StrategyTable({ comparison, selected, onSelect, firstPayment }: StrategyTableProps) {
  const minimumNeverEnds = comparison.minimumOnly.status === 'NOT_PAYABLE';

  return (
    <div className={styles.wrapper}>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <caption className={styles.caption}>Comparación de estrategias</caption>
          <thead>
            <tr>
              <th scope="col">Estrategia</th>
              <th scope="col">Libre en</th>
              <th scope="col" className={styles.number}>
                Meses
              </th>
              <th scope="col" className={styles.number}>
                Intereses totales
              </th>
              <th scope="col" className={styles.number}>
                Ahorro frente a solo mínimos
              </th>
            </tr>
          </thead>
          <tbody>
            {STRATEGIES.map((strategy) => {
              const result = comparison[strategy.key];
              const savings = savingsVsMinimum(comparison, strategy.key);
              const isSelected = strategy.key === selected;
              return (
                <tr
                  key={strategy.key}
                  className={isSelected ? styles.selected : undefined}
                  onClick={() => onSelect(strategy.key)}
                >
                  <th scope="row" className={styles.strategy}>
                    <label className={styles.name}>
                      <input
                        type="radio"
                        name="strategy"
                        value={strategy.key}
                        checked={isSelected}
                        onChange={() => onSelect(strategy.key)}
                      />
                      {strategy.name}
                    </label>
                    <span className={styles.description}>{strategy.description}</span>
                  </th>
                  {result.status === 'PAID_OFF' ? (
                    <>
                      <td className={styles.date}>
                        {formatMonthYear(monthToDate(firstPayment, result.months))}
                      </td>
                      <td className={styles.number}>{result.months}</td>
                      <td className={styles.number}>{formatMoney(result.totalInterest)}</td>
                    </>
                  ) : (
                    <>
                      <td colSpan={2}>No se termina de pagar</td>
                      <td className={styles.number}>{EMPTY}</td>
                    </>
                  )}
                  <td className={styles.number}>
                    {savings === null ? EMPTY : formatMoney(savings)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {minimumNeverEnds && <p className={styles.note}>{resultMessages.minimumNeverEnds}</p>}
    </div>
  );
}
