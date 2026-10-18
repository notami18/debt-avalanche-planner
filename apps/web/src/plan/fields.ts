import type { DebtForm, DebtTextField, FieldKey } from './types.js';

export const BUDGET_FIELD: FieldKey = 'monthlyBudget';

const DEBT_TEXT_FIELDS: readonly DebtTextField[] = ['name', 'balance', 'rate', 'minimumPayment'];

export function debtFieldKey(debtId: string, field: DebtTextField): FieldKey {
  return `${debtId}.${field}`;
}

export function fieldId(key: FieldKey): string {
  return `field-${key}`;
}

export function defaultDebtName(index: number): string {
  return `Deuda ${index + 1}`;
}

// Orden visual del formulario: primero las deudas, luego el presupuesto.
export function fieldsInFormOrder(debts: readonly DebtForm[]): FieldKey[] {
  return [
    ...debts.flatMap((debt) => DEBT_TEXT_FIELDS.map((field) => debtFieldKey(debt.id, field))),
    BUDGET_FIELD,
  ];
}
