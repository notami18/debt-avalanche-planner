export type RateType = 'EA' | 'MV';

// Lo que la persona escribió, sin convertir (SPEC-web §2).
export interface DebtForm {
  id: string;
  name: string;
  balance: string;
  rate: string;
  rateType: RateType;
  minimumPayment: string;
}

export type DebtTextField = 'name' | 'balance' | 'rate' | 'minimumPayment';

export interface PlanForm {
  debts: DebtForm[];
  monthlyBudget: string;
  /** 'YYYY-MM' */
  firstPayment: string;
}

export type FieldKey = 'monthlyBudget' | `${string}.${DebtTextField}`;

// SPEC-web §3: el botón de agregar se desactiva al llegar a 20.
export const MAX_DEBTS = 20;
