import { describe, expect, it } from 'vitest';
import { EXAMPLE_PLAN } from './example.js';
import { nextMonth } from './firstPayment.js';
import { createEmptyPlan, planReducer } from './reducer.js';
import type { PlanForm } from './types.js';

const empty = createEmptyPlan('2027-01');

function withDebts(...ids: string[]): PlanForm {
  return ids.reduce((state, id) => planReducer(state, { type: 'addDebt', id }), empty);
}

describe('planReducer', () => {
  it('adds an empty E.A. debt with the given id', () => {
    expect(withDebts('a').debts).toEqual([
      { id: 'a', name: '', balance: '', rate: '', rateType: 'EA', minimumPayment: '' },
    ]);
  });

  it('does not add more than 20 debts', () => {
    const full = withDebts(...Array.from({ length: 20 }, (_, i) => `d${i}`));

    expect(planReducer(full, { type: 'addDebt', id: 'extra' })).toBe(full);
  });

  it('edits only the targeted debt', () => {
    const state = planReducer(withDebts('a', 'b'), {
      type: 'updateDebt',
      id: 'b',
      field: 'balance',
      value: '1.000',
    });

    expect(state.debts.map((d) => d.balance)).toEqual(['', '1.000']);
  });

  it('changes the rate type', () => {
    const state = planReducer(withDebts('a'), { type: 'setRateType', id: 'a', rateType: 'MV' });

    expect(state.debts[0]?.rateType).toBe('MV');
  });

  it('removes a debt', () => {
    const state = planReducer(withDebts('a', 'b'), { type: 'removeDebt', id: 'a' });

    expect(state.debts.map((d) => d.id)).toEqual(['b']);
  });

  it('sets budget and first payment', () => {
    const withBudget = planReducer(empty, { type: 'setBudget', value: '1.300.000' });
    const state = planReducer(withBudget, { type: 'setFirstPayment', value: '2028-03' });

    expect(state).toMatchObject({ monthlyBudget: '1.300.000', firstPayment: '2028-03' });
  });

  it('loads the example with the first payment from the action', () => {
    const state = planReducer(withDebts('a'), { type: 'loadExample', firstPayment: '2027-05' });

    expect(state).toEqual({ ...EXAMPLE_PLAN, firstPayment: '2027-05' });
  });

  it('clears everything', () => {
    const loaded = planReducer(empty, { type: 'loadExample', firstPayment: '2027-05' });

    expect(planReducer(loaded, { type: 'clear', firstPayment: '2027-06' })).toEqual(
      createEmptyPlan('2027-06'),
    );
  });
});

describe('nextMonth', () => {
  it('returns the following month, crossing the year', () => {
    expect(nextMonth(new Date(2026, 9, 17))).toBe('2026-11');
    expect(nextMonth(new Date(2026, 11, 31))).toBe('2027-01');
  });
});
