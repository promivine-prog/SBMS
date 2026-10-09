# SBMS — Smart Budgeting and Micro-Savings Software

> Know what you have. Plan what matters. Make your money last. Build your future one small step at a time.

**Initial market:** Nigerian tertiary students (University, Polytechnic, College of Education)
**Currency:** NGN (₦)
**Type:** Mobile-first PWA (manual entry first)
**Status:** v0.1 — planning / blueprint (no app code yet)

## 1. What it is

SBMS is a student-first cash-flow companion for small, irregular or uncertain money. It answers:

- How much can I safely spend today?
- What must I protect until my next income?
- What can I change if money is not enough?

Core workflow: **money-runway planner + irregular-income handling + calm low-balance recovery (Survival Mode)**, connected to expense tracking, micro-savings goals, short lessons, 5-language support, and a virtual investment simulator.

Source of truth:

- `SBMS_Winning_Product_Blueprint_Complete_With_Bank_Partnerships.docx` (~44k chars, 17 sections) — full concept, research, UX, tech, safety, instruments, partnership strategy
- `IMPLEMENTATION_PLAN.md` — build-ready extraction for developers

## 2. MVP Scope (P0)

- Onboarding: language select, NGN, starting balance, optional next-income date + Demo mode
- Income/expense log: manual add/edit/delete (amount, type, category, date, note)
- Budgets: essential / flexible limits, spent, remaining
- Runway / daily guide: `flexible = available - protected_essentials - known_essentials_due - buffer`, `daily_guide = flexible / planning_days`
- Irregular Income Mode: multiple sources (regular/variable/one-off), update dates without penalty
- Survival Mode: what changed, revised estimate, adjustable options — no shame language
- Micro-savings goals: tracker only, `suggested = (target - saved) / weeks_left`, pause/reduce allowed
- Basic insights (rules only), 5-language critical flows, privacy notice + export/delete

Categories: food, transport, data, school materials, accommodation, personal.

P1 (after core stable): lessons + quiz, virtual simulator (scenario cards, HYPOTHETICAL label).
P2 / Later: rules insights, expense-split helper, reminders, term templates.

## 3. Explicit Non-Goals for MVP

No bank integration / open banking / auto-sync, no real-money custody / transfers / pooled savings, no real investments / live prices / trading, no complex AI coach, no native apps.

Full future partnership path (Phases 1-6) is in blueprint §16: prove core → smarter planning → bank education pilot → opt-in read-only connectivity → partner referrals → institutional expansion. Only with evidence + legal review.

## 4. Signature Logic

- **Runway:** if `flexible <= 0` show shortfall, no positive daily guide. If next-income unknown, require user-picked horizon, never invent date. Always show assumptions + period + "estimate, not a guarantee."
- **Survival Mode:** trigger on new expense / lower balance / delayed income / overspend. Never suggest skipping meals/meds/safe housing.
- **Irregular Income:** expected income != available balance. Stale date → prompt to update.
- **Savings:** warn if contribution conflicts with essentials. Label: "tracking only, SBMS does not move/hold money."
- **Simulator + Insights:** fictional balances, show gain AND loss, rules text like "Transport is 1,200 above limit you set this week [period]."

## 5. Planned Stack

- Client: React + Vite + TypeScript, PWA, React Router, Tailwind / CSS Modules
- Backend: Supabase (Postgres + Auth + RLS) — Firebase only if team knows it
- Auth: Supabase Auth + Guest/Demo mode (localStorage)
- i18n: i18next, `/locales/en, yo, pcm, ig, ha`
- Hosting: Vercel/Netlify + Supabase, HTTPS, staging + prod
- Testing: Vitest (runway edge cases), Playwright (critical flows)
- Monitoring: Sentry + privacy-respecting analytics

Architecture: `PWA → Supabase Auth + PostgREST (RLS per user_id) → Postgres (profiles, transactions, budgets, income_expectations, goals, contributions, learning_progress, simulator_sessions)`. All money math in `src/lib/` pure functions. Simulator isolated.

## 6. Languages

English + Yoruba + Nigerian Pidgin + Igbo + Hausa. Glossary first, English reference copy, fluent-speaker review for risk copy, switch preserves data, fits phone width.

## 7. Safety / Privacy Gates

HTTPS, RLS + cross-user denial tests, min data, no secrets in client, never ask for bank/card PIN / passwords / OTP, fictional demo data, configurable reminders, "not a bank/wallet/broker/adviser" label.

## 8. Build Phases

0. Validate (1-2 wks) — 8-15 interviews, 100-200 survey, 5-8 app audit with 8,000 NGN / 6-day scenario, clickable mock
1. Foundation (1 wk) — scaffold, Supabase + RLS, `runway.ts` + tests
2. Core flows (2-3 wks) — transactions, budgets, goals, insights
3. Signature planner (1-2 wks) — runway UI, irregular income, Survival Mode
4. Access + Learning (1-2 wks) — 5 langs, lessons, simulator
5. Pilot hardening (1-2 wks) — privacy, offline, QA
6. Pilot (2-4 wks) — 20-40 students, 1-3 institutions

Total indicative 8-14 weeks. See `IMPLEMENTATION_PLAN.md` §10-12 for exit criteria + acceptance checklist.

## 9. Repo State (v0.1)

```
SBMS/
├── README.md (this file)
├── IMPLEMENTATION_PLAN.md
└── SBMS_Winning_Product_Blueprint_Complete_With_Bank_Partnerships.docx
```

No `src/`, no `package.json` yet. Next: confirm Sec.15 decisions (React+Supabase?, guest+account?, pilot schools?, reviewers?, lesson owner?) → Phase 0 + Phase 1 scaffold in parallel.

## 10. Decisions Needed Before Code

1. React+Supabase confirmed?
2. Guest/demo + account, or account-only?
3. Pilot schools (1-3)?
4. Language reviewers secured?
5. Lesson + simulator owner?
