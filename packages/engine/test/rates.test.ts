import { describe, expect, it } from 'vitest';
import { toAnnualEffectiveRate, toMonthlyRate } from '../src/index.js';
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

describe('toAnnualEffectiveRate', () => {
  it.each(
    fixture.rateConversions.map((row) => ({
      annualEffectiveRate: row.annualEffectiveRate,
      monthlyRate: row.monthlyRate,
    })),
  )(
    'converts monthly rate back to $annualEffectiveRate E.A.',
    ({ annualEffectiveRate, monthlyRate }) => {
      expect(
        Math.abs(toAnnualEffectiveRate(monthlyRate) - annualEffectiveRate),
      ).toBeLessThan(1e-12);
    },
  );

  it('returns exactly 0 for a 0 monthly rate', () => {
    expect(toAnnualEffectiveRate(0)).toBe(0);
  });
});
