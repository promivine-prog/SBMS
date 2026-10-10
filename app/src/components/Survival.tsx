import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { isStale, survivalTriggers } from '../lib/plan';
import { cashOnHand } from '../lib/cash';
import { effectiveAvailable } from '../lib/plan';
import { spentByCategory } from '../lib/insights';
import { calcRunway } from '../lib/runway';
import { useGuest } from '../store/useGuestState';

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
}

/**
 * Calm low-balance recovery plan. Supportive language only — never shaming,
 * never advises skipping essentials. Plan ref: IMPLEMENTATION_PLAN.md §6.2
 */
export default function Survival() {
  const { t } = useTranslation();
  const { state, update } = useGuest();
  const t0 = today();

  const cash = cashOnHand(state.transactions.map((x) => ({ type: x.type, amount: x.amount, paymentMethod: x.paymentMethod })));
  const runway = calcRunway({
    available: effectiveAvailable(state.balance, cash, state.settings.includeCash),
    protectedEssentials: state.protectedEssentials,
    knownEssentialsDue: state.knownEssentialsDue,
    buffer: state.buffer,
    planningDays: state.planningDays,
  });
  const spent = spentByCategory(state.transactions.map((x) => ({ type: x.type, amount: x.amount, category: x.category, date: x.date })));
  const over: Record<string, number> = {};
  for (const [k, v] of Object.entries(spent)) over[k.toLowerCase()] = (over[k.toLowerCase()] ?? 0) + v;
  const overspent = state.budgets
    .filter((b) => (over[b.name.toLowerCase()] ?? 0) > b.limit)
    .map((b) => ({ name: b.name, over: Math.round(((over[b.name.toLowerCase()] ?? 0) - b.limit) * 100) / 100 }));
  const staleIncomes = state.incomeExpectations.filter((x) => isStale(x, t0)).map((x) => ({ source: x.source }));

  const triggers = survivalTriggers({
    shortfall: runway.shortfall,
    shortfallGap: -runway.flexible,
    overspent,
    staleIncomes,
  });
  if (triggers.length === 0) return null;

  const extend = (n: number) => update((s) => ({ ...s, planningDays: s.planningDays + n }));

  return (
    <section className="card survival">
      <h2>{t('survival.title')}</h2>
      <p>{t('survival.mayRunShort')}</p>
      <h3>{t('survival.whatChanged')}</h3>
      <ul>
        {triggers.map((g, i) => (
          <li key={i}>
            {g.kind === 'shortfall' && <>{t('survival.shortfallDetail')} (₦{g.amount.toLocaleString()})</>}
            {g.kind === 'overspend' && <>{g.detail}: ₦{g.amount.toLocaleString()} {t('survival.overspendDetail')}</>}
            {g.kind === 'stale-income' && <>{g.detail} {t('survival.staleDetail')}</>}
          </li>
        ))}
      </ul>
      <h3>{t('survival.options')}</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => extend(3)}>{t('survival.extend3')}</button>
        <button onClick={() => extend(7)}>{t('survival.extend7')}</button>
        <Link to="/plan">{t('survival.reviewPlan')}</Link>
        <Link to="/budget">{t('survival.reviewBudgets')}</Link>
        <Link to="/income">{t('survival.updateIncome')}</Link>
      </div>
    </section>
  );
}
