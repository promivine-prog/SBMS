import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cashOnHand, reconcileDiff } from '../lib/cash';
import { budgetAlerts, spentByCategory, totalByType, weekStart } from '../lib/insights';
import { effectiveAvailable } from '../lib/plan';
import { calcRunway, roundKobo } from '../lib/runway';
import { DEFAULT_CATEGORIES, newId } from '../store/guest';
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
    <div className="card">
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

/** Two-tap cash expense: amount + category, today, cash. Full form lives on Add. */
function QuickCash() {
  const { t } = useTranslation();
  const { update } = useGuest();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [err, setErr] = useState('');
  function save() {
    const a = roundKobo(Number(amount));
    if (!Number.isFinite(a) || a <= 0) {
      setErr(t('errors.invalidAmount'));
      return;
    }
    update((s) => ({
      ...s,
      transactions: [
        ...s.transactions,
        { id: newId(), type: 'expense' as const, amount: a, category: category.trim() || 'personal', date: today(), paymentMethod: 'cash' as const },
      ],
    }));
    setAmount('');
    setErr('');
  }
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
      <label>{t('add.amount')}: <input type="number" min="0" step="0.01" style={{ width: 120 }} value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
      <label>{t('add.category')}: <input list="sbms-quickcats" style={{ width: 130 }} value={category} onChange={(e) => setCategory(e.target.value)} />
        <datalist id="sbms-quickcats">{DEFAULT_CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist></label>
      <button className="small" onClick={save}>{t('cash.quickSave')}</button>
      {err && <span role="alert">{err}</span>}
    </div>
  );
}

/** Passive evening nudge: generic text, only when enabled and nothing logged today. */
function CashNudge({ hasCashToday }: { hasCashToday: boolean }) {
  const { t } = useTranslation();
  const { state } = useGuest();
  if (!state.settings.cashReminder || hasCashToday) return null;
  return <p role="note">{t('cash.reminderNudge')}</p>;
}

export default function Home() {
  const { t } = useTranslation();
  const { state } = useGuest();
  const cashTxns = state.transactions.map((x) => ({ type: x.type, amount: x.amount, paymentMethod: x.paymentMethod }));
  const cash = cashOnHand(cashTxns);
  const avail = effectiveAvailable(state.balance, cash, state.settings.includeCash);
  const runway = calcRunway({
    available: avail,
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
      <div className="card hero">
      <h1>{t('home.title')}</h1>
      <p>{t('trackingOnly')}</p>
      <ul>
        <li>{t('home.available')}: <span>₦{state.balance.toLocaleString()}{state.settings.includeCash && cash > 0 && <> ({t('home.inclCash')}: ₦{cash.toLocaleString()})</>}</span></li>
        <li>{t('home.cashOnHand')}: <span>₦{cash.toLocaleString()}</span></li>
        <li>{t('home.protected')}: <span>₦{state.protectedEssentials.toLocaleString()}</span></li>
        <li>{t('home.flexible')}: <span>₦{runway.flexible.toLocaleString()}</span></li>
        <li>{t('home.period')}: <span>{state.planningDays} days</span></li>
        <li>{t('home.dailyGuide')}: <span>{runway.dailyGuide === null ? t('home.shortfall') : `₦${runway.dailyGuide.toLocaleString()}`}</span></li>
      </ul>
      <p><em>{t('estimateNote')}</em></p>
      </div>

      <Survival />

      <h2>{t('cash.title')}</h2>
      <QuickCash />
      <CashNudge hasCashToday={state.transactions.some((x) => x.paymentMethod === 'cash' && x.date === today())} />
      <Reconcile recorded={cash} />

      <h2>{t('insights.title')}</h2>
      <ul>
        <li>{t('insights.inWeek')}: ₦{totalByType(mini, 'income', ws).toLocaleString()}</li>
        <li>{t('insights.outWeek')}: ₦{totalByType(mini, 'expense', ws).toLocaleString()}</li>
      </ul>
      {alerts.map((a) => (
        <p key={a.budgetId}>
          {a.name} is ₦{(a.spent - a.limit).toLocaleString()} {t('insights.alert')} ({t('budget.limit')}: {a.limit.toLocaleString()}).
        </p>
      ))}
      {unaccountedWeek > 0 && (
        <p role="note">⚠ ₦{unaccountedWeek.toLocaleString()} {t('insights.unaccountedNote')}</p>
      )}
      {Object.keys(spent).length === 0 && <p>{t('add.noTxns')}</p>}
    </section>
  );
}
