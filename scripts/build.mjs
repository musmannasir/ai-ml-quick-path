// Static site build: node scripts/build.mjs   (no dependencies)
// Output: dist/  (flat .html files with relative links; works on any static host and from file://)
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { INLINE_SCRIPT } from '../src/lib/layout.mjs';
import { APPLIED_MATHS, esc, md, parseLesson, parseQA, slug } from '../src/lib/markdown.mjs';
import { navGroups, page, SITE, ADS, adSlot } from '../src/lib/layout.mjs';
import { LEVELS, LESSON_ORDER, MODULES, REVIEWED, ROADMAPS, ROUTES, moduleOfLesson } from '../src/data/curriculum.mjs';
import { CASES } from '../src/data/cases.mjs';
import { PROJECTS } from '../src/data/projects.mjs';
import { CHECKPOINTS, GLOSSARY, HARDWARE, WORKLOADS } from '../src/data/reference.mjs';
import * as P from '../src/pages/pages.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
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
    const l = parseLesson(readFileSync(file, 'utf8'), file.replace(ROOT + '/', ''));
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
        // This edition is fully self-contained: external links are not allowed anywhere.
        errors.push(`${fromPath}: external link not allowed (${url})`);
        return text;
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


// "Python executed 2026-11-02 (details); C# not compiled (details)" -> status pills plus the details as small text.
function codeStatus(code) {
  const parts = []; let depth = 0, cur = '';
  for (const ch of String(code)) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ';' && depth === 0) { parts.push(cur); cur = ''; } else cur += ch; }
  parts.push(cur);
  return parts.map((p) => p.trim()).filter(Boolean).map((p) => {
    const open = p.indexOf('(');
    const label = (open < 0 ? p : p.slice(0, open)).trim();
    const detail = open < 0 ? '' : p.slice(open + 1).replace(/\)\s*$/, '').trim();
    const kind = /not (compiled|run|executed)/i.test(label) ? 'warn' : /executed|compiled/i.test(label) ? 'ok' : 'plain';
    return `<span class="code-status"><span class="pill pill-${kind}">${esc(label)}</span>${detail ? ` <span class="facts-detail">${esc(detail)}</span>` : ''}</span>`;
  }).join('');
}

// ---------- lesson pages ----------
const roadmapNodesForLesson = {};
for (const r of ROADMAPS) for (const n of r.nodes) for (const l of n.lessons) (roadmapNodesForLesson[l] ||= []).push({ r, n });

const PROSE = new Set(['In plain words', 'Real-world example', 'How it works', 'Common mistakes']);
LESSON_ORDER.forEach((id, idx) => {
  const l = lessons[id];
  const path = `lessons/${id}.html`;
  const ctx = makeCtx(path);
  ctx.file = l.file;
  const mod = MODULES.find((m) => m.id === moduleOfLesson[id]);
  const modLessons = mod.groups.flatMap((g) => g.lessons);
  const pos = modLessons.indexOf(id);
  const prev = modLessons[pos - 1], next = modLessons[pos + 1];
  const sections = l.sections.map((s) => {
    let inner;
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
      const items = parts.slice(1).map((p, k) => `<details class="maths-item"><summary>${md(p.title, ctx).replace(/^<p>|<\/p>$/g, '')}</summary><div class="maths-body">${md(p.lines.join('\n'), ctx)}</div></details>`);
      inner = `${intro ? md(intro, ctx) : ''}<div class="qa-controls"><button type="button" class="btn btn-small" data-expand-all="#maths-${id}">Open all topics</button><button type="button" class="btn btn-small" data-collapse-all="#maths-${id}">Close all topics</button></div><div class="maths-list" id="maths-${id}">${items.join('\n')}</div>`;
    } else {
      inner = md(s.body, ctx);
    }
    return `<section class="lesson-section${PROSE.has(s.title) ? ' prose-cols' : ''}" aria-labelledby="${slug(s.title)}"><h2 id="${slug(s.title)}">${esc(s.title)}</h2>\n${inner}</section>`;
  }).join('\n');
  const nodes = roadmapNodesForLesson[id] || [];
  const prereqHtml = l.prereqs.length ? `<ul class="rail-list">${l.prereqs.map((p) => { if (!lessons[p]) errors.push(`${l.file}: unknown prerequisite ${p}`); return `<li>${lessons[p] ? lessonLink(p, ctx) : p}</li>`; }).join('')}</ul>` : '<p>None beyond general computer use.</p>';
  const tocItems = [...l.sections.map((x) => x.title), 'Completion'];
  const body = `
<div class="lesson-layout">
<button type="button" id="rail-edge" class="edge-tab edge-right" aria-controls="lesson-rail" aria-expanded="true" aria-label="Hide lesson side panel"></button>
<header class="lesson-head">
  <p class="eyebrow-line"><a href="${ctx.root}${mod.page}">${esc(mod.title)}</a></p>
  <h1>${esc(l.title)}</h1>
  <p class="goal-line"><strong>Learning goal.</strong> ${md(l.goal, ctx).replace(/^<p>|<\/p>$/g, '')}</p>
  <p class="rail-toggle-row"><button type="button" id="rail-toggle" class="btn btn-small" aria-controls="lesson-rail" aria-expanded="true">Hide side panel</button></p>
</header>
<aside class="lesson-rail" id="lesson-rail" aria-label="Lesson facts and contents">
  <section class="rail-card" aria-labelledby="facts-h"><details class="rail-details" open><summary><h2 id="facts-h" class="rail-title">Lesson facts</h2></summary>
    <dl class="facts"><dt>Level</dt><dd>${levelBadge(l.level)}</dd><dt>Study time</dt><dd>About ${fmtMinutes(l.minutes)}</dd><dt>Reviewed</dt><dd>${esc(l.reviewed)}</dd>${l.code ? `<dt>Code</dt><dd>${codeStatus(l.code)}</dd>` : ''}</dl>
    <h3 class="rail-sub">Prerequisites</h3>${prereqHtml}
    ${nodes.length ? `<h3 class="rail-sub">Roadmap steps</h3><ul class="rail-list">${nodes.map(({ r, n }) => `<li><a href="${ctx.root}roadmaps.html#node-${r.id}-${n.n}">${esc(r.title)}: step ${n.n}</a></li>`).join('')}</ul>` : ''}
  </details></section>
  <nav class="rail-card toc-card" aria-labelledby="toc-h"><details class="rail-details" open><summary><h2 id="toc-h" class="rail-title">On this page</h2></summary><ol class="rail-toc">${tocItems.map((t) => `<li><a href="#${slug(t)}">${esc(t)}</a></li>`).join('')}</ol></details></nav>
  ${adSlot('rail')}
</aside>
<div class="lesson-body">
${sections}
<section class="completion" aria-labelledby="completion">
  <h2 id="completion">Completion</h2>
  <p><strong>Evidence of completion.</strong> ${md(l.evidence, ctx).replace(/^<p>|<\/p>$/g, '')}</p>
  <label class="check-row"><input type="checkbox" data-progress-checkbox="lesson:${id}"> I have completed this lesson and its exercise</label>
  <p class="small muted">Saved in this browser only. <a href="${ctx.root}progress.html">See all progress</a>.</p>
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
    section: mod.short, bodyClass: 'is-lesson',
    keywords: `${l.goal} ${plain.slice(0, 600)}`,
  });
});

// ---------- other pages ----------
const shared = { ADS, LEVELS, lessons, ctxFor: makeCtx, lessonLink, levelBadge, fmtMinutes, esc, md, slug, MODULES, ROADMAPS, ROUTES, PROJECTS, CASES, HARDWARE, WORKLOADS, GLOSSARY, CHECKPOINTS, REVIEWED, LESSON_ORDER, projectsById };
for (const def of P.allPages(shared)) emit(def.path, def);

if (errors.length) { console.error('Build failed:\n- ' + [...new Set(errors)].join('\n- ')); process.exit(1); }

// ---------- assets, search index, robots, sitemap ----------
cpSync(join(ROOT, 'public'), DIST, { recursive: true });
const index = pages.filter((p) => p.path !== '404.html').map((p) => ({ t: p.title, u: p.path, s: p.section, k: p.keywords.slice(0, 700) }));
for (const [term, def, l] of GLOSSARY) index.push({ t: term, u: `glossary.html#${slug(term)}`, s: 'Glossary', k: def });
writeFileSync(join(DIST, 'assets/search-index.js'), `window.SEARCH_INDEX=${JSON.stringify(index)};\n`);
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
