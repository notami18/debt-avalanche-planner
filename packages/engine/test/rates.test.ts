import { describe, expect, it } from 'vitest';
import { toMonthlyRate } from '../src/index.js';
import { loadGoldenFixture } from './load-golden-fixture.js';

const fixture = loadGoldenFixture();

describe('toMonthlyRate', () => {
  it.each(
    fixture.rateConversions.map((row) => ({
      annualEffectiveRate: row.annualEffectiveRate,
      monthlyRate: row.monthlyRate,
    })),
  )(
    'converts $annualEffectiveRate E.A. to monthly rate',
    ({ annualEffectiveRate, monthlyRate }) => {
      expect(
        Math.abs(toMonthlyRate(annualEffectiveRate) - monthlyRate),
      ).toBeLessThan(1e-12);
    },
  );
});
