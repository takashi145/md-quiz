import { parseInline } from './inline.js';
import { renderBlock } from './block.js';

export interface Choice {
  text: string;
  correct: boolean;
}

export interface Question {
  text: string;
  bodyHtml: string;
  choices: Choice[];
}

export interface QuizMeta {
  title?: string;
}

export interface ParseResult {
  meta: QuizMeta;
  questions: Question[];
}

const HEADING_RE = /^##\s+(.+)$/;
const CHOICE_RE = /^-\s+\[([ x])\]\s+(.+)$/i;
const FENCE_RE = /^```/;

function parseFrontMatter(markdown: string): { meta: QuizMeta; rest: string } {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, rest: markdown };

  const meta: QuizMeta = {};
  const titleMatch = match[1].match(/^title:\s*(.+)$/m);
  if (titleMatch) meta.title = titleMatch[1].trim();

  return { meta, rest: match[2] };
}

function splitBodyAndChoices(lines: string[]): { bodyLines: string[]; choiceLines: string[] } {
  let firstChoiceIdx = -1;
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    if (FENCE_RE.test(lines[i])) {
      inFence = !inFence;
      continue;
    }
    if (!inFence && CHOICE_RE.test(lines[i])) {
      firstChoiceIdx = i;
      break;
    }
  }

  if (firstChoiceIdx === -1) return { bodyLines: lines, choiceLines: [] };

  let bodyEnd = firstChoiceIdx;
  while (bodyEnd > 0 && lines[bodyEnd - 1].trim() === '') bodyEnd--;

  return {
    bodyLines: lines.slice(0, bodyEnd),
    choiceLines: lines.slice(firstChoiceIdx).filter((l) => CHOICE_RE.test(l)),
  };
}

export function parse(markdown: string): ParseResult {
  const { meta, rest } = parseFrontMatter(markdown);
  const lines = rest.split('\n');
  const questions: Question[] = [];

  const sections: { heading: string; lines: string[] }[] = [];
  let current: { heading: string; lines: string[] } | null = null;

  for (const line of lines) {
    const headingMatch = line.match(HEADING_RE);
    if (headingMatch) {
      if (current) sections.push(current);
      current = { heading: headingMatch[1].trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push(current);

  for (const section of sections) {
    const { bodyLines, choiceLines } = splitBodyAndChoices(section.lines);

    const choices: Choice[] = choiceLines.map((l) => {
      const m = l.match(CHOICE_RE)!;
      return { text: m[2].trim(), correct: m[1].toLowerCase() === 'x' };
    });

    if (choices.length < 2) continue;

    questions.push({
      text: parseInline(section.heading),
      bodyHtml: renderBlock(bodyLines),
      choices,
    });
  }

  return { meta, questions };
}
