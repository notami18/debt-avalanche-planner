import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App.js';
import { validationMessages } from './i18n/validationMessages.js';
import { STORAGE_KEY } from './plan/storage.js';

const EMPTY_STATE = 'Agrega tu primera deuda o carga un ejemplo para ver cómo funciona.';
const PAUSED = 'Completa los datos de tus deudas para ver tu plan.';

// El estado vacío repite "Agregar deuda" y "Cargar ejemplo": por defecto, los del formulario.
function formButton(name: string) {
  return within(screen.getByRole('form', { name: 'Tus datos' })).getByRole('button', { name });
}

function debtRows() {
  return screen.queryAllByRole('group', { name: /^(Deuda \d+|Tarjeta A|Libre inversión|Tarjeta B)$/ });
}

beforeEach(() => {
  localStorage.clear();
});

describe('App', () => {
  it('starts with the empty state', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Avalancha' })).toBeInTheDocument();
    expect(screen.getByText(EMPTY_STATE)).toBeInTheDocument();
    expect(debtRows()).toHaveLength(0);
    expect(screen.getByRole('contentinfo')).toHaveTextContent(
      'Avalancha es un simulador educativo, no asesoría financiera.',
    );
  });

  it('adds an empty debt without showing errors, and pauses results quietly', () => {
    render(<App />);

    fireEvent.click(formButton('Agregar deuda'));

    expect(debtRows()).toHaveLength(1);
    expect(screen.queryByText(validationMessages.NOT_FINITE)).not.toBeInTheDocument();
    expect(screen.getByText(PAUSED)).toBeInTheDocument();
  });

  it('shows the engine error after leaving a field, linked with aria-describedby', () => {
    render(<App />);
    fireEvent.click(formButton('Agregar deuda'));

    const balance = screen.getByLabelText('Saldo');
    fireEvent.blur(balance);

    expect(balance).toHaveAttribute('aria-invalid', 'true');
    expect(balance).toHaveAccessibleDescription(validationMessages.NOT_FINITE);
    expect(screen.getByLabelText('Cuota mínima')).not.toHaveAttribute('aria-invalid');
  });

  it('"Ver mi plan" shows every error and focuses the first invalid field', () => {
    render(<App />);
    fireEvent.click(formButton('Agregar deuda'));

    fireEvent.click(screen.getByRole('button', { name: 'Ver mi plan' }));

    expect(screen.getByLabelText('Saldo')).toHaveFocus();
    expect(screen.getByLabelText('Cuota mínima')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Tasa (%)')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Presupuesto mensual')).toHaveAttribute('aria-invalid', 'true');
  });

  it('loads the example without errors and persists it', () => {
    render(<App />);

    fireEvent.click(formButton('Cargar ejemplo'));

    expect(debtRows()).toHaveLength(3);
    expect(screen.getByRole('group', { name: 'Tarjeta A' })).toBeInTheDocument();
    expect(screen.queryByText(PAUSED)).not.toBeInTheDocument();
    expect(screen.queryByText(EMPTY_STATE)).not.toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toContain('Libre inversión');
  });

  it('shows the live rate equivalence, flips it for M.V., and hides it when empty', () => {
    render(<App />);
    fireEvent.click(formButton('Agregar deuda'));
    const rate = screen.getByLabelText('Tasa (%)');

    fireEvent.change(rate, { target: { value: '28' } });
    expect(rate).toHaveAccessibleDescription(/^28\s?% E\.A\. equivale a 2,08\s?% mes vencido$/);

    fireEvent.click(screen.getByLabelText('M.V.'));
    fireEvent.change(rate, { target: { value: '2' } });
    expect(rate).toHaveAccessibleDescription(/^2\s?% M\.V\. equivale a 26,82\s?% E\.A\.$/);

    fireEvent.change(rate, { target: { value: '' } });
    expect(screen.queryByText(/equivale a/)).not.toBeInTheDocument();
  });

  it('shows the results for the example and switches strategy from the table', () => {
    render(<App />);
    fireEvent.click(formButton('Cargar ejemplo'));

    const caption = () => screen.getByRole('figure').textContent?.replace(/\s/g, ' ');
    expect(caption()).toContain('Pagarás $ 2.844.122 en intereses');
    expect(screen.getByRole('radio', { name: 'Avalancha' })).toBeChecked();

    fireEvent.click(screen.getByRole('radio', { name: 'Bola de nieve' }));

    expect(screen.getByRole('radio', { name: 'Bola de nieve' })).toBeChecked();
    expect(caption()).toContain('Pagarás $ 2.874.112 en intereses');
  });

  it('shows the minimum budget under the budget field when it is too low', () => {
    render(<App />);
    fireEvent.click(formButton('Cargar ejemplo'));

    const budget = screen.getByLabelText('Presupuesto mensual');
    fireEvent.change(budget, { target: { value: '500.000' } });

    expect(budget).toHaveAttribute('aria-invalid', 'true');
    expect(budget).toHaveAccessibleDescription(
      /Para cubrir los mínimos necesitas al menos \$\s795\.000 al mes\./,
    );
  });

  it('restores the saved plan on reload', () => {
    const { unmount } = render(<App />);
    fireEvent.click(formButton('Cargar ejemplo'));
    unmount();

    render(<App />);

    expect(debtRows()).toHaveLength(3);
  });

  it('asks for confirmation before clearing everything', () => {
    render(<App />);
    fireEvent.click(formButton('Cargar ejemplo'));

    fireEvent.click(screen.getByRole('button', { name: 'Borrar mis datos' }));
    const confirm = screen.getByRole('group', { name: '¿Borrar todo?' });
    expect(within(confirm).getByRole('button', { name: 'Cancelar' })).toHaveFocus();

    fireEvent.click(within(confirm).getByRole('button', { name: 'Cancelar' }));
    expect(debtRows()).toHaveLength(3);

    fireEvent.click(screen.getByRole('button', { name: 'Borrar mis datos' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sí, borrar' }));

    expect(debtRows()).toHaveLength(0);
    expect(screen.getByText(EMPTY_STATE)).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    // Ya no hay nada que borrar: el botón desaparece y el foco pasa a "Cargar ejemplo".
    expect(screen.queryByRole('button', { name: 'Borrar mis datos' })).not.toBeInTheDocument();
    expect(formButton('Cargar ejemplo')).toHaveFocus();
  });

  it('shows "Borrar mis datos" only when there is data', () => {
    render(<App />);
    expect(screen.queryByRole('button', { name: 'Borrar mis datos' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Presupuesto mensual'), { target: { value: '900.000' } });

    expect(screen.getByRole('button', { name: 'Borrar mis datos' })).toBeInTheDocument();
  });

  it('asks the budget question between the label and the field, with an example placeholder', () => {
    render(<App />);

    const budget = screen.getByLabelText('Presupuesto mensual');
    const question = screen.getByText('¿Cuánto puedes destinar en total a tus deudas cada mes?');
    const label = screen.getByText('Presupuesto mensual');

    expect(budget).toHaveAttribute('placeholder', 'Ej. 1.300.000');
    expect(budget).toHaveAccessibleDescription(question.textContent ?? '');
    expect(label.compareDocumentPosition(question)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(question.compareDocumentPosition(budget)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('the empty state has its own buttons; "Agregar deuda" focuses the new debt', () => {
    render(<App />);
    const results = screen.getByRole('region', { name: 'Tu plan' });

    fireEvent.click(within(results).getByRole('button', { name: 'Agregar deuda' }));

    expect(debtRows()).toHaveLength(1);
    expect(screen.getByLabelText('Nombre')).toHaveFocus();
  });

  it('the empty state loads the example and leaves the focus on "Tu plan"', () => {
    render(<App />);
    const results = screen.getByRole('region', { name: 'Tu plan' });

    fireEvent.click(within(results).getByRole('button', { name: 'Cargar ejemplo' }));

    expect(debtRows()).toHaveLength(3);
    expect(screen.getByRole('heading', { name: 'Tu plan' })).toHaveFocus();
  });

  it('"Ver mi plan" with valid data moves the focus to "Tu plan"', () => {
    render(<App />);
    fireEvent.click(formButton('Cargar ejemplo'));

    fireEvent.click(screen.getByRole('button', { name: 'Ver mi plan' }));

    expect(screen.getByRole('heading', { name: 'Tu plan' })).toHaveFocus();
  });

  it('"Ver mi plan" focuses the budget when it does not cover the minimums', () => {
    render(<App />);
    fireEvent.click(formButton('Cargar ejemplo'));
    fireEvent.change(screen.getByLabelText('Presupuesto mensual'), { target: { value: '500.000' } });

    fireEvent.click(screen.getByRole('button', { name: 'Ver mi plan' }));

    expect(screen.getByLabelText('Presupuesto mensual')).toHaveFocus();
  });
});
