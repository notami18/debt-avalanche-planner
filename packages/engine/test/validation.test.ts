import { describe, expect, it } from 'vitest';
import { simulate } from '../src/index.js';
import type {
  Debt,
  PlanInput,
  ValidationCode,
  ValidationIssue,
} from '../src/index.js';

// Datos ficticios: un plan válido al que cada test le introduce una sola falla.
function debt(overrides: Partial<Debt> = {}): Debt {
  return {
    id: 'tarjeta-a',
    name: 'Tarjeta A',
    balance: 1_000_000,
    annualEffectiveRate: 0.3,
    minimumPayment: 50_000,
    ...overrides,
  };
}

function plan(overrides: Partial<PlanInput> = {}): PlanInput {
  return {
    debts: [debt()],
    monthlyBudget: 100_000,
    strategy: 'avalanche',
    ...overrides,
  };
}

// Ids únicos (tarjeta-1 … tarjeta-N) para que no aparezcan issues DUPLICATE_ID ajenos al test.
function manyDebts(count: number): Debt[] {
  return Array.from({ length: count }, (_, index) =>
    debt({ id: `tarjeta-${index + 1}`, name: `Tarjeta ${index + 1}` }),
  );
}

function invalidInput(...issues: ValidationIssue[]) {
  return { status: 'INVALID_INPUT', issues };
}

describe('INVALID_INPUT: ids duplicados', () => {
  it('reports the second occurrence of a repeated id', () => {
    const result = simulate(plan({ debts: [debt(), debt()] }));
    expect(result).toEqual(
      invalidInput({ path: 'debts[1].id', code: 'DUPLICATE_ID' }),
    );
  });

  it('reports every occurrence after the first', () => {
    const result = simulate(
      plan({ debts: [debt(), debt(), debt()], monthlyBudget: 150_000 }),
    );
    expect(result).toEqual(
      invalidInput(
        { path: 'debts[1].id', code: 'DUPLICATE_ID' },
        { path: 'debts[2].id', code: 'DUPLICATE_ID' },
      ),
    );
  });
});

describe('INVALID_INPUT: montos', () => {
  const amountFields = [
    {
      path: 'monthlyBudget',
      build: (value: number) => plan({ monthlyBudget: value }),
    },
    {
      path: 'debts[0].balance',
      build: (value: number) => plan({ debts: [debt({ balance: value })] }),
    },
    {
      path: 'debts[0].minimumPayment',
      build: (value: number) =>
        plan({ debts: [debt({ minimumPayment: value })] }),
    },
  ];

  const badAmounts: { value: number; code: ValidationCode }[] = [
    { value: 1000.5, code: 'NOT_POSITIVE_INTEGER' },
    { value: 0, code: 'NOT_POSITIVE_INTEGER' },
    { value: -50_000, code: 'NOT_POSITIVE_INTEGER' },
    { value: Number.NaN, code: 'NOT_FINITE' },
    { value: Number.POSITIVE_INFINITY, code: 'NOT_FINITE' },
    { value: Number.NEGATIVE_INFINITY, code: 'NOT_FINITE' },
  ];

  const cases = amountFields.flatMap(({ path, build }) =>
    badAmounts.map(({ value, code }) => ({ path, build, value, code })),
  );

  it.each(cases)('$path = $value → $code', ({ path, build, value, code }) => {
    expect(simulate(build(value))).toEqual(invalidInput({ path, code }));
  });
});

describe('INVALID_INPUT: tasa', () => {
  const path = 'debts[0].annualEffectiveRate';

  it.each<{ rate: number; code: ValidationCode }>([
    { rate: -0.01, code: 'RATE_OUT_OF_RANGE' },
    { rate: 2.0001, code: 'RATE_OUT_OF_RANGE' },
    { rate: Number.NaN, code: 'NOT_FINITE' },
    { rate: Number.POSITIVE_INFINITY, code: 'NOT_FINITE' },
  ])('rate $rate → $code', ({ rate, code }) => {
    const result = simulate(plan({ debts: [debt({ annualEffectiveRate: rate })] }));
    expect(result).toEqual(invalidInput({ path, code }));
  });

  it.each([0, 2])('accepts the boundary rate %d', (rate) => {
    const result = simulate(plan({ debts: [debt({ annualEffectiveRate: rate })] }));
    expect(result.status).not.toBe('INVALID_INPUT');
  });
});

describe('INVALID_INPUT: cantidad de deudas', () => {
  it('rejects zero debts', () => {
    expect(simulate(plan({ debts: [] }))).toEqual(
      invalidInput({ path: 'debts', code: 'NO_DEBTS' }),
    );
  });

  it('rejects more than 20 debts', () => {
    const result = simulate(
      plan({ debts: manyDebts(21), monthlyBudget: 1_050_000 }),
    );
    expect(result).toEqual(
      invalidInput({ path: 'debts', code: 'TOO_MANY_DEBTS' }),
    );
  });

  it('accepts exactly 20 debts', () => {
    const result = simulate(
      plan({ debts: manyDebts(20), monthlyBudget: 1_000_000 }),
    );
    expect(result.status).not.toBe('INVALID_INPUT');
  });
});

describe('INVALID_INPUT: reglas generales', () => {
  it('validates the budget even for minimum-only (decisión 1)', () => {
    const result = simulate(plan({ strategy: 'minimum-only', monthlyBudget: 0 }));
    expect(result).toEqual(
      invalidInput({ path: 'monthlyBudget', code: 'NOT_POSITIVE_INTEGER' }),
    );
  });

  it('reports every issue in the documented order', () => {
    const debts = manyDebts(21);
    debts[0] = debt({ id: 'tarjeta-1', minimumPayment: -1 });
    debts[1] = debt({ id: 'tarjeta-1', balance: 1000.5, annualEffectiveRate: 3 });

    const result = simulate(plan({ debts, monthlyBudget: Number.NaN }));
    expect(result).toEqual(
      invalidInput(
        { path: 'debts', code: 'TOO_MANY_DEBTS' },
        { path: 'monthlyBudget', code: 'NOT_FINITE' },
        { path: 'debts[0].minimumPayment', code: 'NOT_POSITIVE_INTEGER' },
        { path: 'debts[1].id', code: 'DUPLICATE_ID' },
        { path: 'debts[1].balance', code: 'NOT_POSITIVE_INTEGER' },
        { path: 'debts[1].annualEffectiveRate', code: 'RATE_OUT_OF_RANGE' },
      ),
    );
  });

  it('takes precedence over INVALID_BUDGET', () => {
    const result = simulate(
      plan({ debts: [debt({ balance: 0 })], monthlyBudget: 1 }),
    );
    expect(result).toEqual(
      invalidInput({ path: 'debts[0].balance', code: 'NOT_POSITIVE_INTEGER' }),
    );
  });
});
