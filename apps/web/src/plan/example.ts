import type { PlanForm } from './types.js';

// Datos ficticios del caso dorado "tres-deudas-clasico", escritos como los teclearía una
// persona. Sin primer pago: la fecha llega con la acción para no envejecer.
export const EXAMPLE_PLAN: Omit<PlanForm, 'firstPayment'> = {
  debts: [
    {
      id: 'tarjeta-a',
      name: 'Tarjeta A',
      balance: '4.500.000',
      rate: '32',
      rateType: 'EA',
      minimumPayment: '225.000',
    },
    {
      id: 'libre-inversion',
      name: 'Libre inversión',
      balance: '12.000.000',
      rate: '21',
      rateType: 'EA',
      minimumPayment: '480.000',
    },
    {
      id: 'tarjeta-b',
      name: 'Tarjeta B',
      balance: '1.800.000',
      rate: '28',
      rateType: 'EA',
      minimumPayment: '90.000',
    },
  ],
  monthlyBudget: '1.300.000',
};
