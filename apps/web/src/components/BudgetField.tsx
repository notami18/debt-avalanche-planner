import { resultMessages } from '../i18n/resultMessages.js';
import { validationMessages } from '../i18n/validationMessages.js';
import { BUDGET_FIELD, fieldId } from '../plan/fields.js';
import type { PlanController } from '../plan/usePlan.js';
import styles from './BudgetField.module.css';
import { TextField } from './TextField.js';

interface BudgetFieldProps {
  plan: PlanController;
}

export function BudgetField({ plan }: BudgetFieldProps) {
  const code = plan.errorFor(BUDGET_FIELD);
  // INVALID_BUDGET solo llega con todos los campos válidos: se muestra sin esperar el blur.
  const { avalanche } = plan.comparison;
  const error = code
    ? validationMessages[code]
    : avalanche.status === 'INVALID_BUDGET'
      ? resultMessages.budgetTooLow(avalanche.minimumRequired)
      : undefined;

  return (
    <div className={styles.budget}>
      <TextField
        id={fieldId(BUDGET_FIELD)}
        label="Presupuesto mensual"
        hint="¿Cuánto puedes destinar en total a tus deudas cada mes?"
        inputMode="numeric"
        placeholder="1.300.000"
        value={plan.form.monthlyBudget}
        onChange={plan.setBudget}
        onBlur={() => plan.touch(BUDGET_FIELD)}
        error={error}
      />
    </div>
  );
}
