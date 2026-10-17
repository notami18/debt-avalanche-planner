// SPEC §3: la tasa mensual se deriva de la E.A. con capitalización, no dividiendo entre 12.
export function toMonthlyRate(annualEffectiveRate: number): number {
  return (1 + annualEffectiveRate) ** (1 / 12) - 1;
}
