import type { PayoffEntry } from '@avalancha/engine';
import { formatMonthYear, monthToDate } from '../format/dates.js';
import styles from './PayoffTimeline.module.css';

interface PayoffTimelineProps {
  payoffOrder: readonly PayoffEntry[];
  debtNames: ReadonlyMap<string, string>;
  firstPayment: string;
}

export function PayoffTimeline({ payoffOrder, debtNames, firstPayment }: PayoffTimelineProps) {
  return (
    <section className={styles.timeline} aria-labelledby="payoff-title">
      <h3 id="payoff-title" className={styles.title}>
        Orden de pago
      </h3>
      <ol className={styles.list}>
        {payoffOrder.map(({ debtId, month }) => (
          <li key={debtId}>
            {debtNames.get(debtId) ?? debtId}, {formatMonthYear(monthToDate(firstPayment, month))}
          </li>
        ))}
      </ol>
    </section>
  );
}
