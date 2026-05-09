import { parseInline } from './inline.js';
import type { Question, QuizMeta } from './parser.js';

export interface QuizInstance {
  readonly title: string | undefined;
  readonly total: number;
  readonly score: number;
  reset(): void;
}

function buildDOM(questions: Question[]): HTMLElement {
  const root = document.createElement('div');
  root.className = 'mq-quiz';

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    const qEl = document.createElement('div');
    qEl.className = 'mq-question';
    qEl.dataset.index = String(i);

    const body = document.createElement('div');
    body.className = 'mq-body';

    const questionText = document.createElement('p');
    questionText.className = 'mq-question-text';
    questionText.innerHTML = q.text;
    body.appendChild(questionText);

    if (q.bodyHtml) {
      const supplement = document.createElement('div');
      supplement.innerHTML = q.bodyHtml;
      body.appendChild(supplement);
    }

    const ul = document.createElement('ul');
    ul.className = 'mq-choices';

    for (const c of q.choices) {
      const li = document.createElement('li');
      li.className = 'mq-choice';
      li.dataset.correct = String(c.correct);
      li.innerHTML = parseInline(c.text);
      ul.appendChild(li);
    }

    qEl.appendChild(body);
    qEl.appendChild(ul);
    root.appendChild(qEl);
  }

  const scoreEl = document.createElement('div');
  scoreEl.className = 'mq-score';

  const current = document.createElement('span');
  current.className = 'mq-score__current';
  current.textContent = '0';

  const total = document.createElement('span');
  total.className = 'mq-score__total';
  total.textContent = String(questions.length);

  scoreEl.appendChild(current);
  scoreEl.append(' / ');
  scoreEl.appendChild(total);
  root.appendChild(scoreEl);

  return root;
}

export function createQuiz(
  meta: QuizMeta,
  questions: Question[],
  container: HTMLElement,
): QuizInstance {
  let score = 0;
  const answered = new Set<number>();
  let root = buildDOM(questions);
  container.appendChild(root);

  function handleClick(e: Event): void {
    const choice = (e.target as Element).closest<HTMLElement>('.mq-choice');
    if (!choice) return;

    const qEl = choice.closest<HTMLElement>('.mq-question');
    if (!qEl) return;

    const index = parseInt(qEl.dataset.index ?? '', 10);
    if (Number.isNaN(index) || answered.has(index)) return;

    answered.add(index);

    const correct = choice.dataset.correct === 'true';

    choice.classList.add('mq-choice--selected');
    qEl.querySelectorAll<HTMLElement>('[data-correct="true"]').forEach((el) => {
      el.classList.add('mq-choice--correct');
    });

    qEl.classList.add('mq-question--answered');
    qEl.classList.add(correct ? 'mq-question--correct' : 'mq-question--incorrect');

    if (correct) score++;
    root.querySelector('.mq-score__current')!.textContent = String(score);

    container.dispatchEvent(
      new CustomEvent('mq-answer', {
        bubbles: true,
        detail: { index, correct },
      }),
    );

    if (answered.size === questions.length) {
      container.dispatchEvent(
        new CustomEvent('mq-complete', {
          bubbles: true,
          detail: { score, total: questions.length },
        }),
      );
    }
  }

  root.addEventListener('click', handleClick);

  return {
    get title() {
      return meta.title;
    },
    get total() {
      return questions.length;
    },
    get score() {
      return score;
    },
    reset() {
      score = 0;
      answered.clear();
      root.removeEventListener('click', handleClick);
      container.removeChild(root);
      root = buildDOM(questions);
      container.appendChild(root);
      root.addEventListener('click', handleClick);
    },
  };
}
