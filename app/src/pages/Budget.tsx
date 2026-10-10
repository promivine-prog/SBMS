import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { spentByCategory } from '../lib/insights';
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
    return Object.entries(spent).reduce((a, [k, v]) => (k.toLowerCase() === key ? a + v : a), 0);
  };

  function add() {
    const lim = Number(limit);
    if (!name.trim() || !Number.isFinite(lim) || lim <= 0) return;
    update((s) => ({ ...s, budgets: [...s.budgets, { id: newId(), name: name.trim(), kind, limit: lim }] }));
    setName('food');
    setLimit('');
  }

  return (
    <section>
      <h1>{t('budget.title')}</h1>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <label>{t('budget.name')}: <input value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label>{t('budget.kind')}: <select value={kind} onChange={(e) => setKind(e.target.value as Budget['kind'])}>
          <option value="essential">{t('budget.essential')}</option>
          <option value="flexible">{t('budget.flexible')}</option>
          <option value="uncertain">{t('budget.uncertain')}</option>
        </select></label>
        <label>{t('budget.limit')}: <input type="number" min="0" step="0.01" value={limit} onChange={(e) => setLimit(e.target.value)} /></label>
        <button onClick={add}>{t('budget.add')}</button>
      </div>
      <ul>
        {state.budgets.map((b) => {
          const s = spentFor(b.name);
          return (
            <li key={b.id}>
              {b.name} ({t(`budget.${b.kind}`)}) — {t('budget.limit')}: ₦{b.limit.toLocaleString()} · {t('budget.spent')}: ₦{s.toLocaleString()} · {t('budget.remaining')}: ₦{(b.limit - s).toLocaleString()}
              {s > b.limit && <> · ⚠ ₦{(s - b.limit).toLocaleString()} {t('budget.overBy')}</>}
              {' '}<button onClick={() => update((p) => ({ ...p, budgets: p.budgets.filter((x) => x.id !== b.id) }))}>{t('add.delete')}</button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
