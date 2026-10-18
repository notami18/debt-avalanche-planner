import { compareStrategies } from '@avalancha/engine';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { resultMessages } from '../i18n/resultMessages.js';
import type { StrategyKey } from '../plan/strategies.js';
import {
  CLASSIC,
  LOW_BUDGET,
  MINIMUM_NEVER_ENDS,
  MINIMUM_TRAP,
} from '../../test/cases.js';
import type { TestCase } from '../../test/cases.js';
import { PlanResults } from './PlanResults.js';

const normalize = (text: string | null) => (text ?? '').replace(/\s/g, ' ');

function renderResults({ debts, monthlyBudget }: TestCase, selected: StrategyKey = 'avalanche') {
  return render(
    <PlanResults
      hasDebts={debts.length > 0}
      comparison={compareStrategies(debts, monthlyBudget)}
      selected={selected}
      onSelect={() => {}}
      firstPayment="2027-01"
    />,
  );
}

function rowOf(name: string) {
  return screen.getByRole('row', { name: new RegExp(`^${name}`) });
}

describe('PlanResults', () => {
  it('shows the empty state without debts', () => {
    renderResults({ debts: [], monthlyBudget: Number.NaN });

    expect(screen.getByRole('status')).toHaveTextContent(resultMessages.empty);
  });

  it('pauses quietly while the input is invalid', () => {
    renderResults({ ...CLASSIC, monthlyBudget: Number.NaN });

    expect(screen.getByRole('status')).toHaveTextContent(resultMessages.incomplete);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('pauses with the minimum budget when INVALID_BUDGET', () => {
    renderResults(LOW_BUDGET);

    expect(normalize(screen.getByRole('status').textContent)).toBe(
      'Para cubrir los mínimos necesitas al menos $ 250.000 al mes.',
    );
    expect(screen.queryByRole('figure')).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows the freedom date, the interest line and the comparison (classic case)', () => {
    renderResults(CLASSIC);

    expect(normalize(screen.getByRole('figure').textContent)).toContain(
      'Libre en mayo de 2028. Pagarás $ 2.844.122 en intereses: $ 2.798.238 menos que pagando solo los mínimos.',
    );
    const expected = [
      ['Avalancha', 'mayo de 2028', '17', '$ 2.844.122', '$ 2.798.238'],
      ['Bola de nieve', 'mayo de 2028', '17', '$ 2.874.112', '$ 2.768.248'],
      ['Solo mínimos', 'septiembre de 2029', '33', '$ 5.642.360', '—'],
    ];
    for (const [name = '', ...cells] of expected) {
      const values = within(rowOf(name))
        .getAllByRole('cell')
        .map((cell) => normalize(cell.textContent));
      expect(values).toEqual(cells);
    }
    expect(document.querySelectorAll('[data-strategy]')).toHaveLength(3);
  });

  it('mixed case: avalanche and snowball pay off but minimums never end', () => {
    renderResults(MINIMUM_NEVER_ENDS);

    // La montaña dibuja solo las estrategias que pagan.
    const crests = [...document.querySelectorAll('[data-strategy]')].map((crest) =>
      crest.getAttribute('data-strategy'),
    );
    expect(crests.sort()).toEqual(['avalanche', 'snowball']);

    // La tabla: solo mínimos no tiene fecha ni meses, y no hay ahorro.
    expect(within(rowOf('Solo mínimos')).getByText('No se termina de pagar')).toBeInTheDocument();
    expect(within(rowOf('Avalancha')).getAllByRole('cell').at(-1)).toHaveTextContent('—');

    // El ahorro se reemplaza por la frase, en el héroe y como nota bajo la tabla.
    expect(normalize(screen.getByRole('figure').textContent)).toContain(
      `Pagarás $ 6.692.975 en intereses. ${resultMessages.minimumNeverEnds}`,
    );
    expect(screen.getByText(resultMessages.minimumNeverEnds)).toBeInTheDocument();
    expect(screen.queryByText(/menos que pagando/)).not.toBeInTheDocument();
  });

  it('mixed case: selecting minimums shows the alternative hero', () => {
    renderResults(MINIMUM_NEVER_ENDS, 'minimumOnly');

    expect(screen.queryByRole('figure')).not.toBeInTheDocument();
    expect(screen.getByText(resultMessages.notPayable)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Solo mínimos' })).toBeChecked();
  });

  it('shows the alternative hero when nothing pays off (minimum trap)', () => {
    renderResults(MINIMUM_TRAP);

    expect(screen.getByText(resultMessages.notPayable)).toBeInTheDocument();
    expect(screen.getAllByText('No se termina de pagar')).toHaveLength(3);
    expect(screen.queryByRole('figure')).not.toBeInTheDocument();
  });
});
