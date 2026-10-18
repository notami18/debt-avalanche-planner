import { compareStrategies } from '@avalancha/engine';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { loadGoldenFixture } from '../../../../packages/engine/test/load-golden-fixture.js';
import { TrapNotice } from './TrapNotice.js';

const trap = loadGoldenFixture().cases.find((c) => c.name === 'trampa-de-minimos');
if (!trap) throw new Error('Missing golden case trampa-de-minimos');

const debtNames = new Map(trap.debts.map((debt) => [debt.id, debt.name]));

describe('TrapNotice', () => {
  it('names the debt whose minimum does not cover interest (trampa-de-minimos)', () => {
    const { avalanche } = compareStrategies(trap.debts, trap.monthlyBudget);
    if (avalanche.status !== 'NOT_PAYABLE') throw new Error('expected NOT_PAYABLE');

    render(<TrapNotice warnings={avalanche.warnings} debtNames={debtNames} />);

    expect(screen.getByRole('note')).toHaveTextContent(
      'La cuota mínima de Tarjeta grande no alcanza a cubrir los intereses del mes: la deuda crece aunque pagues.',
    );
  });

  it('renders nothing without warnings', () => {
    const { container } = render(<TrapNotice warnings={[]} debtNames={debtNames} />);

    expect(container).toBeEmptyDOMElement();
  });
});
