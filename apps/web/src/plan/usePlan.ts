import { compareStrategies } from '@avalancha/engine';
import type { ValidationCode } from '@avalancha/engine';
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { fieldsInFormOrder } from './fields.js';
import { nextMonth } from './firstPayment.js';
import { inputIssues, issuesByField } from './issues.js';
import { createEmptyPlan, planReducer } from './reducer.js';
import { clearPlan, loadPlan, savePlan } from './storage.js';
import type { StrategyKey } from './strategies.js';
import { toEngineInput } from './toEngineInput.js';
import type { DebtTextField, FieldKey, PlanForm, RateType } from './types.js';

function initPlan(): PlanForm {
  return loadPlan() ?? createEmptyPlan(nextMonth(new Date()));
}

function isEmptyPlan(form: PlanForm): boolean {
  return form.debts.length === 0 && form.monthlyBudget.trim() === '';
}

export function usePlan() {
  const [form, dispatch] = useReducer(planReducer, undefined, initPlan);
  // Estado de UI, no se persiste: qué campos ya se tocaron (SPEC-web §3).
  const [touched, setTouched] = useState<ReadonlySet<FieldKey>>(() => new Set());
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [selected, setSelected] = useState<StrategyKey>('avalanche');

  useEffect(() => {
    if (isEmptyPlan(form)) clearPlan();
    else savePlan(form);
  }, [form]);

  // Una sola llamada al motor: resultados y validación salen de aquí (SPEC-web §2).
  const comparison = useMemo(() => {
    const { debts, monthlyBudget } = toEngineInput(form);
    return compareStrategies(debts, monthlyBudget);
  }, [form]);
  const issues = useMemo(() => inputIssues(comparison.avalanche), [comparison]);
  const fieldErrors = useMemo(() => issuesByField(issues, form.debts), [issues, form.debts]);

  const errorFor = (key: FieldKey): ValidationCode | undefined =>
    showAllErrors || touched.has(key) ? fieldErrors.get(key) : undefined;

  const touch = useCallback((key: FieldKey) => {
    setTouched((previous) => (previous.has(key) ? previous : new Set(previous).add(key)));
  }, []);

  const resetUi = () => {
    setTouched(new Set());
    setShowAllErrors(false);
    setSelected('avalanche');
  };

  /** "Ver mi plan": muestra todos los errores y devuelve el primer campo con error. */
  const revealErrors = (): FieldKey | null => {
    setShowAllErrors(true);
    return fieldsInFormOrder(form.debts).find((key) => fieldErrors.has(key)) ?? null;
  };

  return {
    form,
    comparison,
    issues,
    selected,
    select: setSelected,
    errorFor,
    touch,
    revealErrors,
    addDebt: () => dispatch({ type: 'addDebt', id: crypto.randomUUID() }),
    updateDebt: (id: string, field: DebtTextField, value: string) =>
      dispatch({ type: 'updateDebt', id, field, value }),
    setRateType: (id: string, rateType: RateType) =>
      dispatch({ type: 'setRateType', id, rateType }),
    removeDebt: (id: string) => dispatch({ type: 'removeDebt', id }),
    setBudget: (value: string) => dispatch({ type: 'setBudget', value }),
    setFirstPayment: (value: string) => dispatch({ type: 'setFirstPayment', value }),
    loadExample: () => {
      dispatch({ type: 'loadExample', firstPayment: nextMonth(new Date()) });
      resetUi();
    },
    clear: () => {
      dispatch({ type: 'clear', firstPayment: nextMonth(new Date()) });
      resetUi();
    },
  };
}

export type PlanController = ReturnType<typeof usePlan>;
