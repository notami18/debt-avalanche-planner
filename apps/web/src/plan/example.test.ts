import { compareStrategies } from '@avalancha/engine';
import { describe, expect, it } from 'vitest';
import { EXAMPLE_PLAN } from './example.js';
import { toEngineInput } from './toEngineInput.js';

describe('EXAMPLE_PLAN', () => {
  it('is the "tres-deudas-clasico" case: avalanche pays off in 17 months', () => {
    const { debts, monthlyBudget } = toEngineInput(EXAMPLE_PLAN);
    const { avalanche } = compareStrategies(debts, monthlyBudget);

    expect(avalanche.status).toBe('PAID_OFF');
    expect(avalanche.status === 'PAID_OFF' && avalanche.months).toBe(17);
  });
});
