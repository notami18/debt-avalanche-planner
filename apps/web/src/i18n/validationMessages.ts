import type { ValidationCode } from '@avalancha/engine';

// SPEC-web §2: si el motor agrega un código, el typecheck falla hasta escribir su texto.
export const validationMessages: Record<ValidationCode, string> = {
  NOT_FINITE: 'Escribe un número, por ejemplo 4.500.000.',
  NOT_POSITIVE_INTEGER: 'Escribe un valor en pesos mayor que cero, sin centavos.',
  RATE_OUT_OF_RANGE: 'Escribe una tasa entre 0 % y 200 % E.A.',
  DUPLICATE_ID: 'Esta deuda está repetida. Quítala y agrégala de nuevo.',
  NO_DEBTS: 'Agrega al menos una deuda.',
  TOO_MANY_DEBTS: 'Puedes simular hasta 20 deudas.',
};
