import { YEAR_MONTH } from './firstPayment.js';
import { MAX_DEBTS } from './types.js';
import type { DebtForm, PlanForm } from './types.js';

export const STORAGE_KEY = 'avalancha:plan:v1';

export type PlanStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

// Se resuelve dentro del try: en algunos navegadores leer window.localStorage ya lanza.
const browserStorage = (): PlanStorage => window.localStorage;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDebtForm(value: unknown): value is DebtForm {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.balance === 'string' &&
    typeof value.rate === 'string' &&
    (value.rateType === 'EA' || value.rateType === 'MV') &&
    typeof value.minimumPayment === 'string'
  );
}

function isStoredPlan(value: unknown): value is PlanForm & { version: 1 } {
  return (
    isRecord(value) &&
    value.version === 1 &&
    typeof value.monthlyBudget === 'string' &&
    typeof value.firstPayment === 'string' &&
    YEAR_MONTH.test(value.firstPayment) &&
    Array.isArray(value.debts) &&
    value.debts.length <= MAX_DEBTS &&
    value.debts.every(isDebtForm)
  );
}

export function loadPlan(storage: () => PlanStorage = browserStorage): PlanForm | null {
  try {
    const raw = storage().getItem(STORAGE_KEY);
    if (raw === null) return null;

    const stored: unknown = JSON.parse(raw);
    if (!isStoredPlan(stored)) return null;

    return {
      debts: stored.debts.map(({ id, name, balance, rate, rateType, minimumPayment }) => ({
        id,
        name,
        balance,
        rate,
        rateType,
        minimumPayment,
      })),
      monthlyBudget: stored.monthlyBudget,
      firstPayment: stored.firstPayment,
    };
  } catch {
    return null;
  }
}

export function savePlan(form: PlanForm, storage: () => PlanStorage = browserStorage): void {
  try {
    storage().setItem(STORAGE_KEY, JSON.stringify({ version: 1, ...form }));
  } catch {
    // Modo privado o cuota llena: la app sigue funcionando en memoria.
  }
}

export function clearPlan(storage: () => PlanStorage = browserStorage): void {
  try {
    storage().removeItem(STORAGE_KEY);
  } catch {
    // Igual que savePlan: sin almacenamiento no hay nada que borrar.
  }
}
