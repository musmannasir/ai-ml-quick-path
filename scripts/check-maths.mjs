// Maths checks without a full build.
//   node scripts/check-maths.mjs                 scan every lesson: structure + every "calculation = result" in the maths text
//   node scripts/check-maths.mjs <file.md ...>   only these lessons
// Exit code 1 if a lesson fails to parse or any arithmetic does not add up.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseLesson, APPLIED_MATHS } from '../src/lib/markdown.mjs';
import { scanArithmetic } from '../src/lib/maths.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : p.endsWith('.md') ? [p] : []; });
const files = process.argv.slice(2).length ? process.argv.slice(2) : walk(join(ROOT, 'src/content/lessons'));
const quiet = files.length > 5;
let bad = 0, checked = 0, topics = 0, moments = 0;
for (const f of files) {
  try {
    const raw = readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
    const l = parseLesson(raw, f);
    const s = l.sections.find((x) => x.title === APPLIED_MATHS);
    const nm = (raw.match(/^```maths /gm) || []).length; moments += nm;
    // Scan the maths text: the Applied Maths section, every maths moment, and the quick-check answers.
    const blocks = [...raw.matchAll(/^```maths [^\n]*\n([\s\S]*?)^```/gm)].map((m) => m[1]);
    const text = [s ? s.body.replace(/^```formula[\s\S]*?^```/gm, '') : '', ...blocks].join('\n');
    const r = scanArithmetic(text); checked += r.checked;
    if (s) topics += (s.body.match(/^### /gm) || []).length;
    if (r.problems.length) { bad++; console.log(`FAIL ${f.replace(ROOT, '').split(/[\\/]/).join('/')}`); for (const p of r.problems) console.log(`       ${p}`); }
    else if (!quiet) console.log(`ok   ${f}  (${s ? (s.body.match(/^### /gm) || []).length : 0} applied-maths topics, ${nm} maths moments, ${r.checked} calculations checked)`);
  } catch (e) { bad++; console.log(`FAIL ${e.message}`); }
}
console.log(`${files.length} lessons: ${moments} maths moments, ${topics} applied-maths topics, ${checked} calculations checked, ${bad} lessons with problems.`);
process.exit(bad ? 1 : 0);
