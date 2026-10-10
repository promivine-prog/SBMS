// Pure cloud-sync mapping. Local ids (any string) become stable UUIDs on first
// upload; references (allocations, contributions) are rewritten through the map.
// Repeat uploads reuse the map, so upserts stay idempotent. No I/O here.
import type { GuestState } from '../store/guest';

export type IdMap = Record<string, string>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(id: string): boolean {
  return UUID_RE.test(id);
}

export interface CloudTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  note: string | null;
  payment_method: string;
  source: string | null;
  allocations: { budgetId?: string; goalId?: string; label: string; amount: number }[];
}

export interface CloudBudget {
  id: string;
  name: string;
  kind: 'essential' | 'flexible' | 'uncertain';
  limit: number;
}

export interface CloudGoal {
  id: string;
  title: string;
  target: number;
  deadline: string | null;
  status: 'active' | 'paused' | 'done';
}

export interface CloudContribution {
  id?: string;
  goal_id: string;
  amount: number;
  date?: string;
}

export interface CloudExpectation {
  id: string;
  source: string;
  expected_date: string | null;
  estimated_amount: number | null;
  status: 'expected' | 'received' | 'delayed' | 'cancelled';
  regularity: 'regular' | 'variable' | 'one-off';
}

export interface CloudSource {
  id?: string;
  name: string;
}

export interface CloudLearning {
  lesson_id: string;
  quiz_score: number;
  at: string;
}

export interface CloudSession {
  id: string;
  scenario_id: string;
  virtual_balance?: number;
  choices: string[];
  outcome: { finalBalance?: number };
  at: string;
}

export type ProfileSettings = Record<string, number | boolean>;

export interface CloudProfile {
  language?: string;
  currency?: string;
  settings?: ProfileSettings;
}

export interface CloudRows {
  profile: { language: string; currency: string; settings: ProfileSettings };
  transactions: CloudTransaction[];
  budgets: CloudBudget[];
  goals: CloudGoal[];
  contributions: CloudContribution[];
  expectations: CloudExpectation[];
  sources: CloudSource[];
  learning: CloudLearning[];
  sessions: CloudSession[];
}

function mapId(map: IdMap, localId: string, gen: () => string): { id: string; map: IdMap } {
  if (isUuid(localId)) return { id: localId, map };
  const hit = map[localId];
  if (hit) return { id: hit, map };
  const fresh = gen();
  return { id: fresh, map: { ...map, [localId]: fresh } };
}

/**
 * Goal totals have no cloud column (saved derives from contributions), so a
 * goal with saved > 0 uploads one opening contribution dated today. Disclosed
 * in the UI as "goal totals upload as single opening entries".
 */
export function remapForCloud(
  state: GuestState,
  map: IdMap,
  gen: () => string,
  today: string,
): { rows: CloudRows; map: IdMap } {
  let m = map;
  const take = (localId: string): string => {
    const r = mapId(m, localId, gen);
    m = r.map;
    return r.id;
  };

  const budgets = state.budgets.map((b) => ({ id: take(b.id), name: b.name, kind: b.kind, limit: b.limit }));
  const goals = state.goals.map((g) => ({
    id: take(g.id),
    title: g.title,
    target: g.target,
    deadline: g.deadline ?? null,
    status: g.status,
  }));
  const transactions = state.transactions.map((t) => ({
    id: take(t.id),
    type: t.type,
    amount: t.amount,
    category: t.category,
    date: t.date,
    note: t.note ?? null,
    payment_method: t.paymentMethod,
    source: t.source ?? null,
    allocations: (t.allocations ?? []).map((a) => ({
      ...a,
      budgetId: a.budgetId ? take(a.budgetId) : undefined,
      goalId: a.goalId ? take(a.goalId) : undefined,
    })),
  }));

  const contributions = state.goals
    .filter((g) => g.saved > 0)
    .map((g) => ({ id: gen(), goal_id: take(g.id), amount: g.saved, date: today }));

  return {
    rows: {
      profile: {
        language: 'en',
        currency: 'NGN',
        settings: {
          balance: state.balance,
          protectedEssentials: state.protectedEssentials,
          knownEssentialsDue: state.knownEssentialsDue,
          buffer: state.buffer,
          planningDays: state.planningDays,
          includeCash: state.settings.includeCash,
        },
      },
      transactions,
      budgets,
      goals,
      contributions,
      expectations: state.incomeExpectations.map((e) => ({
        id: take(e.id),
        source: e.source,
        expected_date: e.expectedDate ?? null,
        estimated_amount: e.estimatedAmount ?? null,
        status: e.status,
        regularity: e.regularity,
      })),
      sources: state.customSources.map((name) => ({ id: gen(), name })),
      learning: state.learning.map((p) => ({ lesson_id: p.lessonId, quiz_score: p.quizScore, at: p.at })),
      sessions: state.simSessions.map((s) => ({
        id: take(s.id),
        scenario_id: s.scenarioId,
        virtual_balance: 0,
        choices: s.choices,
        outcome: { finalBalance: s.finalBalance },
        at: s.at,
      })),
    },
    map: m,
  };
}

/** Rebuild local state from cloud rows. Last-download-wins; disclosed in UI. */
export function fromCloud(rows: {
  profile?: CloudProfile | null;
  transactions: CloudTransaction[];
  budgets: CloudBudget[];
  goals: CloudGoal[];
  contributions: CloudContribution[];
  expectations: CloudExpectation[];
  sources: CloudSource[];
  learning: CloudLearning[];
  sessions: CloudSession[];
  seeds: string[];
}): GuestState {
  const savedByGoal = new Map<string, number>();
  for (const c of rows.contributions) {
    savedByGoal.set(c.goal_id, Math.round(((savedByGoal.get(c.goal_id) ?? 0) + c.amount) * 100) / 100);
  }
  const settings = rows.profile?.settings ?? {};
  const num = (v: unknown, fb: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fb);
  return {
    balance: num(settings.balance, 0),
    protectedEssentials: num(settings.protectedEssentials, 0),
    knownEssentialsDue: num(settings.knownEssentialsDue, 0),
    buffer: num(settings.buffer, 0),
    planningDays: Math.max(1, Math.floor(num(settings.planningDays, 7))),
    transactions: rows.transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      category: t.category,
      date: t.date,
      note: t.note ?? undefined,
      paymentMethod: (t.payment_method ?? 'other') as GuestState['transactions'][number]['paymentMethod'],
      source: t.source ?? undefined,
      allocations: t.allocations ?? [],
    })),
    budgets: rows.budgets.map((b) => ({ id: b.id, name: b.name, kind: b.kind, limit: b.limit })),
    goals: rows.goals.map((g) => ({
      id: g.id,
      title: g.title,
      target: g.target,
      deadline: g.deadline ?? undefined,
      status: g.status,
      saved: savedByGoal.get(g.id) ?? 0,
    })),
    customSources: [...rows.seeds, ...rows.sources.map((s) => s.name).filter((n) => !rows.seeds.some((s) => s.toLowerCase() === n.toLowerCase()))],
    incomeExpectations: rows.expectations.map((e) => ({
      id: e.id,
      source: e.source,
      expectedDate: e.expected_date ?? undefined,
      estimatedAmount: e.estimated_amount ?? undefined,
      status: e.status,
      regularity: e.regularity,
    })),
    learning: rows.learning.map((p) => ({ lessonId: p.lesson_id, quizScore: p.quiz_score, at: p.at })),
    simSessions: rows.sessions.map((s) => ({
      id: s.id,
      scenarioId: s.scenario_id,
      choices: s.choices,
      finalBalance: s.outcome?.finalBalance ?? 0,
      at: s.at,
    })),
    settings: { cashReminder: false, onboarded: true, demoMode: false, includeCash: rows.profile?.settings?.includeCash === true },
  };
}
