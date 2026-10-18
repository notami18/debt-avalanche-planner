import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App.js';
import { validationMessages } from './i18n/validationMessages.js';
import { STORAGE_KEY } from './plan/storage.js';

const EMPTY_STATE = 'Agrega tu primera deuda o carga un ejemplo para ver cómo funciona.';
const PAUSED = 'Completa los datos de tus deudas para ver tu plan.';

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
  });

  it('adds an empty debt without showing errors, and pauses results quietly', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Agregar deuda' }));

    expect(debtRows()).toHaveLength(1);
    expect(screen.queryByText(validationMessages.NOT_FINITE)).not.toBeInTheDocument();
    expect(screen.getByText(PAUSED)).toBeInTheDocument();
  });

  it('shows the engine error after leaving a field, linked with aria-describedby', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Agregar deuda' }));

    const balance = screen.getByLabelText('Saldo');
    fireEvent.blur(balance);

    expect(balance).toHaveAttribute('aria-invalid', 'true');
    expect(balance).toHaveAccessibleDescription(validationMessages.NOT_FINITE);
    expect(screen.getByLabelText('Cuota mínima')).not.toHaveAttribute('aria-invalid');
  });

  it('"Ver mi plan" shows every error and focuses the first invalid field', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Agregar deuda' }));

    fireEvent.click(screen.getByRole('button', { name: 'Ver mi plan' }));

    expect(screen.getByLabelText('Saldo')).toHaveFocus();
    expect(screen.getByLabelText('Cuota mínima')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Tasa (%)')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Presupuesto mensual')).toHaveAttribute('aria-invalid', 'true');
  });

  it('loads the example without errors and persists it', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Cargar ejemplo' }));

    expect(debtRows()).toHaveLength(3);
    expect(screen.getByRole('group', { name: 'Tarjeta A' })).toBeInTheDocument();
    expect(screen.queryByText(PAUSED)).not.toBeInTheDocument();
    expect(screen.queryByText(EMPTY_STATE)).not.toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toContain('Libre inversión');
  });

  it('shows the live rate equivalence, flips it for M.V., and hides it when empty', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Agregar deuda' }));
    const rate = screen.getByLabelText('Tasa (%)');

    fireEvent.change(rate, { target: { value: '28' } });
    expect(rate).toHaveAccessibleDescription(/^28\s?% E\.A\. equivale a 2,08\s?% mes vencido$/);

    fireEvent.click(screen.getByLabelText('M.V.'));
    fireEvent.change(rate, { target: { value: '2' } });
    expect(rate).toHaveAccessibleDescription(/^2\s?% M\.V\. equivale a 26,82\s?% E\.A\.$/);

    fireEvent.change(rate, { target: { value: '' } });
    expect(screen.queryByText(/equivale a/)).not.toBeInTheDocument();
  });

  it('restores the saved plan on reload', () => {
    const { unmount } = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Cargar ejemplo' }));
    unmount();

    render(<App />);

    expect(debtRows()).toHaveLength(3);
  });

  it('asks for confirmation before clearing everything', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Cargar ejemplo' }));

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
  });
});
