-- SBMS initial schema: sbms-staging
-- Run in Supabase Dashboard → SQL Editor. Review before running.
-- Local-first app is unchanged; this backend activates on your approval.

-- ── profiles ──────────────────────────────────────────────────────────────
create table profiles (
  user_id uuid primary key references auth.users on delete cascade,
  language text not null default 'en',
  currency text not null default 'NGN',
  settings jsonb not null default '{}'
);

-- ── transactions (plan §5 + cash fields §6.6) ─────────────────────────────
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null check (amount > 0),
  category text not null,
  date date not null,
  note text,
  payment_method text not null default 'other'
    check (payment_method in ('cash', 'bank', 'mobile', 'other')),
  source text,
  allocations jsonb not null default '[]'
);
create index transactions_user_date on transactions (user_id, date desc);

-- ── cash_sources (custom quick-reuse, unique per user, case-insensitive) ──
create table cash_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null
);
create unique index cash_sources_user_name on cash_sources (user_id, lower(name));

-- ── cash_reconciliations ("Count my cash" audit trail) ────────────────────
create table cash_reconciliations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  recorded numeric not null,
  counted numeric not null,
  diff numeric not null,
  accepted boolean not null default true,
  date date not null
);

-- ── budgets ───────────────────────────────────────────────────────────────
create table budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  kind text not null check (kind in ('essential', 'flexible', 'uncertain')),
  "limit" numeric not null check ("limit" > 0)
);

-- ── income_expectations (expected ≠ balance) ──────────────────────────────
create table income_expectations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  source text not null,
  expected_date date,
  estimated_amount numeric check (estimated_amount is null or estimated_amount > 0),
  status text not null default 'expected'
    check (status in ('expected', 'received', 'delayed', 'cancelled')),
  regularity text not null default 'variable'
    check (regularity in ('regular', 'variable', 'one-off'))
);

-- ── savings_goals + contributions (tracker only, no custody) ──────────────
create table savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text not null,
  target numeric not null check (target > 0),
  deadline date,
  status text not null default 'active'
    check (status in ('active', 'paused', 'done'))
);

create table contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  goal_id uuid not null references savings_goals on delete cascade,
  amount numeric not null check (amount > 0),
  date date not null
);
create index contributions_goal on contributions (goal_id);

-- ── learning_progress (best score per lesson) ─────────────────────────────
create table learning_progress (
  user_id uuid not null references auth.users on delete cascade,
  lesson_id text not null,
  quiz_score int not null check (quiz_score >= 0),
  at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- ── simulator_sessions (isolated from real balances) ──────────────────────
create table simulator_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  scenario_id text not null,
  virtual_balance numeric not null,
  choices jsonb not null default '[]',
  outcome jsonb not null default '{}',
  at timestamptz not null default now()
);

-- ── Row Level Security: users touch only their own rows ───────────────────
alter table profiles enable row level security;
alter table transactions enable row level security;
alter table cash_sources enable row level security;
alter table cash_reconciliations enable row level security;
alter table budgets enable row level security;
alter table income_expectations enable row level security;
alter table savings_goals enable row level security;
alter table contributions enable row level security;
alter table learning_progress enable row level security;
alter table simulator_sessions enable row level security;

create policy own_rows on profiles
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_rows on transactions
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_rows on cash_sources
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_rows on cash_reconciliations
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_rows on budgets
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_rows on income_expectations
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_rows on savings_goals
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_rows on contributions
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_rows on learning_progress
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_rows on simulator_sessions
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
