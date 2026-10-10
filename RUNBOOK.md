# SBMS Production Runbook — Supabase `sbms-prod` go-live

**Goal:** real student data touches ONLY production. Staging (`sbms-staging`,
`tpsbdvqdivpqspggfjam`) stays the playground.
**Rule:** you approve before execution. Nothing here runs itself.

## 0. Preconditions (check all before starting)

- [ ] Staging smoke suite green (`SMOKE_CLOUD=1` run passed)
- [ ] `main` branch clean and pushed
- [ ] You hold the staging DB password and the prod password (different, stored safe)

## 1. Create the production project (your side, dashboard)

1. Supabase → New Project → same organization
2. Name: `sbms-prod` → new strong **DB password** (different from staging)
3. Region: **EU West (Ireland)** → Free (or Pro if pilot needs it) → Create
4. Authentication → Sign In / Up → **Confirm email: ON** for prod
   (real accounts; staging keeps it OFF for testing)
5. Note the new project ref + API URL + publishable key
   (Settings → API). Never touch the Secret key.

## 2. Apply the schema (your side, dashboard)

1. Supabase prod → SQL Editor → New Query
2. Paste the entire `supabase/migrations/0001_init.sql` from `main`
3. Run → expect **success, no rows returned**
4. Verify (SQL Editor, run each, expect 10 tables):
   ```sql
   select table_name from information_schema.tables
   where table_schema = 'public' order by 1;
   ```
5. Verify RLS is ON everywhere (expect 10 rows, all `true`):
   ```sql
   select tablename, rowsecurity from pg_tables
   where schemaname = 'public' order by 1;
   ```

## 3. Point Vercel at prod (your side, dashboard)

1. Vercel → sbms → Settings → Environment Variables
2. `VITE_SUPABASE_URL` → set **Production** value to the prod URL
   (keep Preview on the staging URL — add per-environment values)
3. `VITE_SUPABASE_PUBLISHABLE_KEY` → **Production** value = prod publishable key
   (Preview keeps the staging key). Type: Config, never Secret.
4. Deployments → Redeploy latest **without** build cache → wait Ready

## 4. Prod smoke test (approve first — touches prod)

1. Approve, then I run the gated smoke suite against the production URL
   with a throwaway `sbms.prodcheck.*@gmail.com` user
2. Expected: signup → upload counts → download lossless → logout
3. Afterwards you delete the throwaway user
   (Supabase prod → Authentication → Users → Delete; cascades its rows)

## 5. Go / no-go for pilot

- [ ] Prod journey green, deep link `/plan` returns 200
- [ ] Account page shows signup form (env wired)
- [ ] Throwaway user + rows deleted
- [ ] Reviewer sign-off recorded (plan §12), lesson content approved

## 6. Rollback

- **Bad migration:** do NOT hand-edit prod tables. Fix `supabase/migrations/`
  with a new `0002_*.sql` on `main`, review, then apply forward.
- **Bad app deploy:** Vercel → Deployments → previous Ready build → Promote
  to Production.
- **Bad env values:** correct the variable → Redeploy without cache.
- **Leaked Secret key:** roll it immediately
  (Supabase → Settings → API → regenerate), then update server-side only.
