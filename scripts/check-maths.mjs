// Validate lesson files without building: node scripts/check-maths.mjs <file.md ...>
import { readFileSync } from 'node:fs';
import { parseLesson, APPLIED_MATHS } from '../src/lib/markdown.mjs';
let bad = 0;
for (const f of process.argv.slice(2)) {
  try {
    const l = parseLesson(readFileSync(f, 'utf8').replace(/\r\n/g, '\n'), f);
    const s = l.sections.find((x) => x.title === APPLIED_MATHS);
    console.log(`ok   ${f}${s ? `  (${(s.body.match(/^### /gm) || []).length} topics)` : '  (no applied maths section)'}`);
  } catch (e) { bad++; console.log(`FAIL ${e.message}`); }
}
process.exit(bad ? 1 : 0);
