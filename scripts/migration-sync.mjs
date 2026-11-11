// Migration sync: node scripts/migration-sync.mjs [--out <folder>] [--no-zip]
// Regenerates the migration pack (markdown files + a source snapshot zip) so development can continue
// on another machine, and appends an entry to 10-sync-log.md describing what changed since the last run.
// Narrative files live in migration-src/ (edit those); generated files are rebuilt every run.
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const OUT = args.includes('--out') ? args[args.indexOf('--out') + 1] : join(ROOT, '..', 'migration');
const NOZIP = args.includes('--no-zip');
const imp = (p) => import(pathToFileURL(join(ROOT, p)).href);

const { parseLesson, APPLIED_MATHS } = await imp('src/lib/markdown.mjs');
const { MODULES, ROADMAPS, LESSON_ORDER } = await imp('src/data/curriculum.mjs');
const { CASES } = await imp('src/data/cases.mjs');
const { PROJECTS } = await imp('src/data/projects.mjs');
const { GLOSSARY, HARDWARE, CHECKPOINTS } = await imp('src/data/reference.mjs');

const now = new Date();
const p2 = (n) => String(n).padStart(2, '0');
const date = `${now.getFullYear()}-${p2(now.getMonth() + 1)}-${p2(now.getDate())}`;
const stamp = `${date} ${p2(now.getHours())}:${p2(now.getMinutes())}`;

// ---------- walk + hash the source tree ----------
const SKIP_DIRS = new Set(['node_modules', 'dist', 'release', '.git']);
function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const st = statSync(p);
    if (st.isDirectory()) { if (!SKIP_DIRS.has(f) && !(f === 'screenshots' && dir.endsWith('qa'))) walk(p, out); }
    else out.push(p);
  }
  return out;
}
const files = walk(ROOT);
const hashes = {};
for (const f of files) hashes[relative(ROOT, f).split(sep).join('/')] = createHash('sha1').update(readFileSync(f)).digest('hex').slice(0, 12);

// ---------- lessons ----------
const lessonsDir = join(ROOT, 'src/content/lessons');
const lessons = {};
for (const f of walk(lessonsDir).filter((x) => x.endsWith('.md'))) {
  const raw = readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
  const l = parseLesson(raw, relative(ROOT, f));
  const am = l.sections.find((s) => s.title === APPLIED_MATHS);
  l.diagrams = (raw.match(/^```diagram /gm) || []).length;
  l.pyBlocks = (raw.match(/^```(python|py)\b/gm) || []).length;
  l.csBlocks = (raw.match(/^```(cs|csharp)\b/gm) || []).length;
  l.outputs = (raw.match(/^```text Output of/gm) || []).length;
  l.mathTopics = am ? am.body.split('\n').filter((x) => /^### /.test(x)).map((x) => x.slice(4).replace(/\s*\(.*$/, '')) : [];
  l.words = raw.split(/\s+/).length;
  lessons[l.id] = l;
}

const table = (head, rows) => `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n${rows.map((r) => `| ${r.map((c) => String(c).replace(/\|/g, '\\|').replace(/\n/g, ' ')).join(' | ')} |`).join('\n')}\n`;

// ---------- counts ----------
const totals = {
  lessons: LESSON_ORDER.length,
  parts: MODULES.length,
  roadmaps: ROADMAPS.length,
  projects: PROJECTS.length,
  cases: CASES.length,
  glossary: GLOSSARY.length,
  checkpoints: CHECKPOINTS.length,
  diagrams: Object.values(lessons).reduce((a, l) => a + l.diagrams, 0),
  mathLessons: Object.values(lessons).filter((l) => l.mathTopics.length).length,
  mathTopics: Object.values(lessons).reduce((a, l) => a + l.mathTopics.length, 0),
  minutes: Object.values(lessons).reduce((a, l) => a + l.minutes, 0),
  pages: existsSync(join(ROOT, 'dist')) ? readdirSync(join(ROOT, 'dist'), { recursive: true }).filter((x) => String(x).endsWith('.html')).length : 'build not run',
};

// ---------- 03 content and data inventory (generated) ----------
let inv = `# 03 - Content and data inventory (generated)\n\n> Generated ${stamp} by scripts/migration-sync.mjs from the real source files. Do not edit by hand; rerun the exe.\n\n`;
inv += `## Totals\n\n${table(['Item', 'Count'], [
  ['Lessons', totals.lessons], ['Parts', totals.parts], ['Roadmaps', totals.roadmaps], ['Capstone projects', totals.projects],
  ['Company cases', totals.cases], ['Glossary terms', totals.glossary], ['Part quizzes (checkpoints)', totals.checkpoints],
  ['Diagrams in lessons', totals.diagrams], ['Lessons with Applied Maths - Statistics', `${totals.mathLessons} (${totals.mathTopics} topics)`],
  ['Study minutes (sum of lesson estimates)', `${totals.minutes} (about ${Math.round(totals.minutes / 60)} h)`], ['HTML pages in dist/', totals.pages],
])}\n`;
inv += `## Lessons by part\n\nColumns: level, study minutes, diagrams, Python blocks, C# blocks, executed-output blocks, applied-maths topics. File = src/content/lessons/<part>/<id>.md.\n\n`;
for (const m of MODULES) {
  const ids = m.groups.flatMap((g) => g.lessons);
  inv += `### ${m.title}\n\n${m.intro}\n\n`;
  inv += table(['Lesson id', 'Title', 'Level', 'Min', 'Diag', 'Py', 'C#', 'Out', 'Applied maths topics', 'Code status (front matter)'],
    ids.map((id) => { const l = lessons[id]; return [id, l.title, l.level, l.minutes, l.diagrams, l.pyBlocks, l.csBlocks, l.outputs, l.mathTopics.join('; ') || '-', l.code || '-']; }));
  inv += `\nGroups: ${m.groups.map((g) => `${g.title} (${g.lessons.join(', ')})`).join(' | ')}\n\n`;
}
inv += `## Prerequisite map\n\n${table(['Lesson', 'Prerequisites'], LESSON_ORDER.map((id) => [id, lessons[id].prereqs.join(', ') || '-']))}\n`;
inv += `## Roadmaps\n\n`;
for (const r of ROADMAPS) {
  inv += `### ${r.title} (id \`${r.id}\`)\n\n${[r.advice, r.estimate].filter(Boolean).join(' ')}\n\n`;
  inv += table(['Step', 'Title', 'Effort', 'Lessons', 'Capstones'], (r.nodes || r.steps?.map((s, i) => ({ n: i + 1, title: s, lessons: [s] })) || []).map((n) => [n.n, n.title, n.effort || '', (n.lessons || []).join(', '), (n.projects || []).join(', ')])) + '\n';
}
inv += `## Capstone projects\n\n${table(['id', 'No.', 'Title', 'Track', 'Level', 'Effort', 'Prerequisite lessons'], PROJECTS.map((p) => [p.id, p.n, p.title, p.track, p.level, p.effort, (p.prereqs || []).join(', ')]))}\n`;
inv += `Each capstone object has: id, n, title, track (applied|ml|lm), level, effort, reuses[], requirement, prereqs[], architecture[], steps[], python, dotnet, io{input,output}, data, tests[], rubric[], stretch[], security, acceptance[], structure, evidence (src/data/projects.mjs).\n\n`;
inv += `## Company cases\n\n${table(['id', 'Company', 'Industry', 'Difficulty', 'Confirmed facts', 'Sources (title, publisher; URLs only in CONTENT_SOURCES.md)'], CASES.map((c) => [c.id, c.company, c.industry, c.difficulty, (c.results || []).length + ' results', (c.sources || []).map((s) => `${s.title} (${s.publisher})`).join('; ')]))}\n`;
inv += `## Hardware tiers\n\n${table(['Tier', 'Cost', 'Supports', 'Note'], HARDWARE.map((h) => [h.tier, h.costLabel || h.cost, Object.entries(h.supports || {}).map(([k, v]) => `${k}: ${v}`).join(', '), h.note || '']))}\n`;
inv += `## Part quizzes\n\n${table(['Quiz id', 'Title', 'Questions'], CHECKPOINTS.map((c) => [c.id, c.title, c.questions.length]))}\n`;
inv += `## Glossary terms (${GLOSSARY.length})\n\nFormat in src/data/reference.mjs: [term, definition, lessonId].\n\n${[...GLOSSARY].sort((a, b) => a[0].localeCompare(b[0])).map((g) => `${g[0]} (${g[2]})`).join(', ')}\n\n`;
inv += `## Applied Maths - Statistics topics (all lessons)\n\n${table(['Lesson', 'Topics'], Object.values(lessons).filter((l) => l.mathTopics.length).map((l) => [l.id, l.mathTopics.join('; ')]))}\nLessons without the section (tooling only): ${Object.values(lessons).filter((l) => !l.mathTopics.length).map((l) => l.id).join(', ') || 'none'}.\n\n`;
inv += `## Source file hashes (first 12 chars of SHA-1)\n\nUsed by the sync log to detect what changed. ${Object.keys(hashes).length} files tracked.\n`;

// ---------- design tokens (generated) ----------
const css = readFileSync(join(ROOT, 'public/assets/app.css'), 'utf8');
const tokenBlocks = [...css.matchAll(/(:root(?:\[data-theme="dark"\])?|:root:not\(\[data-theme="light"\]\))\s*\{([^}]*)\}/g)].slice(0, 3).map((m) => `/* ${m[1]} */\n${m[2].trim()}`).join('\n\n');
const design = `\n\n## Appendix: theme tokens (generated from public/assets/app.css, ${stamp})\n\n\`\`\`css\n${tokenBlocks}\n\`\`\`\n\nCSS size: ${(css.length / 1024).toFixed(0)} KB, ${css.split('\n').length} lines. Client script: ${(readFileSync(join(ROOT, 'public/assets/app.js'), 'utf8').length / 1024).toFixed(0)} KB.\n`;

// ---------- test inventory (generated) ----------
const e2e = readFileSync(join(ROOT, 'tests/e2e.mjs'), 'utf8');
const checks = [...e2e.matchAll(/expect\(\s*[`'"]([^`'"]{10,200})/g)].map((m) => m[1].replace(/\$\{[^}]*\}/g, '…'));
const testsAppendix = `\n\n## Appendix: browser checks (generated from tests/e2e.mjs, ${checks.length} expect() calls found; some run per theme or per page)\n\n${checks.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n`;

// ---------- narrative files ----------
mkdirSync(OUT, { recursive: true });
const SRC = join(ROOT, 'migration-src');
const fill = (s) => s
  .replaceAll('{{DATE}}', date).replaceAll('{{STAMP}}', stamp)
  .replaceAll('{{LESSONS}}', totals.lessons).replaceAll('{{PARTS}}', totals.parts).replaceAll('{{PROJECTS}}', totals.projects)
  .replaceAll('{{CASES}}', totals.cases).replaceAll('{{GLOSSARY}}', totals.glossary).replaceAll('{{DIAGRAMS}}', totals.diagrams)
  .replaceAll('{{MATHLESSONS}}', totals.mathLessons).replaceAll('{{MATHTOPICS}}', totals.mathTopics).replaceAll('{{PAGES}}', totals.pages)
  .replaceAll('{{HOURS}}', Math.round(totals.minutes / 60)).replaceAll('{{ROADMAPS}}', totals.roadmaps);
const written = [];
for (const f of readdirSync(SRC).filter((x) => x.endsWith('.md')).sort()) {
  let s = fill(readFileSync(join(SRC, f), 'utf8'));
  if (f.startsWith('04-')) s += design;
  if (f.startsWith('06-')) s += testsAppendix;
  writeFileSync(join(OUT, f), s);
  written.push(f);
}
writeFileSync(join(OUT, '03-content-and-data-inventory.md'), inv); written.push('03-content-and-data-inventory.md');

// ---------- sync log (appended each run) ----------
const statePath = join(OUT, '.sync-state.json');
let prev = null;
try { prev = JSON.parse(readFileSync(statePath, 'utf8')); } catch { /* first run */ }
const logPath = join(OUT, '10-sync-log.md');
let log = existsSync(logPath) ? readFileSync(logPath, 'utf8') : `# 10 - Sync log\n\nEach run of UpdateMigration.exe appends one entry: what changed in the project since the previous run. Newest at the bottom. Use it on the other machine to see exactly what is new.\n`;
let entry = `\n## ${stamp}${prev ? '' : ' (first sync: baseline)'}\n\n`;
entry += `Totals: ${totals.lessons} lessons, ${totals.projects} capstones, ${totals.cases} cases, ${totals.glossary} glossary terms, ${totals.diagrams} diagrams, ${totals.mathLessons} lessons with applied maths (${totals.mathTopics} topics), ${totals.pages} pages.\n\n`;
if (prev) {
  const added = Object.keys(hashes).filter((k) => !(k in prev.hashes));
  const removed = Object.keys(prev.hashes).filter((k) => !(k in hashes));
  const changed = Object.keys(hashes).filter((k) => k in prev.hashes && prev.hashes[k] !== hashes[k]);
  const list = (t, a) => (a.length ? `**${t} (${a.length}):**\n${a.slice(0, 80).map((x) => `- ${x}`).join('\n')}${a.length > 80 ? `\n- ... and ${a.length - 80} more` : ''}\n\n` : '');
  entry += list('Added', added) + list('Changed', changed) + list('Removed', removed);
  if (!added.length && !changed.length && !removed.length) entry += 'No file changes since the last sync.\n\n';
  const d = (k, label) => (prev.totals && prev.totals[k] !== totals[k] ? `- ${label}: ${prev.totals[k]} -> ${totals[k]}\n` : '');
  const deltas = d('lessons', 'Lessons') + d('projects', 'Capstones') + d('cases', 'Cases') + d('glossary', 'Glossary terms') + d('diagrams', 'Diagrams') + d('mathTopics', 'Applied maths topics');
  if (deltas) entry += `**Count changes:**\n${deltas}\n`;
} else {
  entry += `Baseline recorded: ${Object.keys(hashes).length} files tracked. Everything described in the other files is the current state.\n\n`;
}
entry += `Notes for the next person: add a short sentence here by hand if a change needs explaining (why, not what).\n`;
writeFileSync(logPath, log + entry);
written.push('10-sync-log.md');
writeFileSync(statePath, JSON.stringify({ stamp, totals, hashes }, null, 1));

// ---------- source snapshot zip ----------
let zipNote = 'skipped (--no-zip)';
if (!NOZIP) {
  const stage = join(OUT, '.stage', 'ai-ml-quick-path');
  rmSync(join(OUT, '.stage'), { recursive: true, force: true });
  mkdirSync(stage, { recursive: true });
  for (const rel of Object.keys(hashes)) {
    if (rel.startsWith('qa/') ) continue;
    const to = join(stage, rel); mkdirSync(dirname(to), { recursive: true }); cpSync(join(ROOT, rel), to);
  }
  const zip = join(OUT, 'source-snapshot.zip');
  rmSync(zip, { force: true });
  const r = spawnSync('powershell', ['-NoProfile', '-Command', `Compress-Archive -Path '${join(OUT, '.stage', 'ai-ml-quick-path')}' -DestinationPath '${zip}' -Force`], { encoding: 'utf8' });
  rmSync(join(OUT, '.stage'), { recursive: true, force: true });
  zipNote = r.status === 0 && existsSync(zip) ? `source-snapshot.zip (${(statSync(zip).size / 1024).toFixed(0)} KB, without node_modules, dist and qa)` : `FAILED: ${r.stderr || r.stdout}`;
}

console.log(`Migration pack updated in ${OUT}`);
for (const w of written) console.log('  wrote ' + w);
console.log('  snapshot: ' + zipNote);
console.log(`  totals: ${totals.lessons} lessons, ${totals.projects} capstones, ${totals.cases} cases, ${totals.glossary} glossary terms, ${totals.mathTopics} applied-maths topics`);
