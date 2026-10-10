import { describe, expect, it } from 'vitest';
import { calcRunway } from './runway';

// Edge cases from IMPLEMENTATION_PLAN.md §6.1 / Phase 1 exit criteria.
describe('calcRunway', () => {
  it('computes the handbook example: 30000-20000-4000 over 15d = 400/day', () => {
    const r = calcRunway({ available: 30000, protectedEssentials: 20000, knownEssentialsDue: 0, buffer: 4000, planningDays: 15 });
    expect(r).toEqual({ flexible: 6000, dailyGuide: 400, shortfall: false });
  });

  it('zero balance -> shortfall, no positive guide', () => {
    const r = calcRunway({ available: 0, protectedEssentials: 0, knownEssentialsDue: 0, buffer: 0, planningDays: 6 });
    expect(r.shortfall).toBe(true);
    expect(r.dailyGuide).toBeNull();
  });

  it('essentials exceed balance -> shortfall with negative flexible', () => {
    const r = calcRunway({ available: 8000, protectedEssentials: 9000, knownEssentialsDue: 0, buffer: 0, planningDays: 6 });
    expect(r.shortfall).toBe(true);
    expect(r.flexible).toBe(-1000);
    expect(r.dailyGuide).toBeNull();
  });

  it('exactly zero flexible -> shortfall (no guide)', () => {
    const r = calcRunway({ available: 10000, protectedEssentials: 9000, knownEssentialsDue: 500, buffer: 500, planningDays: 5 });
    expect(r.shortfall).toBe(true);
    expect(r.dailyGuide).toBeNull();
  });

  it('one day remaining divides by 1', () => {
    const r = calcRunway({ available: 5000, protectedEssentials: 3000, knownEssentialsDue: 0, buffer: 0, planningDays: 1 });
    expect(r.dailyGuide).toBe(2000);
  });

  it('rejects planningDays < 1 (unknown date must be asked, never invented)', () => {
    expect(() => calcRunway({ available: 5000, protectedEssentials: 0, knownEssentialsDue: 0, buffer: 0, planningDays: 0 })).toThrow();
  });

  it('rejects negative / NaN inputs', () => {
    expect(() => calcRunway({ available: -1, protectedEssentials: 0, knownEssentialsDue: 0, buffer: 0, planningDays: 5 })).toThrow();
    expect(() => calcRunway({ available: NaN, protectedEssentials: 0, knownEssentialsDue: 0, buffer: 0, planningDays: 5 })).toThrow();
  });

  it('rounds to kobo consistently', () => {
    const r = calcRunway({ available: 100, protectedEssentials: 0, knownEssentialsDue: 0, buffer: 0, planningDays: 3 });
    expect(r.dailyGuide).toBe(33.33);
  });
});
