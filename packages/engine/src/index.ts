export type Strategy = 'avalanche' | 'snowball' | 'minimum-only';

export interface Debt {
  id: string;
  name: string;
  balance: number;
  annualEffectiveRate: number;
  minimumPayment: number;
}

export interface PlanInput {
  debts: Debt[];
  monthlyBudget: number;
  strategy: Strategy;
}

export type Warning = { code: 'MINIMUM_BELOW_INTEREST'; debtId: string };

export interface MonthRow {
  month: number;
  rows: {
    debtId: string;
    openingBalance: number;
    interest: number;
    payment: number;
    closingBalance: number;
  }[];
}

export type SimulationResult =
  | {
      status: 'PAID_OFF';
      warnings: Warning[];
      months: number;
      totalInterest: number;
      totalPaid: number;
      payoffOrder: { debtId: string; month: number }[];
      schedule: MonthRow[];
    }
  | { status: 'NOT_PAYABLE'; monthsSimulated: 600; warnings: Warning[] }
  | { status: 'INVALID_BUDGET'; minimumRequired: number }
  | { status: 'INVALID_INPUT'; issues: { path: string; message: string }[] };

export function toMonthlyRate(_annualEffectiveRate: number): number {
  throw new Error('not implemented');
}

export function simulate(_input: PlanInput): SimulationResult {
  throw new Error('not implemented');
}

export function compareStrategies(
  _debts: Debt[],
  _monthlyBudget: number,
): {
  avalanche: SimulationResult;
  snowball: SimulationResult;
  minimumOnly: SimulationResult;
} {
  throw new Error('not implemented');
}
