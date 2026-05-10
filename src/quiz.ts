import { parseInline } from './inline.js';
import type { Question } from './parser.js';

export interface QuizInstance {
  readonly total: number;
  reset(): void;
}

export interface QuizAnswerEventDetail {
  index: number;
  correct: boolean;
  answers: string[];
}

export interface QuizCompleteEventDetail {
  total: number;
}

export interface QuizOptions {
  submitLabel?: string;
}

interface ResolvedQuizOptions {
  submitLabel: string;
}

function resolveOptions(options: QuizOptions = {}): ResolvedQuizOptions {
  return {
    submitLabel: options.submitLabel ?? '確認',
  };
}

function buildSubmitButton(label: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'mq-submit';
  btn.type = 'button';
  btn.textContent = label;
  return btn;
}

function buildQuestionEl(q: Question, index: number, options: ResolvedQuizOptions): HTMLElement {
  const qEl = document.createElement('div');
  qEl.className = q.type === 'choice'
    ? `mq-question mq-question--choice mq-question--${q.subtype}`
    : 'mq-question mq-question--fill';
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
      const label = document.createElement('label');
      label.className = 'mq-choice';
      const input = document.createElement('input');
      input.type = q.subtype === 'single' ? 'radio' : 'checkbox';
      input.className = q.subtype === 'single' ? 'mq-radio' : 'mq-checkbox';
      if (q.subtype === 'single') input.name = `mq-q${index}`;
      input.dataset.correct = String(c.correct);
      const span = document.createElement('span');
      span.innerHTML = parseInline(c.text);
      label.appendChild(input);
      label.appendChild(span);
      li.appendChild(label);
      ul.appendChild(li);
    }
    qEl.appendChild(ul);
    qEl.appendChild(buildSubmitButton(options.submitLabel));
  } else {
    qEl.appendChild(buildSubmitButton(options.submitLabel));
  }

  return qEl;
}

function buildDOM(questions: Question[], options: ResolvedQuizOptions): HTMLElement {
  const root = document.createElement('div');
  root.className = 'mq-quiz';

  questions.forEach((q, i) => root.appendChild(buildQuestionEl(q, i, options)));

  return root;
}

export function createQuiz(
  questions: Question[],
  container: HTMLElement,
  options?: QuizOptions,
): QuizInstance {
  const answered = new Set<number>();
  const resolvedOptions = resolveOptions(options);
  let root = buildDOM(questions, resolvedOptions);
  container.appendChild(root);

  function applyResult(qEl: HTMLElement, index: number, correct: boolean, answers: string[]): void {
    qEl.classList.add('mq-question--answered');
    qEl.classList.add(correct ? 'mq-question--correct' : 'mq-question--incorrect');

    container.dispatchEvent(
      new CustomEvent<QuizAnswerEventDetail>('mq-answer', {
        bubbles: true,
        detail: { index, correct, answers },
      }),
    );

    if (answered.size === questions.length) {
      container.dispatchEvent(
        new CustomEvent<QuizCompleteEventDetail>('mq-complete', {
          bubbles: true,
          detail: { total: questions.length },
        }),
      );
    }
  }

  function submitSingleChoice(qEl: HTMLElement, index: number): void {
    if (answered.has(index)) return;
    const radios = Array.from(qEl.querySelectorAll<HTMLInputElement>('.mq-radio'));
    const checked = radios.find((r) => r.checked);
    if (!checked) return;
    answered.add(index);

    const correct = checked.dataset.correct === 'true';
    radios.forEach((r) => {
      r.disabled = true;
      const choice = r.closest<HTMLElement>('.mq-choice');
      if (!choice) return;
      if (r.checked) choice.classList.add('mq-choice--selected');
      if (r.dataset.correct === 'true') choice.classList.add('mq-choice--correct');
    });

    const btn = qEl.querySelector<HTMLButtonElement>('.mq-submit');
    if (btn) btn.disabled = true;

    const answers = radios
      .filter((r) => r.dataset.correct === 'true')
      .map((r) => r.nextElementSibling?.textContent?.trim() ?? '');

    applyResult(qEl, index, correct, answers);
  }

  function submitMultiChoice(qEl: HTMLElement, index: number): void {
    if (answered.has(index)) return;
    answered.add(index);

    const checkboxes = Array.from(qEl.querySelectorAll<HTMLInputElement>('.mq-checkbox'));
    const correct = checkboxes.every((cb) => cb.checked === (cb.dataset.correct === 'true'));

    checkboxes.forEach((cb) => {
      cb.disabled = true;
      const choice = cb.closest<HTMLElement>('.mq-choice');
      if (!choice) return;
      if (cb.checked) choice.classList.add('mq-choice--selected');
      if (cb.dataset.correct === 'true') choice.classList.add('mq-choice--correct');
    });

    const btn = qEl.querySelector<HTMLButtonElement>('.mq-submit');
    if (btn) btn.disabled = true;

    const answers = checkboxes
      .filter((cb) => cb.dataset.correct === 'true')
      .map((cb) => cb.nextElementSibling?.textContent?.trim() ?? '');

    applyResult(qEl, index, correct, answers);
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
    });

    const btn = qEl.querySelector<HTMLButtonElement>('.mq-submit');
    if (btn) btn.disabled = true;

    applyResult(qEl, index, correct, q.answers);
  }

  function handleClick(e: Event): void {
    const target = e.target as Element;

    const btn = target.closest<HTMLElement>('.mq-submit');
    if (btn) {
      const qEl = btn.closest<HTMLElement>('.mq-question');
      if (!qEl) return;
      const index = parseInt(qEl.dataset.index ?? '', 10);
      if (Number.isNaN(index)) return;
      if (qEl.classList.contains('mq-question--single')) {
        submitSingleChoice(qEl, index);
      } else if (qEl.classList.contains('mq-question--multiple')) {
        submitMultiChoice(qEl, index);
      } else {
        submitFill(qEl, index);
      }
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
    get total() { return questions.length; },
    reset() {
      answered.clear();
      root.removeEventListener('click', handleClick);
      root.removeEventListener('keydown', handleKeydown);
      container.removeChild(root);
      root = buildDOM(questions, resolvedOptions);
      container.appendChild(root);
      root.addEventListener('click', handleClick);
      root.addEventListener('keydown', handleKeydown);
    },
  };
}
