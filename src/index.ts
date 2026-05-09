import { parse } from './parser.js';
import { createQuiz } from './quiz.js';
import type { QuizInstance } from './quiz.js';

export type { Choice, Question, QuizMeta } from './parser.js';
export type { QuizInstance } from './quiz.js';

export async function loadQuiz(
  src: string,
  container: HTMLElement,
): Promise<QuizInstance> {
  const res = await fetch(src);
  if (!res.ok) {
    throw new Error(`md-quiz: failed to fetch "${src}" (${res.status})`);
  }
  const markdown = await res.text();
  const { meta, questions } = parse(markdown);
  return createQuiz(meta, questions, container);
}
