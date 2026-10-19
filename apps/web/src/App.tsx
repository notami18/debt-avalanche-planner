import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import styles from './App.module.css';
import { BudgetField } from './components/BudgetField.js';
import { DebtList } from './components/DebtList.js';
import { FirstPaymentField } from './components/FirstPaymentField.js';
import { PlanActions } from './components/PlanActions.js';
import { PlanResults } from './components/PlanResults.js';
import { resultMessages } from './i18n/resultMessages.js';
import { debtFieldKey, fieldId } from './plan/fields.js';
import { usePlan } from './plan/usePlan.js';
import buttons from './styles/buttons.module.css';

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export function App() {
  const plan = usePlan();
  const resultsTitleRef = useRef<HTMLHeadingElement>(null);
  // Deuda agregada desde el estado vacío: se enfoca cuando ya está en el DOM.
  const [debtToFocus, setDebtToFocus] = useState<string | null>(null);

  useEffect(() => {
    if (debtToFocus === null) return;
    document.getElementById(fieldId(debtFieldKey(debtToFocus, 'name')))?.focus();
    setDebtToFocus(null);
  }, [debtToFocus]);

  const focusResults = () => {
    const title = resultsTitleRef.current;
    title?.focus({ preventScroll: true });
    title?.scrollIntoView?.({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  };

  // "Ver mi plan" (SPEC-web §3): muestra todos los errores y enfoca el primero; con datos
  // válidos, lleva a "Tu plan".
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const firstError = plan.revealErrors();
    if (firstError !== null) document.getElementById(fieldId(firstError))?.focus();
    else focusResults();
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
          <PlanActions hasData={plan.hasData} onLoadExample={plan.loadExample} onClear={plan.clear} />
        </form>
        <PlanResults
          titleRef={resultsTitleRef}
          debts={plan.debts}
          comparison={plan.comparison}
          selected={plan.selected}
          onSelect={plan.select}
          firstPayment={plan.form.firstPayment}
          onAddDebt={() => setDebtToFocus(plan.addDebt())}
          onLoadExample={() => {
            plan.loadExample();
            // El botón desaparece con el estado vacío: el foco queda en "Tu plan".
            resultsTitleRef.current?.focus();
          }}
        />
      </div>
      <footer className={styles.footer}>
        <p>{resultMessages.disclaimer}</p>
      </footer>
    </div>
  );
}
