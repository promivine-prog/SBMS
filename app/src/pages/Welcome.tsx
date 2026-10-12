import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { seedDemo } from '../data/demo';
import { LANGS, setLang, type LangCode } from '../i18n';
import { daysBetween } from '../lib/plan';
import { roundKobo } from '../lib/runway';
import { newId, saveGuest } from '../store/guest';
import { useGuest } from '../store/useGuestState';
import Account from './Account';

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
}

type Mode = 'menu' | 'account' | 'setup';

/** First-run onboarding: promise → language → account first, then plan or demo. */
export default function Welcome() {
  const { t, i18n } = useTranslation();
  const { update } = useGuest();
  const [mode, setMode] = useState<Mode>('menu');
  const [balance, setBalance] = useState('');
  const [prot, setProt] = useState('');
  const [days, setDays] = useState('7');
  const [cashNow, setCashNow] = useState('');
  const [nextDate, setNextDate] = useState('');

  function startFresh() {
    const t0 = today();
    const cash = roundKobo(Number(cashNow) || 0);
    let d = Math.max(1, Math.floor(Number(days) || 7));
    const txns = cash > 0
      ? [{ id: newId(), type: 'income' as const, amount: cash, category: 'Income', date: t0, paymentMethod: 'cash' as const, source: 'Opening cash' }]
      : [];
    let expectations: { id: string; source: string; expectedDate?: string; status: 'expected'; regularity: 'one-off' }[] = [];
    if (nextDate && daysBetween(t0, nextDate) >= 1) {
      d = daysBetween(t0, nextDate);
      expectations = [{ id: newId(), source: 'Next income', expectedDate: nextDate, status: 'expected', regularity: 'one-off' }];
    }
    window.history.replaceState(null, '', '/');
    update((s) => ({
      ...s,
      balance: Number(balance) || 0,
      protectedEssentials: Number(prot) || 0,
      planningDays: d,
      transactions: txns,
      incomeExpectations: expectations,
      settings: { ...s.settings, onboarded: true, demoMode: false },
    }));
  }

  function exploreDemo() {
    const demo = seedDemo();
    saveGuest(demo);
    window.history.replaceState(null, '', '/');
    update(() => demo);
  }

  if (mode === 'account') {
    return (
      <main className="welcome">
        <Account onAuthed={() => setMode('setup')} />
        <p>
          <button className="linklike" onClick={() => setMode('setup')}>{t('welcome.skipForNow')}</button>
        </p>
      </main>
    );
  }

  if (mode === 'setup') {
    return (
      <main className="welcome">
        <h1>{t('plan.title')}</h1>
        <div style={{ display: 'grid', gap: 8 }}>
          <label>{t('plan.balance')}: <input type="number" min="0" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} /></label>
          <label>{t('plan.protected')}: <input type="number" min="0" step="0.01" value={prot} onChange={(e) => setProt(e.target.value)} /></label>
          <label>{t('plan.days')}: <input type="number" min="1" step="1" value={days} onChange={(e) => setDays(e.target.value)} /></label>
          <label>{t('welcome.cashNow')}: <input type="number" min="0" step="0.01" value={cashNow} onChange={(e) => setCashNow(e.target.value)} /></label>
          <label>{t('plan.byDate')} ({t('welcome.optional')}): <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} /></label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={startFresh}>{t('add.save')}</button>
            <button onClick={exploreDemo}>{t('home.exploreDemo')}</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="welcome">
      <h1>{t('appName')}</h1>
      <p>{t('tagline')}</p>
      <label>
        {t('settings.language')}:{' '}
        <select value={i18n.language} onChange={(e) => setLang(e.target.value as LangCode)}>
          {LANGS.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
      </label>
      <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
        <button onClick={() => setMode('account')}>{t('welcome.account')}</button>
        <button onClick={() => setMode('setup')}>{t('home.planMyMoney')}</button>
        <button onClick={exploreDemo}>{t('home.exploreDemo')}</button>
      </div>
      <p><small>{t('trackingOnly')}</small></p>
    </main>
  );
}
