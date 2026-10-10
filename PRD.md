# SBMS — Product Requirements Document (PRD)

**Product:** Smart Budgeting and Micro-Savings Software (SBMS)
**Version:** v0.3 (gap fixes 2026-10-10 — filters, due bills, savings warning, setup cash/date)
**Status:** Live — app on Vercel production + Supabase staging/prod, suites green
**Market:** Nigerian tertiary students (University, Polytechnic, College of Education)
**Currency:** NGN (₦)
**Form factor:** Mobile-first PWA, manual entry first
**Sources:** `SBMS_Winning_Product_Blueprint_Complete_With_Bank_Partnerships.docx`, `IMPLEMENTATION_PLAN.md`, `README.md`
**Rule:** You approve before execution. No build step runs without your `yes`.

> Promise: Know what you have. Plan what matters. Make your money last. Build your future one small step at a time.

## 1. Goals

1. Know what they have (balance + income/expense log, incl. physical cash)
2. Protect essentials and see flexible money (runway / daily guide)
3. Re-plan when income is delayed or expense hits (Survival Mode + Irregular Income Mode)
4. Track micro-savings goals (tracker only, no custody)
5. Learn via short lessons + virtual simulator (hypothetical only)
6. Use it in English, Yoruba, Nigerian Pidgin, Igbo, Hausa
7. Record physical cash with a separate "Cash on hand" balance + reconcile count (tracking only)

## 2. Non-Goals (MVP explicitly excludes)

- Bank integration / open banking / auto-sync
- Real-money custody, transfers, pooled group savings
- Real investments, live prices, trading
- Complex AI coach, wellness score, marketplace, rewards with liability
- Native iOS/Android apps (PWA only)

**Cash scope note:** physical cash is tracking only. SBMS does not hold, send, or receive real money. Users type amounts; the app records and plans around them.

## 3. Users

Primary: university / polytechnic / college-of-education students managing small, irregular money (allowances, part-time work, gifts, side business). Later: recent graduates, institutions, partners (post-MVP only).

## 4. Functional Requirements

### 4.1 Onboarding & accounts (Hybrid)
- Language select (en/yo/pcm/ig/ha), NGN default, starting balance, optional next-income date.
- Plan my money / Explore demo.
- Guest/Demo: local-only (`localStorage`), never writes to Supabase, Reset demo button. Account (optional): Supabase Auth, cloud sync. Merge rule: upload merges local records into the cloud copy by stable id (nothing server-side is deleted except scoped refreshes of opening contributions and the source-name list); download replaces local records only after an inline two-tap confirm (explicit, disclosed).

### 4.2 Income / expense log
- Manual add/edit/delete: amount (>0, kobo rounding), type (income|expense), category, date, note (optional), payment method (cash|bank|mobile|other), source (optional).
- History list with filters. Corrections allowed.

### 4.3 Manual Cash Income & Cash Balance (tracking only) — NEW
- **Add cash income:** fields amount, source (Parent, Allowance, Part-time work, Gift, Other), date, optional note. `payment_method='cash'`.
- **Custom sources:** user can save custom sources (e.g. "Mum", "Dad") for quick reuse; stored per user (`cash_sources`), seeds listed above. Cap: 5 seeds + max ~20 custom per user; names unique per user (case-insensitive — "mum" = "Mum"). At cap, block with "delete an unused source to add a new one."
- **Cash on hand:** derived separate balance: `cash_on_hand = SUM(cash income) − SUM(cash expenses)`. Shown as its own Home card. Stays OUT of runway `available` by default (avoids double-counting the manual balance); an opt-in toggle folds it in with the cash share labeled. Starts at zero; optional "cash in pocket now?" setup field posts an opening cash income.
- **Allocate on entry:** optional after logging cash income: split across budget categories (food, transport, savings, etc.). Savings legs create `contributions` toward savings goals. Total allocated must equal income amount (validate + kobo rounding); save is atomic (transaction + allocations + contributions together or not at all).
- **Log cash expenses:** same expense flow with payment type "Cash"; decreases cash on hand.
- **Reconcile ("Count my cash"):** user enters physical count; app shows `diff = counted − recorded`. Accept → posts `Unaccounted` expense (diff < 0) or correction income (diff > 0) + `cash_reconciliations` row. `Unaccounted` counts as spending under its own category and is flagged in insights (never hidden). Dismiss → posts nothing.
- **Speed/usability:** Home "Quick cash" widget (amount + category, today, cash — 2 taps plus typing); full form on Add. Passive in-app nudge only: when the cash reminder is ON and no cash is logged today, Home shows the generic "Record today's cash spending?" line. No push scheduling, no lock-screen amounts, no amounts in any notification text.
- Label everywhere: "tracking only, SBMS does not hold/move money."

### 4.4 Budgets
- Category limits (essential|flexible|uncertain), spent, remaining. Defaults: food, transport, data, school materials, accommodation, personal.

### 4.5 Runway / daily guide
- `flexible = available − protected_essentials − known_essentials_due − buffer`; if `≤ 0` show shortfall, no positive guide; else `daily_guide = flexible / planning_days`.
- Unknown next-income → user picks horizon, never invented. Show assumptions + period + "estimate, not a guarantee."

### 4.6 Survival Mode + Irregular Income
- Survival: trigger on new expense / lower balance / delayed income / overspend; show what changed + revised estimate + adjustable options. Supportive language only; never suggest skipping meals/meds/safe housing.
- Irregular: multiple sources (regular|variable|one-off); record actual, update dates without penalty; stale dates prompt, never shown as fresh. Expected income ≠ balance.

### 4.7 Micro-savings goals
- Target, deadline, manual + cash-leg contributions, progress, pause/reduce. `suggested = (target − saved) / weeks_or_months_left`. Warn on essentials conflict. "Tracking only."

### 4.8 Insights (rules only), lessons, simulator
- Insights: transparent rules ("Transport is 1,200 above limit you set this week [period]"). No AI in MVP.
- Lessons: 5–6 starters + quiz + progress (AI drafts, you approve).
- Simulator: scenario cards, virtual balance isolated from real balances, gain AND loss shown, HYPOTHETICAL label.

### 4.9 Languages, settings, privacy
- 5-language critical flows; glossary incl. cash on hand, reconcile/count my cash, unaccounted; fluent-speaker review for risk copy; switch preserves data.
- Settings: language switch, reminders (incl. cash nudge), export/delete, privacy notice. HTTPS, RLS per `user_id`, no secrets in client, never ask for bank/card PIN/passwords/OTP, fictional demo data.

## 5. Data Model (summary; detail in IMPLEMENTATION_PLAN.md §5)

- `profiles`, `transactions` (+`payment_method`, +`source`, allocations embedded as
  `allocations` jsonb — no separate `transaction_allocations` table by design, to keep
  allocate-on-entry saves atomic without orphan risk), `cash_sources`,
  `cash_reconciliations` (reserved for future audit sync; reconcile events are
  recorded today as `Unaccounted` transactions), `budgets`, `income_expectations`,
  `savings_goals`, `contributions`, `learning_progress`, `simulator_sessions`.

## 6. Acceptance (pre-pilot gate, cash items)

- Cash income/expense with `payment_method='cash'`; custom sources reusable.
- Cash on hand separate; allocate-on-entry sums to income; savings legs hit goals.
- Count my cash shows diff; accept posts Unaccounted correction; dismiss posts nothing.
- Full checklist in `IMPLEMENTATION_PLAN.md` §12.

## 7. Locked Decisions (2026-10-09, solo build)

1. React + Supabase, Vercel frontend, local-first then Supabase.
2. Hybrid accounts, guest local-only (keeps DB clean).
3. Pilot schools: you recruit, deferred.
4. Reviewers pending (yo/pcm/ig/ha).
5. Lessons + simulator: AI drafts, you approve.

## 8. Open Items (owner-side)

- Fluent reviewers (yo/pcm/ig/ha) sign-off before pilot.
- Pilot schools + Phase 0 interviews/survey/audit.
- Lesson + scenario wording approval.
- Phone + slow-network QA.
- (Done: Node toolchain, Supabase staging + prod, Vercel production.)
