import { toAnnualEffectiveRate } from '@avalancha/engine';
import type { Debt } from '@avalancha/engine';
import { defaultDebtName } from './fields.js';
import type { PlanForm, RateType } from './types.js';

export interface EngineInput {
  debts: Debt[];
  monthlyBudget: number;
}

const NUMBER = /^-?(?:\d+\.?\d*|\.\d+)$/;

function toNumber(text: string): number {
  return NUMBER.test(text) ? Number(text) : Number.NaN;
}

// Solo traduce texto a número: las reglas (positivo, entero, rango) son del motor.
export function parseMoney(text: string): number {
  return toNumber(text.replace(/[$\s.]/g, '').replace(',', '.'));
}

/** Porcentaje escrito ("28,5") → fracción (0.285). */
export function parseRate(text: string): number {
  return toNumber(text.replace(/[\s%]/g, '').replace(',', '.')) / 100;
}

export function toAnnualRate(rate: number, rateType: RateType): number {
  return rateType === 'MV' ? toAnnualEffectiveRate(rate) : rate;
}

// Conserva orden y filas: debts[i] del motor es la fila i del formulario.
export function toEngineInput(form: Pick<PlanForm, 'debts' | 'monthlyBudget'>): EngineInput {
  return {
    debts: form.debts.map((debt, index) => ({
      id: debt.id,
      name: debt.name.trim() || defaultDebtName(index),
      balance: parseMoney(debt.balance),
      annualEffectiveRate: toAnnualRate(parseRate(debt.rate), debt.rateType),
      minimumPayment: parseMoney(debt.minimumPayment),
    })),
    monthlyBudget: parseMoney(form.monthlyBudget),
  };
}
