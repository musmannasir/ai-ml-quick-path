// Lists every Visual tab in the lessons: which lesson (screen) it is on, under which section, next to which diagram, and which file draws it.
// Run:  npm run list:visuals        (add --open to print only the local addresses; the preview server is `npm run serve`, port 8080)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LES = join(ROOT, 'src', 'content', 'lessons');
const BASE = process.env.PREVIEW_URL || 'http://localhost:8080';
const rows = [];
let total = 0;

for (const part of readdirSync(LES)) {
  for (const fn of readdirSync(join(LES, part)).filter((f) => f.endsWith('.md'))) {
    const id = fn.replace(/\.md$/, '');
    const lines = readFileSync(join(LES, part, fn), 'utf8').replace(/\r\n/g, '\n').split('\n');
    let section = '', lastDiagram = '', diagrams = 0;
    for (let i = 0; i < lines.length; i++) {
      const h = lines[i].match(/^(#{2,4})\s+(.+)$/);
      if (h) { section = h[2]; continue; }
      const f = lines[i].match(/^```(diagram|visual)\s*(.*)$/);
      if (!f) continue;
      const body = [];
      for (i++; i < lines.length && !lines[i].startsWith('```'); i++) body.push(lines[i]);
      if (f[1] === 'diagram') { diagrams++; lastDiagram = f[2].replace(/^\S+\s*/, '').trim(); continue; }
      const file = (body.find((l) => l.startsWith('file:')) || '').replace('file:', '').trim();
      rows.push({ lesson: id, section, diagram: lastDiagram, title: f[2].trim(), file, exists: existsSync(join(ROOT, 'src', 'visuals', file + '.svg')), url: `${BASE}/lessons/${id}.html` });
      total++;
    }
  }
}

if (!rows.length) { console.log('No Visual tabs yet.'); process.exit(0); }
if (process.argv.includes('--open')) { for (const u of [...new Set(rows.map((r) => r.url))]) console.log(u); process.exit(0); }
for (const r of rows) {
  console.log(`${r.lesson}\n  screen:  ${r.url}\n  section: ${r.section}\n  diagram: ${r.diagram}  (tab "Boxes")\n  visual:  ${r.title}  (tab "Visual", src/visuals/${r.file}.svg${r.exists ? '' : ' MISSING'})\n`);
}
console.log(`${total} visual(s) in ${new Set(rows.map((r) => r.lesson)).size} lesson(s).`);
