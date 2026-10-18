import { compareStrategies } from '@avalancha/engine';
import type { MonthRow, StrategyComparison } from '@avalancha/engine';
import { describe, expect, it } from 'vitest';
import { CLASSIC, MINIMUM_NEVER_ENDS, MINIMUM_TRAP } from '../../test/cases.js';
import { mountainGeometry, mountainScale } from './mountainGeometry.js';

/** Un resultado PAID_OFF de una sola deuda a partir de la serie de saldos. */
function paidOff(series: number[]) {
  const schedule: MonthRow[] = series.slice(1).map((closingBalance, index) => ({
    month: index + 1,
    rows: [
      {
        debtId: 'a',
        openingBalance: series[index] ?? 0,
        interest: 0,
        payment: 0,
        closingBalance,
      },
    ],
  }));
  return {
    status: 'PAID_OFF' as const,
    warnings: [],
    months: schedule.length,
    totalInterest: 0,
    totalPaid: 0,
    payoffOrder: [],
    schedule,
  };
}

describe('mountainScale', () => {
  it('uses the highest point of every crest, not the first one', () => {
    expect(mountainScale([[100, 120, 50, 0], [100, 0]])).toEqual({ maxMonths: 3, maxBalance: 120 });
  });
});

describe('mountainGeometry', () => {
  it('scales Y to a balance that grows before falling', () => {
    const comparison: StrategyComparison = {
      avalanche: paidOff([100, 80, 0]),
      snowball: paidOff([100, 130, 60, 0]),
      minimumOnly: paidOff([100, 90, 40, 10, 0]),
    };

    const geometry = mountainGeometry(comparison, 'avalanche');

    expect(geometry?.maxBalance).toBe(130);
    expect(geometry?.maxMonths).toBe(4);
    expect(geometry?.summit.balance).toBe(100);
  });

  it('labels the end of every unselected crest (classic case)', () => {
    const { debts, monthlyBudget } = CLASSIC;
    const geometry = mountainGeometry(compareStrategies(debts, monthlyBudget), 'avalanche');

    expect(geometry?.summit.balance).toBe(18_300_000);
    expect(geometry?.marker.month).toBe(17);
    expect(geometry?.endLabels.map(({ keys, month }) => ({ keys, month }))).toEqual([
      { keys: ['snowball'], month: 17 },
      { keys: ['minimumOnly'], month: 33 },
    ]);
    // La seleccionada se dibuja al final y es la única con relleno.
    expect(geometry?.crests.map((crest) => [crest.key, crest.area !== null])).toEqual([
      ['snowball', false],
      ['minimumOnly', false],
      ['avalanche', true],
    ]);
  });

  it('puts two unselected crests ending the same month in one label', () => {
    const { debts, monthlyBudget } = CLASSIC;
    const geometry = mountainGeometry(compareStrategies(debts, monthlyBudget), 'minimumOnly');

    expect(geometry?.endLabels.map(({ keys, month }) => ({ keys, month }))).toEqual([
      { keys: ['avalanche', 'snowball'], month: 17 },
    ]);
  });

  it('stacks end labels that would overlap', () => {
    const comparison: StrategyComparison = {
      avalanche: paidOff([100, 50, 0]),
      snowball: paidOff([100, 70, 30, 0]),
      minimumOnly: paidOff([100, 90, 60, 30, 10, 0]),
    };

    const rows = mountainGeometry(comparison, 'minimumOnly')?.endLabels.map((label) => label.row);

    expect(rows).toEqual([0, 1]);
  });

  it('leaves out crests that never pay off (mixed case)', () => {
    const { debts, monthlyBudget } = MINIMUM_NEVER_ENDS;
    const geometry = mountainGeometry(compareStrategies(debts, monthlyBudget), 'avalanche');

    expect(geometry?.crests.map((crest) => crest.key)).toEqual(['snowball', 'avalanche']);
    expect(geometry?.endLabels.flatMap((label) => label.keys)).toEqual(['snowball']);
  });

  it('is null when the selected strategy does not pay off', () => {
    const { debts, monthlyBudget } = MINIMUM_TRAP;

    expect(mountainGeometry(compareStrategies(debts, monthlyBudget), 'avalanche')).toBeNull();
  });
});
