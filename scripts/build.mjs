// Static site build: node scripts/build.mjs   (no dependencies)
// Output: dist/  (flat .html files with relative links; works on any static host and from file://)
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { INLINE_SCRIPT } from '../src/lib/layout.mjs';
import { APPLIED_MATHS, esc, md, parseLesson, parseQA, slug } from '../src/lib/markdown.mjs';
import { navGroups, page, SITE, ADS, adSlot } from '../src/lib/layout.mjs';
import { LEVELS, LESSON_ORDER, MODULES, REVIEWED, ROADMAPS, ROUTES, STARTS, moduleOfLesson } from '../src/data/curriculum.mjs';
import { CASES, CASE_CHECKS } from '../src/data/cases.mjs';
import { PROJECTS, STARTERS } from '../src/data/projects.mjs';
import { CHECKPOINTS, GLOSSARY, HARDWARE, WORKLOADS } from '../src/data/reference.mjs';
import * as P from '../src/pages/pages.mjs';
import { tokensCss } from '../src/design/tokens.mjs';
import { SOURCES, LESSON_REFS } from '../src/data/sources.mjs';
import { resetMathSeq } from '../src/lib/maths.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p, fallback) => { try { return JSON.parse(readFileSync(join(ROOT, p), 'utf8')); } catch { return fallback; } };
// Evidence files written by real runs: scripts/check-links.mjs and scripts/verify-code.mjs.
const SOURCE_STATUS = readJson('src/data/source-status.json', {});
const CODE_STATUS = readJson('qa/code-status.json', { lessons: {}, examples: [], tools: {} });
const DIST = join(ROOT, 'dist');
const errors = [];

// ---------- load lessons ----------
function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : f.endsWith('.md') ? [p] : [];
  });
}
const lessons = {};
for (const file of walk(join(ROOT, 'src/content/lessons'))) {
  try {
    const l = parseLesson(readFileSync(file, 'utf8'), file.slice(ROOT.length + 1).split(/[\\/]/).join('/'));
    if (lessons[l.id]) errors.push(`duplicate lesson id ${l.id}`);
    lessons[l.id] = l;
  } catch (e) { errors.push(e.message); }
}
for (const id of LESSON_ORDER) if (!lessons[id]) errors.push(`curriculum lists lesson "${id}" but no file defines it`);
for (const id of Object.keys(lessons)) if (!LESSON_ORDER.includes(id)) errors.push(`lesson "${id}" is not placed in curriculum.mjs`);
if (errors.length) { console.error('Build failed:\n- ' + errors.join('\n- ')); process.exit(1); }

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

const projectsById = Object.fromEntries(PROJECTS.map((p) => [p.id, p]));
const casesById = Object.fromEntries(CASES.map((c) => [c.id, c]));
const groups = navGroups(lessons);

// ---------- link resolution ----------
function makeCtx(fromPath) {
  const root = '../'.repeat(fromPath.split('/').length - 1);
  return {
    root,
    link(text, url) {
      let href;
      const [scheme, rest] = url.includes(':') && !/^https?:/.test(url) ? url.split(/:(.*)/s) : [null, url];
      if (/^https?:\/\//.test(url)) {
        // Outside addresses are never written into content. Register the source in src/data/sources.mjs and link to it as [text](source:id).
        errors.push(`${fromPath}: raw outside address not allowed (${url}); register it in src/data/sources.mjs and use source:id`);
        return text;
      } else if (scheme === 'source') {
        if (!SOURCES[rest]) { errors.push(`${fromPath}: unknown source ${rest}`); return text; }
        return sourceLink(rest, text);
      } else if (scheme === 'lesson') {
        if (!lessons[rest]) errors.push(`${fromPath}: unknown lesson link ${rest}`);
        href = `lessons/${rest}.html`;
      } else if (scheme === 'project') {
        if (!projectsById[rest]) errors.push(`${fromPath}: unknown project link ${rest}`);
        href = `projects/${rest}.html`;
      } else if (scheme === 'case') {
        if (!casesById[rest]) errors.push(`${fromPath}: unknown case link ${rest}`);
        href = `cases/${rest}.html`;
      } else if (scheme === 'page') {
        href = rest;
      } else if (url.startsWith('#')) {
        return `<a href="${esc(url)}">${text}</a>`;
      } else {
        errors.push(`${fromPath}: unsupported link ${url}`);
        href = url;
      }
      return `<a href="${root}${esc(href)}">${text}</a>`;
    },
  };
}

// A link to a registered outside source. It is an ordinary link: nothing is loaded from the other site.
function sourceLink(id, text) {
  const s = SOURCES[id];
  return `<a class="ext" href="${esc(s.url)}" rel="noopener noreferrer external">${text || esc(s.title)}</a>`;
}
// What the last real link check found, in words (never "verified" unless the check returned the page).
function sourceNote(id) {
  const st = SOURCE_STATUS[id];
  if (!st) return 'Link not checked yet.';
  if (st.result === 'ok') return `Link checked ${st.checked}.`;
  if (st.result === 'moved') return `Review needed: on ${st.checked} this address led to a different page, so the source may have moved.`;
  if (st.result === 'blocked') return `Review needed: on ${st.checked} the site refused an automated check, so the link was not confirmed.`;
  return `Review needed: the link did not open on ${st.checked}.`;
}
const sourceItem = (id, extra = '') => `<li><span class="ref-title">${sourceLink(id)}</span> <span class="small muted">${esc(SOURCES[id].publisher)}${extra ? '. ' + esc(extra) : ''}. Outside site. ${esc(sourceNote(id))}</span></li>`;
const lessonLink = (id, ctx) => `<a href="${ctx.root}lessons/${id}.html">${esc(lessons[id].title)}</a>`;
const levelBadge = (level) => `<span class="badge badge-${slug(level)}">${esc(level)}</span>`;
const fmtMinutes = (m) => (m >= 90 ? `${(m / 60).toFixed(m % 60 ? 1 : 0)} h` : `${m} min`);

// ---------- output helpers ----------
const pages = [];      // for search index and sitemap
function emit(path, opts) {
  const html = page({ ...opts, path, groups });
  const out = join(DIST, path);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  pages.push({ path, title: opts.title, section: opts.section || '', keywords: opts.keywords || '' });
}

function tocFor(sections) {
  return `<aside class="toc" aria-label="On this page"><h2 class="toc-title">On this page</h2><ol>${
    sections.map((s) => `<li><a href="#${slug(s)}">${esc(s)}</a></li>`).join('')}</ol></aside>`;
}


// Code status pills come from qa/code-status.json, which scripts/verify-code.mjs writes after really compiling the
// C# samples and running the Python ones. The front matter `code:` line only adds a human note; it cannot turn a
// failed or unverified sample green.
function codeEvidence(l) {
  const rec = CODE_STATUS.lessons[l.id] || { python: [], csharp: [] };
  const tools = CODE_STATUS.tools || {};
  const out = [];
  // Python: "run" needs (a) the lesson to quote output from an example programme and (b) every example programme to have run.
  const ex = CODE_STATUS.examples || [];
  const allRan = ex.length > 0 && ex.every((e) => e.result === 'ran');
  const claims = /executed|computed/i.test(l.code || '');
  const py = rec.python;
  const ranBlocks = py.filter((x) => x.result === 'ran').length;
  if (claims && allRan) out.push({ lang: 'python', kind: 'ok', label: 'Python: example run', detail: `The example programme behind this lesson's quoted output ran on ${ex[0].date} (${tools.python || 'Python'}).${py.length ? ` ${py.length} code block${py.length > 1 ? 's' : ''} in the lesson passed a syntax check${ranBlocks ? `, ${ranBlocks} also ran on their own` : ''}.` : ''}` });
  else if (py.length && py.every((x) => x.result === 'ran')) out.push({ lang: 'python', kind: 'ok', label: 'Python: run', detail: `All ${py.length} Python blocks ran on ${py[0].date} (${tools.python || 'Python'}).` });
  else if (py.length && py.every((x) => x.result !== 'syntax-error')) out.push({ lang: 'python', kind: 'warn', label: 'Python: syntax checked, not run', detail: `Valid Python (checked ${py[0].date}), but not run here. ${[...new Set(py.map((x) => x.detail).filter(Boolean))].slice(0, 2).join(' ')}` });
  else out.push({ lang: 'python', kind: 'warn', label: 'Python: not verified', detail: py.length ? 'At least one Python block failed the syntax check.' : 'No verification record yet. Run npm run verify:code.' });
  const cs = rec.csharp;
  const okN = cs.filter((x) => x.result === 'compiled').length;
  const pk = [...new Set(cs.flatMap((x) => Object.entries(x.packages || {}).map(([n, v]) => `${n} ${v}`)))];
  const ranN = cs.filter((x) => x.run === 'ran').length;
  const why = [...new Set(cs.filter((x) => x.run !== 'ran').map((x) => x.runDetail).filter(Boolean))].slice(0, 2).join(' ');
  const runNote = ranN === cs.length ? (cs.length === 1 ? ' It also ran to the end without error.' : ' All of them also ran to the end without error.')
    : ranN ? ` ${ranN} of them also ran to the end without error. Not run: ${why || 'the others need a model, a service or data.'}`
      : ` Compiled is not the same as run. Not run: ${why || 'it needs a model, a service or data that is not part of the sample.'}`;
  if (cs.length && okN === cs.length) out.push({ lang: 'cs', kind: 'ok', label: ranN === cs.length ? 'C#: compiled and run' : 'C#: compiled', detail: `${cs.length === 1 ? 'The C# sample' : `All ${cs.length} C# samples`} compiled on ${cs[0].date} with .NET SDK ${tools.dotnet || ''}${pk.length ? ` (${pk.join(', ')})` : ' (no extra packages)'}.${runNote}` });
  else if (cs.length) out.push({ lang: 'cs', kind: 'warn', label: `C#: ${okN} of ${cs.length} compiled`, detail: `Checked ${cs[0].date} with .NET SDK ${tools.dotnet || ''}. ${cs.length - okN} sample${cs.length - okN > 1 ? 's do' : ' does'} not compile as shown, usually because it is an excerpt that needs code from elsewhere in the lesson.` });
  else out.push({ lang: 'cs', kind: 'warn', label: 'C#: not verified', detail: 'No compile record yet. Run npm run verify:code.' });
  return out;
}
// Applied Maths worked examples are written as one paragraph ("**Example 1: label.** sentence. sentence."). For reading,
// each sentence is shown on its own numbered line. This changes the layout only; the words and numbers are the author's.
const ABBREV = /(?:\b(?:e\.g|i\.e|vs|approx|Fig|No|etc)\.|\b[A-Z]\.)$/;
function splitSentences(text) {
  const out = []; let cur = '';
  for (const piece of text.split(/(?<=[.!?])\s+(?=[A-Z0-9(\u2212-])/)) {
    cur = cur ? cur + ' ' + piece : piece;
    // Keep going when the break is not a real sentence end: an abbreviation or an open bracket.
    const open = (cur.match(/\(/g) || []).length > (cur.match(/\)/g) || []).length;
    if (ABBREV.test(cur) || open) continue;
    out.push(cur); cur = '';
  }
  if (cur) out.push(cur);
  return out;
}
function mathsTopicHtml(lines, ctx) {
  const blocks = []; let buf = [];
  const flush = () => { if (buf.length) { blocks.push({ md: buf.join('\n') }); buf = []; } };
  let fence = false;
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (ln.startsWith('```')) fence = !fence;
    const m = !fence && ln.match(/^\*\*(Example \d+[^*]*)\*\*\s*(.*)$/);
    if (!m) { buf.push(ln); continue; }
    flush();
    let rest = m[2];
    while (i + 1 < lines.length && lines[i + 1].trim() && !/^(\*\*|```|###|\||>|-\s|\d+\.\s)/.test(lines[i + 1])) rest += ' ' + lines[++i].trim();
    blocks.push({ title: m[1], rest });
  }
  flush();
  const one = (s) => md(s, ctx).replace(/^<p>|<\/p>$/g, '');
  return blocks.map((b) => {
    if (b.md !== undefined) return md(b.md, ctx);
    const parts = splitSentences(b.rest);
    return `<div class="ex"><p class="ex-title"><strong>${one(b.title)}</strong></p>${parts.length > 1 ? `<ol class="ex-steps">${parts.map((s) => `<li>${one(s)}</li>`).join('')}</ol>` : `<p>${one(b.rest)}</p>`}</div>`;
  }).join('\n');
}
const pill = (e) => `<span class="pill pill-${e.kind}">${esc(e.label)}</span>`;

// ---------- lesson pages ----------
const roadmapNodesForLesson = {};
for (const r of ROADMAPS) for (const n of r.nodes) for (const l of n.lessons) (roadmapNodesForLesson[l] ||= []).push({ r, n });

const mathsIndex = [];          // every maths moment, for the Maths map
const usedSources = new Set();  // every outside source a page links to
const searchText = [];          // full-text search entries, one per lesson section
const leadsTo = {};             // lesson id -> lessons that list it as a prerequisite
for (const id of LESSON_ORDER) for (const p of lessons[id].prereqs) (leadsTo[p] ||= []).push(id);
const MATHS_LABEL = { none: 'No maths', 'basic arithmetic': 'Basic arithmetic', algebra: 'Some algebra', 'advanced optional': 'Arithmetic, with optional advanced maths' };
// Plain text of a section for search: drop code, keep the words of diagrams and maths moments.
const plainText = (body) => body.replace(/^```(?:python|py|cs|csharp|bash|sh|json|yaml|sql|http|powershell|js)[^\n]*\n[\s\S]*?^```/gm, ' ')
  .replace(/^```[^\n]*$/gm, ' ').replace(/^(?:[a-z]+:|##|-|\d+\.|>|Q:|A:)\s*/gm, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[`*#|]/g, ' ').replace(/\s+/g, ' ').trim();

LESSON_ORDER.forEach((id, idx) => {
  const l = lessons[id];
  const path = `lessons/${id}.html`;
  const ctx = makeCtx(path);
  ctx.file = l.file;
  ctx.moments = [];
  resetMathSeq();
  const mod = MODULES.find((m) => m.id === moduleOfLesson[id]);
  const modLessons = mod.groups.flatMap((g) => g.lessons);
  const pos = modLessons.indexOf(id);
  const prev = modLessons[pos - 1], next = modLessons[pos + 1];
  const langOf = (t) => (t === 'Python example' ? 'python' : t.startsWith('.NET') ? 'cs' : '');
  const evidence = codeEvidence(l);
  const refs = (LESSON_REFS[id] || []).filter((r) => { if (!SOURCES[r]) { errors.push(`${l.file}: LESSON_REFS lists unknown source ${r}`); return false; } usedSources.add(r); return true; });
  const refsHtml = refs.length ? `<aside class="refs" aria-labelledby="refs-h"><h2 id="refs-h" class="refs-title">Official documentation (optional reading)</h2><p class="small muted">You do not need these to finish the lesson. They open outside sites, which are not part of this guide.</p><ul class="refs-list">${refs.map((r) => sourceItem(r)).join('')}</ul></aside>` : '';
  const sections = l.sections.map((s) => {
    let inner;
    const before = ctx.moments.length;
    ctx.idPrefix = s.title === 'Python example' ? 'py-' : s.title.startsWith('.NET') ? 'cs-' : '';
    if (s.title === 'Quick check') {
      const qa = parseQA(s.body);
      if (qa.length < 2 || qa.length > 5) errors.push(`${l.file}: needs 2–5 questions, has ${qa.length}`);
      inner = `<div class="qa-controls"><button type="button" class="btn btn-small" data-expand-all="#qa-${id}">Show all answers</button><button type="button" class="btn btn-small" data-collapse-all="#qa-${id}">Hide all answers</button></div>
<ol class="qa" id="qa-${id}">${qa.map((x) => `<li><p class="qa-q">${md(x.q, ctx).replace(/^<p>|<\/p>$/g, '')}</p><details><summary>Show answer</summary><div class="qa-a">${md(x.a, ctx)}</div></details></li>`).join('')}</ol>`;
    } else if (s.title === APPLIED_MATHS) {
      // Intro text, then one collapsible panel per "###" topic (fence-aware split).
      const parts = []; let cur = { title: '', lines: [] }, fence = false;
      for (const ln of s.body.split('\n')) {
        if (ln.startsWith('```')) fence = !fence;
        const h = !fence && ln.match(/^### (.+)$/);
        if (h) { parts.push(cur); cur = { title: h[1].trim(), lines: [] }; } else cur.lines.push(ln);
      }
      parts.push(cur);
      const intro = parts[0].lines.join('\n').trim();
      const items = parts.slice(1).map((p, k) => `<details class="maths-item"><summary>${md(p.title, ctx).replace(/^<p>|<\/p>$/g, '')}</summary><div class="maths-body">${mathsTopicHtml(p.lines, ctx)}</div></details>`);
      inner = `${intro ? md(intro, ctx) : ''}<div class="qa-controls"><button type="button" class="btn btn-small" data-expand-all="#maths-${id}">Open all topics</button><button type="button" class="btn btn-small" data-collapse-all="#maths-${id}">Close all topics</button></div><div class="maths-list" id="maths-${id}">${items.join('\n')}</div>`;
    } else {
      inner = md(s.body, ctx);
    }
    const lang = langOf(s.title);
    const ev = lang ? evidence.find((e) => e.lang === lang) : null;
    const status = ev ? `<p class="code-evidence">${pill(ev)} <span class="small muted">${esc(ev.detail)}</span></p>` : '';
    for (const m of ctx.moments.slice(before)) mathsIndex.push({ ...m, lesson: id, section: s.title });
    searchText.push({ t: l.title, h: s.title, u: `${path}#${slug(s.title)}`, s: mod.short, x: plainText(s.body) });
    return `<section class="lesson-section"${lang ? ` data-lang-section="${lang}"` : ''} aria-labelledby="${slug(s.title)}"><h2 id="${slug(s.title)}">${esc(s.title)}</h2>\n${status}${inner}</section>${s.title.startsWith('.NET') ? '\n' + refsHtml : ''}`;
  }).join('\n');
  const nodes = roadmapNodesForLesson[id] || [];
  const prereqLinks = l.prereqs.map((p) => { if (!lessons[p]) errors.push(`${l.file}: unknown prerequisite ${p}`); return lessons[p] ? lessonLink(p, ctx) : p; });
  const prereqHtml = l.prereqs.length ? `<ul class="rail-list">${prereqLinks.map((p) => `<li>${p}</li>`).join('')}</ul>` : '<p>None beyond general computer use.</p>';
  const tocItems = [...l.sections.map((x) => x.title), 'Completion'];
  const after = (leadsTo[id] || []).slice(0, 4);
  const body = `
<div class="lesson-layout">
<button type="button" id="rail-edge" class="edge-tab edge-right" aria-controls="lesson-rail" aria-expanded="true" aria-label="Hide lesson side panel"></button>
<header class="lesson-head">
  <p class="eyebrow-line"><a href="${ctx.root}${mod.page}">${esc(mod.title)}</a> <span class="lesson-pos">Lesson ${pos + 1} of ${modLessons.length} in this part</span></p>
  <h1>${esc(l.title)}</h1>
  <p class="goal-line"><strong>What you will learn.</strong> ${md(l.goal, ctx).replace(/^<p>|<\/p>$/g, '')}</p>
  <ul class="lesson-meta" aria-label="Lesson facts">
    <li>${levelBadge(l.level)}</li>
    <li><span class="meta-k">Study time</span> about ${fmtMinutes(l.minutes)}</li>
    <li><span class="meta-k">Maths</span> ${esc(MATHS_LABEL[l.maths])}</li>
    ${evidence.map((e) => `<li>${pill(e)}</li>`).join('')}
  </ul>
  ${l.prereqs.length ? `<p class="prereq-line"><strong>Before this lesson:</strong> ${prereqLinks.join(', ')}. <span class="muted">Already know these? Carry on.</span></p>` : '<p class="prereq-line"><strong>Before this lesson:</strong> nothing. You can start here.</p>'}
  <div class="lesson-tools">
    <fieldset class="lang-switch" data-lang-switch hidden><legend>Code examples to show</legend>
      <label><input type="radio" name="code-lang" value="both" checked> Both</label>
      <label><input type="radio" name="code-lang" value="python"> Python</label>
      <label><input type="radio" name="code-lang" value="cs"> C#</label>
    </fieldset>
    <p class="rail-toggle-row"><button type="button" id="rail-toggle" class="btn btn-small" aria-controls="lesson-rail" aria-expanded="true">Hide side panel</button></p>
  </div>
</header>
<aside class="lesson-rail" id="lesson-rail" aria-label="Lesson facts and contents">
  <nav class="rail-card toc-card" aria-labelledby="toc-h"><details class="rail-details" open><summary><h2 id="toc-h" class="rail-title">On this page</h2></summary><ol class="rail-toc">${tocItems.map((t) => `<li${langOf(t) ? ` data-lang-section="${langOf(t)}"` : ''}><a href="#${slug(t)}">${esc(t)}</a></li>`).join('')}</ol></details></nav>
  <section class="rail-card" aria-labelledby="facts-h"><details class="rail-details" open><summary><h2 id="facts-h" class="rail-title">Lesson facts</h2></summary>
    <dl class="facts"><dt>Level</dt><dd>${levelBadge(l.level)}</dd><dt>Study time</dt><dd>About ${fmtMinutes(l.minutes)}</dd><dt>Maths</dt><dd>${esc(MATHS_LABEL[l.maths])}</dd><dt>Reviewed</dt><dd>${esc(l.reviewed)}</dd><dt>Code</dt><dd>${evidence.map((e) => `<span class="code-status">${pill(e)}</span>`).join('')}${l.code ? `<span class="facts-detail">${esc(l.code)}</span>` : ''}</dd></dl>
    <h3 class="rail-sub">Prerequisites</h3>${prereqHtml}
    ${nodes.length ? `<h3 class="rail-sub">Roadmap steps</h3><ul class="rail-list">${nodes.map(({ r, n }) => `<li><a href="${ctx.root}roadmaps.html#node-${r.id}-${n.n}">${esc(r.title)}: step ${n.n}</a></li>`).join('')}</ul>` : ''}
  </details></section>
  ${adSlot('rail')}
</aside>
<div class="lesson-body">
${sections}
<section class="completion" aria-labelledby="completion">
  <h2 id="completion">Completion</h2>
  <p><strong>Evidence of completion.</strong> ${md(l.evidence, ctx).replace(/^<p>|<\/p>$/g, '')}</p>
  <label class="check-row"><input type="checkbox" data-progress-checkbox="lesson:${id}"> I have completed this lesson and its exercise</label>
  <p class="small muted">Saved in this browser only. A tick records that you finished the work; it is not a test result. <a href="${ctx.root}progress.html">See all progress</a>.</p>
  ${after.length ? `<p class="leads-to"><strong>This lesson prepares you for:</strong> ${after.map((x) => lessonLink(x, ctx)).join(', ')}.</p>` : ''}
  <div class="actions"><button type="button" class="btn btn-small" data-print>Print or save as PDF</button></div>
</section>
${adSlot('end')}
<nav class="pager" aria-label="Lesson navigation">
  ${prev ? `<a class="pager-prev" href="${prev}.html"><span class="small muted">Previous</span>${esc(lessons[prev].title)}</a>` : '<span></span>'}
  ${next ? `<a class="pager-next" href="${next}.html"><span class="small muted">Next</span>${esc(lessons[next].title)}</a>` : `<a class="pager-next" href="${ctx.root}${mod.page}"><span class="small muted">Back to</span>${esc(mod.title)}</a>`}
</nav>
</div>
</div>`;
  const plain = l.sections.map((s) => s.body).join(' ').replace(/[`*#>|\[\]()]/g, ' ').replace(/\s+/g, ' ');
  emit(path, {
    title: l.title, description: l.goal, body, crumbs: [[mod.short, mod.page], [l.title, path]],
    section: mod.short, bodyClass: 'is-lesson', lessonId: id,
    keywords: `${l.goal} ${plain.slice(0, 600)}`,
  });
});

// ---------- other pages ----------
const shared = { CASE_CHECKS, STARTERS, ADS, SOURCES, sourceItem, sourceLink, sourceNote, CODE_STATUS, codeEvidence, pill, mathsIndex, usedSources, STARTS, LEVELS, lessons, ctxFor: makeCtx, lessonLink, levelBadge, fmtMinutes, esc, md, slug, MODULES, ROADMAPS, ROUTES, PROJECTS, CASES, HARDWARE, WORKLOADS, GLOSSARY, CHECKPOINTS, REVIEWED, LESSON_ORDER, projectsById };
for (const def of P.allPages(shared)) emit(def.path, def);
for (const c of CASES) for (const s of c.sources) if (s.ref) usedSources.add(s.ref);

if (errors.length) { console.error('Build failed:\n- ' + [...new Set(errors)].join('\n- ')); process.exit(1); }

// ---------- assets, search index, robots, sitemap ----------
cpSync(join(ROOT, 'public'), DIST, { recursive: true });
// Theme tokens are defined once (src/design/tokens.mjs) and written at the top of the stylesheet.
writeFileSync(join(DIST, 'assets/app.css'), tokensCss() + readFileSync(join(ROOT, 'public/assets/app.css'), 'utf8'));
const index = pages.filter((p) => p.path !== '404.html').map((p) => ({ t: p.title, u: p.path, s: p.section, k: p.keywords.slice(0, 700) }));
for (const [term, def, l] of GLOSSARY) index.push({ t: term, u: `glossary.html#${slug(term)}`, s: 'Glossary', k: def });
writeFileSync(join(DIST, 'assets/search-index.js'), `window.SEARCH_INDEX=${JSON.stringify(index)};\n`);
writeFileSync(join(DIST, 'assets/search-text.js'), `window.SEARCH_TEXT=${JSON.stringify(searchText)};\n`);
// Security headers for hosts that support them (Netlify, Cloudflare Pages, Azure Static Web Apps).
const scriptHash = createHash('sha256').update(INLINE_SCRIPT).digest('base64');
const CSP = `default-src 'self'; script-src 'self' 'sha256-${scriptHash}'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`;
// With AdSense on, Google supports only a strict nonce-based CSP, and a static host cannot add per-request nonces.
// So the policy is sent as Report-Only (violations are reported, nothing is blocked) until a host that can add nonces is chosen.
const CSP_HEADER = ADS.client ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
const HEADERS = { [CSP_HEADER]: CSP, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()' };
writeFileSync(join(DIST, '_headers'), '/*\n' + Object.entries(HEADERS).map(([k, v]) => `  ${k}: ${v}`).join('\n') + '\n');
writeFileSync(join(DIST, 'staticwebapp.config.json'), JSON.stringify({ globalHeaders: HEADERS, responseOverrides: { 404: { rewrite: '/404.html' } } }, null, 2));
writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n${SITE.url ? `Sitemap: ${SITE.url}/sitemap.xml\n` : ''}`);
if (ADS.client) writeFileSync(join(DIST, 'ads.txt'), `google.com, ${ADS.client.replace('ca-pub-', 'pub-')}, DIRECT, f08c47fec0942fa0
`);
if (SITE.url) {
  writeFileSync(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${
    pages.filter((p) => p.path !== '404.html').map((p) => `  <url><loc>${SITE.url}/${p.path === 'index.html' ? '' : p.path}</loc><lastmod>${REVIEWED}</lastmod></url>`).join('\n')}\n</urlset>\n`);
}
console.log(`Built ${pages.length} pages (${LESSON_ORDER.length} lessons, ${PROJECTS.length} capstones, ${CASES.length} case studies) into dist/${ADS.client ? ` [AdSense ${ADS.client}; ad slots ${ADS.slotsOn ? 'ON' : 'OFF'}]` : ''}${SITE.url ? ' with sitemap for ' + SITE.url : ' (set SITE_URL to emit sitemap.xml and canonical URLs)'}`);
