import type { StrategyComparison } from '@avalancha/engine';
import type { StrategyKey } from './strategies.js';

export type InterestSummary =
  | { kind: 'savings'; interest: number; savings: number }
  | { kind: 'same'; interest: number }
  | { kind: 'minimumNeverEnds'; interest: number }
  | { kind: 'plain'; interest: number };

/** Intereses que se ahorran frente a solo mínimos; null si no aplica. */
export function savingsVsMinimum(comparison: StrategyComparison, key: StrategyKey): number | null {
  const result = comparison[key];
  const minimum = comparison.minimumOnly;
  if (key === 'minimumOnly' || result.status !== 'PAID_OFF' || minimum.status !== 'PAID_OFF') {
    return null;
  }
  return minimum.totalInterest - result.totalInterest;
}

// SPEC-web §5.1: la línea bajo la montaña y sus variantes.
export function interestSummary(
  comparison: StrategyComparison,
  selected: StrategyKey,
): InterestSummary | null {
  const result = comparison[selected];
  if (result.status !== 'PAID_OFF') return null;

  const interest = result.totalInterest;
  if (selected === 'minimumOnly') return { kind: 'plain', interest };
  if (comparison.minimumOnly.status === 'NOT_PAYABLE') return { kind: 'minimumNeverEnds', interest };

  const savings = savingsVsMinimum(comparison, selected) ?? 0;
  return savings > 0 ? { kind: 'savings', interest, savings } : { kind: 'same', interest };
}
