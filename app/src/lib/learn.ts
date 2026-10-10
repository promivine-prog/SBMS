// Pure learning helpers: quiz scoring + best-score progress. Plan ref: Phase 4.
export interface QuizAnswer {
  answer: number;
}

/** Score = correct count. Order must match the quiz questions. */
export function scoreQuiz(quiz: QuizAnswer[], given: number[]): { score: number; total: number } {
  let score = 0;
  quiz.forEach((q, i) => {
    if (given[i] === q.answer) score += 1;
  });
  return { score, total: quiz.length };
}

export interface LessonProgress {
  lessonId: string;
  quizScore: number;
  at: string; // ISO timestamp
}

/** Keep the best score per lesson (learning gain = pre/post diff measured by caller). */
export function upsertProgress(prev: LessonProgress[], lessonId: string, quizScore: number, at: string): LessonProgress[] {
  const ix = prev.findIndex((p) => p.lessonId === lessonId);
  if (ix === -1) return [...prev, { lessonId, quizScore, at }];
  if (quizScore <= prev[ix].quizScore) return prev;
  return prev.map((p, i) => (i === ix ? { lessonId, quizScore, at } : p));
}
