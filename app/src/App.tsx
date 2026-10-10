import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { cashOnHand } from './lib/cash';
import { calcRunway } from './lib/runway';
import { loadGuest } from './store/guest';
import { LANGS, setLang, type LangCode } from './i18n';

function useGuest() {
  const [state] = useState(loadGuest);
  return state;
}

function Home() {
  const { t } = useTranslation();
  const g = useGuest();
  const cash = cashOnHand(g.transactions.map((x) => ({ type: x.type, amount: x.amount, paymentMethod: x.paymentMethod })));
  const runway = calcRunway({
    available: g.balance,
    protectedEssentials: g.protectedEssentials,
    knownEssentialsDue: 0,
    buffer: g.buffer,
    planningDays: g.planningDays,
  });
  return (
    <section>
      <h1>{t('home.title')}</h1>
      <p>{t('trackingOnly')}</p>
      <ul>
        <li>{t('home.available')}: ₦{g.balance.toLocaleString()}</li>
        <li>{t('home.cashOnHand')}: ₦{cash.toLocaleString()}</li>
        <li>{t('home.protected')}: ₦{g.protectedEssentials.toLocaleString()}</li>
        <li>{t('home.flexible')}: ₦{runway.flexible.toLocaleString()}</li>
        <li>{t('home.period')}: {g.planningDays} days</li>
        <li>
          {t('home.dailyGuide')}: {runway.dailyGuide === null ? t('home.shortfall') : `₦${runway.dailyGuide.toLocaleString()}`}
        </li>
      </ul>
      <p><em>{t('estimateNote')}</em></p>
    </section>
  );
}

function Placeholder({ k }: { k: string }) {
  const { t } = useTranslation();
  return <h1>{t(k)}</h1>;
}

function Settings() {
  const { t, i18n } = useTranslation();
  return (
    <section>
      <h1>{t('settings.title')}</h1>
      <label>
        {t('settings.language')}:{' '}
        <select value={i18n.language} onChange={(e) => setLang(e.target.value as LangCode)}>
          {LANGS.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
      </label>
    </section>
  );
}

export default function App() {
  const { t } = useTranslation();
  return (
    <Router>
      <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: 12 }}>
        <NavLink to="/">{t('nav.home')}</NavLink>
        <NavLink to="/add">{t('nav.add')}</NavLink>
        <NavLink to="/budget">{t('nav.budget')}</NavLink>
        <NavLink to="/goals">{t('nav.goals')}</NavLink>
        <NavLink to="/learn">{t('nav.learn')}</NavLink>
        <NavLink to="/simulator">{t('nav.simulator')}</NavLink>
        <NavLink to="/settings">{t('nav.settings')}</NavLink>
      </nav>
      <main style={{ padding: 16, maxWidth: 560, margin: '0 auto' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add" element={<Placeholder k="add.title" />} />
          <Route path="/budget" element={<Placeholder k="nav.budget" />} />
          <Route path="/goals" element={<Placeholder k="goals.title" />} />
          <Route path="/learn" element={<Placeholder k="nav.learn" />} />
          <Route path="/simulator" element={<Placeholder k="nav.simulator" />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </Router>
  );
}
