import { simulate } from './simulate.js';
import type { Debt, StrategyComparison } from './types.js';

export function compareStrategies(debts: Debt[], monthlyBudget: number): StrategyComparison {
  return {
    avalanche: simulate({ debts, monthlyBudget, strategy: 'avalanche' }),
    snowball: simulate({ debts, monthlyBudget, strategy: 'snowball' }),
    minimumOnly: simulate({ debts, monthlyBudget, strategy: 'minimum-only' }),
  };
}
