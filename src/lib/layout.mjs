import { esc } from './markdown.mjs';
import { MODULES, REVIEWED } from '../data/curriculum.mjs';

export const INLINE_SCRIPT = `(function(){try{var d=JSON.parse(localStorage.getItem('aimlqp.v1')||'{}'),p=d.prefs||{},h=document.documentElement;if(p.theme==='light'||p.theme==='dark')h.setAttribute('data-theme',p.theme);if(p.sidebar==='hidden')h.setAttribute('data-sidebar','hidden');if(p.focus==='on')h.setAttribute('data-focus','on');if(p.rail==='hidden')h.setAttribute('data-rail','hidden');}catch(e){}document.documentElement.classList.add('js');})();`;

export const SITE = {
  name: 'AI & ML Quick Path: From Concepts to Industry',
  short: 'AI & ML Quick Path',
  url: (process.env.SITE_URL || '').replace(/\/$/, ''),
  description: 'A self-contained, plain-language guide to AI and machine learning concepts and how industry builds them, with Python and .NET examples, from first steps to advanced systems.',
};

// ---------- optional Google AdSense (owner decision 2026-11-05) ----------
// Everything is OFF unless ADSENSE_CLIENT is set. Stage 1 (approval): ADSENSE_CLIENT only -> Google loader script,
// verification meta tag, ads.txt, privacy wording. Stage 2 (ads visible): also ADS_SLOTS=on plus AD_SLOT_RAIL /
// AD_SLOT_END / AD_SLOT_FOOTER (ad unit ids from the AdSense account). A slot without an id is not rendered.
const env = (k) => (process.env[k] || '').trim();
export const ADS = { client: env('ADSENSE_CLIENT'), slotsOn: env('ADS_SLOTS') === 'on',
  slots: { rail: env('AD_SLOT_RAIL'), end: env('AD_SLOT_END'), footer: env('AD_SLOT_FOOTER') } };
if (ADS.client && !/^ca-pub-[0-9]{10,20}$/.test(ADS.client)) throw new Error('ADSENSE_CLIENT must look like ca-pub-1234567890123456');
for (const [k, v] of Object.entries(ADS.slots)) if (v && !/^[0-9]{6,20}$/.test(v)) throw new Error(`AD_SLOT_${k.toUpperCase()} must be the numeric ad unit id`);
if (ADS.client && !SITE.url) throw new Error('ADSENSE_CLIENT is set but SITE_URL is not. AdSense needs the real site address: set SITE_URL=https://your-domain');
export function adSlot(name) {
  const id = ADS.slots[name];
  if (!ADS.client || !ADS.slotsOn || !id) return '';
  return `<aside class="ad-slot ad-slot-${name}" aria-label="Advertisement"><p class="ad-label">Advertisement</p><ins class="adsbygoogle" data-ad-client="${esc(ADS.client)}" data-ad-slot="${esc(id)}" data-ad-format="auto" data-full-width-responsive="true"></ins></aside>`;
}
const FOOTER_AD_PAGES = /^(lessons\.html|glossary|cases|projects|hardware|solve|maths|part-[0-9])/;

const ICON = {
  menu: '<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>',
  focus: '<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  logo: '<svg aria-hidden="true" viewBox="0 0 32 32" width="28" height="28"><rect width="32" height="32" rx="7" fill="var(--accent)"/><path d="M8 22l5-12 5 12M10 18h6M21 10v12" stroke="var(--accent-ink)" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

// Navigation tree. "key" is matched against the current page to mark it active.
export function navGroups(lessonsById) {
  const groups = [
    { id: 'begin', title: 'Start here', items: [
      { href: 'index.html', label: 'Welcome and how to use this guide' }, { href: 'roadmaps.html', label: 'Visual roadmaps' },
      { href: 'plan.html', label: '12-week study plan' }, { href: 'lessons.html', label: 'All lessons with filters' },
      { href: 'roles.html', label: 'AI engineer or ML engineer?' } ] },
  ];
  for (const m of MODULES) {
    const ids = m.groups.flatMap((g) => g.lessons);
    groups.push({ id: m.id, title: m.short, progressIds: ids.map((id) => `lesson:${id}`), items: [
      { href: m.page, label: 'Part overview' },
      ...ids.map((id) => ({ href: `lessons/${id}.html`, label: lessonsById[id].title, progressId: `lesson:${id}`, level: lessonsById[id].level })),
    ] });
  }
  groups.push({ id: 'practice', title: 'Practice and industry', items: [
    { href: 'solve.html', label: 'Solve any case: decision guide' }, { href: 'cases.html', label: 'Real-world cases' },
    { href: 'projects.html', label: 'Capstone projects' }, { href: 'assessment.html', label: 'Quick checks and readiness' } ] });
  groups.push({ id: 'reference', title: 'Reference', items: [
    { href: 'maths.html', label: 'Maths map' }, { href: 'hardware.html', label: 'Hardware: laptop to cloud' },
    { href: 'glossary.html', label: 'Glossary' }, { href: 'progress.html', label: 'My progress and calendar' },
    { href: 'about.html', label: 'About this guide' } ] });
  return groups;
}

function sidebar(groups, current, root) {
  const currentGroup = groups.find((g) => g.items.some((i) => i.href === current))?.id || 'begin';
  return `<nav id="sidebar" class="sidebar" aria-label="Course navigation">
  <div class="sidebar-search">
    <label for="nav-filter">Filter the course list</label>
    <input id="nav-filter" type="search" autocomplete="off" placeholder="Type to filter lessons">
    <p id="nav-filter-status" class="sr-only" role="status" aria-live="polite"></p>
  </div>
  <div class="nav-actions"><button type="button" class="link-btn" data-nav-expand="all">Expand all</button><button type="button" class="link-btn" data-nav-expand="none">Collapse all</button></div>
  ${groups.map((g) => {
    const open = g.id === currentGroup;
    return `<div class="nav-group" data-group="${g.id}">
    <h2 class="nav-heading"><button type="button" class="nav-toggle" aria-expanded="${open}" aria-controls="ng-${g.id}"><span class="nav-title">${esc(g.title)}</span>${
      g.progressIds ? `<span class="nav-count" data-progress-ids="${g.progressIds.join(' ')}" aria-label="lessons completed">0/${g.progressIds.length}</span>` : ''}<span class="chev" aria-hidden="true"></span></button></h2>
    <ul id="ng-${g.id}" class="nav-list"${open ? '' : ' hidden'}>
      ${g.items.map((i) => `<li><a href="${root}${i.href}"${i.href === current ? ' aria-current="page"' : ''}${i.progressId ? ` data-progress-id="${i.progressId}"` : ''}><span class="nav-check" aria-hidden="true"></span><span class="nav-label">${esc(i.label)}</span>${i.level === 'Advanced' || i.level === 'Expert' ? `<span class="nav-level">${esc(i.level)}</span>` : ''}</a></li>`).join('\n      ')}
    </ul></div>`;
  }).join('\n')}
  <p class="sidebar-note">Progress is saved only in this browser on this device. <a href="${root}progress.html">Export or reset</a>.</p>
</nav>`;
}

export function page({ path, title, description, body, crumbs = [], groups, toc = '', wide = false, bodyClass = '' }) {
  const depth = path.split('/').length - 1;
  const root = depth ? '../'.repeat(depth) : '';
  const fullTitle = path === 'index.html' ? SITE.name : `${title} | ${SITE.short}`;
  const canonical = SITE.url ? `${SITE.url}/${path === 'index.html' ? '' : path}` : '';
  const desc = description || SITE.description;
  return `<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="color-scheme" content="light dark">
<meta name="aiea-root" content="${root}">
${canonical ? `<link rel="canonical" href="${esc(canonical)}">\n<meta property="og:url" content="${esc(canonical)}">` : ''}
<meta property="og:type" content="${path.startsWith('lessons/') ? 'article' : 'website'}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:site_name" content="${esc(SITE.name)}">
<link rel="icon" href="${root}favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${root}assets/app.css">
${ADS.client ? `<meta name="google-adsense-account" content="${esc(ADS.client)}">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(ADS.client)}" crossorigin="anonymous"></script>` : ''}
<script>${INLINE_SCRIPT}</script>
</head>
<body class="${bodyClass}">
<a class="skip-link" href="#main">Skip to main content</a>
<header class="topbar">
  <button type="button" id="sidebar-toggle" class="btn btn-quiet" aria-controls="sidebar" aria-expanded="true">${ICON.menu}<span class="btn-label">Contents</span></button>
  <a class="brand" href="${root}index.html">${ICON.logo}<span class="brand-text">${SITE.short}</span></a>
  <div class="search" role="search">
    <label for="site-search" class="sr-only">Search the academy</label>
    <input id="site-search" type="search" autocomplete="off" placeholder="Search lessons, projects, terms" aria-controls="search-results" aria-expanded="false" aria-describedby="search-hint">
    <span id="search-hint" class="sr-only">Results appear below as you type. Press the down arrow to move into the results.</span>
    <div id="search-results" class="search-results" hidden><p class="search-status" role="status" aria-live="polite"></p><ul></ul></div>
  </div>
  <button type="button" id="focus-toggle" class="btn btn-quiet" aria-pressed="false">${ICON.focus}<span class="btn-label">Focus</span></button>
  <label class="theme-picker"><span class="theme-label">Theme</span>
    <select id="theme-select"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select>
  </label>
</header>
<div class="layout">
<button type="button" id="sidebar-edge" class="edge-tab edge-left" aria-controls="sidebar" aria-expanded="true" aria-label="Hide course navigation"></button>
${sidebar(groups, path, root)}
<div class="scrim" hidden></div>
<div class="main-col">
<main id="main" tabindex="-1" class="${wide ? 'wide' : ''}${toc ? ' has-toc' : ''}">
${crumbs.length ? `<nav class="crumbs" aria-label="Breadcrumb"><ol>${[['Home', 'index.html'], ...crumbs].map(([label, href], k, arr) =>
    k === arr.length - 1 ? `<li><span aria-current="page">${esc(label)}</span></li>` : `<li><a href="${root}${href}">${esc(label)}</a></li>`).join('')}</ol></nav>` : ''}
<div class="content-grid">
<div class="content${['about.html', 'assessment.html'].includes(path) || path.startsWith('cases/') || path.startsWith('projects/') ? ' cols' : ''}">
${body}
</div>
${toc}
</div>
</main>
${FOOTER_AD_PAGES.test(path) ? adSlot('footer') : ''}
<footer class="site-footer">
  <p>${SITE.name}. Content reviewed ${REVIEWED}. ${ADS.client ? 'This site is supported by advertising.' : 'Self-contained edition: no external links.'} Text CC BY 4.0, code MIT.</p>
  <ul class="footer-links"><li><a href="${root}about.html">About and accessibility</a></li><li><a href="${root}privacy.html">Privacy and cookies</a></li><li><a href="${root}cases.html">Real-world cases</a></li><li><a href="${root}progress.html">Progress export</a></li></ul>
</footer>
</div>
</div>
<button type="button" class="to-top btn" hidden>Back to top</button>
<script src="${root}assets/search-index.js" defer></script>
<script src="${root}assets/app.js" defer></script>
</body>
</html>`;
}
