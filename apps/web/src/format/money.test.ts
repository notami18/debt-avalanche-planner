import { expect, test } from 'vitest';
import { formatMoney } from './money.js';

// es-CO separa el "$" con un espacio no separable: se normaliza con \s.
test.each([
  [2_844_122, /^\$\s2\.844\.122$/],
  [250_000, /^\$\s250\.000$/],
  [0, /^\$\s0$/],
])('formatMoney(%d) matches %s', (amount, expected) => {
  expect(formatMoney(amount)).toMatch(expected);
});
