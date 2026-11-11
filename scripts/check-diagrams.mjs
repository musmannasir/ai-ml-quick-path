// Validate every ```diagram block in the lessons without writing dist/.
//   node scripts/check-diagrams.mjs            all lessons
//   node scripts/check-diagrams.mjs ml dl      only these part folders
// Prints the number of diagrams per lesson and exits 1 on any error or if a lesson has fewer than MIN (default 3).
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDiagram } from '../src/lib/diagram.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content', 'lessons');
const MIN = Number(process.env.MIN_DIAGRAMS || 3);
const parts = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(ROOT);
let errors = 0, total = 0;
for (const part of parts) {
  for (const f of readdirSync(join(ROOT, part)).filter((x) => x.endsWith('.md')).sort()) {
    const lines = readFileSync(join(ROOT, part, f), 'utf8').replace(/\r\n/g, '\n').split('\n');
    let n = 0;
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^```diagram\s*(.*)$/);
      if (!m) continue;
      const body = [];
      const start = i + 1;
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) body.push(lines[i++]);
      try { parseDiagram(m[1], body, `${part}/${f}:${start}`); n++; } catch (e) { errors++; console.log('ERROR', e.message); }
    }
    total += n;
    if (n < MIN) { errors++; console.log(`ERROR ${part}/${f}: only ${n} diagrams (minimum ${MIN})`); }
    console.log(`${String(n).padStart(2)}  ${part}/${f}`);
  }
}
console.log(`${total} diagrams, ${errors} problem(s)`);
process.exit(errors ? 1 : 0);
