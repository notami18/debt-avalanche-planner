import { splitYearMonth } from '../plan/firstPayment.js';

const monthYearFormat = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' });

/** El "mes N" del motor como fecha: el mes 1 es el mes del primer pago ('YYYY-MM'). */
export function monthToDate(firstPayment: string, month: number): Date {
  const { year, month: firstMonth } = splitYearMonth(firstPayment);
  return new Date(year, firstMonth - 1 + month - 1, 1);
}

/** "marzo de 2028" */
export function formatMonthYear(date: Date): string {
  return monthYearFormat.format(date);
}
