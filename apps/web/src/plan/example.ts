import type { Debt } from '@avalancha/engine';

// Fictional data from the golden case "tres-deudas-clasico".
export const EXAMPLE_DEBTS: Debt[] = [
  {
    id: 'tarjeta-a',
    name: 'Tarjeta A',
    balance: 4_500_000,
    annualEffectiveRate: 0.32,
    minimumPayment: 225_000,
  },
  {
    id: 'libre-inversion',
    name: 'Libre inversión',
    balance: 12_000_000,
    annualEffectiveRate: 0.21,
    minimumPayment: 480_000,
  },
  {
    id: 'tarjeta-b',
    name: 'Tarjeta B',
    balance: 1_800_000,
    annualEffectiveRate: 0.28,
    minimumPayment: 90_000,
  },
];

export const EXAMPLE_BUDGET = 1_300_000;
