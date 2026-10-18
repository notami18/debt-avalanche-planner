import { simulate } from '@avalancha/engine';
import type { ValidationCode, ValidationIssue } from '@avalancha/engine';
import { BUDGET_FIELD, debtFieldKey } from './fields.js';
import type { EngineInput } from './toEngineInput.js';
import type { DebtForm, DebtTextField, FieldKey } from './types.js';

// La API pública valida dentro de simulate: aquí solo se leen sus issues.
export function findIssues(input: EngineInput): ValidationIssue[] {
  const result = simulate({ ...input, strategy: 'avalanche' });
  return result.status === 'INVALID_INPUT' ? result.issues : [];
}

const DEBT_PATH = /^debts\[(\d+)\]\.(\w+)$/;

const FORM_FIELD: Record<string, DebtTextField> = {
  id: 'name',
  balance: 'balance',
  annualEffectiveRate: 'rate',
  minimumPayment: 'minimumPayment',
};

function toFieldKey(path: string, debts: readonly DebtForm[]): FieldKey | null {
  if (path === 'monthlyBudget') return BUDGET_FIELD;

  const [, index, engineField] = DEBT_PATH.exec(path) ?? [];
  const debt = debts[Number(index)];
  const field = engineField === undefined ? undefined : FORM_FIELD[engineField];
  return debt && field ? debtFieldKey(debt.id, field) : null;
}

// `debts` (NO_DEBTS, TOO_MANY_DEBTS) no es de un campo: no entra al mapa.
export function issuesByField(
  issues: readonly ValidationIssue[],
  debts: readonly DebtForm[],
): Map<FieldKey, ValidationCode> {
  const byField = new Map<FieldKey, ValidationCode>();
  for (const issue of issues) {
    const key = toFieldKey(issue.path, debts);
    if (key !== null && !byField.has(key)) byField.set(key, issue.code);
  }
  return byField;
}
