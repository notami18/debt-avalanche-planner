import { MONTH_NAMES } from '../format/months.js';
import { splitYearMonth, toYearMonth } from '../plan/firstPayment.js';
import styles from './FirstPaymentField.module.css';

interface FirstPaymentFieldProps {
  value: string;
  onChange: (value: string) => void;
}

const YEARS_AHEAD = 5;

function yearOptions(selectedYear: number): number[] {
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: YEARS_AHEAD + 1 }, (_, offset) => thisYear + offset);
  return years.includes(selectedYear) ? years : [selectedYear, ...years].sort((a, b) => a - b);
}

export function FirstPaymentField({ value, onChange }: FirstPaymentFieldProps) {
  const { year, month } = splitYearMonth(value);

  return (
    <fieldset className={styles.firstPayment}>
      <legend className={styles.legend}>Primer pago</legend>
      <div className={styles.selects}>
        <label className={styles.field}>
          Mes
          <select
            value={month}
            onChange={(event) => onChange(toYearMonth(year, Number(event.target.value)))}
          >
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Año
          <select
            value={year}
            onChange={(event) => onChange(toYearMonth(Number(event.target.value), month))}
          >
            {yearOptions(year).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
    </fieldset>
  );
}
