import type { MonthRow } from '@avalancha/engine';

/**
 * Saldo total por mes: la posición 0 es la suma de los saldos iniciales y la posición N
 * el saldo al cierre del mes N. Las filas solo traen deudas abiertas, así que basta sumar.
 */
export function balanceSeries(schedule: readonly MonthRow[]): number[] {
  const [first] = schedule;
  if (!first) return [];

  const total = (values: number[]) => values.reduce((sum, value) => sum + value, 0);
  return [
    total(first.rows.map((row) => row.openingBalance)),
    ...schedule.map((month) => total(month.rows.map((row) => row.closingBalance))),
  ];
}
