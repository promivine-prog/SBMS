import { describe, expect, it } from 'vitest';
import { defaultGuestState } from '../store/guest';
import { fromCloud, isUuid, remapForCloud } from './sync';

let n = 0;
const gen = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;

describe('isUuid', () => {
  it('accepts UUIDs, rejects legacy local ids', () => {
    expect(isUuid('00000000-0000-4000-8000-000000000001')).toBe(true);
    expect(isUuid('m3x9abc-12ab')).toBe(false);
  });
});

function sampleState() {
  const s = defaultGuestState();
  s.balance = 12500;
  s.knownEssentialsDue = 2000;
  s.budgets = [{ id: 'b1', name: 'food', kind: 'essential', limit: 6000 }];
  s.goals = [{ id: 'g1', title: 'Textbooks', target: 5000, status: 'active', saved: 1500 }];
  s.transactions = [
    {
      id: 't1', type: 'income', amount: 8000, category: 'Allowance', date: '2026-10-06',
      paymentMethod: 'cash', source: 'Parent',
      allocations: [
        { budgetId: 'b1', label: 'food (budget)', amount: 5000 },
        { goalId: 'g1', label: 'Textbooks (goal)', amount: 3000 },
      ],
    },
  ];
  return s;
}

describe('remapForCloud', () => {
  it('assigns UUIDs and rewrites allocation references consistently', () => {
    const { rows, map } = remapForCloud(sampleState(), {}, gen, '2026-10-10');
    const tx = rows.transactions[0] as { id: string; allocations: { budgetId?: string; goalId?: string }[] };
    expect(isUuid(tx.id)).toBe(true);
    expect(tx.allocations[0].budgetId).toBe(rows.budgets[0].id);
    expect(tx.allocations[1].goalId).toBe(rows.goals[0].id);
    expect(map['t1']).toBe(tx.id);
  });

  it('synthesizes one opening contribution per goal with savings', () => {
    const { rows } = remapForCloud(sampleState(), {}, gen, '2026-10-10');
    expect(rows.contributions).toHaveLength(1);
    expect(rows.contributions[0]).toMatchObject({ amount: 1500, date: '2026-10-10' });
  });

  it('reuses the map on repeat uploads (idempotent)', () => {
    const s = sampleState();
    const first = remapForCloud(s, {}, gen, '2026-10-10');
    const second = remapForCloud(s, first.map, gen, '2026-10-10');
    expect(second.rows.transactions[0].id).toBe(first.rows.transactions[0].id);
  });
});

describe('fromCloud', () => {
  it('round-trips totals and settings', () => {    const s = sampleState();
    const { rows } = remapForCloud(s, {}, gen, '2026-10-10');
    const back = fromCloud({ ...rows, seeds: ['Parent'] });
    expect(back.balance).toBe(12500);
    expect(back.knownEssentialsDue).toBe(2000);
    expect(back.goals[0].saved).toBe(1500);
    expect(back.transactions).toHaveLength(1);
    expect(back.transactions[0].allocations).toHaveLength(2);
    expect(back.settings.onboarded).toBe(true);
  });

  it('coerces PostgREST NUMERIC strings back to numbers', () => {
    const s = sampleState();
    const { rows } = remapForCloud(s, {}, gen, '2026-10-10');
    const stringy = {
      ...rows,
      transactions: rows.transactions.map((t) => ({ ...t, amount: String(t.amount) })),
      budgets: rows.budgets.map((b) => ({ ...b, limit: String(b.limit) })),
      goals: rows.goals.map((g) => ({ ...g, target: String(g.target) })),
      contributions: rows.contributions.map((c) => ({ ...c, amount: String(c.amount) })),
    };
    const back = fromCloud({ ...stringy, seeds: ['Parent'] });
    expect(back.balance).toBe(12500);
    expect(back.goals[0].saved).toBe(1500);
    expect(back.goals[0].target).toBe(5000);
    expect(back.transactions[0].amount).toBe(8000);
    expect(typeof back.transactions[0].amount).toBe('number');
  });
});
