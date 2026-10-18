import { describe, expect, it, test } from 'vitest';
import { parseMoney, parseRate, toEngineInput } from './toEngineInput.js';
import type { DebtForm } from './types.js';

function debt(overrides: Partial<DebtForm> = {}): DebtForm {
  return {
    id: 'deuda',
    name: 'Tarjeta',
    balance: '4.500.000',
    rate: '28',
    rateType: 'EA',
    minimumPayment: '225.000',
    ...overrides,
  };
}

describe('parseMoney', () => {
  test.each([
    ['4.500.000', 4_500_000],
    ['$ 4.500.000', 4_500_000],
    ['$ 4.500.000', 4_500_000],
    ['$4.500.000', 4_500_000],
    ['4500000', 4_500_000],
    ['1000,5', 1000.5],
  ])('"%s" → %d', (text, expected) => {
    expect(parseMoney(text)).toBe(expected);
  });

  test.each(['', '   ', 'abc', '$'])('"%s" → NaN', (text) => {
    expect(parseMoney(text)).toBeNaN();
  });
});

describe('parseRate', () => {
  test.each([
    ['28', 0.28],
    ['28,5', 0.285],
    ['28.5', 0.285],
    ['28,5 %', 0.285],
  ])('"%s" → %d', (text, expected) => {
    expect(parseRate(text)).toBeCloseTo(expected, 15);
  });

  test.each(['', 'abc'])('"%s" → NaN', (text) => {
    expect(parseRate(text)).toBeNaN();
  });
});

describe('toEngineInput', () => {
  it('converts the typed strings into engine numbers', () => {
    const input = toEngineInput({ debts: [debt()], monthlyBudget: '$ 1.300.000' });

    expect(input).toEqual({
      debts: [
        {
          id: 'deuda',
          name: 'Tarjeta',
          balance: 4_500_000,
          annualEffectiveRate: 0.28,
          minimumPayment: 225_000,
        },
      ],
      monthlyBudget: 1_300_000,
    });
  });

  it('converts a monthly (M.V.) rate to effective annual with the engine', () => {
    const [converted] = toEngineInput({
      debts: [debt({ rate: '2', rateType: 'MV' })],
      monthlyBudget: '',
    }).debts;

    expect(converted?.annualEffectiveRate).toBeCloseTo(1.02 ** 12 - 1, 12);
  });

  it('keeps order and every row, naming empty ones "Deuda N"', () => {
    const input = toEngineInput({
      debts: [debt({ id: 'a' }), debt({ id: 'b', name: '  ', balance: '' })],
      monthlyBudget: '',
    });

    expect(input.debts.map((d) => d.id)).toEqual(['a', 'b']);
    expect(input.debts[1]?.name).toBe('Deuda 2');
    expect(input.debts[1]?.balance).toBeNaN();
    expect(input.monthlyBudget).toBeNaN();
  });
});
