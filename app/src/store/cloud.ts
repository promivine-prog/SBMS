// Supabase cloud sync. Guest stays local-only; these run only when the user
// explicitly taps Upload/Download while signed in. Publishable key only.
import type { SupabaseClient } from '@supabase/supabase-js';
import { CASH_SOURCE_SEEDS } from '../lib/cash';
import { getSupabase } from '../lib/supabase';
import {
  fromCloud,
  remapForCloud,
  type CloudBudget,
  type CloudContribution,
  type CloudExpectation,
  type CloudGoal,
  type CloudLearning,
  type CloudProfile,
  type CloudSession,
  type CloudSource,
  type CloudTransaction,
  type IdMap,
} from '../lib/sync';
import type { GuestState } from './guest';

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
}

export function cloudConfigured(): boolean {
  return getSupabase() !== null;
}

const MAP_KEY = 'sbms-cloud-map';

function loadMap(): IdMap {
  try {
    return (JSON.parse(localStorage.getItem(MAP_KEY) ?? '{}') ?? {}) as IdMap;
  } catch {
    return {};
  }
}

function saveMap(map: IdMap): void {
  try {
    localStorage.setItem(MAP_KEY, JSON.stringify(map));
  } catch {
    /* private mode: re-upload remaps next time */
  }
}

export async function currentEmail(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.user.email ?? null;
}

export async function signUp(email: string, password: string): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return 'Cloud sync is not configured on this build.';
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) {
    if (/already registered|already exists/i.test(error.message)) {
      return 'That email already has an account. Log in instead.';
    }
    return error.message;
  }
  // With email confirmation ON there is no session yet: never write as anon
  // (RLS would reject it). The profile row is created on first upload instead.
  if (!data.session) return 'Account created. Confirm your email, then log in.';
  if (data.user) {
    const { error: pErr } = await sb.from('profiles').upsert(
      { user_id: data.user.id, language: 'en', currency: 'NGN', settings: {} },
      { onConflict: 'user_id' },
    );
    if (pErr) return pErr.message;
  }
  return null;
}

export async function signIn(email: string, password: string): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return 'Cloud sync is not configured on this build.';
  const { error } = await sb.auth.signInWithPassword({ email, password });
  return error ? error.message : null;
}

export async function signOut(): Promise<void> {
  await getSupabase()?.auth.signOut();
}

/**
 * Upload MERGES local records into the cloud copy (upsert by stable id).
 * Nothing on the server is deleted except scoped refreshes: opening
 * contributions and the custom-source name list, which are rebuilt from
 * local truth each time. Goal totals upload as single opening entries.
 */
export async function uploadAll(state: GuestState): Promise<{ counts: Record<string, number> }> {
  const db = getSupabase();
  if (!db) throw new Error('Cloud sync is not configured on this build.');
  const { data } = await db.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) throw new Error('Log in first.');
  const { rows, map } = remapForCloud(state, loadMap(), () => crypto.randomUUID(), today());
  saveMap(map);
  const withUser = <T extends object>(list: T[]): (T & { user_id: string })[] =>
    list.map((r) => ({ ...r, user_id: uid }));

  const { error: pErr } = await db.from('profiles').upsert(
    { user_id: uid, language: 'en', currency: 'NGN', settings: rows.profile.settings },
    { onConflict: 'user_id' },
  );
  if (pErr) throw new Error(pErr.message);

  const counts: Record<string, number> = {};
  // Stable-id tables: pure upsert, server rows from other devices survive.
  const upserts: [string, object[], string][] = [
    ['transactions', withUser(rows.transactions), 'id'],
    ['budgets', withUser(rows.budgets), 'id'],
    ['savings_goals', withUser(rows.goals), 'id'],
    ['income_expectations', withUser(rows.expectations), 'id'],
    ['learning_progress', withUser(rows.learning), 'user_id,lesson_id'],
    ['simulator_sessions', withUser(rows.sessions), 'id'],
  ];
  for (const [table, insertRows, conflict] of upserts) {
    if (insertRows.length === 0) {
      counts[table] = 0;
      continue;
    }
    const { error } = await db.from(table).upsert(insertRows, { onConflict: conflict });
    if (error) throw new Error(`${table}: ${error.message}`);
    counts[table] = insertRows.length;
  }
  // Rebuilt-from-local tables: scoped refresh keeps them exact.
  const { error: cDel } = await db.from('contributions').delete().eq('user_id', uid);
  if (cDel) throw new Error(`contributions: ${cDel.message}`);
  if (rows.contributions.length > 0) {
    const { error: cIns } = await db.from('contributions').insert(withUser(rows.contributions));
    if (cIns) throw new Error(`contributions: ${cIns.message}`);
  }
  counts['contributions'] = rows.contributions.length;
  // Name lists rebuild cleanly: scoped refresh (the unique index has no
  // constraint name addressable by onConflict, so upsert can't target it).
  const { error: sDel } = await db.from('cash_sources').delete().eq('user_id', uid);
  if (sDel) throw new Error(`cash_sources: ${sDel.message}`);
  if (rows.sources.length > 0) {
    const { error: sIns } = await db.from('cash_sources').insert(withUser(rows.sources));
    if (sIns) throw new Error(`cash_sources: ${sIns.message}`);
  }
  counts['cash_sources'] = rows.sources.length;
  return { counts };
}

/** Download REPLACES local records with the cloud copy (last-download-wins). */
export async function downloadAll(): Promise<GuestState> {
  const db = getSupabase();
  if (!db) throw new Error('Cloud sync is not configured on this build.');
  const { data } = await db.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) throw new Error('Log in first.');
  const client: SupabaseClient = db;
  async function all<T>(table: string): Promise<T[]> {
    const { data: rows, error } = await client.from(table).select('*').eq('user_id', uid);
    if (error) throw new Error(`${table}: ${error.message}`);
    return (rows ?? []) as T[];
  }
  const [profile, transactions, budgets, goals, contributions, expectations, sources, learning, sessions] =
    await Promise.all([
      all<CloudProfile>('profiles').then((r) => r[0] ?? null),
      all<CloudTransaction>('transactions'),
      all<CloudBudget>('budgets'),
      all<CloudGoal>('savings_goals'),
      all<CloudContribution>('contributions'),
      all<CloudExpectation>('income_expectations'),
      all<CloudSource>('cash_sources'),
      all<CloudLearning>('learning_progress'),
      all<CloudSession>('simulator_sessions'),
    ]);
  return fromCloud({
    profile,
    transactions,
    budgets,
    goals,
    contributions,
    expectations,
    sources,
    learning,
    sessions,
    seeds: [...CASH_SOURCE_SEEDS],
  });
}
