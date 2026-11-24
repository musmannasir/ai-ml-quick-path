// One page with every visual, grouped by lesson, with a link to the lesson screen and a light/dark switch.
// For the owner's local review: run `npm run build`, then `npm run serve`, and open http://localhost:8080/visuals-sheet.html
// (the local server builds the page on each request from the lesson files, so it always matches them; it is not part of the site).
// `npm run sheet:visuals` writes the same page to qa/visuals.html for a quick look (it needs the server for styling).
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LES = join(ROOT, 'src', 'content', 'lessons');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export function buildSheet(css = 'assets/app.css', base = 'lessons/') {
const rows = [];
for (const part of readdirSync(LES).sort()) {
  for (const fn of readdirSync(join(LES, part)).filter((f) => f.endsWith('.md')).sort()) {
    const id = fn.replace(/\.md$/, '');
    const lines = readFileSync(join(LES, part, fn), 'utf8').replace(/\r\n/g, '\n').split('\n');
    let lastDiagram = '';
    for (let i = 0; i < lines.length; i++) {
      const f = lines[i].match(/^```(diagram|visual)\s*(.*)$/);
      if (!f) continue;
      const body = [];
      for (i++; i < lines.length && !lines[i].startsWith('```'); i++) body.push(lines[i]);
      if (f[1] === 'diagram') { lastDiagram = f[2].replace(/^\S+\s*/, '').trim(); continue; }
      const val = (k) => (body.find((l) => l.startsWith(k + ':')) || '').slice(k.length + 1).trim();
      const file = val('file'), p = join(ROOT, 'src', 'visuals', file + '.svg');
      rows.push({ id, diagram: lastDiagram, title: f[2].trim(), file, caption: val('caption'), svg: existsSync(p) ? readFileSync(p, 'utf8').replace(/<!--[\s\S]*?-->/g, '') : '<p>MISSING</p>' });
    }
  }
}
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>All visuals</title>
<link rel="stylesheet" href="${css}"><style>body{padding:1rem 1.5rem;max-width:1100px;margin:0 auto}h2{margin:2rem 0 .2rem}.meta{color:var(--ink-2);font-size:.9rem;margin:0 0 .5rem}.sw{position:sticky;top:0;background:var(--bg);padding:.5rem 0;z-index:2}</style></head><body>
<div class="sw"><strong>${rows.length} visuals in ${new Set(rows.map((r) => r.id)).size} lessons.</strong> <button class="tab" type="button" id="lt">Light</button> <button class="tab" type="button" id="dk">Dark</button></div>
${rows.map((r) => `<h2>${esc(r.title)}</h2><p class="meta">Lesson <a href="${base}${r.id}.html">${r.id}</a> · beside the diagram "${esc(r.diagram)}" · src/visuals/${r.file}.svg</p><figure class="vz-fig">${r.svg}<figcaption>${esc(r.caption)}</figcaption></figure>`).join('\n')}
<script>document.getElementById('lt').onclick=function(){document.documentElement.dataset.theme='light'};document.getElementById('dk').onclick=function(){document.documentElement.dataset.theme='dark'};</script></body></html>`;
return { html, count: rows.length };
}

if (process.argv[1] && process.argv[1].endsWith('visual-sheet.mjs')) {
  const { html, count } = buildSheet('../dist/assets/app.css', 'http://localhost:8080/lessons/');
  writeFileSync(join(ROOT, 'qa', 'visuals.html'), html);
  console.log(`Wrote qa/visuals.html (${count} visuals). For the styled page run npm run serve and open http://localhost:8080/visuals-sheet.html`);
}
