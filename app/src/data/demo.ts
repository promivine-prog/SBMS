// Fictional demo dataset for "Explore demo". Clearly fake amounts, clearly
// labeled in the UI. Never touches any server (guest store is local-only).
import type { GuestState } from '../store/guest';

export const DEMO_NOTE = 'Fictional demo data — not your real money.';

export function seedDemo(): GuestState {
  return {
    balance: 12500,
    protectedEssentials: 6000,
    knownEssentialsDue: 0,
    buffer: 1000,
    planningDays: 9,
    transactions: [
      { id: 'demo-t1', type: 'income', amount: 8000, category: 'Allowance', date: '2026-10-06', paymentMethod: 'cash', source: 'Parent', note: DEMO_NOTE },
      { id: 'demo-t2', type: 'expense', amount: 1500, category: 'food', date: '2026-10-07', paymentMethod: 'cash', note: DEMO_NOTE },
      { id: 'demo-t3', type: 'expense', amount: 800, category: 'transport', date: '2026-10-08', paymentMethod: 'cash', note: DEMO_NOTE },
      { id: 'demo-t4', type: 'expense', amount: 500, category: 'data', date: '2026-10-09', paymentMethod: 'mobile', note: DEMO_NOTE },
    ],
    budgets: [
      { id: 'demo-b1', name: 'food', kind: 'essential', limit: 6000 },
      { id: 'demo-b2', name: 'transport', kind: 'essential', limit: 3000 },
      { id: 'demo-b3', name: 'data', kind: 'flexible', limit: 1500 },
    ],
    goals: [
      { id: 'demo-g1', title: 'Textbooks', target: 5000, deadline: '2026-12-20', status: 'active', saved: 1500 },
    ],
    customSources: ['Parent', 'Allowance', 'Part-time work', 'Gift', 'Other'],
    incomeExpectations: [
      { id: 'demo-e1', source: 'Monthly allowance', expectedDate: '2026-11-01', estimatedAmount: 15000, status: 'expected', regularity: 'regular' },
    ],
    learning: [],
    simSessions: [],
    settings: { cashReminder: false, onboarded: true, demoMode: true, includeCash: false },
  };
}
