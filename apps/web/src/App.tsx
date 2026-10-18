import type { FormEvent } from 'react';
import styles from './App.module.css';
import { BudgetField } from './components/BudgetField.js';
import { DebtList } from './components/DebtList.js';
import { FirstPaymentField } from './components/FirstPaymentField.js';
import { PlanActions } from './components/PlanActions.js';
import { PlanResults } from './components/PlanResults.js';
import { fieldId } from './plan/fields.js';
import { usePlan } from './plan/usePlan.js';
import buttons from './styles/buttons.module.css';

export function App() {
  const plan = usePlan();

  // "Ver mi plan" (SPEC-web §3): muestra todos los errores y enfoca el primero.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const firstError = plan.revealErrors();
    if (firstError !== null) document.getElementById(fieldId(firstError))?.focus();
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.brand}>Avalancha</h1>
        <p className={styles.privacy}>Tus datos se quedan en este navegador</p>
      </header>
      <div className={styles.layout}>
        <form className={styles.form} onSubmit={handleSubmit} noValidate aria-label="Tus datos">
          <DebtList plan={plan} />
          <BudgetField plan={plan} />
          <FirstPaymentField value={plan.form.firstPayment} onChange={plan.setFirstPayment} />
          <div>
            <button type="submit" className={buttons.primary}>
              Ver mi plan
            </button>
          </div>
          <PlanActions onLoadExample={plan.loadExample} onClear={plan.clear} />
        </form>
        <PlanResults
          hasDebts={plan.form.debts.length > 0}
          comparison={plan.comparison}
          selected={plan.selected}
          onSelect={plan.select}
          firstPayment={plan.form.firstPayment}
        />
      </div>
    </div>
  );
}
