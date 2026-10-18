import { compareStrategies } from '@avalancha/engine';
import { describe, expect, it } from 'vitest';
import { interestSummary, savingsVsMinimum } from './summary.js';
import { CLASSIC, MINIMUM_NEVER_ENDS, MINIMUM_TRAP, SINGLE_LOAN } from '../../test/cases.js';
import type { TestCase } from '../../test/cases.js';

const compare = ({ debts, monthlyBudget }: TestCase) => compareStrategies(debts, monthlyBudget);

describe('interestSummary', () => {
  it('reports the savings against minimums (classic case)', () => {
    expect(interestSummary(compare(CLASSIC), 'avalanche')).toEqual({
      kind: 'savings',
      interest: 2_844_122,
      savings: 2_798_238,
    });
  });

  it('says "the same" when every strategy costs the same', () => {
    expect(interestSummary(compare(SINGLE_LOAN), 'avalanche')).toEqual({
      kind: 'same',
      interest: 2_524_732,
    });
  });

  it('says minimums never end when only minimum-only is NOT_PAYABLE', () => {
    const summary = interestSummary(compare(MINIMUM_NEVER_ENDS), 'snowball');

    expect(summary?.kind).toBe('minimumNeverEnds');
  });

  it('has no comparison line when minimums are selected', () => {
    expect(interestSummary(compare(CLASSIC), 'minimumOnly')).toEqual({
      kind: 'plain',
      interest: 5_642_360,
    });
  });

  it('is null when the selected strategy does not pay off', () => {
    expect(interestSummary(compare(MINIMUM_TRAP), 'avalanche')).toBeNull();
  });
});

describe('savingsVsMinimum', () => {
  it('is the interest difference against minimums, or null when it does not apply', () => {
    const classic = compare(CLASSIC);

    expect(savingsVsMinimum(classic, 'snowball')).toBe(5_642_360 - 2_874_112);
    expect(savingsVsMinimum(classic, 'minimumOnly')).toBeNull();
    expect(savingsVsMinimum(compare(MINIMUM_NEVER_ENDS), 'avalanche')).toBeNull();
  });
});
