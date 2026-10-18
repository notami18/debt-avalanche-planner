export const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

export function toYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** `month` va de 1 a 12. */
export function splitYearMonth(value: string): { year: number; month: number } {
  const [year = '', month = ''] = value.split('-');
  return { year: Number(year), month: Number(month) };
}

// SPEC-web §3: por defecto, el primer pago es el mes siguiente al actual.
export function nextMonth(today: Date): string {
  const next = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return toYearMonth(next.getFullYear(), next.getMonth() + 1);
}
