# md-quiz

MarkdownからクイズUIを生成するライブラリです。

md-quizはDOM構造、回答処理、状態クラス、イベントだけを提供します。見た目は同梱しないため、利用側のCSSで自由に調整してください。

## Usage

```html
<div id="app"></div>

<script type="module">
  import { loadQuiz } from '@takashi145/md-quiz';

  const app = document.getElementById('app');

  await loadQuiz('./quiz.md', app, {
    submitLabel: '回答する',
    autoDisableSubmit: true,
    shuffleChoices: true,
    shuffleQuestions: true,
  });
</script>
```

`loadQuiz()` はMarkdownファイルを取得し、パースして、指定したコンテナにクイズを描画します。

```ts
loadQuiz(src: string, container: HTMLElement, options?: QuizOptions): Promise<QuizInstance>
```

Markdown文字列を自分で取得・加工したい場合は、`parse()` と `createQuiz()` を直接使えます。

```ts
import { parse, createQuiz } from '@takashi145/md-quiz';

const { questions, warnings } = parse(markdown);
const quiz = createQuiz(questions, container);
```

## Markdown

各問題はレベル2見出しから始めます。

```md
## Question text
```

### Single Choice

単一選択問題は丸括弧を使います。

```md
## Choose one

- ( ) Wrong
- (x) Correct
- ( ) Wrong
```

### Multiple Choice

複数選択問題は角括弧を使います。

```md
## Choose all that apply

- [x] Correct
- [ ] Wrong
- [x] Correct
```

### Fill-In

穴埋め問題は `[[answer]]` を使います。

```md
## `typeof undefined === typeof null` is [[false]].
```

本文中にも書けます。

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

- `submitLabel`: 回答ボタンの文言です。デフォルトは `確認`。
- `autoDisableSubmit`: `true` の場合、未選択または未入力の間は回答ボタンを disabled にします。デフォルトは `false`。
- `shuffleChoices`: `true` の場合、選択肢の表示順をシャッフルします。デフォルトは `false`。
- `shuffleQuestions`: `true` の場合、問題の表示順をシャッフルします。デフォルトは `false`。

## Events

回答後に `mq-answer` を発火します。

```ts
interface QuizAnswerEventDetail {
  index: number;
  correct: boolean;
  answers: string[];
  inputResults?: boolean[];
}
```

穴埋め問題では、`inputResults` に各入力欄の正誤が入ります。例えば2つの入力欄のうち1つ目だけ正解だった場合は `[true, false]` になります。
選択問題では `inputResults` は付きません。

全問回答後に `mq-complete` を発火します。

```ts
interface QuizCompleteEventDetail {
  total: number;
}
```

例:

```js
app.addEventListener('mq-answer', (event) => {
  console.log(event.detail.correct);
});

app.addEventListener('mq-complete', (event) => {
  console.log(`answered ${event.detail.total} questions`);
});
```

## Styling

md-quizはCSSを提供しません。生成される主なクラスを使って、利用側でスタイルを当ててください。

| クラス | 付与される場所 |
| --- | --- |
| `.mq-quiz` | クイズ全体のルート要素 |
| `.mq-question` | 各問題のルート要素 |
| `.mq-question--single` | 単一選択問題の `.mq-question` |
| `.mq-question--multiple` | 複数選択問題の `.mq-question` |
| `.mq-question--fill` | 穴埋め問題の `.mq-question` |
| `.mq-question--answered` | 回答後の `.mq-question` |
| `.mq-question--correct` | 正解だった `.mq-question` |
| `.mq-question--incorrect` | 不正解だった `.mq-question` |
| `.mq-body` | 問題文と本文のラッパー |
| `.mq-question-text` | 見出しから生成された問題文 |
| `.mq-choices` | 選択肢リスト |
| `.mq-choice` | 各選択肢のラベル |
| `.mq-choice--selected` | 回答後、選択されていた `.mq-choice` |
| `.mq-choice--correct` | 回答後、正解の `.mq-choice` |
| `.mq-radio` | 単一選択問題の radio input |
| `.mq-checkbox` | 複数選択問題の checkbox input |
| `.mq-input` | 穴埋め問題の text input |
| `.mq-input--correct` | 回答後、正解だった `.mq-input` |
| `.mq-input--incorrect` | 回答後、不正解だった `.mq-input` |
| `.mq-submit` | 回答ボタン |

これらのクラスの一部はイベント処理や採点にも使われます。DOMから削除・置換せず、CSSで見た目を調整してください。
