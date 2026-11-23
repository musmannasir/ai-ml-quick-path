// Static checks on dist/: internal links and anchors resolve, one h1 per page, no heading
// level skips, lang attribute, unique ids, no placeholder text, images/scripts exist, and the outside-link policy
// (owner decision 2026-11-13, replaces "zero external links"):
//   - NOTHING is loaded from another site: no outside script, image, font, frame, stylesheet or data (src/link/iframe).
//   - An outside address may appear only as an ordinary <a href> to a source registered in src/data/sources.mjs,
//     with https, class="ext" and rel="noopener noreferrer external", and with descriptive link text.
//   - No web address is printed as visible text. Local addresses such as http://localhost:11434 inside code
//     samples are allowed because they point at the learner's own machine.
// Run: node tests/static-checks.mjs   (after npm run build)
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOURCES } from '../src/data/sources.mjs';

const ADSENSE = !!(process.env.ADSENSE_CLIENT || '').trim();
const SITE_URL = (process.env.SITE_URL || '').replace(/\/$/, '');
const CLEAN_URLS = process.env.CLEAN_URLS === 'on' || !!process.env.WORKERS_CI || !!process.env.CF_PAGES;
const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const files = (function walk(d) { return readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : []; }); })(DIST);
const ids = new Map();
for (const f of files) ids.set(f, new Set([...readFileSync(f, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));

const problems = [];
if (!files.length) { console.error('No HTML files found in dist/ - run npm run build first.'); process.exit(1); }
let links = 0, outside = 0; const external = new Set(), usedSources = new Set();
const REGISTERED = new Map(Object.entries(SOURCES).map(([id, s]) => [s.url, id]));
for (const [id, s] of Object.entries(SOURCES)) { if (!/^https:\/\//.test(s.url)) problems.push(`sources.mjs: ${id} must use https`); if (!s.title || !s.publisher) problems.push(`sources.mjs: ${id} needs a title and a publisher`); }
for (const f of files) {
  const html = readFileSync(f, 'utf8');
  const rel = f.slice(DIST.length + 1);
  if (!/<html lang="en"/.test(html)) problems.push(`${rel}: missing lang`);
  if (SITE_URL) {   // the canonical tag must name the address the host really serves (no .html where the host uses clean addresses)
    const relUrl = rel.split('\\').join('/'), want = `${SITE_URL}/${relUrl === 'index.html' ? '' : CLEAN_URLS ? relUrl.replace(/\.html$/, '') : relUrl}`;
    const got = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
    if (got !== want) problems.push(`${rel}: canonical is ${got || 'missing'}, expected ${want}`);
  }
  if ((html.match(/<h1[\s>]/g) || []).length !== 1) problems.push(`${rel}: expected exactly one h1`);
  if (/<figure class="sim"/.test(html)) {
    // Simulations (src/lib/sim.mjs): static markup must be complete, with no inline style, and the engine and module files must exist.
    for (const s of html.match(/<figure class="sim"[\s\S]*?<\/figure>/g) || []) {
      if (/\sstyle=/.test(s)) problems.push(rel + ': a simulation has an inline style attribute');
      if (!/class="sim-leaves"/.test(s)) problems.push(rel + ': a simulation has no "What this leaves out" note');
      if (!/class="sim-watch"/.test(s)) problems.push(rel + ': a simulation has no "What to watch" list');
    }
    if (!/<script src="[^"]*assets\/sim\.js" defer>/.test(html)) problems.push(rel + ': has a simulation but does not load assets/sim.js');
    for (const m of html.matchAll(/<script src="([^"]*assets\/sims\/[^"]+)" defer>/g)) if (!existsSync(normalize(join(dirname(f), m[1])))) problems.push(rel + ': missing simulation file ' + m[1]);
  }
  if (/^lessons[\\/]/.test(rel)) { const nd = (html.match(/<figure class="diagram /g) || []).length; if (nd < 3) problems.push(`${rel}: needs at least 3 diagrams, has ${nd}`); }
  // Maths at the point of need: every lesson that asks for any maths has at least one worked maths moment,
  // each with hand steps and a tie-back to AI; a lesson marked "No maths" must not carry one.
  if (/^lessons[\\/]/.test(rel)) {
    const mm = (html.match(/<aside class="math-moment"/g) || []).length;
    const none = /<span class="meta-k">Maths<\/span> No maths/.test(html);
    if (!none && mm < 1) problems.push(`${rel}: needs at least one maths moment (or front matter "maths: none")`);
    if (none && mm > 0) problems.push(`${rel}: is marked "maths: none" but contains a maths moment`);
    if (mm !== (html.match(/<ol class="mm-steps">/g) || []).length || mm !== (html.match(/<p class="mm-why">/g) || []).length) problems.push(`${rel}: every maths moment needs steps and a "why"`);
  }
  // Company cases: a dated source check and linked sources. Capstones: a starter that was really run, with its limits stated.
  if (/^cases[\\/]/.test(rel)) {
    if (!/<h2 id="checked">Source check/.test(html)) problems.push(`${rel}: needs a "Source check" section`);
    if ((html.match(/<a class="ext"/g) || []).length < 2) problems.push(`${rel}: needs at least two linked sources`);
  }
  if (/^projects[\\/]/.test(rel) && (!/Starter code you can run today/.test(html) || !/What the starter does not give you/.test(html))) problems.push(`${rel}: needs a starter section with its limits`);
  if ((html.match(/<figure class="diagram /g) || []).length !== (html.match(/<figure class="diagram [^>]*aria-labelledby="dg-[0-9]+"><figcaption id="dg-[0-9]+"/g) || []).length) problems.push(`${rel}: every diagram needs a caption`);
  let last = 0;
  for (const m of html.replace(/<nav id="sidebar"[\s\S]*?<\/nav>/, '').matchAll(/<h([1-6])[\s>]/g)) {
    const lvl = Number(m[1]);
    if (last && lvl > last + 1) { problems.push(`${rel}: heading jumps h${last} -> h${lvl}`); break; }
    last = lvl;
  }
  const all = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = all.filter((x, i) => all.indexOf(x) !== i);
  if (dup.length) problems.push(`${rel}: duplicate ids ${[...new Set(dup)].join(', ')}`);
  const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
  if (/\b(TODO|TBD|lorem ipsum|coming soon|placeholder lesson)\b/i.test(text)) problems.push(`${rel}: placeholder text`);
  if (/\{escape\(|\$\{/.test(text)) problems.push(`${rel}: unrendered template text`);
  for (const m of text.matchAll(/\bhttps?:\/\/[^\s"'<)]+/g)) {
    if (!/^https?:\/\/(localhost|127\.0\.0\.1)([:/]|$)/.test(m[0])) problems.push(`${rel}: external web address in text ${m[0]}`);
  }
  // Outside reference links: registered source, safe rel, descriptive text.
  for (const m of html.matchAll(/<a\s([^>]*?)href="(https?:[^"]+)"([^>]*)>([\s\S]*?)<\/a>/g)) {
    const attrs = m[1] + m[3], url = m[2].replace(/&amp;/g, '&'), text = m[4].replace(/<[^>]+>/g, '').trim();
    if (SITE_URL && (url === SITE_URL || url.startsWith(SITE_URL + '/'))) continue;
    const id = REGISTERED.get(url);
    if (!id) { external.add(url); continue; }
    outside++; usedSources.add(id);
    if (!/class="ext"/.test(attrs)) problems.push(`${rel}: outside link to ${id} needs class="ext"`);
    if (!/rel="noopener noreferrer external"/.test(attrs)) problems.push(`${rel}: outside link to ${id} needs rel="noopener noreferrer external"`);
    if (/target=/.test(attrs)) problems.push(`${rel}: outside link to ${id} must not force a new window`);
    if (text.length < 4 || /^https?:|^(here|link|click here|this)$/i.test(text)) problems.push(`${rel}: outside link to ${id} needs descriptive text, found "${text}"`);
  }
  if (/<iframe|<embed|<object/i.test(html)) problems.push(`${rel}: frames and embeds are not allowed`);
  for (const m of html.matchAll(/<(\w+)\s[^>]*?\s?(?:href|src)="([^"]+)"/g)) {
    const tag = m[1].toLowerCase(), url = m[2];
    if (/^https?:/.test(url)) {
      if (tag === 'a') continue; // checked above
      // Owner decision 2026-11-05: the AdSense build (ADSENSE_CLIENT set) may load exactly the Google ad loader.
      if (ADSENSE && /^https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-[0-9]+$/.test(url)) continue;
      // Canonical / og:url tags point at the site's own address when SITE_URL is set; that is not an outside link.
      if (SITE_URL && (url === SITE_URL || url.startsWith(SITE_URL + '/'))) continue;
      external.add(url); continue;
    }
    if (/^(mailto:|data:)/.test(url)) continue;
    links++;
    const [path, hash] = url.split('#');
    const target = path ? normalize(join(dirname(f), path)) : f;
    if (!existsSync(target)) { problems.push(`${rel}: broken link ${url}`); continue; }
    if (hash && target.endsWith('.html') && !ids.get(target)?.has(decodeURIComponent(hash)) && !['applied', 'ml', 'lm'].includes(hash))
      problems.push(`${rel}: missing anchor ${url}`);
  }
}
for (const u of external) problems.push(`outside address not registered in src/data/sources.mjs: ${u}`);
console.log(`Checked ${files.length} pages, ${links} internal links, ${outside} outside reference links to ${usedSources.size} registered sources, ${external.size} unregistered outside addresses or outside resources (must be 0).`);
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('Static checks passed.');
