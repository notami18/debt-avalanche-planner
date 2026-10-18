import { compareStrategies } from '@avalancha/engine';
import { EXAMPLE_BUDGET, EXAMPLE_DEBTS } from './plan/example.js';

export function App() {
  const result = compareStrategies(EXAMPLE_DEBTS, EXAMPLE_BUDGET).avalanche;

  return (
    <main>
      <h1>Avalancha</h1>
      {result.status === 'PAID_OFF' ? (
        <p>
          Meses con avalancha (ejemplo): <strong>{result.months}</strong>
        </p>
      ) : (
        <p>El ejemplo no se pudo calcular.</p>
      )}
    </main>
  );
}
