import { simulate } from '@avalancha/engine';
import { describe, expect, it } from 'vitest';
import { createEmptyDebt } from './reducer.js';
import { inputIssues, issuesByField } from './issues.js';
import { toEngineInput } from './toEngineInput.js';

const debts = [createEmptyDebt('a'), createEmptyDebt('b')];

describe('issuesByField', () => {
  it('maps engine paths to form fields by row id', () => {
    const fields = issuesByField(
      [
        { path: 'debts', code: 'NO_DEBTS' },
        { path: 'monthlyBudget', code: 'NOT_FINITE' },
        { path: 'debts[0].balance', code: 'NOT_POSITIVE_INTEGER' },
        { path: 'debts[1].annualEffectiveRate', code: 'RATE_OUT_OF_RANGE' },
        { path: 'debts[1].minimumPayment', code: 'NOT_FINITE' },
        { path: 'debts[1].id', code: 'DUPLICATE_ID' },
      ],
      debts,
    );

    expect(Object.fromEntries(fields)).toEqual({
      monthlyBudget: 'NOT_FINITE',
      'a.balance': 'NOT_POSITIVE_INTEGER',
      'b.rate': 'RATE_OUT_OF_RANGE',
      'b.minimumPayment': 'NOT_FINITE',
      'b.name': 'DUPLICATE_ID',
    });
  });

  it('ignores paths of rows that no longer exist', () => {
    const fields = issuesByField([{ path: 'debts[5].balance', code: 'NOT_FINITE' }], debts);

    expect(fields.size).toBe(0);
  });
});

describe('inputIssues', () => {
  it('returns the engine issues for an empty row', () => {
    const result = simulate({
      ...toEngineInput({ debts, monthlyBudget: '' }),
      strategy: 'avalanche',
    });

    expect(inputIssues(result)).toContainEqual({ path: 'debts[0].balance', code: 'NOT_FINITE' });
  });

  it('returns no issues when the input is valid', () => {
    const issues = inputIssues(
      simulate({
        debts: [
          { id: 'a', name: 'A', balance: 1000, annualEffectiveRate: 0.2, minimumPayment: 100 },
        ],
        monthlyBudget: 50,
        strategy: 'avalanche',
      }),
    );

    // Presupuesto insuficiente es INVALID_BUDGET, no un error de campo.
    expect(issues).toEqual([]);
  });
});
