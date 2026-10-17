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

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface DebtMonthRow {
  debtId: string;
  openingBalance: number;
  interest: number;
  payment: number;
  closingBalance: number;
}

export interface MonthRow {
  month: number;
  rows: DebtMonthRow[];
}

export interface PayoffEntry {
  debtId: string;
  month: number;
}

export type SimulationResult =
  | {
      status: 'PAID_OFF';
      warnings: Warning[];
      months: number;
      totalInterest: number;
      totalPaid: number;
      payoffOrder: PayoffEntry[];
      schedule: MonthRow[];
    }
  | { status: 'NOT_PAYABLE'; monthsSimulated: 600; warnings: Warning[] }
  | { status: 'INVALID_BUDGET'; minimumRequired: number }
  | { status: 'INVALID_INPUT'; issues: ValidationIssue[] };

export interface StrategyComparison {
  avalanche: SimulationResult;
  snowball: SimulationResult;
  minimumOnly: SimulationResult;
}
