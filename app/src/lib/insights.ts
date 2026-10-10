// Pure insight helpers (rules only, no AI). Plan ref: IMPLEMENTATION_PLAN.md §6.5
import { roundKobo } from './runway';

export interface MiniTxn {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
}

export interface MiniBudget {
  id: string;
  name: string;
  limit: number;
}

/** Total spent per category (expenses only). */
export function spentByCategory(txns: MiniTxn[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of txns) {
    if (t.type !== 'expense') continue;
    out[t.category] = roundKobo((out[t.category] ?? 0) + t.amount);
  }
  return out;
}

/** Sum of a type on/after `since` (YYYY-MM-DD, inclusive). Omit for all-time. */
export function totalByType(txns: MiniTxn[], type: 'income' | 'expense', since?: string): number {
  let total = 0;
  for (const t of txns) {
    if (t.type !== type) continue;
    if (since && t.date < since) continue;
    total += t.amount;
  }
  return roundKobo(total);
}

/** Monday of the current week, local time, as YYYY-MM-DD. */
export function weekStart(today = new Date()): string {
  const d = new Date(today);
  const day = (d.getDay() + 6) % 7; // Monday-first
  d.setDate(d.getDate() - day);
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const dd = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${dd}`;
}

export interface BudgetAlert {
  budgetId: string;
  name: string;
  limit: number;
  spent: number;
  over: boolean;
}

/** Match budget spend by category name (case-insensitive, summed across variants). */
export function budgetAlerts(budgets: MiniBudget[], spent: Record<string, number>): BudgetAlert[] {
  const lower: Record<string, number> = {};
  for (const [k, v] of Object.entries(spent)) {
    const key = k.toLowerCase();
    lower[key] = roundKobo((lower[key] ?? 0) + v);
  }
  return budgets.map((b) => {
    const s = lower[b.name.toLowerCase()] ?? 0;
    return { budgetId: b.id, name: b.name, limit: b.limit, spent: s, over: s > b.limit };
  });
}
