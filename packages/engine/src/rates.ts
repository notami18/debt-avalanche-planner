// SPEC §3: la tasa mensual se deriva de la E.A. con capitalización, no dividiendo entre 12.
export function toMonthlyRate(annualEffectiveRate: number): number {
  return (1 + annualEffectiveRate) ** (1 / 12) - 1;
}

// SPEC §3: inversa de toMonthlyRate, para tasas que vienen M.V. en el extracto.
export function toAnnualEffectiveRate(monthlyRate: number): number {
  return (1 + monthlyRate) ** 12 - 1;
}
