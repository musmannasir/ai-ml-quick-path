// Static checks on dist/: internal links and anchors resolve, one h1 per page, no heading
// level skips, lang attribute, unique ids, no placeholder text, images/scripts exist, and
// ZERO external links or web addresses (this edition is self-contained). Local addresses such as
// http://localhost:11434 inside code samples are allowed because they point at the learner's own machine.
// Run: node tests/static-checks.mjs   (after npm run build)
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ADSENSE = !!(process.env.ADSENSE_CLIENT || '').trim();
const SITE_URL = (process.env.SITE_URL || '').replace(/\/$/, '');
const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const files = (function walk(d) { return readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : []; }); })(DIST);
const ids = new Map();
for (const f of files) ids.set(f, new Set([...readFileSync(f, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));

const problems = [];
if (!files.length) { console.error('No HTML files found in dist/ - run npm run build first.'); process.exit(1); }
let links = 0, external = new Set();
for (const f of files) {
  const html = readFileSync(f, 'utf8');
  const rel = f.slice(DIST.length + 1);
  if (!/<html lang="en"/.test(html)) problems.push(`${rel}: missing lang`);
  if ((html.match(/<h1[\s>]/g) || []).length !== 1) problems.push(`${rel}: expected exactly one h1`);
  if (/^lessons[\\/]/.test(rel)) { const nd = (html.match(/<figure class="diagram /g) || []).length; if (nd < 3) problems.push(`${rel}: needs at least 3 diagrams, has ${nd}`); }
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
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const url = m[1];
    if (/^https?:/.test(url)) {
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
for (const u of external) problems.push(`external link not allowed: ${u}`);
console.log(`Checked ${files.length} pages, ${links} internal links, ${external.size} external links (must be 0).`);
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('Static checks passed.');
