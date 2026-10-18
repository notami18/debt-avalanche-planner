import { simulate } from '@avalancha/engine';
import { describe, expect, it } from 'vitest';
import { balanceSeries } from './balanceSeries.js';
import { CLASSIC } from '../../test/cases.js';

describe('balanceSeries', () => {
  it('starts at the total initial balance and ends at zero (classic case)', () => {
    const result = simulate({ ...CLASSIC, strategy: 'avalanche' });
    if (result.status !== 'PAID_OFF') throw new Error('expected PAID_OFF');

    const series = balanceSeries(result.schedule);

    expect(series[0]).toBe(18_300_000);
    expect(series).toHaveLength(18);
    expect(series.at(-1)).toBe(0);
    // Mes 1 a mano: 3.875.326 + 1.747.413 + 11.712.142 (golden firstMonths).
    expect(series[1]).toBe(3_875_326 + 1_747_413 + 11_712_142);
  });

  it('sums only the rows of each month', () => {
    const series = balanceSeries([
      {
        month: 1,
        rows: [
          { debtId: 'a', openingBalance: 100, interest: 2, payment: 102, closingBalance: 0 },
          { debtId: 'b', openingBalance: 300, interest: 6, payment: 56, closingBalance: 250 },
        ],
      },
      {
        month: 2,
        rows: [{ debtId: 'b', openingBalance: 250, interest: 5, payment: 255, closingBalance: 0 }],
      },
    ]);

    expect(series).toEqual([400, 250, 0]);
  });

  it('is empty without schedule', () => {
    expect(balanceSeries([])).toEqual([]);
  });
});
