import type { Debt, Strategy } from './types.js';

type DebtComparator = (a: Debt, b: Debt) => number;

export function compareIds(a: Debt, b: Debt): number {
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

const byHighestRate: DebtComparator = (a, b) =>
  b.annualEffectiveRate - a.annualEffectiveRate;

const bySmallestBalance: DebtComparator = (a, b) => a.balance - b.balance;

function chain(...comparators: DebtComparator[]): DebtComparator {
  return (a, b) => {
    for (const compare of comparators) {
      const result = compare(a, b);
      if (result !== 0) return result;
    }
    return 0;
  };
}

// SPEC §4: criterio principal, desempate 1 y desempate 2 por estrategia.
const comparators: Record<Strategy, DebtComparator> = {
  avalanche: chain(byHighestRate, bySmallestBalance, compareIds),
  snowball: chain(bySmallestBalance, byHighestRate, compareIds),
  'minimum-only': compareIds,
};

export function prioritize(debts: readonly Debt[], strategy: Strategy): Debt[] {
  return [...debts].sort(comparators[strategy]);
}
