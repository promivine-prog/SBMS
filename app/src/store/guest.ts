// Guest/Demo local-only store. Never writes to Supabase — keeps the DB clean.
// Shape mirrors IMPLEMENTATION_PLAN.md §5. Cloud sync (Supabase) arrives in a later phase.
import { CASH_SOURCE_SEEDS } from '../lib/cash';

export type TxnType = 'income' | 'expense';
export type PaymentMethod = 'cash' | 'bank' | 'mobile' | 'other';

export interface Allocation {
  budgetId?: string;
  goalId?: string;
  label: string;
  amount: number;
}

export interface Transaction {
  id: string;
  type: TxnType;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  note?: string;
  paymentMethod: PaymentMethod;
  source?: string;
  /** Allocate-on-entry split (cash income). Goal legs also bump goal.saved. */
  allocations?: Allocation[];
}

export interface Budget {
  id: string;
  name: string;
  kind: 'essential' | 'flexible' | 'uncertain';
  limit: number;
}

export interface SavingsGoal {
  id: string;
  title: string;
  target: number;
  deadline?: string;
  status: 'active' | 'paused' | 'done';
  saved: number;
}

export interface IncomeExpectation {
  id: string;
  source: string;
  expectedDate?: string; // YYYY-MM-DD
  estimatedAmount?: number;
  status: 'expected' | 'received' | 'delayed' | 'cancelled';
  regularity: 'regular' | 'variable' | 'one-off';
}

export interface LessonProgress {
  lessonId: string;
  quizScore: number;
  at: string;
}

export interface SimSession {
  id: string;
  scenarioId: string;
  choices: string[];
  finalBalance: number;
  at: string;
}

export interface GuestSettings {
  /** Optional evening nudge to record cash spending. OFF by default. Generic text only. */
  cashReminder: boolean;
  /** First-run onboarding completed. */
  onboarded: boolean;
  /** True when the store holds fictional demo data. */
  demoMode: boolean;
}

export interface GuestState {
  balance: number;
  protectedEssentials: number;
  buffer: number;
  planningDays: number;
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  customSources: string[];
  incomeExpectations: IncomeExpectation[];
  learning: LessonProgress[];
  simSessions: SimSession[];
  settings: GuestSettings;
}

const KEY = 'sbms-guest';

export const DEFAULT_CATEGORIES = ['food', 'transport', 'data', 'school materials', 'accommodation', 'personal'];

export function defaultGuestState(): GuestState {
  return {
    balance: 0,
    protectedEssentials: 0,
    buffer: 0,
    planningDays: 7,
    transactions: [],
    budgets: [],
    goals: [],
    customSources: [...CASH_SOURCE_SEEDS],
    incomeExpectations: [],
    learning: [],
    simSessions: [],
    settings: { cashReminder: false, onboarded: false, demoMode: false },
  };
}

export function loadGuest(): GuestState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultGuestState();
    const parsed = JSON.parse(raw) as Partial<GuestState>;
    const fresh = defaultGuestState();
    return {
      ...fresh,
      ...parsed,
      // Deep-merge nested settings so older saved states gain new flags.
      settings: { ...fresh.settings, ...(parsed.settings ?? {}) },
    };
  } catch {
    return defaultGuestState();
  }
}

export function saveGuest(state: GuestState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}

/** Demo reset — wipes local test data without touching any server. */
export function resetDemo(): GuestState {
  const fresh = defaultGuestState();
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  return fresh;
}

export function newId(): string {
  // UUIDs so future cloud uploads keep stable ids (legacy base36 ids remap on upload).
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  } catch {
    /* fall through to legacy generator */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
