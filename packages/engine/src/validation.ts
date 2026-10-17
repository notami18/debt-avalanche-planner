import type { PlanInput, SimulationResult, ValidationIssue } from './types.js';

export const MAX_DEBTS = 20;
export const MAX_ANNUAL_EFFECTIVE_RATE = 2;

type InvalidResult = Extract<
  SimulationResult,
  { status: 'INVALID_INPUT' } | { status: 'INVALID_BUDGET' }
>;

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

export function findInputIssues(input: PlanInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (input.debts.length === 0 || input.debts.length > MAX_DEBTS) {
    issues.push({
      path: 'debts',
      message: `Debe haber entre 1 y ${MAX_DEBTS} deudas.`,
    });
  }

  if (!isPositiveInteger(input.monthlyBudget)) {
    issues.push({
      path: 'monthlyBudget',
      message: 'El presupuesto mensual debe ser un entero mayor que 0.',
    });
  }

  const seenIds = new Set<string>();
  input.debts.forEach((debt, index) => {
    const path = `debts[${index}]`;

    if (seenIds.has(debt.id)) {
      issues.push({ path: `${path}.id`, message: `El id "${debt.id}" está repetido.` });
    }
    seenIds.add(debt.id);

    if (!isPositiveInteger(debt.balance)) {
      issues.push({
        path: `${path}.balance`,
        message: 'El saldo debe ser un entero mayor que 0.',
      });
    }

    if (!isPositiveInteger(debt.minimumPayment)) {
      issues.push({
        path: `${path}.minimumPayment`,
        message: 'La cuota mínima debe ser un entero mayor que 0.',
      });
    }

    const rate = debt.annualEffectiveRate;
    if (!Number.isFinite(rate) || rate < 0 || rate > MAX_ANNUAL_EFFECTIVE_RATE) {
      issues.push({
        path: `${path}.annualEffectiveRate`,
        message: 'La tasa E.A. debe estar entre 0 y 2 (200 %).',
      });
    }
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
