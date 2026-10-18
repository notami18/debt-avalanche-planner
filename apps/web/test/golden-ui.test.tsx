import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { FixtureStrategyKey } from '../../../packages/engine/test/golden-fixture.js';
// Carga y valida packages/engine/test/fixtures/golden-cases.json (no se toca a mano).
import { loadGoldenFixture } from '../../../packages/engine/test/load-golden-fixture.js';
import { App } from '../src/App.js';
import { formatMoney } from '../src/format/money.js';
import { EXAMPLE_PLAN } from '../src/plan/example.js';
import { toEngineInput } from '../src/plan/toEngineInput.js';

// Generador de Python → motor → pantalla: si este test pasa, lo que ve la persona es lo
// mismo que calculó la implementación independiente.
const classic = loadGoldenFixture().cases.find((c) => c.name === 'tres-deudas-clasico');
if (!classic) throw new Error('Missing golden case tres-deudas-clasico');

const ROW_NAMES: Record<FixtureStrategyKey, string> = {
  avalanche: 'Avalancha',
  snowball: 'Bola de nieve',
  'minimum-only': 'Solo mínimos',
};

const normalize = (text: string | null) => (text ?? '').replace(/\s/g, ' ');

beforeEach(() => {
  localStorage.clear();
});

describe('golden UI: tres-deudas-clasico', () => {
  it('"Cargar ejemplo" holds the same data as the golden case (ids may differ)', () => {
    const { debts, monthlyBudget } = toEngineInput(EXAMPLE_PLAN);

    expect(monthlyBudget).toBe(classic.monthlyBudget);
    expect(debts).toHaveLength(classic.debts.length);
    classic.debts.forEach((expected, index) => {
      const debt = debts[index];
      expect(debt?.name).toBe(expected.name);
      expect(debt?.balance).toBe(expected.balance);
      expect(debt?.annualEffectiveRate).toBeCloseTo(expected.annualEffectiveRate, 12);
      expect(debt?.minimumPayment).toBe(expected.minimumPayment);
    });
  });

  it('the strategy table shows the fixture months and total interest', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Cargar ejemplo' }));

    const table = screen.getByRole('table', { name: 'Comparación de estrategias' });
    for (const [key, name] of Object.entries(ROW_NAMES) as [FixtureStrategyKey, string][]) {
      const expected = classic.expected[key];
      if (expected.status !== 'PAID_OFF') throw new Error(`${key} should be PAID_OFF`);

      const row = within(table).getByRole('row', { name: new RegExp(`^${name}`) });
      const cells = within(row)
        .getAllByRole('cell')
        .map((cell) => normalize(cell.textContent));

      expect(cells[1]).toBe(String(expected.months));
      expect(cells[2]).toBe(normalize(formatMoney(expected.totalInterest)));
    }
  });
});
