import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
let attempted = false;

/** Publishable-key client. Null when env is not configured (local-only mode). */
export function getSupabase(): SupabaseClient | null {
  if (attempted) return client;
  attempted = true;
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  if (!url || !key) return null;
  client = createClient(url, key);
  return client;
}

/** For tests: reset the memo so env changes take effect. */
export function resetSupabaseForTests(): void {
  client = null;
  attempted = false;
}
