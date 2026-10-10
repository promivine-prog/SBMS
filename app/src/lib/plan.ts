// Pure planning helpers: horizons, stale income, survival triggers.
// Plan ref: IMPLEMENTATION_PLAN.md §6.1–6.3. No UI side-effects, no I/O.
import { roundKobo } from './runway';

export type ExpectStatus = 'expected' | 'received' | 'delayed' | 'cancelled';

export interface MiniExpectation {
  id: string;
  source: string;
  expectedDate?: string;
  status: ExpectStatus;
}

/** Effective planning balance: manual figure plus cash on hand only when opted in. */
export function effectiveAvailable(balance: number, cashOnHand: number, includeCash: boolean): number {
  return roundKobo(balance + (includeCash ? Math.max(0, cashOnHand) : 0));
}

/** True when essentials + buffer already consume the balance: saving now risks them. */
export function essentialsConflict(balance: number, protectedEssentials: number, buffer: number): boolean {
  if (!Number.isFinite(balance) || !Number.isFinite(protectedEssentials) || !Number.isFinite(buffer)) return false;
  return balance - protectedEssentials - buffer <= 0;
}

/** Whole days from todayStr to dateStr (negative when past). Both YYYY-MM-DD. */
export function daysBetween(todayStr: string, dateStr: string): number {
  const ms = new Date(`${dateStr}T00:00:00`).getTime() - new Date(`${todayStr}T00:00:00`).getTime();
  return Math.round(ms / (24 * 3600 * 1000));
}

/**
 * Planning days from a next-income date. Returns null when the date is
 * missing or not in the future — the UI must then ask for a manual horizon,
 * never invent one.
 */
export function planningDaysFrom(nextIncomeDate: string | undefined, todayStr: string): number | null {
  if (!nextIncomeDate) return null;
  const d = daysBetween(todayStr, nextIncomeDate);
  return d >= 1 ? d : null;
}

/** Stale = still 'expected' but the date has passed. Never show stale plans as fresh. */
export function isStale(e: MiniExpectation, todayStr: string): boolean {
  return e.status === 'expected' && !!e.expectedDate && e.expectedDate < todayStr;
}

export type TriggerKind = 'shortfall' | 'overspend' | 'stale-income';

export interface SurvivalTrigger {
  kind: TriggerKind;
  /** i18n-safe detail, e.g. budget name or income source. */
  detail: string;
  /** NGN amount involved (over-limit, shortfall gap), 0 when n/a. */
  amount: number;
}

export interface SurvivalInput {
  shortfall: boolean;
  shortfallGap: number;
  overspent: { name: string; over: number }[];
  staleIncomes: { source: string }[];
}

/** Live triggers behind Survival Mode. Supportive copy lives in the UI layer. */
export function survivalTriggers(input: SurvivalInput): SurvivalTrigger[] {
  const out: SurvivalTrigger[] = [];
  if (input.shortfall) out.push({ kind: 'shortfall', detail: '', amount: Math.max(0, input.shortfallGap) });
  for (const o of input.overspent) out.push({ kind: 'overspend', detail: o.name, amount: o.over });
  for (const s of input.staleIncomes) out.push({ kind: 'stale-income', detail: s.source, amount: 0 });
  return out;
}
