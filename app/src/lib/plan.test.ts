import { describe, expect, it } from 'vitest';
import { daysBetween, isStale, planningDaysFrom, survivalTriggers } from './plan';

describe('daysBetween', () => {
  it('counts forward and past days', () => {
    expect(daysBetween('2026-10-10', '2026-10-16')).toBe(6);
    expect(daysBetween('2026-10-10', '2026-10-10')).toBe(0);
    expect(daysBetween('2026-10-10', '2026-10-08')).toBe(-2);
  });
});

describe('planningDaysFrom', () => {
  it('uses future dates as the horizon', () => {
    expect(planningDaysFrom('2026-10-16', '2026-10-10')).toBe(6);
  });

  it('returns null for missing, today, or past dates (ask, never invent)', () => {
    expect(planningDaysFrom(undefined, '2026-10-10')).toBeNull();
    expect(planningDaysFrom('2026-10-10', '2026-10-10')).toBeNull();
    expect(planningDaysFrom('2026-10-08', '2026-10-10')).toBeNull();
  });
});

describe('isStale', () => {
  it('flags passed expected dates only', () => {
    expect(isStale({ id: 'a', source: 'Mum', expectedDate: '2026-10-08', status: 'expected' }, '2026-10-10')).toBe(true);
    expect(isStale({ id: 'a', source: 'Mum', expectedDate: '2026-10-12', status: 'expected' }, '2026-10-10')).toBe(false);
    expect(isStale({ id: 'a', source: 'Mum', expectedDate: '2026-10-08', status: 'received' }, '2026-10-10')).toBe(false);
    expect(isStale({ id: 'a', source: 'Mum', status: 'expected' }, '2026-10-10')).toBe(false);
  });
});

describe('survivalTriggers', () => {
  it('collects shortfall, overspend, and stale-income triggers in order', () => {
    const t = survivalTriggers({
      shortfall: true,
      shortfallGap: 1500,
      overspent: [{ name: 'Transport', over: 1200 }],
      staleIncomes: [{ source: 'Allowance' }],
    });
    expect(t.map((x) => x.kind)).toEqual(['shortfall', 'overspend', 'stale-income']);
    expect(t[1]).toMatchObject({ detail: 'Transport', amount: 1200 });
  });

  it('empty when everything is fine', () => {
    expect(survivalTriggers({ shortfall: false, shortfallGap: 0, overspent: [], staleIncomes: [] })).toEqual([]);
  });
});
