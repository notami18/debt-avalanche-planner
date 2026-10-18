import { toMonthlyRate } from '@avalancha/engine';
import { parseRate, toAnnualRate } from './toEngineInput.js';
import type { RateType } from './types.js';

export interface RateEquivalence {
  annualEffectiveRate: number;
  monthlyRate: number;
}

// SPEC-web §3: solo hay equivalencia si la tasa escrita es un número finito.
export function rateEquivalence(rate: string, rateType: RateType): RateEquivalence | null {
  const value = parseRate(rate);
  if (!Number.isFinite(value)) return null;

  const annualEffectiveRate = toAnnualRate(value, rateType);
  const monthlyRate = rateType === 'MV' ? value : toMonthlyRate(value);
  if (!Number.isFinite(annualEffectiveRate) || !Number.isFinite(monthlyRate)) return null;

  return { annualEffectiveRate, monthlyRate };
}
