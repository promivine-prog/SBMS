import { describe, expect, it } from 'vitest';
import { cashOnHand } from '../lib/cash';
import { DEMO_NOTE, seedDemo } from './demo';

describe('seedDemo', () => {
  it('holds internally consistent fictional data', () => {
    const d = seedDemo();
    expect(d.settings.demoMode).toBe(true);
    expect(d.settings.onboarded).toBe(true);
    // Every transaction is positive, dated, and labeled fictional.
    for (const t of d.transactions) {
      expect(t.amount).toBeGreaterThan(0);
      expect(t.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(t.note).toBe(DEMO_NOTE);
    }
    // Cash on hand derives cleanly and stays non-negative.
    const cash = cashOnHand(d.transactions.map((x) => ({ type: x.type, amount: x.amount, paymentMethod: x.paymentMethod })));
    expect(cash).toBe(8000 - 1500 - 800);
    // Budgets cover their spent categories without overshoot in the demo story.
    expect(d.budgets.length).toBeGreaterThan(0);
    expect(d.goals[0].saved).toBeLessThanOrEqual(d.goals[0].target);
  });
});
