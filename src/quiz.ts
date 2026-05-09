import { parseInline } from './inline.js';
import type { Question, QuizMeta } from './parser.js';

export interface QuizInstance {
  readonly title: string | undefined;
  readonly total: number;
  readonly score: number;
  reset(): void;
}

function buildQuestionEl(q: Question, index: number): HTMLElement {
  const qEl = document.createElement('div');
  qEl.className = `mq-question mq-question--${q.type}`;
  qEl.dataset.index = String(index);

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

  qEl.appendChild(body);

  if (q.type === 'choice') {
    const ul = document.createElement('ul');
    ul.className = 'mq-choices';
    for (const c of q.choices) {
      const li = document.createElement('li');
      li.className = 'mq-choice';
      li.dataset.correct = String(c.correct);
      li.innerHTML = parseInline(c.text);
      ul.appendChild(li);
    }
    qEl.appendChild(ul);
  } else {
    const btn = document.createElement('button');
    btn.className = 'mq-submit';
    btn.type = 'button';
    btn.textContent = '確認';
    qEl.appendChild(btn);
  }

  return qEl;
}

function buildDOM(questions: Question[]): HTMLElement {
  const root = document.createElement('div');
  root.className = 'mq-quiz';

  questions.forEach((q, i) => root.appendChild(buildQuestionEl(q, i)));

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

  function applyResult(qEl: HTMLElement, index: number, correct: boolean): void {
    qEl.classList.add('mq-question--answered');
    qEl.classList.add(correct ? 'mq-question--correct' : 'mq-question--incorrect');
    if (correct) score++;
    root.querySelector('.mq-score__current')!.textContent = String(score);

    container.dispatchEvent(
      new CustomEvent('mq-answer', { bubbles: true, detail: { index, correct } }),
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

  function submitChoice(qEl: HTMLElement, choice: HTMLElement, index: number): void {
    if (answered.has(index)) return;
    answered.add(index);

    const correct = choice.dataset.correct === 'true';
    choice.classList.add('mq-choice--selected');
    qEl.querySelectorAll<HTMLElement>('[data-correct="true"]').forEach((el) => {
      el.classList.add('mq-choice--correct');
    });
    applyResult(qEl, index, correct);
  }

  function submitFill(qEl: HTMLElement, index: number): void {
    if (answered.has(index)) return;
    const inputs = qEl.querySelectorAll<HTMLInputElement>('.mq-input');
    if (inputs.length === 0) return;
    answered.add(index);

    const q = questions[index] as import('./parser.js').FillQuestion;
    let correct = true;
    Array.from(inputs).forEach((input, i) => {
      const expected = q.answers[i] ?? '';
      const ok = input.value.trim().toLowerCase() === expected.trim().toLowerCase();
      if (!ok) correct = false;
      input.disabled = true;
      input.classList.add(ok ? 'mq-input--correct' : 'mq-input--incorrect');
      if (!ok) {
        const hint = document.createElement('span');
        hint.className = 'mq-fill-hint';
        hint.textContent = expected;
        input.insertAdjacentElement('afterend', hint);
      }
    });

    const btn = qEl.querySelector<HTMLButtonElement>('.mq-submit');
    if (btn) btn.disabled = true;

    applyResult(qEl, index, correct);
  }

  function handleClick(e: Event): void {
    const target = e.target as Element;

    const choice = target.closest<HTMLElement>('.mq-choice');
    if (choice) {
      const qEl = choice.closest<HTMLElement>('.mq-question');
      if (!qEl) return;
      const index = parseInt(qEl.dataset.index ?? '', 10);
      if (!Number.isNaN(index)) submitChoice(qEl, choice, index);
      return;
    }

    const btn = target.closest<HTMLElement>('.mq-submit');
    if (btn) {
      const qEl = btn.closest<HTMLElement>('.mq-question');
      if (!qEl) return;
      const index = parseInt(qEl.dataset.index ?? '', 10);
      if (!Number.isNaN(index)) submitFill(qEl, index);
    }
  }

  function handleKeydown(e: Event): void {
    const ke = e as KeyboardEvent;
    if (ke.key !== 'Enter') return;
    const input = ke.target as Element;
    if (!input.classList.contains('mq-input')) return;
    const qEl = input.closest<HTMLElement>('.mq-question');
    if (!qEl) return;
    const index = parseInt(qEl.dataset.index ?? '', 10);
    if (!Number.isNaN(index)) submitFill(qEl, index);
  }

  root.addEventListener('click', handleClick);
  root.addEventListener('keydown', handleKeydown);

  return {
    get title() { return meta.title; },
    get total() { return questions.length; },
    get score() { return score; },
    reset() {
      score = 0;
      answered.clear();
      root.removeEventListener('click', handleClick);
      root.removeEventListener('keydown', handleKeydown);
      container.removeChild(root);
      root = buildDOM(questions);
      container.appendChild(root);
      root.addEventListener('click', handleClick);
      root.addEventListener('keydown', handleKeydown);
    },
  };
}
