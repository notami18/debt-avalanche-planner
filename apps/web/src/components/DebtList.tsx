import { validationMessages } from '../i18n/validationMessages.js';
import { MAX_DEBTS } from '../plan/types.js';
import type { PlanController } from '../plan/usePlan.js';
import buttons from '../styles/buttons.module.css';
import { DebtRow } from './DebtRow.js';
import styles from './DebtList.module.css';

interface DebtListProps {
  plan: PlanController;
}

export function DebtList({ plan }: DebtListProps) {
  const { debts } = plan.form;
  const isFull = debts.length >= MAX_DEBTS;

  return (
    <section className={styles.list} aria-labelledby="debts-title">
      <h2 id="debts-title" className={styles.title}>
        Tus deudas
      </h2>
      {debts.map((debt, index) => (
        <DebtRow
          key={debt.id}
          debt={debt}
          index={index}
          errorFor={plan.errorFor}
          onChange={(field, value) => plan.updateDebt(debt.id, field, value)}
          onRateTypeChange={(rateType) => plan.setRateType(debt.id, rateType)}
          onBlur={plan.touch}
          onRemove={() => plan.removeDebt(debt.id)}
        />
      ))}
      <div>
        <button type="button" className={buttons.button} onClick={plan.addDebt} disabled={isFull}>
          Agregar deuda
        </button>
        {isFull && <p className={styles.note}>{validationMessages.TOO_MANY_DEBTS}</p>}
      </div>
    </section>
  );
}
