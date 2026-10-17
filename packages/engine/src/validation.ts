import type {
  PlanInput,
  SimulationResult,
  ValidationCode,
  ValidationIssue,
} from './types.js';

export const MAX_DEBTS = 20;
export const MAX_ANNUAL_EFFECTIVE_RATE = 2;

type InvalidResult = Extract<
  SimulationResult,
  { status: 'INVALID_INPUT' } | { status: 'INVALID_BUDGET' }
>;

// SPEC §6, decisión 2: NaN/Infinity se distinguen de los errores de entero.
function amountIssue(value: number): ValidationCode | null {
  if (!Number.isFinite(value)) return 'NOT_FINITE';
  if (!Number.isInteger(value) || value <= 0) return 'NOT_POSITIVE_INTEGER';
  return null;
}

function rateIssue(rate: number): ValidationCode | null {
  if (!Number.isFinite(rate)) return 'NOT_FINITE';
  if (rate < 0 || rate > MAX_ANNUAL_EFFECTIVE_RATE) return 'RATE_OUT_OF_RANGE';
  return null;
}

function debtCountIssue(count: number): ValidationCode | null {
  if (count === 0) return 'NO_DEBTS';
  if (count > MAX_DEBTS) return 'TOO_MANY_DEBTS';
  return null;
}

// SPEC §6: todos los problemas, uno por campo, en orden fijo.
export function findInputIssues(input: PlanInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const check = (path: string, code: ValidationCode | null): void => {
    if (code !== null) issues.push({ path, code });
  };

  check('debts', debtCountIssue(input.debts.length));
  // Decisión 1: el presupuesto se valida siempre, también en minimum-only.
  check('monthlyBudget', amountIssue(input.monthlyBudget));

  const seenIds = new Set<string>();
  input.debts.forEach((debt, index) => {
    const path = `debts[${index}]`;

    check(`${path}.id`, seenIds.has(debt.id) ? 'DUPLICATE_ID' : null);
    seenIds.add(debt.id);

    check(`${path}.balance`, amountIssue(debt.balance));
    check(`${path}.minimumPayment`, amountIssue(debt.minimumPayment));
    check(`${path}.annualEffectiveRate`, rateIssue(debt.annualEffectiveRate));
  });

  return issues;
}

export function minimumRequired(input: PlanInput): number {
  return input.debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
}

// SPEC §6: INVALID_INPUT se valida antes que todo; INVALID_BUDGET no aplica a minimum-only.
export function validatePlan(input: PlanInput): InvalidResult | null {
  const issues = findInputIssues(input);
  if (issues.length > 0) {
    return { status: 'INVALID_INPUT', issues };
  }

  const required = minimumRequired(input);
  if (input.strategy !== 'minimum-only' && input.monthlyBudget < required) {
    return { status: 'INVALID_BUDGET', minimumRequired: required };
  }

  return null;
}
