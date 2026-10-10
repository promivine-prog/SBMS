import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { seedDemo } from '../data/demo';
import { LANGS, setLang, type LangCode } from '../i18n';
import { saveGuest } from '../store/guest';
import { useGuest } from '../store/useGuestState';

/** First-run onboarding: one-sentence promise → language → plan or demo. */
export default function Welcome() {
  const { t, i18n } = useTranslation();
  const { update } = useGuest();
  const [setup, setSetup] = useState(false);
  const [balance, setBalance] = useState('');
  const [prot, setProt] = useState('');
  const [days, setDays] = useState('7');

  function startFresh() {
    const d = Math.max(1, Math.floor(Number(days) || 7));
    window.history.replaceState(null, '', '/');
    update((s) => ({
      ...s,
      balance: Number(balance) || 0,
      protectedEssentials: Number(prot) || 0,
      planningDays: d,
      settings: { ...s.settings, onboarded: true, demoMode: false },
    }));
  }

  function exploreDemo() {
    const demo = seedDemo();
    saveGuest(demo);
    window.history.replaceState(null, '', '/');
    update(() => demo);
  }

  if (!setup) {
    return (
      <main style={{ padding: 24, maxWidth: 520, margin: '0 auto' }}>
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
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={() => setSetup(true)}>{t('home.planMyMoney')}</button>
          <button onClick={exploreDemo}>{t('home.exploreDemo')}</button>
        </div>
        <p><small>{t('trackingOnly')}</small></p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 520, margin: '0 auto' }}>
      <h1>{t('plan.title')}</h1>
      <div style={{ display: 'grid', gap: 8 }}>
        <label>{t('plan.balance')}: <input type="number" min="0" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} /></label>
        <label>{t('plan.protected')}: <input type="number" min="0" step="0.01" value={prot} onChange={(e) => setProt(e.target.value)} /></label>
        <label>{t('plan.days')}: <input type="number" min="1" step="1" value={days} onChange={(e) => setDays(e.target.value)} /></label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={startFresh}>{t('add.save')}</button>
          <button onClick={exploreDemo}>{t('home.exploreDemo')}</button>
        </div>
      </div>
    </main>
  );
}
