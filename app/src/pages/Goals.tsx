import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { essentialsConflict } from '../lib/plan';
import { roundKobo } from '../lib/runway';
import { newId } from '../store/guest';
import { useGuest } from '../store/useGuestState';

function weeksLeft(deadline?: string): number | null {
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - Date.now();
  return Math.max(1, Math.ceil(ms / (7 * 24 * 3600 * 1000)));
}

export default function Goals() {
  const { t } = useTranslation();
  const { state, update } = useGuest();
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  function add() {
    const tg = Number(target);
    if (!title.trim() || !Number.isFinite(tg) || tg <= 0) return;
    update((s) => ({
      ...s,
      goals: [...s.goals, { id: newId(), title: title.trim(), target: roundKobo(tg), deadline: deadline || undefined, status: 'active' as const, saved: 0 }],
    }));
    setTitle('');
    setTarget('');
    setDeadline('');
  }

  function contribute(id: string) {
    const a = roundKobo(Number(amounts[id] ?? 0));
    if (!Number.isFinite(a) || a <= 0) return;
    update((s) => ({
      ...s,
      goals: s.goals.map((g) => {
        if (g.id !== id) return g;
        const saved = roundKobo(g.saved + a);
        return { ...g, saved, status: saved >= g.target ? 'done' as const : g.status };
      }),
    }));
    setAmounts((p) => ({ ...p, [id]: '' }));
  }

  return (
    <section>
      <h1>{t('goals.title')}</h1>
      <p>{t('trackingOnly')}</p>
      {essentialsConflict(state.balance, state.protectedEssentials, state.buffer) && (
        <p role="alert">{t('goals.essentialsWarn')}</p>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <label>{t('goals.name')}: <input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label>{t('goals.target')}: <input type="number" min="0" step="0.01" value={target} onChange={(e) => setTarget(e.target.value)} /></label>
        <label>{t('goals.deadline')}: <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></label>
        <button onClick={add}>{t('goals.new')}</button>
      </div>
      <ul>
        {state.goals.map((g) => {
          const wl = weeksLeft(g.deadline);
          const suggested = wl === null ? null : roundKobo(Math.max(0, (g.target - g.saved) / wl));
          const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
          return (
            <li key={g.id}>
              <strong>{g.title}</strong> [{t(`goals.${g.status}`)}] — ₦{g.saved.toLocaleString()} / ₦{g.target.toLocaleString()} ({pct}%)
              {suggested !== null && <> · {t('goals.suggested')}: ₦{suggested.toLocaleString()}</>}
              {g.status === 'active' && (
                <>
                  {' '}<input type="number" min="0" step="0.01" style={{ width: 110 }} placeholder={t('goals.amount')}
                    value={amounts[g.id] ?? ''} onChange={(e) => setAmounts((p) => ({ ...p, [g.id]: e.target.value }))} />
                  {' '}<button onClick={() => contribute(g.id)}>{t('goals.contribute')}</button>
                  {' '}<button onClick={() => update((s) => ({ ...s, goals: s.goals.map((x) => (x.id === g.id ? { ...x, status: 'paused' as const } : x)) }))}>{t('goals.pause')}</button>
                </>
              )}
              {g.status === 'paused' && (
                <button onClick={() => update((s) => ({ ...s, goals: s.goals.map((x) => (x.id === g.id ? { ...x, status: 'active' as const } : x)) }))}>{t('goals.resume')}</button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
