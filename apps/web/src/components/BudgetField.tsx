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
        error={code && validationMessages[code]}
      />
    </div>
  );
}
