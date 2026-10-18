import { EXAMPLE_PLAN } from './example.js';
import { MAX_DEBTS } from './types.js';
import type { DebtForm, DebtTextField, PlanForm, RateType } from './types.js';

// Ids y fechas llegan en la acción para que el reducer sea puro.
export type PlanAction =
  | { type: 'addDebt'; id: string }
  | { type: 'updateDebt'; id: string; field: DebtTextField; value: string }
  | { type: 'setRateType'; id: string; rateType: RateType }
  | { type: 'removeDebt'; id: string }
  | { type: 'setBudget'; value: string }
  | { type: 'setFirstPayment'; value: string }
  | { type: 'loadExample'; firstPayment: string }
  | { type: 'clear'; firstPayment: string };

export function createEmptyPlan(firstPayment: string): PlanForm {
  return { debts: [], monthlyBudget: '', firstPayment };
}

export function createEmptyDebt(id: string): DebtForm {
  return { id, name: '', balance: '', rate: '', rateType: 'EA', minimumPayment: '' };
}

function updateDebt(
  debts: DebtForm[],
  id: string,
  change: (debt: DebtForm) => DebtForm,
): DebtForm[] {
  return debts.map((debt) => (debt.id === id ? change(debt) : debt));
}

export function planReducer(state: PlanForm, action: PlanAction): PlanForm {
  switch (action.type) {
    case 'addDebt':
      if (state.debts.length >= MAX_DEBTS) return state;
      return { ...state, debts: [...state.debts, createEmptyDebt(action.id)] };
    case 'updateDebt':
      return {
        ...state,
        debts: updateDebt(state.debts, action.id, (debt) => ({
          ...debt,
          [action.field]: action.value,
        })),
      };
    case 'setRateType':
      return {
        ...state,
        debts: updateDebt(state.debts, action.id, (debt) => ({
          ...debt,
          rateType: action.rateType,
        })),
      };
    case 'removeDebt':
      return { ...state, debts: state.debts.filter((debt) => debt.id !== action.id) };
    case 'setBudget':
      return { ...state, monthlyBudget: action.value };
    case 'setFirstPayment':
      return { ...state, firstPayment: action.value };
    case 'loadExample':
      return {
        debts: EXAMPLE_PLAN.debts.map((debt) => ({ ...debt })),
        monthlyBudget: EXAMPLE_PLAN.monthlyBudget,
        firstPayment: action.firstPayment,
      };
    case 'clear':
      return createEmptyPlan(action.firstPayment);
  }
}
