function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeHref(href: string): string | null {
  const value = href.trim();
  if (value === '' || /[\u0000-\u001F\u007F]/.test(value)) return null;

  if (value.startsWith('#') || value.startsWith('./') || value.startsWith('../')) {
    return value;
  }

  if (value.startsWith('/')) {
    return value.startsWith('//') ? null : value;
  }

  const schemeMatch = value.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (!schemeMatch) return value;

  const scheme = schemeMatch[1].toLowerCase();
  return scheme === 'http' || scheme === 'https' || scheme === 'mailto' ? value : null;
}

function parseInlineText(text: string): string {
  const tokenRe = /\[([^\]\n]+)\]\(([^)\n]+)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g;
  let html = '';
  let lastIndex = 0;

  for (const match of text.matchAll(tokenRe)) {
    html += escapeHtml(text.slice(lastIndex, match.index));

    if (match[1] !== undefined && match[2] !== undefined) {
      const href = sanitizeHref(match[2]);
      html += href === null
        ? escapeHtml(match[0])
        : `<a href="${escapeHtml(href)}">${escapeHtml(match[1])}</a>`;
    } else if (match[3] !== undefined) {
      html += `<strong>${escapeHtml(match[3])}</strong>`;
    } else {
      html += `<em>${escapeHtml(match[4])}</em>`;
    }

    lastIndex = match.index + match[0].length;
  }

  html += escapeHtml(text.slice(lastIndex));
  return html;
}

export function parseInline(text: string): string {
  const parts = text.split(/(`[^`]+`)/);

  return parts
    .map((part) => {
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return `<code>${escapeHtml(part.slice(1, -1))}</code>`;
      }
      return parseInlineText(part);
    })
    .join('');
}
