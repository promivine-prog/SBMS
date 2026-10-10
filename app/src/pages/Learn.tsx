import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LESSONS } from '../data/lessons';
import { scoreQuiz, upsertProgress } from '../lib/learn';
import { useGuest } from '../store/useGuestState';

export default function Learn() {
  const { t, i18n } = useTranslation();
  const { state, update } = useGuest();
  const [openId, setOpenId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [lastScore, setLastScore] = useState<{ score: number; total: number } | null>(null);

  const lesson = LESSONS.find((l) => l.id === openId) ?? null;
  const best = (id: string) => state.learning.find((p) => p.lessonId === id)?.quizScore;

  function submit() {
    if (!lesson) return;
    const given = lesson.quiz.map((_, i) => answers[i] ?? -1);
    const r = scoreQuiz(lesson.quiz, given);
    setLastScore(r);
    update((s) => ({ ...s, learning: upsertProgress(s.learning, lesson.id, r.score, new Date().toISOString()) }));
  }

  if (!lesson) {
    return (
      <section>
        <h1>{t('learn.title')}</h1>
        {i18n.language !== 'en' && <p><em>{t('learn.onlyEnglish')}</em></p>}
        <ul>
          {LESSONS.map((l) => (
            <li key={l.id}>
              <button onClick={() => { setOpenId(l.id); setAnswers({}); setLastScore(null); }}>{l.title}</button>
              {' '}({l.minutes} {t('learn.minutes')})
              {best(l.id) !== undefined && <> · {t('learn.yourScore')}: {best(l.id)}/{l.quiz.length}</>}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section>
      <button onClick={() => setOpenId(null)}>← {t('learn.backToLessons')}</button>
      <h1>{lesson.title}</h1>
      {lesson.body.map((p, i) => <p key={i}>{p}</p>)}
      <h2>{t('learn.startQuiz')}</h2>
      {lesson.quiz.map((q, qi) => (
        <fieldset key={qi}>
          <legend>{q.q}</legend>
          {q.options.map((o, oi) => (
            <label key={oi} style={{ display: 'block' }}>
              <input type="radio" name={`q${qi}`} checked={answers[qi] === oi} onChange={() => setAnswers((p) => ({ ...p, [qi]: oi }))} /> {o}
            </label>
          ))}
        </fieldset>
      ))}
      <button onClick={submit}>{t('learn.submit')}</button>
      {lastScore && <p>{t('learn.yourScore')}: {lastScore.score}/{lastScore.total}</p>}
    </section>
  );
}
