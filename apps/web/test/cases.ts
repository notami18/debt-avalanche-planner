import type { Debt } from '@avalancha/engine';

// Datos ficticios para tests. Los tres primeros reproducen casos dorados del motor; el
// mixto no existe en el fixture: avalancha y bola de nieve pagan, solo mínimos no.
export interface TestCase {
  debts: Debt[];
  monthlyBudget: number;
}

export const CLASSIC: TestCase = {
  debts: [
    { id: 'tarjeta-a', name: 'Tarjeta A', balance: 4_500_000, annualEffectiveRate: 0.32, minimumPayment: 225_000 },
    { id: 'libre-inversion', name: 'Libre inversión', balance: 12_000_000, annualEffectiveRate: 0.21, minimumPayment: 480_000 },
    { id: 'tarjeta-b', name: 'Tarjeta B', balance: 1_800_000, annualEffectiveRate: 0.28, minimumPayment: 90_000 },
  ],
  monthlyBudget: 1_300_000,
};

export const SINGLE_LOAN: TestCase = {
  debts: [
    { id: 'libre-inversion', name: 'Libre inversión', balance: 10_000_000, annualEffectiveRate: 0.24, minimumPayment: 500_000 },
  ],
  monthlyBudget: 500_000,
};

export const LOW_BUDGET: TestCase = {
  debts: [
    { id: 'tarjeta-a', name: 'Tarjeta A', balance: 3_000_000, annualEffectiveRate: 0.3, minimumPayment: 150_000 },
    { id: 'tarjeta-b', name: 'Tarjeta B', balance: 2_000_000, annualEffectiveRate: 0.28, minimumPayment: 100_000 },
  ],
  monthlyBudget: 200_000,
};

export const MINIMUM_TRAP: TestCase = {
  debts: [
    { id: 'tarjeta-grande', name: 'Tarjeta grande', balance: 20_000_000, annualEffectiveRate: 0.3, minimumPayment: 300_000 },
  ],
  monthlyBudget: 300_000,
};

export const MINIMUM_NEVER_ENDS: TestCase = {
  ...MINIMUM_TRAP,
  monthlyBudget: 1_000_000,
};
