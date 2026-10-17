import type { Debt, Strategy, Warning } from '../src/index.js';

export interface RateConversion {
  annualEffectiveRate: number;
  monthlyRate: number;
}

export interface ExpectedMonthRow {
  month: number;
  rows: {
    debtId: string;
    openingBalance: number;
    interest: number;
    payment: number;
    closingBalance: number;
  }[];
}

export type ExpectedResult =
  | {
      status: 'PAID_OFF';
      warnings: Warning[];
      months: number;
      totalInterest: number;
      totalPaid: number;
      payoffOrder: { debtId: string; month: number }[];
      firstMonths: ExpectedMonthRow[];
    }
  | {
      status: 'NOT_PAYABLE';
      monthsSimulated: 600;
      warnings: Warning[];
    }
  | {
      status: 'INVALID_BUDGET';
      minimumRequired: number;
    };

export type FixtureStrategyKey = 'avalanche' | 'snowball' | 'minimum-only';

export interface GoldenCase {
  name: string;
  learning: string;
  debts: Debt[];
  monthlyBudget: number;
  expected: Record<FixtureStrategyKey, ExpectedResult>;
}

export interface GoldenCasesFixture {
  generatedBy: string;
  spec: string;
  rateConversions: RateConversion[];
  cases: GoldenCase[];
}

export function fixtureKeyToStrategy(key: FixtureStrategyKey): Strategy {
  return key;
}
