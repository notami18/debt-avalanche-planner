import { toMonthlyRate } from '@avalancha/engine';
import { describe, expect, it, test } from 'vitest';
import { rateEquivalence } from './rateEquivalence.js';

describe('rateEquivalence', () => {
  it('converts an E.A. rate to its monthly equivalent', () => {
    const equivalence = rateEquivalence('28', 'EA');

    expect(equivalence?.annualEffectiveRate).toBe(0.28);
    expect(equivalence?.monthlyRate).toBeCloseTo(toMonthlyRate(0.28), 15);
  });

  it('converts an M.V. rate to its effective annual equivalent', () => {
    const equivalence = rateEquivalence('2', 'MV');

    expect(equivalence?.monthlyRate).toBe(0.02);
    expect(equivalence?.annualEffectiveRate).toBeCloseTo(1.02 ** 12 - 1, 12);
  });

  test.each(['', 'abc', '%'])('"%s" has no equivalence', (rate) => {
    expect(rateEquivalence(rate, 'EA')).toBeNull();
  });
});
