import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineBadge from './components/OfflineBadge';
import { getSupabase } from './lib/supabase';
import { GuestProvider, useGuest } from './store/useGuestState';
import './i18n';
import Account from './pages/Account';
import Add from './pages/Add';
import Budget from './pages/Budget';
import Goals from './pages/Goals';
import Home from './pages/Home';
import Income from './pages/Income';
import Learn from './pages/Learn';
import Plan from './pages/Plan';
import Settings from './pages/Settings';
import Simulator from './pages/Simulator';
import Welcome from './pages/Welcome';

function Shell() {
  const { t } = useTranslation();
  const { state } = useGuest();
  useEffect(() => {
    // Confirm-link landings carry ?code=: creating the client exchanges it.
    if (window.location.search.includes('code=')) getSupabase();
  }, []);
  if (!state.settings.onboarded) return <Welcome />;
  return (
    <Router>
      <nav className="tabbar">
        <NavLink to="/">{t('nav.home')}</NavLink>
        <NavLink to="/plan">{t('nav.plan')}</NavLink>
        <NavLink to="/add">{t('nav.add')}</NavLink>
        <NavLink to="/income">{t('nav.income')}</NavLink>
        <NavLink to="/budget">{t('nav.budget')}</NavLink>
        <NavLink to="/goals">{t('nav.goals')}</NavLink>
        <NavLink to="/learn">{t('nav.learn')}</NavLink>
        <NavLink to="/simulator">{t('nav.simulator')}</NavLink>
        <NavLink to="/settings">{t('nav.settings')}</NavLink>
        <NavLink to="/account">{t('nav.account')}</NavLink>
        <OfflineBadge />
      </nav>
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/add" element={<Add />} />
          <Route path="/income" element={<Income />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/account" element={<Account />} />
        </Routes>
      </main>
    </Router>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <GuestProvider>
        <Shell />
      </GuestProvider>
    </ErrorBoundary>
  );
}
