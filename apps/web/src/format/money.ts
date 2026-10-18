const moneyFormat = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

/** Pesos en es-CO: 2844122 → "$ 2.844.122" (con espacio no separable). */
export function formatMoney(amount: number): string {
  return moneyFormat.format(amount);
}
