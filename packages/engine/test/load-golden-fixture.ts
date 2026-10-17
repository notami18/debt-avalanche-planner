import type { Debt, Warning } from '../src/index.js';
import type {
  ExpectedMonthRow,
  ExpectedResult,
  FixtureStrategyKey,
  GoldenCase,
  GoldenCasesFixture,
  RateConversion,
} from './golden-fixture.js';
import rawFixture from './fixtures/golden-cases.json';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, path: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Expected string at ${path}`);
  }
  return value;
}

function requireNumber(value: unknown, path: string): number {
  if (typeof value !== 'number') {
    throw new Error(`Expected number at ${path}`);
  }
  return value;
}

function requireArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Expected array at ${path}`);
  }
  return value;
}

function parseDebt(value: unknown, path: string): Debt {
  if (!isRecord(value)) {
    throw new Error(`Expected debt object at ${path}`);
  }
  return {
    id: requireString(value.id, `${path}.id`),
    name: requireString(value.name, `${path}.name`),
    balance: requireNumber(value.balance, `${path}.balance`),
    annualEffectiveRate: requireNumber(
      value.annualEffectiveRate,
      `${path}.annualEffectiveRate`,
    ),
    minimumPayment: requireNumber(
      value.minimumPayment,
      `${path}.minimumPayment`,
    ),
  };
}

function parseWarning(value: unknown, path: string): Warning {
  if (!isRecord(value)) {
    throw new Error(`Expected warning object at ${path}`);
  }
  const code = requireString(value.code, `${path}.code`);
  if (code !== 'MINIMUM_BELOW_INTEREST') {
    throw new Error(`Unknown warning code at ${path}: ${code}`);
  }
  return {
    code,
    debtId: requireString(value.debtId, `${path}.debtId`),
  };
}

function parseMonthRow(value: unknown, path: string): ExpectedMonthRow {
  if (!isRecord(value)) {
    throw new Error(`Expected month row at ${path}`);
  }
  const rows = requireArray(value.rows, `${path}.rows`).map((row, index) => {
    if (!isRecord(row)) {
      throw new Error(`Expected debt month row at ${path}.rows[${index}]`);
    }
    return {
      debtId: requireString(row.debtId, `${path}.rows[${index}].debtId`),
      openingBalance: requireNumber(
        row.openingBalance,
        `${path}.rows[${index}].openingBalance`,
      ),
      interest: requireNumber(row.interest, `${path}.rows[${index}].interest`),
      payment: requireNumber(row.payment, `${path}.rows[${index}].payment`),
      closingBalance: requireNumber(
        row.closingBalance,
        `${path}.rows[${index}].closingBalance`,
      ),
    };
  });
  return {
    month: requireNumber(value.month, `${path}.month`),
    rows,
  };
}

function parseExpected(value: unknown, path: string): ExpectedResult {
  if (!isRecord(value)) {
    throw new Error(`Expected result object at ${path}`);
  }
  const status = requireString(value.status, `${path}.status`);

  if (status === 'INVALID_BUDGET') {
    return {
      status: 'INVALID_BUDGET',
      minimumRequired: requireNumber(
        value.minimumRequired,
        `${path}.minimumRequired`,
      ),
    };
  }

  if (status === 'NOT_PAYABLE') {
    const monthsSimulated = requireNumber(
      value.monthsSimulated,
      `${path}.monthsSimulated`,
    );
    if (monthsSimulated !== 600) {
      throw new Error(`Expected monthsSimulated 600 at ${path}`);
    }
    return {
      status: 'NOT_PAYABLE',
      monthsSimulated: 600,
      warnings: requireArray(value.warnings, `${path}.warnings`).map(
        (warning, index) => parseWarning(warning, `${path}.warnings[${index}]`),
      ),
    };
  }

  if (status === 'PAID_OFF') {
    return {
      status: 'PAID_OFF',
      warnings: requireArray(value.warnings, `${path}.warnings`).map(
        (warning, index) => parseWarning(warning, `${path}.warnings[${index}]`),
      ),
      months: requireNumber(value.months, `${path}.months`),
      totalInterest: requireNumber(value.totalInterest, `${path}.totalInterest`),
      totalPaid: requireNumber(value.totalPaid, `${path}.totalPaid`),
      payoffOrder: requireArray(value.payoffOrder, `${path}.payoffOrder`).map(
        (entry, index) => {
          if (!isRecord(entry)) {
            throw new Error(
              `Expected payoff entry at ${path}.payoffOrder[${index}]`,
            );
          }
          return {
            debtId: requireString(
              entry.debtId,
              `${path}.payoffOrder[${index}].debtId`,
            ),
            month: requireNumber(
              entry.month,
              `${path}.payoffOrder[${index}].month`,
            ),
          };
        },
      ),
      firstMonths: requireArray(value.firstMonths, `${path}.firstMonths`).map(
        (month, index) =>
          parseMonthRow(month, `${path}.firstMonths[${index}]`),
      ),
    };
  }

  throw new Error(`Unknown expected status at ${path}: ${status}`);
}

function parseCase(value: unknown, path: string): GoldenCase {
  if (!isRecord(value)) {
    throw new Error(`Expected case object at ${path}`);
  }
  if (!isRecord(value.expected)) {
    throw new Error(`Expected expected object at ${path}.expected`);
  }

  const expectedRaw = value.expected;
  const expected: Record<FixtureStrategyKey, ExpectedResult> = {
    avalanche: parseExpected(expectedRaw.avalanche, `${path}.expected.avalanche`),
    snowball: parseExpected(expectedRaw.snowball, `${path}.expected.snowball`),
    'minimum-only': parseExpected(
      expectedRaw['minimum-only'],
      `${path}.expected.minimum-only`,
    ),
  };

  return {
    name: requireString(value.name, `${path}.name`),
    learning: requireString(value.learning, `${path}.learning`),
    debts: requireArray(value.debts, `${path}.debts`).map((debt, index) =>
      parseDebt(debt, `${path}.debts[${index}]`),
    ),
    monthlyBudget: requireNumber(value.monthlyBudget, `${path}.monthlyBudget`),
    expected,
  };
}

function parseRateConversion(value: unknown, path: string): RateConversion {
  if (!isRecord(value)) {
    throw new Error(`Expected rate conversion at ${path}`);
  }
  return {
    annualEffectiveRate: requireNumber(
      value.annualEffectiveRate,
      `${path}.annualEffectiveRate`,
    ),
    monthlyRate: requireNumber(value.monthlyRate, `${path}.monthlyRate`),
  };
}

export function loadGoldenFixture(): GoldenCasesFixture {
  if (!isRecord(rawFixture)) {
    throw new Error('golden-cases.json root must be an object');
  }

  return {
    generatedBy: requireString(rawFixture.generatedBy, 'generatedBy'),
    spec: requireString(rawFixture.spec, 'spec'),
    rateConversions: requireArray(
      rawFixture.rateConversions,
      'rateConversions',
    ).map((row, index) =>
      parseRateConversion(row, `rateConversions[${index}]`),
    ),
    cases: requireArray(rawFixture.cases, 'cases').map((goldenCase, index) =>
      parseCase(goldenCase, `cases[${index}]`),
    ),
  };
}
