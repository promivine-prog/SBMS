import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cashOnHand, reconcileDiff } from '../lib/cash';
import { budgetAlerts, spentByCategory, totalByType, weekStart } from '../lib/insights';
import { calcRunway } from '../lib/runway';
import { newId } from '../store/guest';
import { useGuest } from '../store/useGuestState';
import Survival from '../components/Survival';

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
}

function Reconcile({ recorded }: { recorded: number }) {
  const { t } = useTranslation();
  const { update } = useGuest();
  const [counted, setCounted] = useState('');
  const [open, setOpen] = useState(false);
  if (!open) return <button onClick={() => setOpen(true)}>{t('cash.countMyCash')}</button>;
  const n = Number(counted);
  const valid = counted !== '' && Number.isFinite(n) && n >= 0;
  const diff = valid ? reconcileDiff(recorded, n) : null;
  return (
    <div style={{ border: '1px solid #ccc', padding: 8, marginTop: 8 }}>
      <label>
        {t('cash.counted')}: <input type="number" min="0" step="0.01" value={counted} onChange={(e) => setCounted(e.target.value)} />
      </label>
      {diff !== null && diff !== 0 && <p>{t('cash.difference')}: ₦{diff.toLocaleString()}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          disabled={!valid || diff === null || diff === 0}
          onClick={() => {
            update((s) => ({
              ...s,
              transactions: [
                ...s.transactions,
                {
                  id: newId(),
                  type: (diff as number) < 0 ? 'expense' : 'income',
                  amount: Math.abs(diff as number),
                  category: 'Unaccounted',
                  date: today(),
                  note: 'Cash count adjustment',
                  paymentMethod: 'cash' as const,
                },
              ],
            }));
            setCounted('');
            setOpen(false);
          }}
        >
          {t('cash.accept')}
        </button>
        <button onClick={() => { setCounted(''); setOpen(false); }}>{t('cash.dismiss')}</button>
      </div>
    </div>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const { state } = useGuest();
  const cashTxns = state.transactions.map((x) => ({ type: x.type, amount: x.amount, paymentMethod: x.paymentMethod }));
  const cash = cashOnHand(cashTxns);
  const runway = calcRunway({
    available: state.balance,
    protectedEssentials: state.protectedEssentials,
    knownEssentialsDue: state.knownEssentialsDue,
    buffer: state.buffer,
    planningDays: state.planningDays,
  });
  const ws = weekStart();
  const mini = state.transactions.map((x) => ({ type: x.type, amount: x.amount, category: x.category, date: x.date }));
  const spent = spentByCategory(mini);
  const unaccountedWeek = Math.round(mini
    .filter((x) => x.type === 'expense' && x.category.toLowerCase() === 'unaccounted' && x.date >= ws)
    .reduce((a, x) => a + x.amount, 0) * 100) / 100;
  const alerts = budgetAlerts(state.budgets, spent).filter((a) => a.over);

  return (
    <section>
      <h1>{t('home.title')}</h1>
      <p>{t('trackingOnly')}</p>
      <ul>
        <li>{t('home.available')}: ₦{state.balance.toLocaleString()}</li>
        <li>{t('home.cashOnHand')}: ₦{cash.toLocaleString()}</li>
        <li>{t('home.protected')}: ₦{state.protectedEssentials.toLocaleString()}</li>
        <li>{t('home.flexible')}: ₦{runway.flexible.toLocaleString()}</li>
        <li>{t('home.period')}: {state.planningDays} days</li>
        <li>{t('home.dailyGuide')}: {runway.dailyGuide === null ? t('home.shortfall') : `₦${runway.dailyGuide.toLocaleString()}`}</li>
      </ul>
      <p><em>{t('estimateNote')}</em></p>

      <Survival />

      <h2>{t('cash.title')}</h2>
      <Reconcile recorded={cash} />

      <h2>{t('insights.title')}</h2>
      <ul>
        <li>{t('insights.inWeek')}: ₦{totalByType(mini, 'income', ws).toLocaleString()}</li>
        <li>{t('insights.outWeek')}: ₦{totalByType(mini, 'expense', ws).toLocaleString()}</li>
      </ul>
      {alerts.map((a) => (
        <p key={a.budgetId}>
          {a.name} is ₦{(a.spent - a.limit).toLocaleString()} {t('insights.alert')} ({t('budget.limit')}: ₦{a.limit.toLocaleString()}).
        </p>
      ))}
      {unaccountedWeek > 0 && (
        <p role="note">⚠ ₦{unaccountedWeek.toLocaleString()} {t('insights.unaccountedNote')}</p>
      )}
      {Object.keys(spent).length === 0 && <p>{t('add.noTxns')}</p>}
    </section>
  );
}
