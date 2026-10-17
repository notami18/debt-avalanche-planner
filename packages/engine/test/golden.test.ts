import { describe, expect, it } from 'vitest';
import { simulate } from '../src/index.js';
import type { SimulationResult } from '../src/index.js';
import type { ExpectedResult, FixtureStrategyKey } from './golden-fixture.js';
import { fixtureKeyToStrategy } from './golden-fixture.js';
import { loadGoldenFixture } from './load-golden-fixture.js';

const fixture = loadGoldenFixture();

const strategyKeys: FixtureStrategyKey[] = [
  'avalanche',
  'snowball',
  'minimum-only',
];

const cases = fixture.cases.flatMap((goldenCase) =>
  strategyKeys.map((strategyKey) => ({
    name: goldenCase.name,
    strategyKey,
    debts: goldenCase.debts,
    monthlyBudget: goldenCase.monthlyBudget,
    expected: goldenCase.expected[strategyKey],
  })),
);

function assertMatchesExpected(
  result: SimulationResult,
  expected: ExpectedResult,
): void {
  expect(result.status).toBe(expected.status);

  if (expected.status === 'INVALID_BUDGET') {
    if (result.status !== 'INVALID_BUDGET') {
      return;
    }
    expect(result.minimumRequired).toBe(expected.minimumRequired);
    return;
  }

  if (expected.status === 'NOT_PAYABLE') {
    if (result.status !== 'NOT_PAYABLE') {
      return;
    }
    expect(result.monthsSimulated).toBe(expected.monthsSimulated);
    expect(result.warnings).toEqual(expected.warnings);
    return;
  }

  if (result.status !== 'PAID_OFF') {
    return;
  }

  expect(result.warnings).toEqual(expected.warnings);
  expect(result.months).toBe(expected.months);
  expect(result.totalInterest).toBe(expected.totalInterest);
  expect(result.totalPaid).toBe(expected.totalPaid);
  expect(result.payoffOrder).toEqual(expected.payoffOrder);
  expect(result.schedule.slice(0, expected.firstMonths.length)).toEqual(
    expected.firstMonths,
  );
}

describe('simulate golden cases', () => {
  it.each(cases)(
    '$name × $strategyKey',
    ({ debts, monthlyBudget, strategyKey, expected }) => {
      const result = simulate({
        debts,
        monthlyBudget,
        strategy: fixtureKeyToStrategy(strategyKey),
      });
      assertMatchesExpected(result, expected);
    },
  );
});
