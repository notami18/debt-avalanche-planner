import { formatMoney } from '../format/money.js';

// SPEC-web §4 y §5: textos de los estados del resultado.
export const resultMessages = {
  empty: 'Agrega tu primera deuda o carga un ejemplo para ver cómo funciona.',
  incomplete: 'Completa los datos de tus deudas para ver tu plan.',
  notPayable: 'Con estos pagos, esta deuda no se termina de pagar.',
  minimumNeverEnds: 'Pagando solo los mínimos, esta deuda no se acabaría nunca.',
  budgetTooLow: (minimumRequired: number) =>
    `Para cubrir los mínimos necesitas al menos ${formatMoney(minimumRequired)} al mes.`,
  minimumBelowInterest: (debtName: string) =>
    `La cuota mínima de ${debtName} no alcanza a cubrir los intereses del mes: la deuda crece aunque pagues.`,
  disclaimer:
    'Avalancha es un simulador educativo, no asesoría financiera. Tu banco puede calcular distinto: cuotas de manejo, seguros o cambios de tasa.',
};
