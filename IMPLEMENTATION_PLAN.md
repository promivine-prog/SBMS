# SBMS - Implementation Plan
**Source:** `SBMS_Winning_Product_Blueprint_Complete_With_Bank_Partnerships.docx`
**Date:** 2026-10-09
**Target:** Nigerian tertiary students (University, Polytechnic, College of Education)
**Initial currency:** NGN

## 1. Goal
Build a mobile-first PWA that helps students:
1. Know what they have (balance + income/expense log)
2. Protect essentials and see flexible money (runway / daily guide)
3. Re-plan when income is delayed or expense hits (Survival Mode + Irregular Income Mode)
4. Track micro-savings goals (tracker only, no custody)
5. Learn via short lessons + virtual simulator (hypothetical only)
6. Use it in English, Yoruba, Nigerian Pidgin, Igbo, Hausa

## 2. Non-Goals for MVP (Explicitly Postponed)
- No bank integration / open banking / auto-sync
- No real-money custody, transfers, pooled group savings
- No real investments, live prices, trading
- No complex AI coach, wellness score, marketplace, rewards with liability
- No native iOS/Android apps (PWA only)

## 3. Recommended Stack (default - confirm before build)
- **Client:** React + Vite + TypeScript, PWA (vite-plugin-pwa), React Router, Tailwind or CSS Modules
- **Backend:** Supabase (Postgres + Auth + RLS) - alternative Firebase only if team already knows it
- **Auth:** Supabase Auth + Demo/Guest mode (localStorage, no account required to try)
- **i18n:** i18next + central JSON keys per language (`/locales/en, yo, pcm, ig, ha`)
- **Hosting:** Vercel/Netlify (frontend) + Supabase (backend), HTTPS, staging + prod envs
- **Testing:** Vitest (runway calc unit tests), Playwright (critical flows), manual phone testing
- **Monitoring:** Sentry (or Supabase logs) + basic analytics (privacy-respecting, no transaction notes in analytics)

Why: one codebase, managed auth/RLS/backups, testable calc module, cheap pilot.

## 4. Architecture
```
Mobile Browser / PWA (React)
  -> Supabase Auth + PostgREST (RLS per user_id)
  -> Postgres (profiles, transactions, budgets, income_expectations, goals, contributions, learning_progress, simulator_sessions)
  -> i18n JSON bundle
  -> Isolated calc module: src/lib/runway.ts (pure, fully unit-tested)
  -> Simulator module isolated from real balances
```

Rules:
- All money math lives in `src/lib/` pure functions, no UI side-effects.
- Simulator data never mixes with transaction balances.
- No secrets in client. Enforce RLS and test cross-user access denial.
- Expected income != available balance.

## 5. Data Model (MVP)
- `profiles(user_id PK, language, currency='NGN', settings JSONB)`
- `transactions(id, user_id FK, type: income|expense, amount NUMERIC>0, category TEXT, date DATE, note TEXT?)`
- `budgets(id, user_id FK, name, essential|flexible|uncertain, limit NUMERIC)`
- `income_expectations(id, user_id FK, source, expected_date DATE?, estimated_amount NUMERIC?, status: expected|received|delayed|cancelled, regularity: regular|variable|one-off)`
- `savings_goals(id, user_id FK, title, target NUMERIC, deadline DATE?, status: active|paused|done)`
- `contributions(id, goal_id FK, amount, date)`
- `learning_progress(user_id, lesson_id, quiz_score, timestamp)`
- `simulator_sessions(id, user_id, scenario_id, virtual_balance, choices JSONB, outcome JSONB)`

## 6. Signature Logic (must implement exactly)
### 6.1 Runway
```
flexible = available - protected_essentials - known_essentials_due - buffer
if flexible <= 0: show shortfall state, NO positive daily guide
else: daily_guide = flexible / planning_days
```
- Inputs editable. If next-income date unknown, require user to pick planning horizon, never invent date.
- Show assumptions + period + "estimate based on what you entered, not a guarantee."
- Example only: 30,000 - 20,000 - 4,000 buffer = 6,000 / 15d = 400/day.

### 6.2 Survival Mode
Trigger: new expense / lower balance / delayed income / overspent category.
Show: what changed, revised estimate, adjustable options (cut flexible, extend horizon).
Never suggest skipping meals/meds/safe housing. No shame language ("may run short", not "you failed").

### 6.3 Irregular Income
Multiple sources, record actual, update expected date without penalty. Stale expected date -> prompt to update, don't show stale plan.

### 6.4 Micro-savings
`suggested = (target - saved) / weeks_or_months_left`. Warn if conflicts with essentials. Allow pause/reduce. Label: "tracking only, SBMS does not move/hold money."

### 6.5 Simulator + Insights
- Scenario cards (allowance delayed, course material, charger breaks, overspend invite, transport rise, fictional investment). Show gain AND loss, label HYPOTHETICAL.
- Insights MVP = rules only: "Transport is 1,200 above limit you set this week [period]." No AI.

## 7. UX - Build Order
1. Welcome (1-sentence promise) -> Language select -> Plan my money / Explore demo
2. Setup: balance, essentials, next-income (optional)
3. Home / My Money Plan: available, protected, flexible, period, next action
4. Add transaction (amount, type, category, date, note) - short form
5. Budget: limits, spent, remaining
6. Survival Mode screen
7. Goals: target, deadline, suggested contribution, progress, pause/edit
8. Learn: short lessons + quiz
9. Simulator: virtual balance, scenario, choice, risk explainer
10. Settings: language switch (no data loss), reminders, export/delete, privacy notice

Categories default: food, transport, data, school materials, accommodation, personal.

## 8. Multilingual Plan
- Glossary first: balance, expense, income, savings goal, risk, loss, return, inflation, investment.
- English reference copy, then localize critical flows (onboarding, home, add-txn, budget, survival, goals, errors).
- Fluent-speaker review required for risk/safety copy. No raw MT for risk text.
- Acceptance: language switch preserves session, fits phone width, user can explain runway + risk in own words.

## 9. Privacy / Security / Safety (MVP gates)
- HTTPS, Supabase RLS, no service-role keys in client
- Min data, optional fields truly optional, privacy notice + export/delete
- Never ask for bank/card PIN, online banking password, OTP
- Fictional data in demos/screenshots
- Configurable reminders, no lock-screen financial details by default
- Label: not a bank/wallet/broker/adviser. Simulator returns hypothetical.

## 10. Phased Build Plan
### Phase 0 - Validate (1-2 wks)
- [ ] 8-15 student interviews (last time money ran short?)
- [ ] 100-200 survey (planning target, not national sample)
- [ ] 5-8 app competitor audit with 8,000 NGN / 6-day scenario
- [ ] Clickable mock + test with 5-8 students
- Exit: major workflow understood, scope locked to P0

### Phase 1 - Foundation (1 wk)
- [ ] Vite React TS PWA scaffold, routing, i18n skeleton, design tokens
- [ ] Supabase project (staging+prod), tables + RLS, auth + guest mode
- [ ] `runway.ts` pure module + Vitest edge cases (zero, essentials>balance, 1 day left, unknown date, delayed/early, edit/delete, negative/invalid, rounding)
- Exit: RLS tested, calc tests green

### Phase 2 - Core Money Flows (2-3 wks)
- [ ] Transactions CRUD + history
- [ ] Budgets (essential/flexible) with spent/remaining
- [ ] Goals + manual contributions + pause
- [ ] Basic insights (totals, budget alerts, weekly summary)
- Exit: key tests pass, edit/delete works

### Phase 3 - Signature Planner (1-2 wks)
- [ ] Runway calculator UI + assumption editor
- [ ] Irregular income update + stale-date prompt
- [ ] Survival Mode UI + copy (supportive, no shame)
- Exit: edge-case tests + comprehension test (user can explain guide != guarantee)

### Phase 4 - Access + Learning (1-2 wks)
- [ ] 5-language critical flows + reviewer sign-off
- [ ] 5-6 starter lessons + quiz + progress
- [ ] Simulator scenario cards (isolated virtual balance)
- Exit: tasks work in all 5 langs or gaps disclosed

### Phase 5 - Pilot Hardening (1-2 wks)
- [ ] Privacy notice, export/delete, backups, error monitoring
- [ ] Offline graceful handling + sync label, low-bandwidth + phone-width QA
- [ ] Onboarding polish, demo mode
- Exit: zero critical calc/access bugs, checklist Sec.12 passes

### Phase 6 - Pilot + Iterate (2-4 wks)
- [ ] Closed pilot 20-40 students, 1-3 institutions
- [ ] Track: activation, time-to-first-plan, week-1 logging retention, plan refresh, goal adoption, task completion by language, pre/post quiz gain, trust/clarity, error rate
- [ ] Interview churned + active users
- Exit: findings doc + prioritized fix list, repeat-use signal

Total indicative: 8-14 weeks for small team. Not a guarantee.

## 11. Team (minimum)
Product owner (student contact + scope guard), Developer (app+calc+RLS), UX builder (phone testing), 4x language reviewers (yo/pcm/ig/ha), student testers, security/privacy reviewer pre-pilot.

## 12. Acceptance Checklist (pre-pilot gate)
- [ ] Demo mode works
- [ ] Language choice + switch preserves data
- [ ] Txn add/edit/delete, budgets show spent/remaining
- [ ] Goals track without implying money moved
- [ ] Runway handles missing/unknown dates transparently, essentials separated
- [ ] Survival Mode explains change, no shaming, no essential-sacrifice advice
- [ ] Expected income not counted as balance
- [ ] Calc edge cases automated
- [ ] Simulator fictional + risk explained
- [ ] Privacy notice + export/delete, RLS blocks cross-user access
- [ ] Phone width + slow connection tested, reviewer sign-off on risk copy
- [ ] 80% pilot target: create plan unaided (revise after evidence)

## 13. Risks
- Logging drop-off -> quick entry, corrections allowed, "based on entered data" label
- Scope creep -> protect P0, push AI/bank/social to Phase 2+
- Bad translation -> fluent review + comprehension test
- Guide mistaken for guarantee -> show assumptions/period, update prompts
- Competitor overlap -> differentiate via cash-flow workflow + test evidence

## 14. Future (Post-MVP, only with evidence + legal review)
Phase 1: polish core. Phase 2: rules insights, reminders, term templates. Phase 3-5: bank education partner -> referral/deep-link -> read-only opt-in sync (never PIN/password in SBMS, revocable, least-privilege). Phase 6: institutional workshops (aggregated, no individual surveillance). Monetization to test later: freemium advanced tools, institution-sponsored, disclosed referrals, grants. Never sell identifiable txn data.

## 15. Decisions (locked 2026-10-09, solo build - you approve before execution)
1. Stack: React + Supabase confirmed. Frontend: Vercel. Backend deferred (local-first, add Supabase project when approved).
2. Accounts: Hybrid - Guest/Demo local-only (localStorage, never writes to Supabase, Reset demo button) + optional Supabase Auth account for cloud sync. Guest -> account merge on signup. Keeps DB clean of test errors.
3. Pilot schools (1-3): owner-recruited, deferred. You handle.
4. Language reviewers: pending - you to secure 1 speaker each yo/pcm/ig/ha before pilot; no lang ships as "reviewed" without sign-off.
5. Lessons + simulator: AI drafts 5-6 lessons + 6 scenario cards, you approve on review.

## 16. Next Action
Confirm Sec.15 decisions -> kick off Phase 0 interviews + scaffold Phase 1 in parallel.
