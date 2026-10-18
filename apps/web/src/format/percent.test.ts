import { expect, test } from 'vitest';
import { formatPercent } from './percent.js';

// Intl decide si hay espacio antes de "%": los tests no lo fijan.
test.each([
  [0.28, /^28\s?%$/],
  [0.020785, /^2,08\s?%$/],
  [0.285, /^28,5\s?%$/],
  [0.2682417945625455, /^26,82\s?%$/],
])('formatPercent(%d) matches %s', (rate, expected) => {
  expect(formatPercent(rate)).toMatch(expected);
});
