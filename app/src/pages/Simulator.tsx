import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { findOutcome, SCENARIOS } from '../data/scenarios';
import { newId } from '../store/guest';
import { useGuest } from '../store/useGuestState';

export default function Simulator() {
  const { t } = useTranslation();
  const { state, update } = useGuest();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [spent, setSpent] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const scenario = SCENARIOS.find((s) => s.id === activeId) ?? null;
  const balance = scenario ? scenario.virtualBalance + spent : 0;

  function start(id: string) {
    setActiveId(id);
    setSpent(0);
    setPicked([]);
    setDone(false);
  }

  function choose(choiceId: string) {
    if (!scenario || done) return;
    const o = findOutcome(scenario.id, choiceId);
    const np = [...picked, choiceId];
    setPicked(np);
    setSpent((p) => p + o.delta);
    // End the run after one choice per scenario step; allow replay via Play again.
    setDone(true);
    update((s) => ({
      ...s,
      simSessions: [
        ...s.simSessions,
        { id: newId(), scenarioId: scenario.id, choices: np, finalBalance: scenario.virtualBalance + spent + o.delta, at: new Date().toISOString() },
      ],
    }));
  }

  if (!scenario) {
    return (
      <section>
        <h1>{t('sim.title')}</h1>
        <p><strong>{t('sim.hypothetical')}</strong></p>
        <ul>
          {SCENARIOS.map((s) => (
            <li key={s.id}>
              <button onClick={() => start(s.id)}>{s.title}</button>
            </li>
          ))}
        </ul>
        {state.simSessions.length > 0 && (
          <>
            <h2>{t('sim.history')}</h2>
            <ul>
              {[...state.simSessions].reverse().slice(0, 10).map((h) => (
                <li key={h.id}>{h.scenarioId} → ₦{h.finalBalance.toLocaleString()} ({h.at.slice(0, 10)})</li>
              ))}
            </ul>
          </>
        )}
      </section>
    );
  }

  const last = picked.length > 0 ? findOutcome(scenario.id, picked[picked.length - 1]) : null;

  return (
    <section>
      <button onClick={() => setActiveId(null)}>← {t('sim.title')}</button>
      <h1>{scenario.title}</h1>
      <p><strong>{t('sim.hypothetical')}</strong></p>
      <p>{scenario.story}</p>
      <p>{t('sim.virtualBalance')}: ₦{balance.toLocaleString()}</p>
      {!done ? (
        <>
          <h2>{t('sim.choose')}</h2>
          {scenario.choices.map((c) => (
            <div key={c.id} style={{ marginBottom: 8 }}>
              <button onClick={() => choose(c.id)}>{c.label}</button>
            </div>
          ))}
        </>
      ) : (
        last && (
          <div style={{ border: '1px solid #ccc', padding: 8 }}>
            <h2>{t('sim.result')}</h2>
            <p>{last.outcome}</p>
            <p><strong>{t('sim.risk')}:</strong> {last.risk}</p>
            <button onClick={() => start(scenario.id)}>{t('sim.playAgain')}</button>
          </div>
        )
      )}
    </section>
  );
}
