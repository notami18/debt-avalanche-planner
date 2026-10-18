import type { ValidationCode, ValidationIssue } from '@avalancha/engine';
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { fieldsInFormOrder } from './fields.js';
import { nextMonth } from './firstPayment.js';
import { findIssues, issuesByField } from './issues.js';
import { createEmptyPlan, planReducer } from './reducer.js';
import { clearPlan, loadPlan, savePlan } from './storage.js';
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

  useEffect(() => {
    if (isEmptyPlan(form)) clearPlan();
    else savePlan(form);
  }, [form]);

  const issues: ValidationIssue[] = useMemo(() => findIssues(toEngineInput(form)), [form]);
  const fieldErrors = useMemo(() => issuesByField(issues, form.debts), [issues, form.debts]);

  const errorFor = (key: FieldKey): ValidationCode | undefined =>
    showAllErrors || touched.has(key) ? fieldErrors.get(key) : undefined;

  const touch = useCallback((key: FieldKey) => {
    setTouched((previous) => (previous.has(key) ? previous : new Set(previous).add(key)));
  }, []);

  const resetErrors = () => {
    setTouched(new Set());
    setShowAllErrors(false);
  };

  /** "Ver mi plan": muestra todos los errores y devuelve el primer campo con error. */
  const revealErrors = (): FieldKey | null => {
    setShowAllErrors(true);
    return fieldsInFormOrder(form.debts).find((key) => fieldErrors.has(key)) ?? null;
  };

  return {
    form,
    issues,
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
      resetErrors();
    },
    clear: () => {
      dispatch({ type: 'clear', firstPayment: nextMonth(new Date()) });
      resetErrors();
    },
  };
}

export type PlanController = ReturnType<typeof usePlan>;
