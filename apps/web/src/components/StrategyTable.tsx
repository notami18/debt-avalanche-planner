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

// Encabezados de columna: también son las etiquetas de la vista apilada (data-label).
const COLUMNS = {
  date: 'Libre en',
  months: 'Meses',
  interest: 'Intereses totales',
  savings: 'Ahorro frente a solo mínimos',
} as const;

export function StrategyTable({ comparison, selected, onSelect, firstPayment }: StrategyTableProps) {
  const minimumNeverEnds = comparison.minimumOnly.status === 'NOT_PAYABLE';

  return (
    <div className={styles.wrapper}>
      <div className={styles.scroll}>
        {/* Roles explícitos: la vista apilada cambia el display y algunos navegadores
            dejan de exponerla como tabla (SPEC-web §5.2). */}
        <table className={styles.table} role="table">
          <caption className={styles.caption}>Comparación de estrategias</caption>
          <thead className={styles.head}>
            <tr role="row">
              <th scope="col" role="columnheader">
                Estrategia
              </th>
              <th scope="col" role="columnheader">
                {COLUMNS.date}
              </th>
              <th scope="col" role="columnheader" className={styles.number}>
                {COLUMNS.months}
              </th>
              <th scope="col" role="columnheader" className={styles.number}>
                {COLUMNS.interest}
              </th>
              <th scope="col" role="columnheader" className={styles.number}>
                {COLUMNS.savings}
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
                  role="row"
                  className={isSelected ? styles.selected : undefined}
                  onClick={() => onSelect(strategy.key)}
                >
                  <th scope="row" role="rowheader" className={styles.strategy}>
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
                      <td role="cell" data-label={COLUMNS.date} className={styles.date}>
                        {formatMonthYear(monthToDate(firstPayment, result.months))}
                      </td>
                      <td role="cell" data-label={COLUMNS.months} className={styles.number}>
                        {result.months}
                      </td>
                      <td role="cell" data-label={COLUMNS.interest} className={styles.number}>
                        {formatMoney(result.totalInterest)}
                      </td>
                    </>
                  ) : (
                    <>
                      <td role="cell" data-label={COLUMNS.date} colSpan={2}>
                        No se termina de pagar
                      </td>
                      <td role="cell" data-label={COLUMNS.interest} className={styles.number}>
                        {EMPTY}
                      </td>
                    </>
                  )}
                  <td role="cell" data-label={COLUMNS.savings} className={styles.number}>
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
