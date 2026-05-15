# md-quiz

A library that generates quiz UI from Markdown.

md-quiz provides only DOM structure, answer processing, state classes, and events. It ships no styles — use your own CSS to control the appearance.

[日本語版はこちら](README.ja.md)

## Usage

```html
<div id="app"></div>

<script type="module">
  import { loadQuiz } from '@takashi145/md-quiz';

  const app = document.getElementById('app');

  await loadQuiz('./quiz.md', app, {
    submitLabel: 'Submit',
    autoDisableSubmit: true,
    shuffleChoices: true,
    shuffleQuestions: true,
  });
</script>
```

`loadQuiz()` fetches a Markdown file, parses it, and renders the quiz into the specified container.

```ts
loadQuiz(src: string, container: HTMLElement, options?: QuizOptions): Promise<QuizInstance>
```

If you want to fetch or transform the Markdown string yourself, use `parse()` and `createQuiz()` directly.

```ts
import { parse, createQuiz } from '@takashi145/md-quiz';

const { questions, warnings } = parse(markdown);
const quiz = createQuiz(questions, container);
```

## Markdown

Each question starts with a level-2 heading.

```md
## Question text
```

### Single Choice

Single-choice questions use parentheses.

```md
## Choose one

- ( ) Wrong
- (x) Correct
- ( ) Wrong
```

### Multiple Choice

Multiple-choice questions use square brackets.

```md
## Choose all that apply

- [x] Correct
- [ ] Wrong
- [x] Correct
```

### Fill-In

Fill-in questions use `[[answer]]`.

```md
## `typeof undefined === typeof null` is [[false]].
```

You can also place blanks in the body text.

```md
## Fill in the blanks

Use arr.[[length]] to get an array length.
```

## Options

```ts
interface QuizOptions {
  submitLabel?: string;
  autoDisableSubmit?: boolean;
  shuffleChoices?: boolean;
  shuffleQuestions?: boolean;
}
```

- `submitLabel`: Label for the submit button. Defaults to `確認`.
- `autoDisableSubmit`: When `true`, the submit button is disabled until all questions have a selection or input. Defaults to `false`.
- `shuffleChoices`: When `true`, choice order is randomized. Defaults to `false`.
- `shuffleQuestions`: When `true`, question order is randomized. Defaults to `false`.

## Events

After each answer, `mq-answer` is fired.

```ts
interface QuizAnswerEventDetail {
  index: number;
  correct: boolean;
  answers: string[];
  inputResults?: boolean[];
}
```

For fill-in questions, `inputResults` contains the correctness of each input. For example, if the first of two inputs is correct and the second is not, `inputResults` will be `[true, false]`. Choice questions do not include `inputResults`.

After all questions have been answered, `mq-complete` is fired.

```ts
interface QuizCompleteEventDetail {
  total: number;
}
```

Example:

```js
app.addEventListener('mq-answer', (event) => {
  console.log(event.detail.correct);
});

app.addEventListener('mq-complete', (event) => {
  console.log(`answered ${event.detail.total} questions`);
});
```

## Styling

md-quiz ships no CSS. Style the quiz using the generated classes below.

| Class | Applied to |
| --- | --- |
| `.mq-quiz` | Root element of the entire quiz |
| `.mq-question` | Root element of each question |
| `.mq-question--single` | `.mq-question` for single-choice questions |
| `.mq-question--multiple` | `.mq-question` for multiple-choice questions |
| `.mq-question--fill` | `.mq-question` for fill-in questions |
| `.mq-question--answered` | `.mq-question` after the question is answered |
| `.mq-question--correct` | `.mq-question` when answered correctly |
| `.mq-question--incorrect` | `.mq-question` when answered incorrectly |
| `.mq-body` | Wrapper for the question text and body |
| `.mq-question-text` | Question text generated from the heading |
| `.mq-choices` | Choice list |
| `.mq-choice` | Label for each choice |
| `.mq-choice--selected` | `.mq-choice` that was selected, shown after answering |
| `.mq-choice--correct` | Correct `.mq-choice`, shown after answering |
| `.mq-radio` | Radio input for single-choice questions |
| `.mq-checkbox` | Checkbox input for multiple-choice questions |
| `.mq-input` | Text input for fill-in questions |
| `.mq-input--correct` | `.mq-input` that was correct, shown after answering |
| `.mq-input--incorrect` | `.mq-input` that was incorrect, shown after answering |
| `.mq-submit` | Submit button |

Some of these classes are also used for event handling and scoring. Do not remove or replace them from the DOM — only adjust their appearance with CSS.
