// Small, dependency-free Markdown subset renderer used for lesson content.
// Supported: ### / #### headings, paragraphs, - and 1. lists, fenced code with
// language label, pipe tables, > callouts, `code`, **bold**, *italic* and links.
// Internal link schemes: lesson:id, project:id, case:id, page:file.html#anchor.

import { renderDiagram } from './diagram.mjs';

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const slug = (s) =>
  String(s).toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function inline(src, ctx) {
  const codes = [];
  let s = String(src).replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  s = esc(s);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, url) => ctx.link(text, url.replace(/&amp;/g, '&')));
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, '$1<em>$2</em>');
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[Number(i)])}</code>`);
  return s;
}

const LANG_LABEL = { py: 'Python', python: 'Python', cs: 'C#', csharp: 'C#', bash: 'Shell', sh: 'Shell',
  json: 'JSON', text: 'Output', http: 'HTTP', yaml: 'YAML', sql: 'SQL', powershell: 'PowerShell', js: 'JavaScript' };

export function md(src, ctx) {
  const lines = String(src).replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  const para = [];
  const flush = () => { if (para.length) { out.push(`<p>${inline(para.join(' '), ctx)}</p>`); para.length = 0; } };

  while (i < lines.length) {
    const line = lines[i];
    const fence = line.match(/^```(\w+)?\s*(.*)$/);
    if (fence) {
      flush();
      const lang = (fence[1] || 'text').toLowerCase();
      const title = fence[2] ? fence[2].trim() : '';
      const body = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) body.push(lines[i++]);
      i++;
      if (lang === 'diagram') { out.push(renderDiagram(title, body, inline, ctx, ctx.file || 'lesson')); continue; }
      if (lang === 'formula') {
        out.push(`<div class="formula" role="group" aria-label="Formula${title ? ': ' + esc(title) : ''}"><p class="formula-title">${esc(title || 'Formula')}</p><pre tabindex="0"><code>${esc(body.join('\n'))}</code></pre></div>`);
        continue;
      }
      const label = [LANG_LABEL[lang] || lang, title].filter(Boolean).join(' — ');
      out.push(`<figure class="code"><figcaption>${esc(label)}</figcaption><pre tabindex="0"><code class="language-${esc(lang)}">${esc(body.join('\n'))}</code></pre></figure>`);
      continue;
    }
    if (/^\s*$/.test(line)) { flush(); i++; continue; }
    const h = line.match(/^(#{3,4})\s+(.+)$/);
    if (h) {
      flush();
      const level = h[1].length;
      out.push(`<h${level} id="${ctx.idPrefix || ''}${slug(h[2])}">${inline(h[2], ctx)}</h${level}>`);
      i++; continue;
    }
    if (line.startsWith('|')) {
      flush();
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
      const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const head = cells(rows[0]);
      const body = rows.slice(2).map(cells);
      out.push(`<div class="table-wrap" tabindex="0" role="region" aria-label="${esc(head.join(', '))} table"><table><thead><tr>${head.map((c) => `<th scope="col">${inline(c, ctx)}</th>`).join('')}</tr></thead><tbody>${
        body.map((r) => `<tr>${r.map((c, j) => `<td data-label="${esc(head[j] || '')}">${inline(c, ctx)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    if (line.startsWith('>')) {
      flush();
      const body = [];
      while (i < lines.length && lines[i].startsWith('>')) body.push(lines[i++].replace(/^>\s?/, ''));
      const text = body.join('\n');
      const kind = /^\*\*(Warning|Caution|Security)/.test(text) ? 'warn' : /^\*\*(Expected output|Result)/.test(text) ? 'ok' : 'note';
      out.push(`<div class="callout callout-${kind}">${md(text, ctx)}</div>`);
      continue;
    }
    const list = line.match(/^(\s*)(-|\d+\.)\s+(.*)$/);
    if (list) {
      flush();
      const ordered = list[2] !== '-';
      const items = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(-|\d+\.)\s+(.*)$/);
        if (m && (m[1] === '-') === !ordered) { items.push(m[2]); i++; continue; }
        if (/^\s{2,}\S/.test(lines[i]) && items.length) { items[items.length - 1] += ' ' + lines[i].trim(); i++; continue; }
        break;
      }
      const tag = ordered ? 'ol' : 'ul';
      out.push(`<${tag}>${items.map((it) => `<li>${inline(it, ctx)}</li>`).join('')}</${tag}>`);
      continue;
    }
    para.push(line.trim());
    i++;
  }
  flush();
  return out.join('\n');
}


// ---- lesson files: front matter + "## Section" blocks ----
// Quick Path lesson template. Every lesson has both a Python and a .NET (C#) example,
// names the maths behind the idea (and may add an applied-maths section), and links to nothing outside the site.
export const REQUIRED_SECTIONS = [
  'In plain words', 'Real-world example', 'How it works', 'Python example', '.NET (C#) example',
  'Maths behind it', 'Common mistakes', 'Quick check',
];

// Optional section: collapsible maths topics, each with a formula block and at least two worked examples.
export const APPLIED_MATHS = 'Applied Maths - Statistics';

export function parseLesson(raw, file) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing front matter`);
  const meta = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].trim();
  }
  for (const key of ['id', 'title', 'module', 'level', 'minutes', 'goal', 'reviewed', 'evidence']) {
    if (!meta[key]) throw new Error(`${file}: front matter is missing "${key}"`);
  }
  const list = (v) => (v ? v.split(',').map((x) => x.trim()).filter(Boolean) : []);
  meta.prereqs = list(meta.prereqs);
  meta.minutes = Number(meta.minutes);
  const sections = [];
  // Split on "## Title" lines, ignoring any that sit inside a fenced block (diagram columns use "## ").
  let inFence = false, current = null;
  for (const line of m[2].split('\n')) {
    if (line.startsWith('```')) inFence = !inFence;
    const h = !inFence && line.match(/^## (.+)$/);
    if (h) { current = { title: h[1].trim(), lines: [] }; sections.push(current); }
    else if (current) current.lines.push(line);
  }
  for (const s of sections) { s.body = s.lines.join('\n').trim(); delete s.lines; }
  for (const req of REQUIRED_SECTIONS) {
    if (!sections.some((s) => s.title === req)) throw new Error(`${file}: missing required section "${req}"`);
  }
  const what = sections.find((s) => s.title === 'In plain words').body.split(/\s+/).length;
  if (what < 50) throw new Error(`${file}: "In plain words" has only ${what} words`);
  const am = sections.findIndex((s) => s.title === APPLIED_MATHS);
  if (am >= 0) {
    const s = sections[am];
    const topics = s.body.split('\n').filter((l) => /^### /.test(l)).length;
    const formulas = (s.body.match(/^```formula/gm) || []).length;
    const examples = (s.body.match(/^\*\*Example \d/gm) || []).length;
    if (topics < 1 || formulas < topics) throw new Error(`${file}: every "${APPLIED_MATHS}" topic needs a formula block`);
    if (examples < topics * 2) throw new Error(`${file}: every "${APPLIED_MATHS}" topic needs at least 2 "**Example n" lines`);
    const net = sections.findIndex((x) => x.title === '.NET (C#) example'), mb = sections.findIndex((x) => x.title === 'Maths behind it');
    if (!(net < am && am < mb)) throw new Error(`${file}: "${APPLIED_MATHS}" must sit between the .NET example and "Maths behind it"`);
  }
  const order = sections.map((s) => s.title).filter((t) => REQUIRED_SECTIONS.includes(t));
  if (order.join('|') !== REQUIRED_SECTIONS.join('|')) throw new Error(`${file}: sections out of order: ${order.join(', ')}`);
  return { ...meta, sections, file };
}

export function parseQA(body) {
  const qa = [];
  for (const block of body.split(/\n(?=Q:)/)) {
    const q = block.match(/^Q:\s*([\s\S]*?)\nA:\s*([\s\S]*)$/);
    if (q) qa.push({ q: q[1].trim(), a: q[2].trim() });
  }
  return qa;
}
