import { describe, expect, it } from 'vitest';
import { budgetAlerts, spentByCategory, totalByType, weekStart } from './insights';

const TXNS = [
  { type: 'expense', amount: 1200, category: 'Transport', date: '2026-10-05' },
  { type: 'expense', amount: 800, category: 'transport', date: '2026-10-06' },
  { type: 'income', amount: 10000, category: 'Allowance', date: '2026-10-01' },
] as const;

describe('spentByCategory', () => {
  it('sums expenses only, keeps category keys', () => {
    expect(spentByCategory([...TXNS])).toEqual({ Transport: 1200, transport: 800 });
  });
});

describe('totalByType', () => {
  it('filters by type and since-date', () => {
    expect(totalByType([...TXNS], 'expense')).toBe(2000);
    expect(totalByType([...TXNS], 'expense', '2026-10-06')).toBe(800);
    expect(totalByType([...TXNS], 'income', '2026-10-06')).toBe(0);
  });
});

describe('budgetAlerts', () => {
  it('sums case variants and flags overspend', () => {
    const alerts = budgetAlerts(
      [{ id: 'b1', name: 'transport', limit: 1500 }],
      { Transport: 1200, transport: 800 },
    );
    expect(alerts[0].spent).toBe(2000);
    expect(alerts[0].over).toBe(true);
    const ok = budgetAlerts([{ id: 'b1', name: 'Transport', limit: 2500 }], { Transport: 2000 });
    expect(ok[0].over).toBe(false);
  });
});

describe('weekStart', () => {
  it('returns Monday of the week', () => {
    // 2026-10-10 is a Saturday; Monday is 2026-10-05
    expect(weekStart(new Date(2026, 9, 10))).toBe('2026-10-05');
  });
});
