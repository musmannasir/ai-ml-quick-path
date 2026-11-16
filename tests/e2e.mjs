// Browser tests with Playwright (Chromium). Run after `npm run build`:
//   npx playwright install chromium   (first time only)
//   node tests/e2e.mjs                (writes qa/e2e-results.json and qa/screenshots/)
import { createRequire } from 'node:module';
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(join(process.env.HOME || '', '.npm-global/lib/node_modules/playwright')); }
const { chromium } = pw;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const QA = join(ROOT, 'qa');
mkdirSync(join(QA, 'screenshots'), { recursive: true });
const url = (p) => { const [f, h] = p.split('#'); return pathToFileURL(join(DIST, f)).href + (h ? '#' + h : ''); };
const ALL = (function walk(d, pre = '') { return readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p, pre + f + '/') : f.endsWith('.html') ? [pre + f] : []; }); })(DIST).sort();
const KEY = ['index.html', 'lessons.html', 'plan.html', 'roles.html', 'roadmaps.html', 'solve.html', 'maths.html', 'part-1-start.html', 'part-3-ml.html', 'part-5-llms.html', 'part-7-production.html', 'projects.html', 'projects/c04-rag-assistant.html', 'cases.html', 'cases/klarna.html', 'hardware.html', 'glossary.html', 'assessment.html', 'progress.html', 'about.html', 'lessons/app-rag.html', 'lessons/dl-transformers.html', 'lessons/llm-train-laptop.html', 'lessons/ml-classification.html', 'lessons/ops-architecture.html', 'lessons/app-agents.html', 'lessons/s-setup.html'];
const WIDTHS = [320, 360, 390, 430, 768, 1024, 1280, 1440, 1920];

const results = [];
function record(name, pass, detail = '') { results.push({ name, pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); }
function expect(name, cond, detail) { record(name, !!cond, cond ? '' : detail); }

// Use an installed browser channel (e.g. Microsoft Edge) with --channel=msedge or PW_CHANNEL=msedge.
const channelArg = process.argv.find((a) => a.startsWith('--channel='));
const channel = (channelArg ? channelArg.slice('--channel='.length) : process.env.PW_CHANNEL) || '';
const browser = await chromium.launch(channel ? { channel } : {});
async function newPage(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: opts.width || 1280, height: opts.height || 900 }, colorScheme: opts.scheme || 'light', reducedMotion: opts.reducedMotion || 'no-preference', acceptDownloads: true });
  if (opts.blockStorage) await ctx.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('blocked'); }; Storage.prototype.getItem = () => { throw new Error('blocked'); }; });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text()); });
  return page;
}

// ---------- contrast audit (runs in page) ----------
const contrastAudit = () => {
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const blend = (top, bottom) => ({ r: top.r * top.a + bottom.r * (1 - top.a), g: top.g * top.a + bottom.g * (1 - top.a), b: top.b * top.a + bottom.b * (1 - top.a), a: 1 });
  const bgOf = (el) => {
    const layers = [];
    for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; } }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) base = blend(layers[i], base);
    return base;
  };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const fails = []; let checked = 0;
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 1 && r.height > 1 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.1 && !el.closest('[hidden]') && !el.closest('.sr-only'); };
  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el)) continue;
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const isField = el.matches('input[type=search],input[type=number],select');
    if (!own && !isField) continue;
    const s = getComputedStyle(el);
    const fg = parse(s.color); const bg = bgOf(el);
    const fgc = fg.a < 1 ? blend(fg, bg) : fg;
    const size = parseFloat(s.fontSize), bold = Number(s.fontWeight) >= 700;
    const need = size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;
    const r = ratio(fgc, bg); checked++;
    if (r < need) fails.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]} "${(el.textContent || el.value || '').trim().slice(0, 30)}" ${r.toFixed(2)} < ${need}`);
    if (el.matches('input[type=search]')) {
      const ph = parse(getComputedStyle(el, '::placeholder').color);
      if (ph) { const pr = ratio(ph.a < 1 ? blend(ph, bg) : ph, bg); checked++; if (pr < 4.5) fails.push(`placeholder ${pr.toFixed(2)}`); }
    }
  }
  return { checked, fails };
};

// 1. Console errors + contrast on every page in both themes (+ no external links in the DOM)
const extLinks = [];
for (const scheme of ['light', 'dark']) {
  const page = await newPage({ scheme });
  let checked = 0; const fails = []; const errs = [];
  for (const p of ALL) {
    page.errors.length = 0;
    await page.goto(url(p));
    const r = await page.evaluate(contrastAudit);
    if (scheme === 'light') { const ext = await page.$$eval('script[src^="http"], link[href^="http"], img[src^="http"], iframe, embed, object, source[src^="http"]', (es) => es.length);
      const badA = await page.$$eval('a[href^="http"]', (es) => es.filter((a) => !a.classList.contains('ext') || a.getAttribute('rel') !== 'noopener noreferrer external' || a.hasAttribute('target') || a.textContent.trim().length < 4).length);
      if (ext || badA) extLinks.push(`${p}: ${ext} outside resources, ${badA} unsafe outside links`); }
    checked += r.checked; r.fails.forEach((f) => fails.push(`${p}: ${f}`));
    page.errors.forEach((e) => errs.push(`${p}: ${e}`));
  }
  expect(`No uncaught JS errors on all ${ALL.length} pages (${scheme})`, errs.length === 0, errs.slice(0, 5).join(' | '));
  expect(`Text contrast WCAG AA on all pages (${scheme}): ${checked} text elements checked`, fails.length === 0, `${fails.length} failures: ${fails.slice(0, 8).join(' | ')}`);
  await page.context().close();
}
expect(`Nothing loaded from other sites (no outside scripts, styles, images or frames) and every outside link is a marked reference link, on all ${ALL.length} pages`, extLinks.length === 0, extLinks.slice(0, 5).join(' | '));

// 2. Contrast in dynamic states (search results, empty filter state, drawer, selected tab, quiz feedback, expanded roadmap)
for (const scheme of ['light', 'dark']) {
  const page = await newPage({ scheme, width: 390 });
  const fails = [];
  const audit = async (label) => { const r = await page.evaluate(contrastAudit); r.fails.forEach((f) => fails.push(`${label}: ${f}`)); };
  await page.goto(url('cases.html'));
  await page.selectOption('select[data-filter="industry"]', 'finance'); await page.selectOption('select[data-filter="difficulty"]', 'advanced'); await audit('cases empty state');
  await page.fill('#site-search', 'attention'); await audit('search results');
  await page.goto(url('index.html')); await page.click('#sidebar-toggle'); await audit('drawer open');
  await page.goto(url('roadmaps.html#lm')); await page.click('[data-roadmap-expand]'); await audit('roadmap expanded');
  await page.goto(url('assessment.html')); await page.check('input[name="cp-ml-0"][value="0"]'); await page.click('[data-check-answer]'); await audit('quiz feedback wrong');
  await page.goto(url('progress.html')); await page.fill('#cal-hours', '1'); await audit('calendar error');
  expect(`Contrast in dynamic states (${scheme})`, fails.length === 0, fails.slice(0, 6).join(' | '));
  await page.context().close();
}

// 3. No horizontal overflow
{
  const page = await newPage();
  const over = [];
  const jobs = [...KEY.flatMap((p) => WIDTHS.map((w) => [p, w])), ...ALL.flatMap((p) => [[p, 390], [p, 1280]])];
  for (const [p, w] of jobs) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(url(p));
    const sw = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (sw > 0) over.push(`${p}@${w}: +${sw}px`);
  }
  expect(`No document-level horizontal scroll (${jobs.length} page × width combinations; widths ${WIDTHS.join(', ')})`, over.length === 0, over.slice(0, 10).join(', '));
  // 200% zoom approximation: 1280 px window at 200% = 640 CSS px
  await page.setViewportSize({ width: 640, height: 450 });
  const z = [];
  for (const p of KEY) { await page.goto(url(p)); const sw = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); if (sw > 0) z.push(p); }
  expect('200% zoom equivalent (640×450 CSS px): no horizontal scroll on key pages', z.length === 0, z.join(', '));
  await page.context().close();
}

// 4. Desktop sidebar hide/show cycles, persistence, focus mode
{
  const page = await newPage({ width: 1440 });
  await page.goto(url('lessons/app-rag.html'));
  const mainW = () => page.evaluate(() => document.querySelector('.main-col').getBoundingClientRect().width);
  const w0 = await mainW(); let ok = true; let detail = '';
  for (let i = 0; i < 3; i++) {
    await page.click('#sidebar-toggle');
    const hidden = await page.evaluate(() => getComputedStyle(document.getElementById('sidebar')).display === 'none');
    const exp = await page.getAttribute('#sidebar-toggle', 'aria-expanded');
    const w1 = await mainW();
    if (!hidden || exp !== 'false' || w1 <= w0 + 200) { ok = false; detail = `cycle ${i}: hidden=${hidden} expanded=${exp} width ${w0}->${w1}`; }
    await page.click('#sidebar-toggle');
    const shown = await page.evaluate(() => getComputedStyle(document.getElementById('sidebar')).display !== 'none');
    if (!shown || (await page.getAttribute('#sidebar-toggle', 'aria-expanded')) !== 'true') { ok = false; detail = `cycle ${i}: not restored`; }
  }
  expect('Desktop sidebar collapses fully (display:none), main column widens, restores; 3 cycles', ok, detail);
  await page.click('#sidebar-toggle'); await page.reload();
  expect('Hidden sidebar state persists after reload, restore button visible', (await page.getAttribute('html', 'data-sidebar')) === 'hidden' && (await page.isVisible('#sidebar-toggle')), '');
  await page.click('#sidebar-toggle');
  await page.click('#focus-toggle');
  const focusState = await page.evaluate(() => ({ sb: getComputedStyle(document.getElementById('sidebar')).display, toc: getComputedStyle(document.querySelector('.lesson-rail')).display, pressed: document.getElementById('focus-toggle').getAttribute('aria-pressed') }));
  expect('Focus mode hides sidebar and lesson side panel; aria-pressed=true', focusState.sb === 'none' && focusState.toc === 'none' && focusState.pressed === 'true', JSON.stringify(focusState));
  await page.click('#focus-toggle');
  expect('Focus mode exits and restores sidebar', await page.evaluate(() => getComputedStyle(document.getElementById('sidebar')).display !== 'none'), '');
  // nav group collapse/expand all and filter
  await page.click('[data-nav-expand="all"]');
  const allOpen = await page.$$eval('.nav-toggle', (bs) => bs.every((b) => b.getAttribute('aria-expanded') === 'true' && !document.getElementById(b.getAttribute('aria-controls')).hidden));
  await page.click('[data-nav-expand="none"]');
  const allClosed = await page.$$eval('.nav-toggle', (bs) => bs.every((b) => b.getAttribute('aria-expanded') === 'false' && document.getElementById(b.getAttribute('aria-controls')).hidden));
  expect('Sidebar group Expand all / Collapse all update aria-expanded and visibility', allOpen && allClosed, `open=${allOpen} closed=${allClosed}`);
  await page.fill('#nav-filter', 'rag');
  const vis = await page.$$eval('.nav-list li:not(.filtered-out) a', (as) => as.filter((a) => a.offsetParent).map((a) => a.textContent.trim()));
  expect('Sidebar filter shows only matching lessons and opens their group', vis.length === 2 && vis.every((t) => /RAG/.test(t)), vis.join(' | '));
  await page.context().close();
}

// 5. Mobile drawer
for (const w of [320, 390, 768]) {
  const page = await newPage({ width: w });
  await page.goto(url('lessons/ml-classification.html'));
  let ok = true; let detail = '';
  const state = () => page.evaluate(() => { const r = document.getElementById('sidebar').getBoundingClientRect(); const s = getComputedStyle(document.getElementById('sidebar')); return { left: r.left, right: r.right, vis: s.visibility, scrim: !document.querySelector('.scrim').hidden, inert: document.getElementById('main').hasAttribute('inert') }; });
  const closedOk = (s) => s.vis === 'hidden' && s.right <= 1 && !s.scrim && !s.inert;
  if (!closedOk(await state())) { ok = false; detail = 'initially visible ' + JSON.stringify(await state()); }
  for (const how of ['escape', 'scrim', 'button']) {
    await page.click('#sidebar-toggle'); await page.waitForTimeout(260);
    const open = await state();
    if (!(open.vis === 'visible' && open.left >= -1 && open.scrim && open.inert)) { ok = false; detail = `${how}: open state ${JSON.stringify(open)}`; }
    if (how === 'escape') await page.keyboard.press('Escape');
    if (how === 'scrim') await page.mouse.click(w - 5, 400);
    if (how === 'button') await page.click('#sidebar-toggle');
    await page.waitForTimeout(260);
    const closed = await state();
    if (!closedOk(closed)) { ok = false; detail = `${how}: after close ${JSON.stringify(closed)}`; }
  }
  const focused = await page.evaluate(() => document.activeElement.id);
  expect(`Mobile drawer @${w}px opens over a scrim, closes by Escape/scrim/button, leaves nothing overlaying content`, ok, detail);
  if (w === 390) expect('Focus returns to the menu button after closing the drawer', focused === 'sidebar-toggle', focused);
  await page.context().close();
}

// 6. Theme persistence
{
  const page = await newPage({ scheme: 'light' });
  await page.goto(url('index.html'));
  await page.selectOption('#theme-select', 'dark');
  await page.goto(url('glossary.html'));
  const t1 = await page.getAttribute('html', 'data-theme');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.selectOption('#theme-select', 'system'); await page.reload();
  const t2 = await page.getAttribute('html', 'data-theme');
  expect('Theme choice persists across pages; System removes the override', t1 === 'dark' && bg === 'rgb(15, 20, 26)' && t2 === null, `t1=${t1} bg=${bg} t2=${t2}`);
  await page.context().close();
}

// 7. Roadmaps
{
  const page = await newPage({ width: 1280 });
  await page.goto(url('roadmaps.html'));
  const counts = await page.$$eval('[role=tabpanel]', (ps) => ps.map((p) => p.querySelectorAll('.flow > .node').length));
  expect('Three roadmaps render with all steps (10, 9, 9)', JSON.stringify(counts) === '[10,9,9]', JSON.stringify(counts));
  await page.click('#tab-applied');
  const overview = await page.$$eval('[role=tabpanel]', (ps) => ps.map((p) => p.querySelectorAll('.overview li').length));
  expect('Overview strip shows a connected step for each stage', JSON.stringify(overview) === '[10,9,9]', JSON.stringify(overview));
  const connectors = await page.$$eval('#applied .node', (ns) => ns.map((n) => getComputedStyle(n, '::before').display));
  expect('Each step except the last has a visible connector with an arrowhead', connectors.slice(0, -1).every((d) => d !== 'none') && connectors.at(-1) === 'none', connectors.join(','));
  const collapsed = await page.$$eval('.node-toggle', (bs) => bs.every((b) => b.getAttribute('aria-expanded') === 'false' && document.getElementById(b.getAttribute('aria-controls')).hidden));
  expect('Steps start collapsed with aria-expanded=false matching hidden panels', collapsed, '');
  await page.click('#applied .node-toggle >> nth=2');
  const one = await page.$$eval('#applied .node-toggle', (bs) => bs.map((b) => b.getAttribute('aria-expanded') === 'true' && !document.getElementById(b.getAttribute('aria-controls')).hidden));
  expect('Individual step toggle opens only that step', one.filter(Boolean).length === 1 && one[2], JSON.stringify(one));
  await page.click('[data-roadmap-expand]');
  const allOpen = await page.$$eval('#applied .node-toggle', (bs) => bs.every((b) => b.getAttribute('aria-expanded') === 'true' && !document.getElementById(b.getAttribute('aria-controls')).hidden));
  await page.screenshot({ path: join(QA, 'screenshots/roadmap-expanded-1280-light.png'), fullPage: true });
  await page.click('[data-roadmap-collapse]');
  const allClosed = await page.$$eval('#applied .node-toggle', (bs) => bs.every((b) => b.getAttribute('aria-expanded') === 'false'));
  expect('Expand all / Collapse all work on the active roadmap', allOpen && allClosed, `open=${allOpen} closed=${allClosed}`);
  await page.click('#tab-ml'); await page.click('#tab-lm');
  await page.goBack();
  const afterBack = await page.getAttribute('#tab-ml', 'aria-selected');
  expect('Track switcher updates URL; browser Back restores the previous track', afterBack === 'true', `ml selected after back: ${afterBack}`);
  await page.focus('#tab-ml'); await page.keyboard.press('ArrowRight');
  const kb = await page.evaluate(() => [document.activeElement.id, document.getElementById('lm').hidden]);
  expect('Arrow keys move between tabs and show the matching panel', kb[0] === 'tab-lm' && kb[1] === false, JSON.stringify(kb));
  await page.goto(url('roadmaps.html#node-ml-3'));
  const deep = await page.evaluate(() => ({ ml: !document.getElementById('ml').hidden, exp: document.querySelector('#node-ml-3 .node-toggle').getAttribute('aria-expanded') }));
  expect('Deep link to a step selects its track and expands it', deep.ml && deep.exp === 'true', JSON.stringify(deep));
  const lessonLinks = await page.$$eval('.node-lessons a', (as) => as.length);
  expect('Roadmap steps link to lessons and capstone projects', lessonLinks >= 50, `${lessonLinks} links`);
  await page.emulateMedia({ media: 'print' });
  const print = await page.evaluate(() => ({ panels: [...document.querySelectorAll('.node-panel')].every((p) => getComputedStyle(p).display !== 'none'), tracks: [...document.querySelectorAll('[role=tabpanel]')].every((p) => getComputedStyle(p).display !== 'none'), sidebar: getComputedStyle(document.getElementById('sidebar')).display }));
  expect('Print layout shows all tracks and all step details, hides navigation', print.panels && print.tracks && print.sidebar === 'none', JSON.stringify(print));
  await page.pdf({ path: join(QA, 'roadmaps-print.pdf') });
  await page.context().close();
}

// 8. Filters
{
  const page = await newPage();
  const shown = (sel) => page.$$eval(`${sel} > li`, (ls) => ls.filter((l) => !l.hidden).length);
  await page.goto(url('cases.html'));
  const total = await shown('#case-list');
  await page.selectOption('select[data-filter="industry"]', 'finance');
  const fin = await shown('#case-list');
  await page.selectOption('select[data-filter="difficulty"]', 'advanced');
  const none = await shown('#case-list'); const emptyVisible = await page.isVisible('.empty-state');
  const status = await page.textContent('.filter-status');
  await page.click('.empty-state [data-filter-reset]');
  const reset = await shown('#case-list');
  await page.fill('[data-filter-text]', 'klarna'); const k = await shown('#case-list');
  await page.click('.filters [data-filter-reset]');
  await page.selectOption('select[data-filter="tracks"]', 'ml'); await page.selectOption('select[data-filter="effort"]', '40-h-or-more');
  const combo = await shown('#case-list');
  expect('Case filters combine (industry × difficulty × track × effort), show empty state, Reset restores all', total === 11 && fin === 1 && none === 0 && emptyVisible && reset === 11 && k === 1 && combo >= 1 && /Showing 0 of 11/.test(status), `total=${total} fin=${fin} none=${none} empty=${emptyVisible} reset=${reset} search=${k} combo=${combo} status="${status}"`);
  await page.goto(url('hardware.html'));
  await page.selectOption('select[data-filter="work"]', 'distributed-training');
  const hw = await shown('#hw-list');
  await page.selectOption('select[data-filter="cost"]', 'low'); const hw0 = await shown('#hw-list');
  expect('Hardware filters (workload × cost) work', hw === 1 && hw0 === 0, `distributed=${hw} distributed+low=${hw0}`);
  await page.goto(url('projects.html'));
  const pAll = await shown('#project-list');
  await page.selectOption('select[data-filter="track"]', 'language-models'); const lmP = await shown('#project-list');
  await page.selectOption('select[data-filter="track"]', 'machine-learning'); const mlP = await shown('#project-list');
  expect('Capstone filter by area works (8 total: 3 ML, 3 language models)', pAll === 8 && lmP === 3 && mlP === 3, `all=${pAll} lm=${lmP} ml=${mlP}`);
  await page.goto(url('glossary.html')); const gAll = await page.$$eval('#gl-list > div', (ds) => ds.length);
  await page.fill('[data-filter-text]', 'drift');
  const g = await page.$$eval('#gl-list > div', (ds) => ds.filter((d) => !d.hidden).length);
  expect('Glossary has 100+ terms and search filters them', gAll >= 100 && g >= 2 && g <= 4, `terms=${gAll} drift matches=${g}`);
  await page.context().close();
}

// 8b. Lesson catalogue filters
{
  const page = await newPage();
  await page.goto(url('lessons.html'));
  const shown = () => page.$$eval('#cat-list > li', (ls) => ls.filter((l) => !l.hidden).length);
  const total = await shown();
  await page.selectOption('select[data-filter="part"]', '3-machine-learning'); const ml = await shown();
  await page.selectOption('select[data-filter="level"]', 'intermediate'); const mlInt = await shown();
  await page.selectOption('select[data-filter="level"]', 'expert'); const none = await shown(); const empty = await page.isVisible('.empty-state');
  await page.click('.filters [data-filter-reset]'); const reset = await shown();
  // The code filter now lists the labels produced by the real verification run (qa/code-status.json), so the option
  // value changed from "python-output-from-a-real-run" to "python-example-run".
  await page.selectOption('select[data-filter="code"]', 'python-example-run'); const exec = await shown();
  expect('Lesson catalogue filters (part × level × code status) combine, show empty state and reset', total === 50 && ml === 9 && mlInt === 6 && none === 0 && empty && reset === 50 && exec >= 40, `total=${total} ml=${ml} mlIntermediate=${mlInt} none=${none} empty=${empty} reset=${reset} executed=${exec}`);
  await page.click('.filters [data-filter-reset]');
  const mathsOpts = await page.$$eval('select[data-filter="maths"] option', (os) => os.map((o) => o.value).filter(Boolean));
  let mathsSum = 0; for (const v of mathsOpts) { await page.selectOption('select[data-filter="maths"]', v); mathsSum += await shown(); }
  await page.click('.filters [data-filter-reset]');
  await page.selectOption('select[data-filter="done"]', 'yes'); const doneNone = await shown();
  await page.selectOption('select[data-filter="done"]', 'no'); const todo = await shown();
  expect('Catalogue maths-level filter covers every lesson exactly once; progress filter separates finished from unfinished', mathsOpts.length === 4 && mathsSum === 50 && doneNone === 0 && todo === 50, `options=${mathsOpts.length} sum=${mathsSum} finished=${doneNone} unfinished=${todo}`);
  await page.context().close();
}

// 9. Search
{
  const page = await newPage();
  await page.goto(url('index.html'));
  await page.fill('#site-search', 'kv cache');
  const items = await page.$$eval('#search-results a', (as) => as.map((a) => a.textContent));
  const exp = await page.getAttribute('#site-search', 'aria-expanded');
  await page.keyboard.press('ArrowDown');
  const focusedLink = await page.evaluate(() => document.activeElement.closest('#search-results') !== null);
  await page.keyboard.press('Escape');
  const closed = await page.isHidden('#search-results');
  expect('Header search returns relevant results, supports arrow keys and Escape', items.length > 0 && items.some((t) => /KV cache|scale|local/i.test(t)) && exp === 'true' && focusedLink && closed, `${items.slice(0, 3).join(' | ')} exp=${exp} focus=${focusedLink} closed=${closed}`);
  await page.fill('#site-search', 'zzzqqq');
  expect('Search shows a no-results message', /No results/.test(await page.textContent('.search-status')), '');
  await page.context().close();
}

// 10. Progress: mark, dashboard, export, reset, import, invalid import
{
  const page = await newPage();
  await page.goto(url('lessons/ml-classification.html'));
  await page.check('[data-progress-checkbox="lesson:ml-classification"]');
  const count = await page.textContent('.nav-group[data-group="ml"] .nav-count');
  await page.goto(url('progress.html'));
  const dash = await page.textContent('#progress-dashboard');
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#export-progress')]);
  const path = join(QA, 'progress-export.json'); await download.saveAs(path);
  const exported = JSON.parse(readFileSync(path, 'utf8'));
  page.once('dialog', (d) => d.accept());
  await page.click('#reset-progress');
  const afterReset = await page.textContent('#progress-dashboard');
  await page.setInputFiles('#import-progress', path); await page.waitForTimeout(200);
  const afterImport = await page.textContent('#progress-dashboard');
  const bad = join(QA, 'bad.json'); writeFileSync(bad, '{"hello": 1}');
  await page.setInputFiles('#import-progress', bad); await page.waitForTimeout(200);
  const badMsg = await page.textContent('#io-status'); const still = await page.textContent('#progress-dashboard');
  expect('Lesson completion updates sidebar count (1/9)', count === '1/9', count);
  expect('Export produces versioned JSON (schema aimlqp-progress, version 2)', exported.schema === 'aimlqp-progress' && exported.version === 2 && exported.progress['lesson:ml-classification']?.done === true, JSON.stringify(exported).slice(0, 120));
  expect('Reset clears progress; import restores it', /1 of 9/.test(dash) && !/1 of 9/.test(afterReset) && /1 of 9/.test(afterImport), '');
  expect('Invalid import is rejected with a clear message and changes nothing', /Import failed/.test(badMsg) && /1 of 9/.test(still), badMsg);
  await page.fill('#cal-hours', '1');
  const calErr = await page.isVisible('#cal-error'); const inv = await page.getAttribute('#cal-hours', 'aria-invalid');
  await page.fill('#cal-hours', '10'); await page.selectOption('#cal-roadmap', 'lm');
  const rows = await page.$$eval('#calendar-output tbody tr', (r) => r.length);
  expect('Study calendar validates input and renders a schedule for each roadmap', calErr && inv === 'true' && rows === 9, `err=${calErr} invalid=${inv} rows=${rows}`);
  await page.context().close();
}

// 11. Storage blocked
{
  const page = await newPage({ blockStorage: true });
  await page.goto(url('lessons/app-rag.html'));
  await page.check('[data-progress-checkbox="lesson:app-rag"]');
  await page.selectOption('#theme-select', 'dark');
  const theme = await page.getAttribute('html', 'data-theme');
  await page.goto(url('progress.html'));
  const warn = await page.isVisible('#storage-warning');
  expect('Site works with localStorage blocked: no errors, theme applies, warning shown on progress page', page.errors.length === 0 && theme === 'dark' && warn, `errors=${page.errors.join(';')} theme=${theme} warn=${warn}`);
  await page.context().close();
}

// 12. Keyboard, skip link, quiz, reduced motion, copy button names
{
  const page = await newPage();
  await page.goto(url('lessons/dl-transformers.html'));
  await page.keyboard.press('Tab');
  const first = await page.evaluate(() => document.activeElement.className);
  await page.keyboard.press('Enter');
  const target = await page.evaluate(() => document.activeElement.id || location.hash);
  expect('First Tab reaches the skip link; it moves focus to main content', first === 'skip-link' && /main/.test(target), `${first} -> ${target}`);
  let outline = true;
  for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab'); const o = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle); if (o === 'none') outline = false; }
  expect('Focused controls show a visible focus outline (12 consecutive Tab stops)', outline, '');
  const unnamed = await page.$$eval('button, a, input, select', (els) => els.filter((e) => { const name = (e.getAttribute('aria-label') || e.textContent || e.value || (e.id && document.querySelector(`label[for="${e.id}"]`)?.textContent) || e.closest('label')?.textContent || '').trim(); return !name; }).map((e) => e.outerHTML.slice(0, 60)));
  expect('Every button, link and field has an accessible name', unnamed.length === 0, unnamed.slice(0, 3).join(' | '));
  const copy = await page.$$eval('.copy-btn', (bs) => bs.every((b) => /Copy code/.test(b.getAttribute('aria-label'))));
  expect('Code copy buttons have descriptive labels', copy, '');
  await page.click('[data-expand-all^="#qa-"]');
  const openAll = await page.$$eval('.qa details', (ds) => ds.every((d) => d.open));
  await page.click('[data-collapse-all^="#qa-"]');
  const closeAll = await page.$$eval('.qa details', (ds) => ds.every((d) => !d.open));
  expect('Lesson answer reveal: Show all / Hide all', openAll && closeAll, '');
  await page.goto(url('assessment.html'));
  await page.check('input[name="cp-ml-0"][value="1"]'); await page.click('#cp-ml + .mcq-list [data-check-answer] >> nth=0');
  expect('Quiz feedback marks a correct answer', /Correct/.test(await page.textContent('#cp-ml + .mcq-list .mcq-feedback >> nth=0')), '');
  await page.context().close();
  const rm = await newPage({ reducedMotion: 'reduce', width: 390 });
  await rm.goto(url('index.html'));
  const dur = await rm.evaluate(() => getComputedStyle(document.getElementById('sidebar')).transitionDuration);
  expect('Reduced-motion preference removes transitions', /^0s/.test(dur), dur);
  await rm.context().close();
}

// 12b. Learning features added 2026-11: maths moments, code language, search inside lessons, start chooser, resume, data migration
{
  // Maths moment calculator (learner journey 2): default result, one change, invalid input, reset, answer reveal
  const page = await newPage({ width: 390, scheme: 'dark' });
  await page.goto(url('lessons/ml-learning.html'));
  const w = page.locator('.mm-widget[data-widget="gradient"]');
  const out = () => w.locator('.mm-out').innerText();
  const first = await out();
  await w.locator('input >> nth=1').fill('1.2'); const up = await out();
  await w.locator('input >> nth=1').fill(''); const errShown = await w.locator('.mm-error').isVisible(); const invalid = await w.locator('input >> nth=1').getAttribute('aria-invalid');
  const fails = (await page.evaluate(contrastAudit)).fails;
  await w.locator('[data-widget-reset]').click(); const back = await out(); const errGone = !(await w.locator('.mm-error').isVisible());
  const mm = page.locator('.math-moment').first();
  await mm.locator('.mm-try summary').focus(); await page.keyboard.press('Enter');
  const answer = await mm.locator('.mm-try .mm-answer').isVisible();
  const scroll = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect('Maths moment calculator: correct default result, reacts to one change, rejects empty input with a message, resets, answer opens by keyboard, readable in dark at 390 px',
    /1\.4/.test(first) && /2\.56/.test(first) && /went UP/.test(up) && errShown && invalid === 'true' && back === first && errGone && answer && fails.length === 0 && scroll <= 0,
    `first=${first.slice(0, 60)} up=${/went UP/.test(up)} err=${errShown} invalid=${invalid} reset=${back === first} answer=${answer} contrast=${fails.slice(0, 2).join(';')} scroll=${scroll} ${page.errors.join(';')}`);
  await page.context().close();
}
{
  // Every calculator type gives the hand-worked answer shown in its lesson (the page and the build agree)
  const page = await newPage();
  const cases = [['lessons/d-clean-eda.html', 'mean', /12 ÷ 3 = 4/], ['lessons/ml-regression.html', 'line', /6 \+ 1 = 7/], ['lessons/ml-classification.html', 'confusion', /0\.8 = 80%/],
    ['lessons/app-embeddings.html', 'dot', /= 11/], ['lessons/dl-transformers.html', 'weighted', /= 8/], ['lessons/llm-local.html', 'memory', /16 GB/], ['lessons/llm-tokens.html', 'softmax', /66\.5%/]];
  const bad = [];
  for (const [p, type, re] of cases) {
    await page.goto(url(p));
    const t = await page.locator(`.mm-widget[data-widget="${type}"] .mm-out`).innerText().catch(() => 'missing');
    if (!re.test(t)) bad.push(`${type}: ${t.slice(0, 80)}`);
  }
  expect('All 8 calculator types show the same result as the worked steps in their lesson', bad.length === 0 && page.errors.length === 0, bad.join(' | ') + page.errors.join(';'));
  await page.context().close();
}
{
  // Code language switch (learner journey 3): C# only hides Python, is remembered, and a deep link to the hidden language still lands
  const page = await newPage({ width: 1280 });
  await page.goto(url('lessons/ml-regression.html'));
  const vis = (id) => page.locator(`#${id}`).isVisible();
  const both = (await vis('python-example')) && (await vis('net-c-example'));
  await page.check('[data-lang-switch] input[value="cs"]');
  const csOnly = !(await vis('python-example')) && (await vis('net-c-example'));
  const tocHidden = !(await page.locator('.rail-toc li[data-lang-section="python"]').isVisible());
  await page.reload();
  const kept = !(await vis('python-example')) && (await page.isChecked('[data-lang-switch] input[value="cs"]'));
  await page.goto(url('lessons/ml-regression.html#python-example'));
  const deep = await vis('python-example');
  const pill = await page.locator('section[data-lang-section="cs"] .code-evidence .pill').innerText();
  expect('Code language switch: C# only hides the Python section and its contents entry, survives reload, deep link to the hidden section shows it; C# status pill comes from the compile record',
    both && csOnly && tocHidden && kept && deep && /^C#:/.test(pill), `both=${both} csOnly=${csOnly} toc=${tocHidden} kept=${kept} deep=${deep} pill=${pill}`);
  await page.context().close();
}
{
  // Search inside lesson text (learner journey 7): a phrase that is in no page title finds a lesson section with a marked snippet
  const page = await newPage({ width: 1280 });
  await page.goto(url('index.html'));
  await page.fill('#site-search', 'jumped right over');
  await page.waitForSelector('#search-results .res-snippet mark', { timeout: 10000 }).catch(() => {});
  const groups = await page.$$eval('#search-results .search-group', (g) => g.map((x) => x.textContent));
  const marks = await page.$$eval('#search-results .res-snippet mark', (m) => m.length);
  const href = await page.locator('#search-results a').first().getAttribute('href');
  await page.locator('#search-results a').first().click();
  const landed = await page.evaluate(() => location.pathname.endsWith('ml-learning.html') && location.hash === '#how-it-works');
  expect('Search finds text inside lessons, marks the words and opens the matching section', groups.includes('Inside lessons') && marks >= 1 && landed, `groups=${groups} marks=${marks} href=${href} landed=${landed}`);
  await page.context().close();
}
{
  // Start chooser and resume (learner journeys 1 and 5)
  const page = await newPage({ width: 1280 });
  await page.goto(url('index.html'));
  const noResume = !(await page.isVisible('#resume-card'));
  await page.click('[data-persona-pick="dotnet"]');
  const start = await page.getAttribute('#hero-start', 'href');
  const pressed = await page.getAttribute('[data-persona-pick="dotnet"]', 'aria-pressed');
  await page.click('#hero-start');
  const onSetup = page.url().endsWith('lessons/s-setup.html');
  const csFirst = await page.isChecked('[data-lang-switch] input[value="cs"]');
  await page.goto(url('index.html'));
  const resume = (await page.isVisible('#resume-card')) && /Set up your laptop/.test(await page.innerText('#resume-link'));
  const chosen = await page.getAttribute('.persona-card[data-persona="dotnet"]', 'data-chosen');
  await page.click('[data-persona-pick="dotnet"]');
  const cleared = (await page.getAttribute('#hero-start', 'href')) === 'lessons/s-what-is-ai.html';
  expect('Start chooser sets the first lesson and code language, is remembered and can be cleared; home page offers to resume the last lesson',
    noResume && /s-setup/.test(start) && pressed === 'true' && onSetup && csFirst && resume && chosen === 'true' && cleared, `noResume=${noResume} start=${start} pressed=${pressed} onSetup=${onSetup} cs=${csFirst} resume=${resume} chosen=${chosen} cleared=${cleared}`);
  await page.context().close();
}
{
  // Data written by the previous site version (version 1) is kept and upgraded, never lost
  const page = await newPage();
  await page.goto(url('index.html'));
  await page.evaluate(() => localStorage.setItem('aimlqp.v1', JSON.stringify({ version: 1, prefs: { theme: 'dark', sidebar: 'hidden' }, progress: { 'lesson:ml-regression': { done: true, at: '2026-11-01' }, 'project:c01-churn': { done: true, at: '2026-11-02' } } })));
  await page.goto(url('lessons/ml-regression.html'));
  const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  const ticked = await page.isChecked('[data-progress-checkbox="lesson:ml-regression"]');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('aimlqp.v1')));
  expect('Version 1 browser data migrates to version 2 with theme, layout and all completion marks intact',
    theme === 'dark' && ticked && stored.version === 2 && stored.prefs.sidebar === 'hidden' && stored.progress['project:c01-churn']?.done === true && stored.progress['lesson:ml-regression']?.at === '2026-11-01' && stored.last?.id === 'ml-regression',
    JSON.stringify(stored).slice(0, 200));
  await page.context().close();
}

{
  // Roadmap steps: prerequisite, progress count, checkpoint link, and a continue button that follows the learner's progress
  const page = await newPage({ width: 1280 });
  await page.goto(url('roadmaps.html#ml'));
  const meta = await page.locator('#ml .node >> nth=1').locator('.node-meta').allInnerTexts();
  const first = await page.locator('#ml .rm-continue').getAttribute('href');
  await page.evaluate(() => localStorage.setItem('aimlqp.v1', JSON.stringify({ version: 2, prefs: {}, progress: { 'lesson:s-what-is-ai': { done: true, at: '2026-11-01' }, 'lesson:s-lifecycle': { done: true, at: '2026-11-01' }, 'lesson:s-setup': { done: true, at: '2026-11-01' } } })));
  await page.goto(url('roadmaps.html#ml')); await page.reload();
  const next = await page.locator('#ml .rm-continue').getAttribute('href');
  const count = await page.locator('#ml .node >> nth=0').locator('[data-progress-ids]').innerText();
  const cp = await page.locator('#ml .node >> nth=1').locator('a[href*="assessment.html#cp-data"]').count();
  expect('Roadmap steps show what to finish first, a progress count and a checkpoint link; Continue points to the first unfinished lesson',
    /Finish step 1/.test(meta.join(' ')) && /lessons/.test(meta.join(' ')) && cp === 1 && /s-what-is-ai/.test(first) && /d-basics/.test(next) && count === '3/3', );
  await page.context().close();
}

{
  // 12-week plan and progress page reflect finished lessons and offer to resume
  const page = await newPage({ width: 1280 });
  await page.goto(url('lessons/s-what-is-ai.html'));
  await page.check('[data-progress-checkbox="lesson:s-what-is-ai"]');
  await page.goto(url('plan.html'));
  const wk = await page.locator('#week-1 [data-progress-ids]').innerText();
  const doneMark = await page.locator('#week-1 a[data-progress-id="lesson:s-what-is-ai"]').getAttribute('data-done');
  await page.goto(url('progress.html'));
  const resume = (await page.isVisible('#resume-progress')) && /What AI/.test(await page.innerText('#resume-link'));
  expect('12-week plan shows finished lessons per week; progress page offers to resume the last lesson', wk === '1/4' && doneMark === 'true' && resume && page.errors.length === 0, 'wk=' + wk + ' done=' + doneMark + ' resume=' + resume + ' ' + page.errors.join(';'));
  await page.context().close();
}

// 13. Screenshots
const shots = [['lessons/ml-learning.html', 1440, 'light', 'lesson-maths-1440-light'], ['lessons/ml-learning.html', 1440, 'dark', 'lesson-maths-1440-dark'], ['lessons/ml-classification.html', 390, 'light', 'lesson-maths-390-light'], ['lessons/ml-regression.html', 768, 'dark', 'lesson-768-dark'], ['index.html', 1440, 'light', 'home-1440-light'], ['index.html', 390, 'dark', 'home-390-dark'], ['cases/klarna.html', 1280, 'light', 'case-sources-1280-light'],
['lessons.html', 1440, 'light', 'catalogue-1440-light'], ['solve.html', 1440, 'dark', 'solve-1440-dark'], ['maths.html', 1280, 'light', 'maths-map-1280-light'], ['lessons/llm-train-laptop.html', 1920, 'light', 'lesson-1920-light'], ['plan.html', 390, 'light', 'plan-390-light'], ['projects/c04-rag-assistant.html', 1440, 'light', 'capstone-1440-light'], ['index.html', 1440, 'light', 'home-1440-light'], ['index.html', 1440, 'dark', 'home-1440-dark'], ['index.html', 390, 'light', 'home-390-light'], ['index.html', 390, 'dark', 'home-390-dark'],
  ['roadmaps.html', 1440, 'dark', 'roadmap-collapsed-1440-dark'], ['roadmaps.html#lm', 390, 'light', 'roadmap-lm-390-light'], ['lessons/app-rag.html', 1440, 'light', 'lesson-1440-light'], ['lessons/app-rag.html', 390, 'dark', 'lesson-390-dark'],
  ['cases.html', 1280, 'dark', 'cases-1280-dark'], ['hardware.html', 390, 'light', 'hardware-390-light'], ['progress.html', 1280, 'light', 'progress-1280-light']];
for (const [p, w, s, name] of shots) {
  const page = await newPage({ width: w, scheme: s });
  await page.goto(url(p)); await page.screenshot({ path: join(QA, `screenshots/${name}.png`) });
  if (name === 'lesson-1440-light') { await page.click('#sidebar-toggle'); await page.screenshot({ path: join(QA, 'screenshots/lesson-1440-sidebar-hidden.png') }); }
  if (name === 'lesson-390-dark') { await page.click('#sidebar-toggle'); await page.waitForTimeout(250); await page.screenshot({ path: join(QA, 'screenshots/drawer-open-390-dark.png') }); }
  if (name === 'roadmap-lm-390-light') { await page.click('[data-roadmap-expand]'); await page.screenshot({ path: join(QA, 'screenshots/roadmap-lm-expanded-390-light.png'), fullPage: true }); }
  await page.context().close();
}
record('Screenshots written to qa/screenshots', true);

await browser.close();
const failed = results.filter((r) => !r.pass);
writeFileSync(join(QA, 'e2e-results.json'), JSON.stringify({ date: new Date().toISOString(), browser: 'Chromium (Playwright)', pages: ALL.length, passed: results.length - failed.length, failed: failed.length, results }, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
process.exit(failed.length ? 1 : 0);
