// Pure cash-tracking math. No UI side-effects, no I/O.
// Tracking only: SBMS never holds/moves money. Plan ref: IMPLEMENTATION_PLAN.md §6.6
import { roundKobo } from './runway';

export type PaymentMethod = 'cash' | 'bank' | 'mobile' | 'other';

export interface CashTxn {
  type: 'income' | 'expense';
  amount: number;
  paymentMethod: PaymentMethod | string;
}

/** Derived balance. Never stored as a column (prevents drift). */
export function cashOnHand(txns: CashTxn[]): number {
  let bal = 0;
  for (const t of txns) {
    if (t.paymentMethod !== 'cash') continue;
    if (!Number.isFinite(t.amount) || t.amount < 0) {
      throw new Error('transaction amount must be finite and >= 0');
    }
    bal += t.type === 'income' ? t.amount : -t.amount;
  }
  return roundKobo(bal);
}

export interface AllocationCheck {
  ok: boolean;
  total: number;
  /** Set when !ok. */
  error?: string;
}

/** Allocate-on-entry legs must sum exactly to the income (kobo tolerance). */
export function validateAllocation(incomeAmount: number, legs: number[]): AllocationCheck {
  if (!Number.isFinite(incomeAmount) || incomeAmount <= 0) {
    return { ok: false, total: 0, error: 'income must be > 0' };
  }
  const total = roundKobo(legs.reduce((a, b) => a + b, 0));
  if (Math.abs(total - roundKobo(incomeAmount)) > 0.009) {
    return { ok: false, total, error: `allocated ${total} != income ${roundKobo(incomeAmount)}` };
  }
  return { ok: true, total };
}

/** "Count my cash": positive diff = extra found, negative = missing. */
export function reconcileDiff(recorded: number, counted: number): number {
  if (!Number.isFinite(recorded) || !Number.isFinite(counted)) {
    throw new Error('recorded and counted must be finite numbers');
  }
  return roundKobo(counted - recorded);
}

export const CASH_SOURCE_SEEDS = ['Parent', 'Allowance', 'Part-time work', 'Gift', 'Other'] as const;
export const MAX_CUSTOM_SOURCES = 20;

/** Add a custom source (e.g. "Mum"). Unique per user, case-insensitive. Throws at cap/duplicates. */
export function addCustomSource(existing: string[], name: string, max = MAX_CUSTOM_SOURCES): string[] {
  const clean = name.trim().replace(/\s+/g, ' ');
  if (!clean) throw new Error('source name must not be empty');
  const lower = existing.map((s) => s.toLowerCase());
  if (lower.includes(clean.toLowerCase())) throw new Error(`source "${clean}" already exists`);
  if (existing.length >= max) throw new Error('source limit reached: delete an unused source to add a new one');
  return [...existing, clean];
}
