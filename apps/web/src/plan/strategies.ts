import type { StrategyComparison } from '@avalancha/engine';

export type StrategyKey = keyof StrategyComparison;

export interface StrategyInfo {
  key: StrategyKey;
  name: string;
  description: string;
}

// Orden de la tabla y de la montaña (SPEC-web §5.2).
export const STRATEGIES: readonly StrategyInfo[] = [
  {
    key: 'avalanche',
    name: 'Avalancha',
    description: 'Abona lo que sobra a la deuda con la tasa más alta: ahorras más en intereses.',
  },
  {
    key: 'snowball',
    name: 'Bola de nieve',
    description: 'Abona lo que sobra a la deuda con el saldo más pequeño: cierras deudas antes.',
  },
  {
    key: 'minimumOnly',
    name: 'Solo mínimos',
    description: 'Pagas solo la cuota mínima de cada deuda, sin abonos extra.',
  },
];
