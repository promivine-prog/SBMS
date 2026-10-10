import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { addCustomSource, validateAllocation } from '../lib/cash';
import { essentialsConflict } from '../lib/plan';
import { roundKobo } from '../lib/runway';
import { DEFAULT_CATEGORIES, newId, type Allocation, type PaymentMethod, type Transaction, type TxnType } from '../store/guest';
import { useGuest } from '../store/useGuestState';

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
}

interface SplitRow {
  target: string; // budget:<id> | goal:<id>
  amount: string;
}

const empty = { amount: '', type: 'expense' as TxnType, category: 'food', date: today(), note: '', paymentMethod: 'cash' as PaymentMethod, source: '' };

export default function Add() {
  const { t } = useTranslation();
  const { state, update } = useGuest();
  const [f, setF] = useState(empty);
  const [newSource, setNewSource] = useState('');
  const [splits, setSplits] = useState<SplitRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [fType, setFType] = useState('all');
  const [fMethod, setFMethod] = useState('all');
  const [fText, setFText] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const showAllocate = f.type === 'income' && f.paymentMethod === 'cash';
  const hasSavingsLeg = splits.some((s) => s.target.startsWith('goal:'));
  const warnEssentials = (showAllocate && hasSavingsLeg) &&
    essentialsConflict(state.balance, state.protectedEssentials, state.buffer);
  const targets = [
    ...state.budgets.map((b) => ({ key: `budget:${b.id}`, label: `${b.name} (budget)` })),
    ...state.goals.filter((g) => g.status === 'active').map((g) => ({ key: `goal:${g.id}`, label: `${g.title} (goal)` })),
  ];

  function revertGoalLegs(tx: Transaction, bump: (id: string, delta: number) => void) {
    for (const a of tx.allocations ?? []) if (a.goalId) bump(a.goalId, -a.amount);
  }

  function save() {
    setErr('');
    const amount = roundKobo(Number(f.amount));
    if (!Number.isFinite(amount) || amount <= 0) return setErr(t('errors.invalidAmount'));
    let sources = state.customSources;
    const srcName = newSource.trim() || f.source || undefined;
    if (newSource.trim()) {
      try {
        sources = addCustomSource(state.customSources, newSource);
      } catch (e) {
        return setErr((e as Error).message);
      }
    }
    let allocations: Allocation[] | undefined;
    if (showAllocate && splits.length > 0) {
      const legs = splits.map((s) => Number(s.amount) || 0);
      const check = validateAllocation(amount, legs);
      if (!check.ok) return setErr(check.error ?? t('errors.allocationMismatch'));
      allocations = splits.map((s) => {
        const [kind, id] = s.target.split(':');
        const label = targets.find((x) => x.key === s.target)?.label ?? s.target;
        return {
          budgetId: kind === 'budget' ? id : undefined,
          goalId: kind === 'goal' ? id : undefined,
          label,
          amount: roundKobo(Number(s.amount)),
        };
      });
    }
    const tx: Transaction = {
      id: editingId ?? newId(),
      type: f.type,
      amount,
      category: f.category.trim() || 'personal',
      date: f.date || today(),
      note: f.note.trim() || undefined,
      paymentMethod: f.paymentMethod,
      source: srcName,
      allocations,
    };
    update((s) => {
      const goals = s.goals.map((g) => ({ ...g }));
      const bump = (id: string, delta: number) => {
        const g = goals.find((x) => x.id === id);
        if (g) g.saved = roundKobo(Math.max(0, g.saved + delta));
      };
      let txns = s.transactions;
      if (editingId) {
        const old = s.transactions.find((x) => x.id === editingId);
        if (old) revertGoalLegs(old, bump);
        txns = s.transactions.map((x) => (x.id === editingId ? tx : x));
      } else {
        txns = [...s.transactions, tx];
      }
      for (const a of allocations ?? []) if (a.goalId) bump(a.goalId, a.amount);
      return { ...s, transactions: txns, goals, customSources: sources };
    });
    setF({ ...empty, date: today() });
    setNewSource('');
    setSplits([]);
    setEditingId(null);
  }

  function remove(id: string) {
    update((s) => {
      const old = s.transactions.find((x) => x.id === id);
      const goals = s.goals.map((g) => ({ ...g }));
      if (old) for (const a of old.allocations ?? []) {
        if (!a.goalId) continue;
        const g = goals.find((x) => x.id === a.goalId);
        if (g) g.saved = roundKobo(Math.max(0, g.saved - a.amount));
      }
      return { ...s, transactions: s.transactions.filter((x) => x.id !== id), goals };
    });
    if (editingId === id) { setEditingId(null); setF({ ...empty, date: today() }); setSplits([]); }
  }

  function edit(tx: Transaction) {
    setEditingId(tx.id);
    setF({ amount: String(tx.amount), type: tx.type, category: tx.category, date: tx.date, note: tx.note ?? '', paymentMethod: tx.paymentMethod, source: tx.source ?? '' });
    setSplits((tx.allocations ?? []).map((a) => ({
      target: a.goalId ? `goal:${a.goalId}` : `budget:${a.budgetId ?? ''}`,
      amount: String(a.amount),
    })));
    setNewSource('');
    setErr('');
    window.scrollTo(0, 0);
  }

  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  return (
    <section>
      <h1>{t('add.title')}</h1>
      {err && <p role="alert">{err}</p>}
      <div style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
        <label>{t('add.amount')}: <input type="number" min="0" step="0.01" value={f.amount} onChange={(e) => set('amount', e.target.value)} /></label>
        <label>{t('add.type')}: <select value={f.type} onChange={(e) => set('type', e.target.value)}>
          <option value="expense">{t('add.expense')}</option>
          <option value="income">{t('add.income')}</option>
        </select></label>
        <label>{t('add.category')}: <input list="sbms-cats" value={f.category} onChange={(e) => set('category', e.target.value)} />
          <datalist id="sbms-cats">{DEFAULT_CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist></label>
        <label>{t('add.date')}: <input type="date" value={f.date} onChange={(e) => set('date', e.target.value)} /></label>
        <label>{t('add.paymentMethod')}: <select value={f.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value)}>
          {(['cash', 'bank', 'mobile', 'other'] as const).map((m) => <option key={m} value={m}>{t(`add.${m}`)}</option>)}
        </select></label>
        <label>{t('add.source')}: <input list="sbms-src" value={f.source} onChange={(e) => set('source', e.target.value)} placeholder="Parent" />
          <datalist id="sbms-src">{state.customSources.map((s) => <option key={s} value={s} />)}</datalist></label>
        <label>{t('add.newSource')}: <input value={newSource} onChange={(e) => setNewSource(e.target.value)} placeholder="Mum" /></label>
        <label>{t('add.note')}: <input value={f.note} onChange={(e) => set('note', e.target.value)} /></label>

        {showAllocate && (
          <fieldset>
            <legend>{t('add.allocateTitle')}</legend>
            <p><small>{t('add.allocateHint')}</small></p>
            {targets.length === 0 && <p><small>No budgets or active goals yet — create them first.</small></p>}
            {splits.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 4 }}>
                <select value={s.target} onChange={(e) => setSplits((p) => p.map((r, j) => (j === i ? { ...r, target: e.target.value } : r)))}>
                  {targets.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
                </select>
                <input type="number" min="0" step="0.01" style={{ width: 110 }} value={s.amount}
                  onChange={(e) => setSplits((p) => p.map((r, j) => (j === i ? { ...r, amount: e.target.value } : r)))} />
                <button className="small" onClick={() => setSplits((p) => p.filter((_, j) => j !== i))}>×</button>
              </div>
            ))}
            {targets.length > 0 && <button className="small" onClick={() => setSplits((p) => [...p, { target: targets[0].key, amount: '' }])}>{t('add.addSplit')}</button>}
            {warnEssentials && <p role="alert"><small>{t('goals.essentialsWarn')}</small></p>}
          </fieldset>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={save}>{editingId ? t('add.update') : t('add.save')}</button>
          {editingId && <button onClick={() => { setEditingId(null); setF({ ...empty, date: today() }); setSplits([]); setErr(''); }}>{t('add.cancel')}</button>}
        </div>
      </div>

      <h2>
        <button onClick={() => setShowHistory((v) => !v)} aria-expanded={showHistory}>
          {t('add.history')} ({state.transactions.length})
        </button>
      </h2>
      {showHistory && (
      <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <label>{t('add.type')}: <select value={fType} onChange={(e) => setFType(e.target.value)}>
          <option value="all">{t('add.all')}</option>
          <option value="expense">{t('add.expense')}</option>
          <option value="income">{t('add.income')}</option>
        </select></label>
        <label>{t('add.paymentMethod')}: <select value={fMethod} onChange={(e) => setFMethod(e.target.value)}>
          <option value="all">{t('add.all')}</option>
          {(['cash', 'bank', 'mobile', 'other'] as const).map((m) => <option key={m} value={m}>{t(`add.${m}`)}</option>)}
        </select></label>
        <label>{t('add.search')}: <input value={fText} onChange={(e) => setFText(e.target.value)} placeholder={t('add.searchHint')} /></label>
      </div>
      {state.transactions.length === 0 && <p>{t('add.noTxns')}</p>}
      <ul>
        {[...state.transactions]
          .filter((x) => fType === 'all' || x.type === fType)
          .filter((x) => fMethod === 'all' || x.paymentMethod === fMethod)
          .filter((x) => {
            const q = fText.trim().toLowerCase();
            if (!q) return true;
            return [x.category, x.source ?? '', x.note ?? ''].some((s) => s.toLowerCase().includes(q));
          })
          .reverse().map((x) => (
          <li key={x.id}>
            {x.date} · {x.type} · ₦{x.amount.toLocaleString()} · {x.category} · {x.paymentMethod}{x.source ? ` · ${x.source}` : ''}{x.note ? ` · ${x.note}` : ''}
            {x.allocations && x.allocations.length > 0 && <> · [{x.allocations.map((a) => `${a.label}: ₦${a.amount.toLocaleString()}`).join('; ')}]</>}
            {' '}<button onClick={() => edit(x)}>{t('add.edit')}</button>{' '}
            <button onClick={() => remove(x.id)}>{t('add.delete')}</button>
          </li>
        ))}
      </ul>
      </>
      )}
    </section>
  );
}
