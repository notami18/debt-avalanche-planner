import { describe, expect, it } from 'vitest';
import { EXAMPLE_PLAN } from './example.js';
import { STORAGE_KEY, clearPlan, loadPlan, savePlan } from './storage.js';
import type { PlanStorage } from './storage.js';
import type { PlanForm } from './types.js';

const plan: PlanForm = { ...EXAMPLE_PLAN, firstPayment: '2027-01' };

function memoryStorage(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial));
  const storage: PlanStorage = {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => {
      items.set(key, value);
    },
    removeItem: (key) => {
      items.delete(key);
    },
  };
  return { items, storage: () => storage };
}

const failing = (): PlanStorage => ({
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
  removeItem: () => {
    throw new Error('SecurityError');
  },
});

describe('plan storage', () => {
  it('saves under avalancha:plan:v1 with version 1 and loads it back', () => {
    const { items, storage } = memoryStorage();

    savePlan(plan, storage);

    expect(JSON.parse(items.get(STORAGE_KEY) ?? '')).toMatchObject({ version: 1 });
    expect(loadPlan(storage)).toEqual(plan);
  });

  it('returns null when nothing is stored', () => {
    expect(loadPlan(memoryStorage().storage)).toBeNull();
  });

  it.each([
    ['corrupt JSON', '{"version": 1, "debts": ['],
    ['another version', JSON.stringify({ ...plan, version: 2 })],
    ['no version', JSON.stringify(plan)],
    ['wrong shape', JSON.stringify({ version: 1, debts: 'nope', monthlyBudget: '' })],
    [
      'invalid rate type',
      JSON.stringify({
        ...plan,
        version: 1,
        debts: [{ ...EXAMPLE_PLAN.debts[0], rateType: 'NA' }],
      }),
    ],
    ['invalid first payment', JSON.stringify({ ...plan, version: 1, firstPayment: '2027-13' })],
  ])('starts empty without throwing on %s', (_, raw) => {
    const { storage } = memoryStorage({ [STORAGE_KEY]: raw });

    expect(() => loadPlan(storage)).not.toThrow();
    expect(loadPlan(storage)).toBeNull();
  });

  it('returns null when reading the storage throws', () => {
    expect(loadPlan(failing)).toBeNull();
  });

  it('does not break the app when setItem throws (private mode, full quota)', () => {
    expect(() => savePlan(plan, failing)).not.toThrow();
  });

  it('clears the key, and does not throw when removeItem fails', () => {
    const { items, storage } = memoryStorage({ [STORAGE_KEY]: '{}', other: 'x' });

    clearPlan(storage);

    expect([...items.keys()]).toEqual(['other']);
    expect(() => clearPlan(failing)).not.toThrow();
  });
});
