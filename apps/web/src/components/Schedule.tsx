import type { MonthRow } from '@avalancha/engine';
import { useState } from 'react';
import { formatMonthYear, monthToDate } from '../format/dates.js';
import { formatMoney } from '../format/money.js';
import buttons from '../styles/buttons.module.css';
import styles from './Schedule.module.css';

interface ScheduleProps {
  schedule: readonly MonthRow[];
  debtNames: ReadonlyMap<string, string>;
  firstPayment: string;
}

// SPEC-web §5.4: 24 meses y, si hay más, un botón para ver todos.
const VISIBLE_MONTHS = 24;

export function Schedule({ schedule, debtNames, firstPayment }: ScheduleProps) {
  const [showAll, setShowAll] = useState(false);
  const months = showAll ? schedule : schedule.slice(0, VISIBLE_MONTHS);

  return (
    <details className={styles.schedule}>
      <summary className={styles.summary}>Ver el plan mes a mes</summary>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Mes</th>
              <th scope="col">Deuda</th>
              <th scope="col" className={styles.number}>
                Saldo inicial
              </th>
              <th scope="col" className={styles.number}>
                Interés
              </th>
              <th scope="col" className={styles.number}>
                Pago
              </th>
              <th scope="col" className={styles.number}>
                Saldo final
              </th>
            </tr>
          </thead>
          {months.map(({ month, rows }) => (
            <tbody key={month} className={styles.month}>
              {rows.map((row, index) => (
                <tr key={row.debtId}>
                  {index === 0 && (
                    <th scope="rowgroup" rowSpan={rows.length} className={styles.monthName}>
                      {formatMonthYear(monthToDate(firstPayment, month))}
                    </th>
                  )}
                  <td>{debtNames.get(row.debtId) ?? row.debtId}</td>
                  <td className={styles.number}>{formatMoney(row.openingBalance)}</td>
                  <td className={styles.number}>{formatMoney(row.interest)}</td>
                  <td className={styles.number}>{formatMoney(row.payment)}</td>
                  <td className={styles.number}>{formatMoney(row.closingBalance)}</td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
      {!showAll && schedule.length > VISIBLE_MONTHS && (
        <button type="button" className={buttons.button} onClick={() => setShowAll(true)}>
          Mostrar todos los meses
        </button>
      )}
    </details>
  );
}
