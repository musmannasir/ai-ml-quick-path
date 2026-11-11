// Diagram renderer for lesson Markdown. A fenced block
//
//   ```diagram <type> <Title of the diagram>
//   note: optional one-line caption shown under the diagram
//   - Label | short detail | kind
//   ```
//
// becomes accessible HTML+CSS (no images, no inline styles, no scripts; colours come from theme tokens).
// Types: flow, loop, layers, compare, nest, matrix, lanes, fan, merge, bar.  See docs in CLAUDE.md section 4.7.

export const DIAGRAM_TYPES = ['flow', 'loop', 'layers', 'compare', 'nest', 'matrix', 'lanes', 'fan', 'merge', 'bar'];
export const DIAGRAM_KINDS = ['plain', 'input', 'process', 'model', 'output', 'store', 'warn', 'bad'];
const TAGS = { input: 'Input', process: 'Process', model: 'Model', output: 'Output', store: 'Data store', warn: 'Risk', bad: 'Problem' };
const LIMITS = { label: 48, detail: 130, items: 8 };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
let counter = 0;

function parseItem(text, where) {
  const f = text.split('|').map((x) => x.trim());
  let kind = 'plain', detail = '';
  if (f.length === 2) { if (DIAGRAM_KINDS.includes(f[1]) && f[1] !== 'plain') kind = f[1]; else detail = f[1]; }
  if (f.length >= 3) { detail = f[1]; kind = f[2] || 'plain'; }
  if (!DIAGRAM_KINDS.includes(kind)) throw new Error(`${where}: unknown kind "${kind}" (use ${DIAGRAM_KINDS.join(', ')})`);
  if (!f[0]) throw new Error(`${where}: empty label`);
  if (f[0].length > LIMITS.label) throw new Error(`${where}: label longer than ${LIMITS.label} characters: "${f[0]}"`);
  if (detail.length > LIMITS.detail) throw new Error(`${where}: detail longer than ${LIMITS.detail} characters: "${detail}"`);
  return { label: f[0], detail, kind };
}

export function parseDiagram(info, bodyLines, where = 'diagram') {
  const m = info.trim().match(/^(\w+)\s+(.+)$/);
  if (!m) throw new Error(`${where}: write "diagram <type> <title>"`);
  const type = m[1].toLowerCase(), title = m[2].trim();
  if (!DIAGRAM_TYPES.includes(type)) throw new Error(`${where}: unknown diagram type "${type}" (use ${DIAGRAM_TYPES.join(', ')})`);
  const d = { type, title, note: '', loop: '', x: [], y: [], items: [], groups: [] };
  let group = null;
  for (const raw of bodyLines) {
    const line = raw.trim();
    if (!line) continue;
    let k;
    if ((k = line.match(/^(note|loop):\s*(.+)$/))) { d[k[1]] = k[2]; continue; }
    if ((k = line.match(/^(x|y):\s*(.+)$/))) { d[k[1]] = k[2].split('|').map((s) => s.trim()); continue; }
    if ((k = line.match(/^##\s+(.+)$/))) { const [t, kind] = k[1].split('|').map((s) => s.trim()); group = { title: t, kind: kind || 'plain', items: [] }; if (!DIAGRAM_KINDS.includes(group.kind)) throw new Error(`${where}: unknown kind "${group.kind}"`); d.groups.push(group); continue; }
    if ((k = line.match(/^-\s+(.+)$/))) { const it = parseItem(k[1], where); (group ? group.items : d.items).push(it); continue; }
    throw new Error(`${where}: cannot read line "${line}" (use "- label | detail | kind", "## group", "note: ...")`);
  }
  const need = (cond, msg) => { if (!cond) throw new Error(`${where} (${type} "${title}"): ${msg}`); };
  if (type === 'compare') { need(d.groups.length >= 2 && d.groups.length <= 4, 'needs 2 to 4 "## column" groups'); d.groups.forEach((g) => need(g.items.length >= 1, `column "${g.title}" is empty`)); }
  else if (type === 'lanes') { need(d.groups.length >= 2 && d.groups.length <= 4, 'needs 2 to 4 "## lane" groups'); d.groups.forEach((g) => need(g.items.length >= 2 && g.items.length <= LIMITS.items, `lane "${g.title}" needs 2 to ${LIMITS.items} items`)); }
  else if (type === 'matrix') { need(d.items.length === 4 && d.x.length === 2 && d.y.length === 2, 'needs x: a | b, y: c | d and exactly 4 items (row by row)'); }
  else if (type === 'nest') { need(d.items.length >= 2 && d.items.length <= 5, 'needs 2 to 5 items, outermost first'); }
  else if (type === 'fan' || type === 'merge') { need(d.items.length >= 3 && d.items.length <= 7, 'needs 3 to 7 items: the first is the single box, the rest are the many'); }
  else if (type === 'bar') { need(d.items.length >= 2 && d.items.length <= 8, 'needs 2 to 8 segments "- label | percent | kind"'); d.items.forEach((it) => need(/^\d+(\.\d+)?%?$/.test(it.detail) && Number(it.detail.replace('%', '')) > 0, `segment "${it.label}" needs a positive percent as its detail`)); }
  else { need(d.items.length >= 2 && d.items.length <= LIMITS.items, `needs 2 to ${LIMITS.items} items`); }
  if (d.groups.length && !['compare', 'lanes'].includes(type)) throw new Error(`${where}: "## groups" are only for compare and lanes`);
  return d;
}

export function renderDiagram(info, bodyLines, inline, ctx, where) {
  const d = parseDiagram(info, bodyLines, where);
  const inl = (s) => inline(s, ctx);
  const id = `dg-${++counter}`;
  const tag = (k) => (TAGS[k] ? `<span class="dg-tag">${TAGS[k]}</span>` : '');
  const box = (it, el = 'div', cls = '') => `<${el} class="dg-box k-${it.kind}${cls}">${tag(it.kind)}<strong class="dg-label">${inl(it.label)}</strong>${it.detail ? `<span class="dg-detail">${inl(it.detail)}</span>` : ''}</${el}>`;
  const cols = (n) => (n <= 4 ? n : n === 5 ? 5 : n === 6 ? 3 : 4);
  const flowList = (items, cls = '') => `<ol class="dg-flow c${cols(items.length)} n${items.length}${cls}">${items.map((it) => box(it, 'li')).join('')}</ol>`;
  let body = '';
  switch (d.type) {
    case 'flow': body = flowList(d.items); break;
    case 'loop': body = flowList(d.items) + `<p class="dg-return"><span aria-hidden="true">↺</span> ${inl(d.loop || 'Repeat')}</p>`; break;
    case 'layers': body = `<ol class="dg-layers">${d.items.map((it) => `<li class="dg-box k-${it.kind}">${tag(it.kind)}<strong class="dg-label">${inl(it.label)}</strong>${it.detail ? `<span class="dg-detail">${inl(it.detail)}</span>` : ''}</li>`).join('')}</ol>`; break;
    case 'compare': body = `<div class="dg-compare cols${d.groups.length}">${d.groups.map((g) => `<section class="dg-col k-${g.kind}"><p class="dg-col-title"><strong>${inl(g.title)}</strong></p><ul>${g.items.map((it) => `<li><strong>${inl(it.label)}</strong>${it.detail ? ` <span class="dg-detail">${inl(it.detail)}</span>` : ''}</li>`).join('')}</ul></section>`).join('')}</div>`; break;
    case 'nest': { const rec = (i) => `<div class="dg-nest k-${d.items[i].kind} depth${i}"><div class="dg-nest-head">${tag(d.items[i].kind)}<strong class="dg-label">${inl(d.items[i].label)}</strong>${d.items[i].detail ? `<span class="dg-detail">${inl(d.items[i].detail)}</span>` : ''}</div>${i + 1 < d.items.length ? rec(i + 1) : ''}</div>`; body = rec(0); break; }
    case 'matrix': body = `<div class="dg-matrix"><span class="dg-corner" aria-hidden="true"></span><span class="dg-axis">${inl(d.x[0])}</span><span class="dg-axis">${inl(d.x[1])}</span><span class="dg-axis dg-axis-y">${inl(d.y[0])}</span>${box(d.items[0])}${box(d.items[1])}<span class="dg-axis dg-axis-y">${inl(d.y[1])}</span>${box(d.items[2])}${box(d.items[3])}</div>`; break;
    case 'lanes': body = d.groups.map((g) => `<div class="dg-lane k-${g.kind}"><p class="dg-lane-title"><strong>${inl(g.title)}</strong></p>${flowList(g.items)}</div>`).join(''); break;
    case 'fan': body = `<div class="dg-fan">${box(d.items[0], 'div', ' dg-src')}<ul class="dg-fan-out">${d.items.slice(1).map((it) => box(it, 'li')).join('')}</ul></div>`; break;
    case 'merge': body = `<div class="dg-fan dg-merge"><ul class="dg-fan-out">${d.items.slice(1).map((it) => box(it, 'li')).join('')}</ul>${box(d.items[0], 'div', ' dg-src')}</div>`; break;
    case 'bar': {
      const total = d.items.reduce((s, it) => s + Number(it.detail.replace('%', '')), 0);
      const w = (it) => Math.max(5, Math.min(100, Math.round((Number(it.detail.replace('%', '')) / total * 100) / 5) * 5));
      body = `<ol class="dg-bar">${d.items.map((it) => `<li class="dg-seg w${w(it)} k-${it.kind}"><strong class="dg-label">${inl(it.label)}</strong><span class="dg-detail">${esc(it.detail.replace('%', ''))}%</span></li>`).join('')}</ol>`; break;
    }
  }
  return `<figure class="diagram dgt-${d.type}" role="group" aria-labelledby="${id}"><figcaption id="${id}"><span class="dg-kicker">Diagram</span> ${inl(d.title)}</figcaption>${body}${d.note ? `<p class="dg-note">${inl(d.note)}</p>` : ''}</figure>`;
}
