import { useTranslation } from 'react-i18next';
import { NavLink, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { GuestProvider } from './store/useGuestState';
import './i18n';
import Add from './pages/Add';
import Budget from './pages/Budget';
import Goals from './pages/Goals';
import Home from './pages/Home';
import Settings from './pages/Settings';

function Soon({ k }: { k: string }) {
  const { t } = useTranslation();
  return <h1>{t(k)}</h1>;
}

export default function App() {
  const { t } = useTranslation();
  return (
    <GuestProvider>
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
        <main style={{ padding: 16, maxWidth: 640, margin: '0 auto' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/add" element={<Add />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/learn" element={<Soon k="nav.learn" />} />
            <Route path="/simulator" element={<Soon k="nav.simulator" />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </Router>
    </GuestProvider>
  );
}
