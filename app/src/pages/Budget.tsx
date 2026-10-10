import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { spentByCategory } from '../lib/insights';
import { roundKobo } from '../lib/runway';
import { newId, type Budget } from '../store/guest';
import { useGuest } from '../store/useGuestState';

export default function Budget() {
  const { t } = useTranslation();
  const { state, update } = useGuest();
  const [name, setName] = useState('food');
  const [kind, setKind] = useState<Budget['kind']>('essential');
  const [limit, setLimit] = useState('');

  const spent = spentByCategory(state.transactions.map((x) => ({ type: x.type, amount: x.amount, category: x.category, date: x.date })));
  const spentFor = (n: string) => {
    const key = n.toLowerCase();
    return roundKobo(Object.entries(spent).reduce((a, [k, v]) => (k.toLowerCase() === key ? a + v : a), 0));
  };

  function add() {
    const lim = Number(limit);
    if (!name.trim() || !Number.isFinite(lim) || lim <= 0) return;
    update((s) => ({ ...s, budgets: [...s.budgets, { id: newId(), name: name.trim(), kind, limit: lim }] }));
    setName('food');
    setLimit('');
  }

  // Most recently added first.
  const ordered = [...state.budgets].reverse();

  return (
    <section>
      <h1>{t('budget.title')}</h1>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'end' }}>
        <label>{t('budget.name')}: <input value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label>{t('budget.kind')}: <select value={kind} onChange={(e) => setKind(e.target.value as Budget['kind'])}>
          <option value="essential">{t('budget.essential')}</option>
          <option value="flexible">{t('budget.flexible')}</option>
          <option value="uncertain">{t('budget.uncertain')}</option>
        </select></label>
        <label>{t('budget.limit')}: <input type="number" min="0" step="0.01" value={limit} onChange={(e) => setLimit(e.target.value)} /></label>
        <button className="small" onClick={add}>{t('budget.add')}</button>
      </div>
      {ordered.length === 0 && <p>{t('budget.none')}</p>}
      {ordered.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table className="grid">
            <thead>
              <tr>
                <th scope="col">{t('budget.name')}</th>
                <th scope="col">{t('budget.kind')}</th>
                <th scope="col" className="num">{t('budget.limit')} (₦)</th>
                <th scope="col" className="num">{t('budget.spent')} (₦)</th>
                <th scope="col" className="num">{t('budget.remaining')} (₦)</th>
                <th scope="col"><span className="vh">{t('add.delete')}</span></th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((b) => {
                const s = spentFor(b.name);
                const over = s > b.limit;
                return (
                  <tr key={b.id} className={over ? 'over' : undefined}>
                    <td><strong>{b.name}</strong></td>
                    <td>{t(`budget.${b.kind}`)}</td>
                    <td className="num">{b.limit.toLocaleString()}</td>
                    <td className="num">{s.toLocaleString()}</td>
                    <td className="num">{(roundKobo(b.limit - s)).toLocaleString()}</td>
                    <td className="num">
                      {over && <span role="note">⚠ {(roundKobo(s - b.limit)).toLocaleString()} {t('budget.overBy')}</span>}{' '}
                      <button className="small" onClick={() => update((p) => ({ ...p, budgets: p.budgets.filter((x) => x.id !== b.id) }))}>{t('add.delete')}</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
