import { describe, expect, it } from 'vitest';
import { findOutcome, SCENARIOS } from '../data/scenarios';
import { scoreQuiz, upsertProgress } from './learn';

describe('scoreQuiz', () => {
  const quiz = [{ answer: 0 }, { answer: 1 }, { answer: 2 }];
  it('counts correct answers by position', () => {
    expect(scoreQuiz(quiz, [0, 1, 2])).toEqual({ score: 3, total: 3 });
    expect(scoreQuiz(quiz, [0, 0, 0])).toEqual({ score: 1, total: 3 });
  });
  it('missing answers count as wrong', () => {
    expect(scoreQuiz(quiz, [0])).toEqual({ score: 1, total: 3 });
  });
});

describe('upsertProgress', () => {
  it('adds first attempt and keeps the best score', () => {
    const p1 = upsertProgress([], 'budgeting-basics', 2, '2026-10-10T09:00:00Z');
    expect(p1).toHaveLength(1);
    const p2 = upsertProgress(p1, 'budgeting-basics', 1, '2026-10-11T09:00:00Z');
    expect(p2[0].quizScore).toBe(2);
    const p3 = upsertProgress(p2, 'budgeting-basics', 3, '2026-10-12T09:00:00Z');
    expect(p3[0].quizScore).toBe(3);
  });
});

describe('findOutcome', () => {
  it('resolves gain and loss outcomes', () => {
    expect(findOutcome('allowance-delayed', 'borrow').delta).toBe(3000);
    expect(findOutcome('fiction-invest', 'all-in').delta).toBe(-2000);
  });
  it('every scenario shows both a non-negative and a loss path', () => {
    for (const s of SCENARIOS) {
      const deltas = s.choices.map((c) => c.delta);
      expect(deltas.some((d) => d >= 0)).toBe(true);
      expect(deltas.some((d) => d < 0)).toBe(true);
    }
  });
  it('throws on unknown ids', () => {
    expect(() => findOutcome('nope', 'x')).toThrow();
  });
});
