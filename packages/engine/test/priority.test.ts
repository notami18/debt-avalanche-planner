import { describe, expect, it } from 'vitest';
import { simulate } from '../src/index.js';
import type { Debt, Strategy } from '../src/index.js';

// Datos ficticios. Las deudas se entregan en orden inverso al esperado para que un
// sort estable no esconda un desempate mal implementado.
function debt(
  id: string,
  balance: number,
  annualEffectiveRate: number,
): Debt {
  return { id, name: `Deuda ${id}`, balance, annualEffectiveRate, minimumPayment: 50_000 };
}

// SPEC §6: las filas de cada mes van en orden de prioridad.
function priorityOrder(debts: Debt[], strategy: Strategy): string[] {
  const result = simulate({ debts, monthlyBudget: 10_000_000, strategy });
  if (result.status !== 'PAID_OFF') {
    throw new Error(`expected PAID_OFF, got ${result.status}`);
  }
  return result.schedule[0]?.rows.map((row) => row.debtId) ?? [];
}

describe('priority tie-breaking (SPEC §4)', () => {
  it('avalanche: same rate → smaller initial balance first', () => {
    const debts = [
      debt('a', 3_000_000, 0.3),
      debt('b', 1_000_000, 0.3),
      debt('c', 2_000_000, 0.4),
    ];
    expect(priorityOrder(debts, 'avalanche')).toEqual(['c', 'b', 'a']);
  });

  it('avalanche: same rate and balance → ascending id', () => {
    const debts = [
      debt('tarjeta-c', 1_000_000, 0.3),
      debt('tarjeta-b', 1_000_000, 0.3),
      debt('tarjeta-a', 1_000_000, 0.3),
    ];
    expect(priorityOrder(debts, 'avalanche')).toEqual([
      'tarjeta-a',
      'tarjeta-b',
      'tarjeta-c',
    ]);
  });

  it('snowball: same balance → higher rate first', () => {
    const debts = [
      debt('a', 1_000_000, 0.2),
      debt('b', 1_000_000, 0.35),
      debt('c', 500_000, 0.1),
    ];
    expect(priorityOrder(debts, 'snowball')).toEqual(['c', 'b', 'a']);
  });

  it('snowball: same balance and rate → ascending id', () => {
    const debts = [
      debt('tarjeta-c', 1_000_000, 0.3),
      debt('tarjeta-b', 1_000_000, 0.3),
      debt('tarjeta-a', 1_000_000, 0.3),
    ];
    expect(priorityOrder(debts, 'snowball')).toEqual([
      'tarjeta-a',
      'tarjeta-b',
      'tarjeta-c',
    ]);
  });

  it.each<Strategy>(['avalanche', 'snowball', 'minimum-only'])(
    '%s: ids compare by character code, not locale (decisión 3)',
    (strategy) => {
      const debts = ['b', 'a9', 'a10', 'B'].map((id) =>
        debt(id, 1_000_000, 0.3),
      );
      expect(priorityOrder(debts, strategy)).toEqual(['B', 'a10', 'a9', 'b']);
    },
  );
});

describe('600-month limit (decisión 5)', () => {
  const zeroRateDebt = (balance: number): Debt => ({
    id: 'prestamo-a',
    name: 'Préstamo A',
    balance,
    annualEffectiveRate: 0,
    minimumPayment: 1,
  });

  it('a debt closed exactly in month 600 is PAID_OFF', () => {
    const result = simulate({
      debts: [zeroRateDebt(600)],
      monthlyBudget: 1,
      strategy: 'minimum-only',
    });
    expect(result).toMatchObject({ status: 'PAID_OFF', months: 600 });
  });

  it('balance left after month 600 is NOT_PAYABLE', () => {
    const result = simulate({
      debts: [zeroRateDebt(601)],
      monthlyBudget: 1,
      strategy: 'minimum-only',
    });
    expect(result).toEqual({
      status: 'NOT_PAYABLE',
      monthsSimulated: 600,
      warnings: [],
    });
  });
});
