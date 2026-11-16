// Validate every ```diagram block in the lessons without writing dist/.
//   node scripts/check-diagrams.mjs            all lessons
//   node scripts/check-diagrams.mjs ml dl      only these part folders
// Exits 1 on any error. Rules:
//   - the block parses (see src/lib/diagram.mjs);
//   - a lesson has at least MIN diagrams (default 3);
//   - a step diagram (flow, loop, fan, merge) has at least 3 steps;
//   - diagram titles are unique within a lesson;
//   - every number shown in a diagram (bar charts excepted: their percents are illustrative) also appears in the
//     lesson text outside diagrams, so a diagram cannot carry a figure the lesson never states.
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDiagram } from '../src/lib/diagram.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content', 'lessons');
const MIN = Number(process.env.MIN_DIAGRAMS || 3);
const STEPS = new Set(['flow', 'loop', 'fan', 'merge']);
const nums = (s) => (s.match(/\d[\d,.]*\d|\d/g) || []).map((x) => x.replace(/,/g, ''));
const parts = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(ROOT);
let errors = 0, total = 0;
for (const part of parts) {
  for (const f of readdirSync(join(ROOT, part)).filter((x) => x.endsWith('.md')).sort()) {
    const text = readFileSync(join(ROOT, part, f), 'utf8').replace(/\r\n/g, '\n');
    const lines = text.split('\n');
    const prose = text.replace(/^```diagram[\s\S]*?^```/gm, ' ').replace(/,/g, '');
    const titles = new Set();
    let n = 0;
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^```diagram\s*(.*)$/);
      if (!m) continue;
      const body = [];
      const start = i + 1;
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) body.push(lines[i++]);
      const [type, ...words] = m[1].trim().split(/\s+/), title = words.join(' ');
      const where = `${part}/${f}:${start} "${title}"`;
      if (STEPS.has(type) && body.filter((l) => l.startsWith('- ')).length < 3) { errors++; console.log(`ERROR ${where}: a ${type} diagram needs at least 3 steps`); }
      if (titles.has(title)) { errors++; console.log(`ERROR ${where}: duplicate diagram title in this lesson`); }
      titles.add(title);
      if (type !== 'bar') for (const x of new Set(nums(body.join(' ')))) if (x.length > 1 && !prose.includes(x)) { errors++; console.log(`ERROR ${where}: number ${x} is not in the lesson text`); }
      try { parseDiagram(m[1], body, `${part}/${f}:${start}`); n++; } catch (e) { errors++; console.log('ERROR', e.message); }
    }
    total += n;
    if (n < MIN) { errors++; console.log(`ERROR ${part}/${f}: only ${n} diagrams (minimum ${MIN})`); }
    if (process.env.VERBOSE) console.log(`${String(n).padStart(2)}  ${part}/${f}`);
  }
}
console.log(`${total} diagrams, ${errors} problem(s)`);
process.exit(errors ? 1 : 0);
