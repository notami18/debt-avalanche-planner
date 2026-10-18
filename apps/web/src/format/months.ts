const monthFormat = new Intl.DateTimeFormat('es-CO', { month: 'long' });

/** Nombres de mes en es-CO; la posición 0 es enero. */
export const MONTH_NAMES: readonly string[] = Array.from({ length: 12 }, (_, index) =>
  monthFormat.format(new Date(2000, index, 1)),
);
