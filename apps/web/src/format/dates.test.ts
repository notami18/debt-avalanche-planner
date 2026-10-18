import { describe, expect, it } from 'vitest';
import { formatMonthYear, monthToDate } from './dates.js';

describe('monthToDate', () => {
  it('month 1 is the month of the first payment', () => {
    expect(monthToDate('2027-03', 1)).toEqual(new Date(2027, 2, 1));
  });

  it('crosses the year', () => {
    expect(monthToDate('2026-11', 3)).toEqual(new Date(2027, 0, 1));
    expect(monthToDate('2027-01', 17)).toEqual(new Date(2028, 4, 1));
  });
});

describe('formatMonthYear', () => {
  it('formats in es-CO', () => {
    expect(formatMonthYear(new Date(2028, 2, 1))).toBe('marzo de 2028');
  });
});
