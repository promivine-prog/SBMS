import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cashOnHand } from '../lib/cash';
import { effectiveAvailable } from '../lib/plan';
import { calcRunway } from '../lib/runway';
import { planningDaysFrom } from '../lib/plan';
import { useGuest } from '../store/useGuestState';

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
}

export default function Plan() {
  const { t } = useTranslation();
  const { state, update } = useGuest();
  const [balance, setBalance] = useState(String(state.balance));
  const [prot, setProt] = useState(String(state.protectedEssentials));
  const [due, setDue] = useState(String(state.knownEssentialsDue));
  const [buffer, setBuffer] = useState(String(state.buffer));
  const [mode, setMode] = useState<'days' | 'date'>('days');
  const [days, setDays] = useState(String(state.planningDays));
  const [date, setDate] = useState('');
  const [saved, setSaved] = useState(false);

  const t0 = today();
  const cash = cashOnHand(state.transactions.map((x) => ({ type: x.type, amount: x.amount, paymentMethod: x.paymentMethod })));
  const fromDate = mode === 'date' ? planningDaysFrom(date || undefined, t0) : null;
  const effDays = mode === 'date' ? fromDate : Number(days);
  let preview: string;
  try {
    const r = calcRunway({
      available: effectiveAvailable(Number(balance) || 0, cash, state.settings.includeCash),
      protectedEssentials: Number(prot) || 0,
      knownEssentialsDue: Number(due) || 0,
      buffer: Number(buffer) || 0,
      planningDays: effDays as number,
    });
    preview = r.shortfall
      ? `${t('home.flexible')}: ₦${r.flexible.toLocaleString()} — ${t('home.shortfall')}`
      : `${t('home.dailyGuide')}: ₦${(r.dailyGuide as number).toLocaleString()}`;
  } catch (e) {
    preview = (e as Error).message;
  }

  function save() {
    const d = mode === 'date' ? fromDate : Math.floor(Number(days));
    if (!d || d < 1) return;
    update((s) => ({
      ...s,
      balance: Number(balance) || 0,
      protectedEssentials: Number(prot) || 0,
      knownEssentialsDue: Number(due) || 0,
      buffer: Number(buffer) || 0,
      planningDays: d,
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <section>
      <h1>{t('plan.title')}</h1>
      <div style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
        <label>{t('plan.balance')}: <input type="number" min="0" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} /></label>
        <label>{t('plan.protected')}: <input type="number" min="0" step="0.01" value={prot} onChange={(e) => setProt(e.target.value)} /></label>
        <label>{t('plan.due')}: <input type="number" min="0" step="0.01" value={due} onChange={(e) => setDue(e.target.value)} /></label>
        <label>{t('plan.buffer')}: <input type="number" min="0" step="0.01" value={buffer} onChange={(e) => setBuffer(e.target.value)} /></label>
        <label><input type="checkbox" checked={state.settings.includeCash}
          onChange={(e) => update((s) => ({ ...s, settings: { ...s.settings, includeCash: e.target.checked } }))} /> {t('plan.includeCash')}</label>
        <label>{t('plan.mode')}: <select value={mode} onChange={(e) => setMode(e.target.value as 'days' | 'date')}>
          <option value="days">{t('plan.byDays')}</option>
          <option value="date">{t('plan.byDate')}</option>
        </select></label>
        {mode === 'days'
          ? <label>{t('plan.days')}: <input type="number" min="1" step="1" value={days} onChange={(e) => setDays(e.target.value)} /></label>
          : <label>{t('plan.byDate')}: <input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>}
        {mode === 'date' && fromDate === null && date !== '' && <p role="alert">{t('plan.needHorizon')}</p>}
        {mode === 'date' && fromDate !== null && <p>{t('plan.days')}: {fromDate}</p>}
        <button onClick={save} disabled={mode === 'date' && fromDate === null}>{t('add.save')}{saved ? ' ✓' : ''}</button>
      </div>
      <h2>{t('plan.assumptions')}</h2>
      <p>{preview}</p>
      <p><em>{t('estimateNote')}</em></p>
      <p>{t('plan.updatePrompt')}</p>
    </section>
  );
}
