import { parseInline } from './inline.js';
import { renderBlock } from './block.js';

export interface Choice {
  text: string;
  correct: boolean;
}

export interface ChoiceQuestion {
  type: 'choice';
  subtype: 'single' | 'multiple';
  text: string;
  bodyHtml: string;
  choices: Choice[];
}

export interface FillQuestion {
  type: 'fill';
  text: string;
  bodyHtml: string;
  answers: string[][];
}

export type Question = ChoiceQuestion | FillQuestion;

export interface ParseResult {
  questions: Question[];
  warnings: ParseWarning[];
}

export type ParseWarningCode =
  | 'empty-question'
  | 'choice-without-correct-answer'
  | 'choice-with-multiple-correct-answers';

export interface ParseWarning {
  code: ParseWarningCode;
  message: string;
  heading: string;
  line: number;
}

const HEADING_RE = /^##\s+(.+)$/;
const SINGLE_CHOICE_RE = /^-\s+\(([ x])\)\s+(.+)$/i;
const MULTI_CHOICE_RE = /^-\s+\[([ x])\]\s+(.+)$/i;

const FENCE_RE = /^```/;
const FILL_RE = /\[\[([^\]\n]+)\]\]/g;
const INPUT_TAG = '<input class="mq-input" type="text" autocomplete="off">';

// Replace [[answer]] with input tag, skipping content inside code.
function injectInput(html: string): string {
  return html.replace(/(<pre>[\s\S]*?<\/pre>|<code>[\s\S]*?<\/code>)|\[\[[^\]\n]+\]\]/g, (_match, code) =>
    code !== undefined ? code : INPUT_TAG,
  );
}

function findFillAnswers(heading: string, lines: string[]): string[][] {
  const answers: string[][] = [];

  for (const m of heading.replace(/`[^`]+`/g, '').matchAll(FILL_RE)) {
    answers.push(m[1].split('|').map((s) => s.trim()).filter(Boolean));
  }

  let inFence = false;
  for (const line of lines) {
    if (FENCE_RE.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    for (const m of line.replace(/`[^`]+`/g, '').matchAll(FILL_RE)) {
      answers.push(m[1].split('|').map((s) => s.trim()).filter(Boolean));
    }
  }

  return answers;
}

function splitBodyAndChoices(lines: string[]): { bodyLines: string[]; choiceLines: string[]; subtype: 'single' | 'multiple' | null } {
  let firstChoiceIdx = -1;
  let subtype: 'single' | 'multiple' | null = null;
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    if (FENCE_RE.test(lines[i])) { inFence = !inFence; continue; }
    if (!inFence && SINGLE_CHOICE_RE.test(lines[i])) { firstChoiceIdx = i; subtype = 'single'; break; }
    if (!inFence && MULTI_CHOICE_RE.test(lines[i])) { firstChoiceIdx = i; subtype = 'multiple'; break; }
  }

  if (firstChoiceIdx === -1) return { bodyLines: lines, choiceLines: [], subtype: null };

  let bodyEnd = firstChoiceIdx;
  while (bodyEnd > 0 && lines[bodyEnd - 1].trim() === '') bodyEnd--;

  const re = subtype === 'single' ? SINGLE_CHOICE_RE : MULTI_CHOICE_RE;
  return {
    bodyLines: lines.slice(0, bodyEnd),
    choiceLines: lines.slice(firstChoiceIdx).filter((l) => re.test(l)),
    subtype,
  };
}

export function parse(markdown: string): ParseResult {
  const lines = markdown.split('\n');
  const questions: Question[] = [];
  const warnings: ParseWarning[] = [];

  const sections: { heading: string; lines: string[]; line: number }[] = [];
  let current: { heading: string; lines: string[]; line: number } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(HEADING_RE);
    if (headingMatch) {
      if (current) sections.push(current);
      current = { heading: headingMatch[1].trim(), lines: [], line: i + 1 };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push(current);

  for (const section of sections) {
    const answers = findFillAnswers(section.heading, section.lines);

    if (answers.length > 0) {
      questions.push({
        type: 'fill',
        text: injectInput(parseInline(section.heading)),
        bodyHtml: injectInput(renderBlock(section.lines)),
        answers,
      });
      continue;
    }

    const { bodyLines, choiceLines, subtype } = splitBodyAndChoices(section.lines);
    const re = subtype === 'single' ? SINGLE_CHOICE_RE : MULTI_CHOICE_RE;
    const choices: Choice[] = choiceLines.map((l) => {
      const m = l.match(re)!;
      return { text: m[2].trim(), correct: m[1].toLowerCase() === 'x' };
    });

    if (choices.length === 0) {
      warnings.push({
        code: 'empty-question',
        message: 'Question has no fill-in answers or choices.',
        heading: section.heading,
        line: section.line,
      });
      continue;
    }

    const correctCount = choices.filter((choice) => choice.correct).length;
    if (correctCount === 0) {
      warnings.push({
        code: 'choice-without-correct-answer',
        message: 'Choice question has no correct answer.',
        heading: section.heading,
        line: section.line,
      });
    } else if (subtype === 'single' && correctCount > 1) {
      warnings.push({
        code: 'choice-with-multiple-correct-answers',
        message: 'Single-choice question has multiple correct answers.',
        heading: section.heading,
        line: section.line,
      });
    }

    questions.push({
      type: 'choice',
      subtype: subtype!,
      text: parseInline(section.heading),
      bodyHtml: renderBlock(bodyLines),
      choices,
    });
  }

  return { questions, warnings };
}
