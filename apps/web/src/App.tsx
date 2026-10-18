import type { FormEvent } from 'react';
import styles from './App.module.css';
import { BudgetField } from './components/BudgetField.js';
import { DebtList } from './components/DebtList.js';
import { FirstPaymentField } from './components/FirstPaymentField.js';
import { PlanActions } from './components/PlanActions.js';
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

  const pausedMessage =
    plan.form.debts.length === 0
      ? 'Agrega tu primera deuda o carga un ejemplo para ver cómo funciona.'
      : plan.issues.length > 0
        ? 'Completa los datos de tus deudas para ver tu plan.'
        : null;

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
        <section className={styles.results} aria-labelledby="results-title" aria-live="polite">
          <h2 id="results-title" className={styles.resultsTitle}>
            Tu plan
          </h2>
          {pausedMessage && <p>{pausedMessage}</p>}
        </section>
      </div>
    </div>
  );
}
