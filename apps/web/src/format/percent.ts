const percentFormat = new Intl.NumberFormat('es-CO', {
  style: 'percent',
  maximumFractionDigits: 2,
});

/** Fracción → porcentaje es-CO con hasta 2 decimales: 0.020785 → "2,08%". */
export function formatPercent(rate: number): string {
  return percentFormat.format(rate);
}
