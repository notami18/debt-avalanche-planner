import { compareIds, prioritize } from './priority.js';
import { toMonthlyRate } from './rates.js';
import type {
  Debt,
  DebtMonthRow,
  MonthRow,
  PayoffEntry,
  PlanInput,
  SimulationResult,
  Warning,
} from './types.js';
import { validatePlan } from './validation.js';

export const MAX_MONTHS = 600;

interface DebtState {
  debt: Debt;
  monthlyRate: number;
  balance: number;
}

interface MonthEntry {
  state: DebtState;
  openingBalance: number;
  interest: number;
  payment: number;
}

function monthlyInterest(balance: number, monthlyRate: number): number {
  return Math.round(balance * monthlyRate);
}

export function findWarnings(debts: readonly Debt[]): Warning[] {
  return [...debts]
    .sort(compareIds)
    .filter(
      (debt) =>
        debt.minimumPayment <=
        monthlyInterest(debt.balance, toMonthlyRate(debt.annualEffectiveRate)),
    )
    .map((debt) => ({ code: 'MINIMUM_BELOW_INTEREST', debtId: debt.id }));
}

function pay(entry: MonthEntry, amount: number): void {
  entry.state.balance -= amount;
  entry.payment += amount;
}

function toDebtMonthRow(entry: MonthEntry): DebtMonthRow {
  return {
    debtId: entry.state.debt.id,
    openingBalance: entry.openingBalance,
    interest: entry.interest,
    payment: entry.payment,
    closingBalance: entry.state.balance,
  };
}

export function simulate(input: PlanInput): SimulationResult {
  const invalid = validatePlan(input);
  if (invalid !== null) {
    return invalid;
  }

  const warnings = findWarnings(input.debts);
  const cascades = input.strategy !== 'minimum-only';
  const states: DebtState[] = prioritize(input.debts, input.strategy).map((debt) => ({
    debt,
    monthlyRate: toMonthlyRate(debt.annualEffectiveRate),
    balance: debt.balance,
  }));

  const schedule: MonthRow[] = [];
  const payoffOrder: PayoffEntry[] = [];
  let totalInterest = 0;
  let totalPaid = 0;

  for (let month = 1; month <= MAX_MONTHS; month++) {
    // 1. Intereses sobre cada deuda activa (en orden de prioridad).
    const entries: MonthEntry[] = states
      .filter((state) => state.balance > 0)
      .map((state) => {
        const openingBalance = state.balance;
        const interest = monthlyInterest(openingBalance, state.monthlyRate);
        state.balance += interest;
        return { state, openingBalance, interest, payment: 0 };
      });

    // 2. Cuotas mínimas.
    let available = input.monthlyBudget;
    for (const entry of entries) {
      const payment = Math.min(entry.state.debt.minimumPayment, entry.state.balance);
      pay(entry, payment);
      available -= payment;
    }

    // 3. Excedente en cascada: minimum-only ignora el presupuesto.
    if (cascades) {
      for (const entry of entries) {
        if (available <= 0) break;
        const payment = Math.min(available, entry.state.balance);
        pay(entry, payment);
        available -= payment;
      }
    }

    // 4. Registro del mes y deudas cerradas.
    schedule.push({ month, rows: entries.map(toDebtMonthRow) });
    for (const entry of entries) {
      totalInterest += entry.interest;
      totalPaid += entry.payment;
      if (entry.state.balance === 0) {
        payoffOrder.push({ debtId: entry.state.debt.id, month });
      }
    }

    if (states.every((state) => state.balance === 0)) {
      return {
        status: 'PAID_OFF',
        warnings,
        months: month,
        totalInterest,
        totalPaid,
        payoffOrder,
        schedule,
      };
    }
  }

  return { status: 'NOT_PAYABLE', monthsSimulated: MAX_MONTHS, warnings };
}
