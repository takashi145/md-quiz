import { parseInline } from './inline.js';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function renderBlock(lines: string[]): string {
  let html = '';
  let i = 0;

  while (i < lines.length) {
    if (lines[i].trim() === '') {
      i++;
      continue;
    }

    // fenced code block
    const fenceMatch = lines[i].match(/^```(\S*)$/);
    if (fenceMatch) {
      const lang = fenceMatch[1];
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // closing ```
      const langAttr = lang ? ` class="language-${escapeHtml(lang)}"` : '';
      html += `<pre><code${langAttr}>${escapeHtml(codeLines.join('\n'))}</code></pre>`;
      continue;
    }

    // unordered list (regular, not choices)
    if (lines[i].match(/^-\s+/) && !lines[i].match(/^-\s+\[[ x]\]/i)) {
      html += '<ul>';
      while (i < lines.length && lines[i].match(/^-\s+/) && !lines[i].match(/^-\s+\[[ x]\]/i)) {
        html += `<li>${parseInline(lines[i].replace(/^-\s+/, ''))}</li>`;
        i++;
      }
      html += '</ul>';
      continue;
    }

    // paragraph
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].match(/^```/) && !lines[i].match(/^-\s+/)) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      html += `<p>${parseInline(paraLines.join(' '))}</p>`;
    }
  }

  return html;
}
