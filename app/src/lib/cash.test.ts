import { describe, expect, it } from 'vitest';
import { addCustomSource, cashOnHand, reconcileDiff, validateAllocation } from './cash';

describe('cashOnHand', () => {
  it('sums cash income minus cash expenses, ignores non-cash', () => {
    expect(
      cashOnHand([
        { type: 'income', amount: 10000, paymentMethod: 'cash' },
        { type: 'expense', amount: 2500, paymentMethod: 'cash' },
        { type: 'income', amount: 50000, paymentMethod: 'bank' },
      ]),
    ).toBe(7500);
  });

  it('empty log -> 0, never negative-guessed', () => {
    expect(cashOnHand([])).toBe(0);
  });

  it('rejects negative amounts', () => {
    expect(() => cashOnHand([{ type: 'income', amount: -5, paymentMethod: 'cash' }])).toThrow();
  });
});

describe('validateAllocation', () => {
  it('accepts legs that sum to income', () => {
    expect(validateAllocation(10000, [6000, 3000, 1000])).toMatchObject({ ok: true, total: 10000 });
  });

  it('rejects legs that do not sum to income', () => {
    const r = validateAllocation(10000, [6000, 3000]);
    expect(r.ok).toBe(false);
    expect(r.error).toBeDefined();
  });

  it('rejects non-positive income', () => {
    expect(validateAllocation(0, []).ok).toBe(false);
  });
});

describe('reconcileDiff', () => {
  it('missing cash -> negative diff (posts Unaccounted expense)', () => {
    expect(reconcileDiff(7500, 7000)).toBe(-500);
  });

  it('extra found -> positive diff (posts correction income)', () => {
    expect(reconcileDiff(7500, 8000)).toBe(500);
  });

  it('exact match -> 0 (dismiss, post nothing)', () => {
    expect(reconcileDiff(7500, 7500)).toBe(0);
  });
});

describe('addCustomSource', () => {
  it('adds trimmed names', () => {
    expect(addCustomSource([], '  Mum  ')).toEqual(['Mum']);
  });

  it('rejects case-insensitive duplicates', () => {
    expect(() => addCustomSource(['Mum'], 'mum')).toThrow();
  });

  it('enforces the cap with a helpful message', () => {
    const full = Array.from({ length: 20 }, (_, i) => `S${i}`);
    expect(() => addCustomSource(full, 'One more')).toThrow(/delete an unused source/);
  });
});
