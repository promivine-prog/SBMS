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
} from '../lib/sync';
import type { GuestState } from './guest';

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
}

export function cloudConfigured(): boolean {
  return getSupabase() !== null;
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
  if (error) return error.message;
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
 * Upload REPLACES the user's cloud dataset with local records (delete then
 * insert per table). Goal totals upload as single opening contributions.
 */
export async function uploadAll(state: GuestState): Promise<{ counts: Record<string, number> }> {
  const db = getSupabase();
  if (!db) throw new Error('Cloud sync is not configured on this build.');
  const { data } = await db.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) throw new Error('Log in first.');
  const { rows } = remapForCloud(state, {}, () => crypto.randomUUID(), today());
  const withUser = <T extends object>(list: T[]): (T & { user_id: string })[] =>
    list.map((r) => ({ ...r, user_id: uid }));

  const { error: pErr } = await db.from('profiles').upsert(
    { user_id: uid, language: 'en', currency: 'NGN', settings: rows.profile.settings },
    { onConflict: 'user_id' },
  );
  if (pErr) throw new Error(pErr.message);

  const counts: Record<string, number> = {};
  const tables: [string, object[]][] = [
    ['transactions', withUser(rows.transactions)],
    ['budgets', withUser(rows.budgets)],
    ['savings_goals', withUser(rows.goals)],
    ['contributions', withUser(rows.contributions)],
    ['income_expectations', withUser(rows.expectations)],
    ['cash_sources', withUser(rows.sources)],
    ['cash_reconciliations', []],
    ['learning_progress', withUser(rows.learning)],
    ['simulator_sessions', withUser(rows.sessions)],
  ];
  for (const [table, insertRows] of tables) {
    const { error: dErr } = await db.from(table).delete().eq('user_id', uid);
    if (dErr) throw new Error(`${table}: ${dErr.message}`);
    if (insertRows.length > 0) {
      const { error: iErr } = await db.from(table).insert(insertRows);
      if (iErr) throw new Error(`${table}: ${iErr.message}`);
    }
    counts[table] = insertRows.length;
  }
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
