// Non-lesson pages for AI & ML Quick Path. Each function returns { path, title, description, body, crumbs, ... }.
// Self-contained edition: no page may contain an external link (the build and static checks enforce this).

const TRACK_LABEL = { applied: 'AI application', ml: 'Machine learning', lm: 'Language models' };

export function allPages(S) {
  return [
    home(S), plan(S), roles(S), roadmaps(S), catalogue(S), solve(S), maths(S),
    ...S.MODULES.map((m) => modulePage(S, m)),
    projectsIndex(S), ...S.PROJECTS.map((p) => projectPage(S, p)),
    casesIndex(S), ...S.CASES.map((c) => casePage(S, c)),
    hardware(S), glossary(S), assessment(S), progress(S), about(S), privacy(S), notFound(S),
  ];
}

const list = (items, esc) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
// Options are strings, or [label, value] pairs when the visible label differs from the filter value.
const filterBar = (S, target, selects, label) => `
<div class="filters" data-filter-target="#${target}" role="group" aria-label="${S.esc(label)}">
  ${selects.map(([key, title, options]) => `<label class="field"><span>${S.esc(title)}</span><select data-filter="${key}"><option value="">All</option>${
    options.map((o) => { const [lab, val] = Array.isArray(o) ? o : [o, o]; return `<option value="${S.esc(S.slug(val))}">${S.esc(lab)}</option>`; }).join('')}</select></label>`).join('')}
  <label class="field field-grow"><span>Search</span><input type="search" data-filter-text placeholder="Type words to match"></label>
  <button type="button" class="btn" data-filter-reset>Reset filters</button>
  <p class="filter-status" role="status" aria-live="polite"></p>
</div>`;
const emptyState = (what) => `<div class="empty-state" hidden><p>No ${what} match these filters.</p><button type="button" class="btn" data-filter-reset>Reset filters</button></div>`;
const dataAttrs = (S, obj) => Object.entries(obj).map(([k, v]) => `data-${k}="${S.esc([].concat(v).map(S.slug).join(' '))}"`).join(' ');
const hoursOf = (S, ids) => Math.round(ids.reduce((a, id) => a + S.lessons[id].minutes, 0) / 60);
const table = (S, label, head, rows, cls = '') => `<div class="table-wrap stack-on-mobile" tabindex="0" role="region" aria-label="${S.esc(label)}"><table${cls ? ` class="${cls}"` : ''}><thead><tr>${head.map((h) => `<th scope="col">${S.esc(h)}</th>`).join('')}</tr></thead><tbody>${
  rows.map((r) => `<tr><th scope="row">${r[0]}</th>${r.slice(1).map((c, i) => `<td data-label="${S.esc(head[i + 1])}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;

// ---------- Home ----------
function home(S) {
  const ctx = S.ctxFor('index.html');
  const total = S.LESSON_ORDER.length;
  const hours = hoursOf(S, S.LESSON_ORDER);
  const parts = ['Big picture', 'Data', 'Machine learning', 'Deep learning', 'Language models', 'AI applications', 'Production'];
  const sections = [
    ['In plain words', 'The idea explained in plain words; every new word is defined.'],
    ['Real-world example', 'Where a real business uses it and what it decides.'],
    ['How it works', 'The steps in order, with what goes in and what comes out.'],
    ['Python example', 'Runnable code, with the real output it printed.'],
    ['.NET (C#) example', 'The same idea in C#, with the packages it needs.'],
    ['Applied Maths - Statistics', 'Collapsible panels with the main formula, a plain-words meaning and two worked examples for each maths idea the lesson uses (where it applies).'],
    ['Maths behind it', 'The names of the maths topics involved, so you can recognise them in documentation and job descriptions.'],
    ['Common mistakes', 'What goes wrong in real projects.'],
    ['Quick check', 'Questions with hidden answers to confirm you understood.'],
  ];
  const body = `
<section class="hero" aria-labelledby="hero-h">
  <div class="hero-text">
    <h1 id="hero-h">AI and machine learning, from zero to industry projects</h1>
    <p class="lede">A complete, step-by-step guide for people new to AI. It explains every concept in plain words, shows how companies use it, and gives working examples in both Python and .NET (C#). Where a lesson uses maths or statistics, a short collapsible panel shows the main formula with simple worked examples. Everything you need is on these pages; there are no outside links to follow.</p>
    <p class="hero-facts"><span>${total} lessons</span><span>About ${hours} hours of study</span><span>${S.MODULES.length} parts</span><span>${S.ROADMAPS.length} visual roadmaps</span><span>${S.PROJECTS.length} capstone projects</span><span>${S.CASES.length} real company cases</span></p>
    <p class="actions"><a class="btn btn-primary" href="lessons/s-what-is-ai.html">Start lesson 1</a><a class="btn" href="plan.html">See the 12-week plan</a></p>
  </div>
  <figure class="hero-figure" aria-labelledby="hero-fig-cap">
    <svg viewBox="0 0 360 262" role="img" aria-labelledby="hero-fig-title">
      <title id="hero-fig-title">Seven parts that build on each other, from the big picture to production</title>
      ${parts.map((t, i) => `<rect x="${8 + i * 24}" y="${226 - i * 34}" width="190" height="28" rx="6" class="svg-box"/><text x="${103 + i * 24}" y="${244 - i * 34}" class="svg-label" text-anchor="middle">${i + 1}. ${t}</text>`).join('')}
    </svg>
    <figcaption id="hero-fig-cap" class="small muted">Each part uses the ones below it. You can go back to any part at any time.</figcaption>
  </figure>
</section>

<section aria-labelledby="parts-h">
  <h2 id="parts-h">The seven parts</h2>
  <ul class="card-list stage-grid">${S.MODULES.map((m) => { const ids = m.groups.flatMap((g) => g.lessons);
    return `<li class="card"><p class="card-kicker"><span class="badge">Part ${S.esc(m.stage)}</span><span class="small muted">${ids.length} lessons, about ${hoursOf(S, ids)} h</span></p><h3 class="card-title"><a href="${m.page}">${S.esc(m.title.replace(/^Part [^:]+: /, ''))}</a></h3><p class="small">${S.esc(m.intro)}</p><p class="small"><span data-module-progress="${ids.map((i) => 'lesson:' + i).join(' ')}">0</span> of ${ids.length} completed</p></li>`; }).join('')}</ul>
</section>

<section aria-labelledby="lesson-h">
  <h2 id="lesson-h">How every lesson is built</h2>
  <p>All ${total} lessons use the same eight sections in the same order, so you always know where to look.</p>
  ${table(S, 'Lesson sections', ['Section', 'What you get'], sections.map(([a, b]) => [S.esc(a), S.esc(b)]))}
</section>

<section aria-labelledby="routes-h">
  <h2 id="routes-h">Choose how to start</h2>
  <div class="route-grid">
  ${S.ROUTES.map((r) => `<article class="route-card" aria-labelledby="route-${r.id}">
    <h3 id="route-${r.id}">${S.esc(r.title)}</h3>
    <p>${S.esc(r.advice)}</p>
    <ol class="route-steps">${r.steps.map((id) => `<li>${S.lessonLink(id, ctx)}</li>`).join('')}</ol>
    <p class="small muted">${S.esc(r.estimate)}</p>
  </article>`).join('')}
  </div>
</section>

<section aria-labelledby="build-h">
  <h2 id="build-h">What you will be able to build</h2>
  <ul class="card-list two">${S.PROJECTS.map((p) => `<li class="card"><p class="card-kicker"><span class="badge">Capstone ${p.n}</span> <span class="badge">${S.esc(TRACK_LABEL[p.track])}</span></p><h3 class="card-title"><a href="projects/${p.id}.html">${S.esc(p.title)}</a></h3><p class="small">${S.esc(p.requirement)}</p></li>`).join('')}</ul>
</section>

<section aria-labelledby="levels-h">
  <h2 id="levels-h">How lessons are labelled</h2>
  <div class="two-col">
    <ul class="plain-list"><li><span class="badge badge-beginner">Beginner</span> needs only the lessons listed as prerequisites.</li><li><span class="badge badge-intermediate">Intermediate</span> builds on several earlier lessons.</li><li><span class="badge badge-advanced">Advanced</span> needs Parts 1 to 3 and some practice.</li><li><span class="badge badge-expert">Expert</span> combines many parts into full systems.</li></ul>
    <div class="callout callout-note"><p><strong>Honest about the code.</strong> Every lesson states whether its code was run. Python outputs shown in lessons were copied from real runs on ${S.REVIEWED}. The C# examples were written carefully but could not be compiled in the build environment, and are labelled that way. Durations are study estimates; quick checks are self-checks, not certificates. Progress is saved only in this browser (see <a href="progress.html">progress</a>).</p></div>
  </div>
</section>`;
  return { path: 'index.html', title: 'Welcome', description: 'A self-contained, plain-words guide to AI and machine learning from beginner to industry level, with Python and .NET examples.', body, crumbs: [], wide: true, section: 'Start', keywords: 'start beginner fresh ai ml guide python dotnet plain words' };
}

// ---------- 12-week plan ----------
function plan(S) {
  const ctx = S.ctxFor('plan.html');
  const weeks = [
    { t: 'The big picture and your setup', lessons: ['s-what-is-ai', 's-lifecycle', 's-setup', 'd-basics'], build: 'Install Python and .NET, run the environment check, and write a one-page description of an AI idea at your workplace using the lifecycle steps.' },
    { t: 'Data skills', lessons: ['d-collect', 'd-clean-eda', 'd-features'], build: 'Clean and explore a messy synthetic customer table; create five features and explain each.' },
    { t: 'How models learn', lessons: ['ml-learning', 'ml-regression', 'ml-classification'], build: 'Train a price predictor and a spam classifier; beat a baseline with both.' },
    { t: 'Algorithms and evaluation', lessons: ['ml-algorithms', 'ml-unsupervised', 'ml-evaluation'], build: 'Compare four algorithms with cross-validation; segment customers; choose a metric for a rare-event problem.' },
    { t: 'Improve and apply ML', lessons: ['ml-improve', 'ml-timeseries', 'ml-recommenders'], build: 'Start capstone 1 (churn). Tune it, explain it and pick a threshold.' },
    { t: 'Neural networks and vision', lessons: ['dl-neural-nets', 'dl-training', 'dl-vision', 'dl-sequences'], build: 'Train a small network, watch for overfitting, and run a small image classifier.' },
    { t: 'Transformers and other model families', lessons: ['dl-transformers', 'dl-generative', 'dl-speech', 'dl-rl', 'dl-graphs'], build: 'Run the attention demo and describe one business use for each model family.' },
    { t: 'Inside a language model', lessons: ['llm-how', 'llm-tokens', 'llm-design', 'llm-train-laptop'], build: 'Train the tiny language model on your laptop and generate text at three temperatures.' },
    { t: 'Scale, adapt and run LLMs', lessons: ['llm-scale', 'llm-finetune', 'llm-local', 'llm-eval'], build: 'Run a local model, measure its speed, and write a memory estimate for a model ten times larger.' },
    { t: 'LLM apps and RAG', lessons: ['app-llm-api', 'app-prompting', 'app-embeddings', 'app-rag', 'app-rag-advanced'], build: 'Start capstone 4: a cited policy assistant with a 30-question evaluation set.' },
    { t: 'Agents, quality and trust', lessons: ['app-agents', 'app-frameworks', 'app-multimodal', 'app-evals', 'app-security', 'app-responsible'], build: 'Add an approval-based tool to your assistant and run 15 adversarial tests.' },
    { t: 'Production', lessons: ['ops-serving', 'ops-mlops', 'ops-monitoring', 'ops-scale', 'ops-architecture'], build: 'Serve capstone 1 as an API, add a promotion gate and a drift check, and draw its architecture.' },
  ];
  const body = `
<h1>12-week study plan</h1>
<p class="lede">The shortest sensible route through the whole guide, planned for about 8 to 12 hours a week. Each week has lessons and one practical task. Move on when the task is done, not when the calendar says so.</p>
<ol class="sprint">${weeks.map((w, i) => `<li class="sprint-week" id="week-${i + 1}">
  <div class="sprint-head"><span class="sprint-n">Week ${i + 1}</span><h2>${S.esc(w.t)}</h2><span class="meta">Lessons about ${hoursOf(S, w.lessons)} h, plus practice (study estimate)</span></div>
  <dl class="kv"><dt>Lessons</dt><dd><ul class="plain-list">${w.lessons.map((l) => `<li>${S.lessonLink(l, ctx)}</li>`).join('')}</ul></dd><dt>Build</dt><dd>${S.esc(w.build)}</dd></dl>
</li>`).join('')}</ol>
<div class="callout callout-note"><p><strong>After week 12.</strong> Finish at least two capstones (one ML, one AI application), then use the <a href="solve.html">decision guide</a> on the <a href="cases.html">company cases</a> to practise planning any new problem.</p></div>`;
  return { path: 'plan.html', title: '12-week study plan', body, crumbs: [['12-week plan', 'plan.html']], section: 'Start', keywords: 'twelve week plan schedule hours study order beginner' };
}

// ---------- Roles ----------
function roles(S) {
  const rows = [
    ['Main question', 'How do we build a reliable product on top of existing models?', 'How do we learn a predictive model from our own data and run it?'],
    ['Typical work', 'RAG assistants, agents, document processing, AI features inside apps', 'Churn, fraud, demand, pricing, quality and recommendation models'],
    ['Core skills', 'LLM APIs, prompting, embeddings, retrieval, evaluation, security, APIs', 'Data preparation, features, algorithms, validation, MLOps'],
    ['Languages', 'Python or C#; both are used widely', 'Mostly Python; C# with ML.NET in .NET companies'],
    ['Maths in daily work', 'Little: metrics and similarity scores', 'Some: statistics and metrics; tools do the heavy maths'],
    ['Hardware', 'A normal laptop; models through an API or run locally', 'A normal laptop for most tabular work; GPUs for deep learning'],
    ['Parts of this guide', 'Parts 1, 2, 5, 6 and 7, plus the basics of Part 3', 'Parts 1, 2, 3, 4 and 7, plus the basics of Part 6'],
    ['Common confusion', 'Calling an API is the start, not the job: evaluation, security and operations are most of the work', 'ML is much more than LLMs; most business ML is on tables of data'],
  ];
  const others = [
    ['Data scientist', 'Answers business questions with data: analysis, experiments (A/B tests), and models. Overlaps strongly with the ML engineer; usually less production engineering.'],
    ['MLOps or platform engineer', 'Builds the pipelines, registries, serving and monitoring that let other teams ship models safely (Part 7).'],
    ['Data engineer', 'Builds and runs the pipelines that collect, clean and store data (Part 2 at large scale).'],
    ['Research scientist', 'Invents and tests new model designs and training methods; usually needs advanced maths and a research background.'],
  ];
  const body = `
<h1>AI engineer or ML engineer?</h1>
<p class="lede">Job titles vary between companies, and many jobs mix both. This page shows the centre of each role so you can choose a roadmap. The guide covers both.</p>
<div class="table-wrap stack-on-mobile" tabindex="0" role="region" aria-label="Role comparison table"><table class="compare">
<caption class="sr-only">Comparison of AI engineer and ML engineer</caption>
<thead><tr><th scope="col">Aspect</th><th scope="col" class="th-lm">AI engineer</th><th scope="col" class="th-ml">ML engineer</th></tr></thead>
<tbody>${rows.map((r) => `<tr><th scope="row">${r[0]}</th>${r.slice(1).map((c, i) => `<td data-label="${['AI engineer', 'ML engineer'][i]}">${S.esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
<h2>A concrete example of each</h2>
<div class="track-grid">
  <article class="track-card track-lm"><h3 class="track-name">AI engineer</h3><p>An employee asks, "How many leave days do I get?" The system checks their permissions, retrieves the HR policy passage and answers with a citation, or says it does not know. See <a href="lessons/app-rag.html">RAG</a> and <a href="projects/c04-rag-assistant.html">capstone 4</a>.</p></article>
  <article class="track-card track-ml"><h3 class="track-name">ML engineer</h3><p>A model trained on two years of customer records predicts who is likely to cancel next month, is served as an API and is checked for drift every week. See <a href="lessons/ml-classification.html">classification</a> and <a href="projects/c01-churn.html">capstone 1</a>.</p></article>
</div>
<h2>Related roles</h2>
${table(S, 'Related roles', ['Role', 'What they do'], others.map(([a, b]) => [S.esc(a), S.esc(b)]))}
<p><a class="btn" href="roadmaps.html">Open the visual roadmaps</a></p>`;
  return { path: 'roles.html', title: 'AI engineer or ML engineer?', body, crumbs: [['Roles', 'roles.html']], wide: true, section: 'Start', keywords: 'role comparison ai engineer ml engineer data scientist mlops difference career' };
}

// ---------- Roadmaps ----------
export function roadmapComponent(S, ctx) {
  return `
<div class="roadmap-bar">
  <div role="tablist" aria-label="Choose a roadmap" class="tabs">
    ${S.ROADMAPS.map((r, i) => `<button type="button" role="tab" id="tab-${r.id}" aria-controls="${r.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" class="tab track-${r.color}">${S.esc(r.title)}</button>`).join('')}
  </div>
  <div class="expand-controls"><button type="button" class="btn btn-small" data-roadmap-expand>Expand all steps</button><button type="button" class="btn btn-small" data-roadmap-collapse>Collapse all steps</button><button type="button" class="btn btn-small" data-print>Print</button></div>
</div>
${S.ROADMAPS.map((r) => `<section role="tabpanel" id="${r.id}" aria-labelledby="tab-${r.id}" class="roadmap track-${r.color}" tabindex="-1">
  <h2>${S.esc(r.title)} roadmap</h2>
  <p>${S.esc(r.summary)}</p>
  <nav class="overview" aria-label="${S.esc(r.title)} steps at a glance"><ol class="steps-${r.nodes.length}">${r.nodes.map((n) => `<li><a href="#node-${r.id}-${n.n}"><span class="ov-n">${n.n}</span><span class="ov-t">${S.esc(n.short)}</span></a></li>`).join('')}</ol></nav>
  <ol class="flow">${r.nodes.map((n) => `
    <li class="node" id="node-${r.id}-${n.n}">
      <div class="node-card">
        <div class="node-head"><span class="node-n" aria-hidden="true">${n.n}</span><h3 class="node-title"><span class="sr-only">Step ${n.n} of ${r.nodes.length}: </span>${S.esc(n.title)}</h3><span class="node-effort">${S.esc(n.effort)}<span class="sr-only"> study estimate</span></span></div>
        <p class="node-desc">${S.esc(n.desc)}</p>
        <button type="button" class="node-toggle" aria-expanded="true" aria-controls="np-${r.id}-${n.n}"><span class="when-closed">Show lessons</span><span class="when-open">Hide lessons</span><span class="sr-only"> for step ${n.n}, ${S.esc(n.title)}</span></button>
        <div class="node-panel" id="np-${r.id}-${n.n}">
          <ul class="node-lessons">${n.lessons.map((id) => `<li>${S.lessonLink(id, ctx)} ${S.levelBadge(S.lessons[id].level)} <span class="small muted">${S.fmtMinutes(S.lessons[id].minutes)}</span></li>`).join('')}${
            (n.projects || []).map((p) => `<li><a href="${ctx.root}projects/${p}.html">Capstone ${S.projectsById[p].n}: ${S.esc(S.projectsById[p].title)}</a> <span class="small muted">${S.esc(S.projectsById[p].effort)}</span></li>`).join('')}</ul>
        </div>
      </div>
    </li>`).join('')}
  </ol>
</section>`).join('')}`;
}

function roadmaps(S) {
  const ctx = S.ctxFor('roadmaps.html');
  const body = `
<h1>Visual roadmaps</h1>
<p class="lede">Three routes through the same lessons. The quick path covers everything in order; the other two put either model training or AI applications first. Effort ranges are study estimates.</p>
${roadmapComponent(S, ctx)}`;
  return { path: 'roadmaps.html', title: 'Visual roadmaps', body, crumbs: [['Roadmaps', 'roadmaps.html']], wide: true, section: 'Start', keywords: 'roadmap flow diagram quick path ml engineer ai engineer steps' };
}

// ---------- Lesson catalogue ----------
function catalogue(S) {
  const ctx = S.ctxFor('lessons.html');
  const codeKind = (c) => (/executed|computed/i.test(c || '') ? 'Python output from a real run' : 'Conceptual code (not run)');
  const bucket = (m) => (m <= 60 ? 'Up to 1 h' : m <= 90 ? '1–1.5 h' : 'Over 1.5 h');
  const body = `
<h1>All lessons</h1>
<p class="lede">All ${S.LESSON_ORDER.length} lessons in the recommended order. Combine the filters to find what you need. Every lesson has a Python and a C# example.</p>
${filterBar(S, 'cat-list', [['part', 'Part', S.MODULES.map((m) => m.short)], ['level', 'Level', S.LEVELS], ['code', 'Python code', ['Python output from a real run', 'Conceptual code (not run)']], ['time', 'Study time', ['Up to 1 h', '1–1.5 h', 'Over 1.5 h']]], 'Filter lessons')}
<ol id="cat-list" class="card-list catalogue">${S.MODULES.flatMap((m) => m.groups.flatMap((g) => g.lessons.map((id) => {
    const l = S.lessons[id];
    return `<li class="card" ${dataAttrs(S, { part: m.short, level: l.level, code: codeKind(l.code), time: bucket(l.minutes) })} data-text="${S.esc((l.title + ' ' + l.goal + ' ' + m.title).toLowerCase())}">
  <p class="card-kicker"><span class="badge">Part ${S.esc(m.stage)}</span>${S.levelBadge(l.level)}<span class="small muted">${S.fmtMinutes(l.minutes)}</span></p>
  <h2 class="card-title"><a href="${ctx.root}lessons/${id}.html" data-progress-id="lesson:${id}"><span class="nav-check" aria-hidden="true"></span>${S.esc(l.title)}</a></h2>
  <p class="small">${S.esc(l.goal)}</p></li>`; }))).join('')}</ol>
${emptyState('lessons')}`;
  return { path: 'lessons.html', title: 'All lessons', body, crumbs: [['All lessons', 'lessons.html']], wide: true, section: 'Start', keywords: 'catalogue all lessons filter level part' };
}

// ---------- Solve any case ----------
function solve(S) {
  const ctx = S.ctxFor('solve.html');
  const L = (id) => S.lessonLink(id, ctx);
  const choose = [
    ['The rules are clear and stable (tax rate, opening hours)', 'Plain code, no AI', 'Cheapest, testable and explainable. Use AI only where rules break down.', L('s-what-is-ai')],
    ['Predict a number from a table (price, delivery time, demand)', 'Regression (gradient boosting first)', 'Tables of business data are where classic ML is strongest.', L('ml-regression')],
    ['Pick a category from a table or short text (churn, fraud, spam, intent)', 'Classification', 'Needs labelled history; choose the metric from the cost of each mistake.', L('ml-classification')],
    ['No labels; find groups or unusual cases', 'Clustering or anomaly detection', 'Segments customers or flags fraud and faults for review.', L('ml-unsupervised')],
    ['Predict future values over time', 'Time-series forecasting', 'Split by time; beat a seasonal baseline.', L('ml-timeseries')],
    ['Suggest items to users', 'Recommender system', 'Collaborative filtering plus content features for new items.', L('ml-recommenders')],
    ['Images, audio or video', 'Deep learning with a pretrained model', 'Transfer learning needs far less data than training from scratch.', `${L('dl-vision')}, ${L('dl-speech')}`],
    ['Write, summarise, translate or extract from text', 'An LLM with a good prompt and structured output', 'Start with a hosted or local model; validate every output.', `${L('app-llm-api')}, ${L('app-prompting')}`],
    ['Answer questions from your own documents', 'RAG', 'Keeps answers current and cited; no retraining.', `${L('app-rag')}, ${L('app-rag-advanced')}`],
    ['Take actions in other systems (refunds, bookings, tickets)', 'Agent with tools and human approval', 'Least privilege and approval in code.', L('app-agents')],
    ['A specific style, format or narrow skill the prompt cannot reach', 'Fine-tuning (for example LoRA)', 'Only after prompting and RAG are measured and fall short.', L('llm-finetune')],
    ['Data must never leave the building', 'A local model', 'Small quantised models run on laptops and servers you control.', L('llm-local')],
    ['Learn by trial and error from a simulator (control, scheduling)', 'Reinforcement learning', 'Rarely the first choice in business; needs a safe simulator.', L('dl-rl')],
  ];
  const steps = [
    ['Write the decision', 'What will the system decide or produce, for whom, and how often? What does a wrong answer cost? Example: "Each morning, rank customers by risk of cancelling, for the retention team; a missed churner costs about a month of revenue, a wasted call costs ten minutes."'],
    ['Check whether AI is needed', 'If clear rules work, write rules. If the pattern is fuzzy, changes often, or involves language, images or sound, AI may help.'],
    ['Find the data', 'What data exists, who owns it, is it labelled, is it allowed to be used, and does it contain personal data?'],
    ['Pick the approach', 'Use the table below. Start with the simplest approach that could work.'],
    ['Define success before building', 'A baseline, a metric tied to the business cost, and an evaluation set that is never used for training or tuning.'],
    ['Build the smallest working version', 'A notebook or script for ML; a prompt plus validation for LLM apps. Measure it against the baseline.'],
    ['Plan the risks', 'Privacy, fairness, security (prompt injection, excessive agency), cost, and what happens when the model is wrong or down.'],
    ['Ship it safely', 'Serve it as an API or batch job, with model version, monitoring, a fallback and a rollback plan.'],
    ['Measure and improve', 'Watch drift, quality and cost; turn every confirmed failure into a new test.'],
  ];
  const worked = [
    { t: 'An insurance company wants to speed up claims', a: 'Two separate problems. (1) Read the claim form and photos: an LLM with structured output extracts fields from text, and a vision model sorts photos by damage type. (2) Decide which claims need a human: a classification model on claim history flags likely fraud for review. Every claim decision stays with a person; the AI prepares and prioritises.', lessons: ['app-multimodal', 'app-llm-api', 'dl-vision', 'ml-classification', 'app-responsible'] },
    { t: 'A hospital IT team wants doctors to search internal guidelines', a: 'RAG over approved guideline documents, with permission filtering, citations and "I don\u2019t know" when not covered. Because data is sensitive, a local model or a provider with suitable data agreements. An evaluation set written with clinicians before launch. No diagnosis by the system.', lessons: ['app-rag', 'app-rag-advanced', 'llm-local', 'app-evals', 'app-security'] },
    { t: 'A logistics firm wants fewer late deliveries', a: 'Forecast daily parcel volume per depot (time series) to plan staff, and predict delivery time per route (regression) to warn customers early. Monitor drift when new areas open. A dashboard for planners, not automatic decisions.', lessons: ['ml-timeseries', 'ml-regression', 'ops-monitoring', 'ops-serving'] },
  ];
  const body = `
<h1>Solve any case: a decision guide</h1>
<p class="lede">Use this page whenever you meet a new problem at work or in an interview. Follow the nine steps, use the table to pick an approach, then study the worked examples.</p>
<section aria-labelledby="steps-h"><h2 id="steps-h">Nine steps for any AI or ML case</h2>
<ol class="flow flow-simple">${steps.map(([t, d], i) => `<li class="node"><div class="node-card"><div class="node-head"><span class="node-n" aria-hidden="true">${i + 1}</span><h3 class="node-title"><span class="sr-only">Step ${i + 1}: </span>${S.esc(t)}</h3></div><p class="node-desc">${S.esc(d)}</p></div></li>`).join('')}</ol></section>
<section aria-labelledby="choose-h"><h2 id="choose-h">Which approach fits the problem?</h2>
${table(S, 'Problem to approach table', ['If the problem is…', 'Start with', 'Why', 'Learn it in'], choose.map(([a, b, c, d]) => [S.esc(a), `<strong>${S.esc(b)}</strong>`, S.esc(c), d]))}
<div class="callout callout-note"><p><strong>Rule of thumb.</strong> Most real systems combine several rows. Solve each sub-problem with the simplest approach that works, and connect them with ordinary software (see ${L('ops-architecture')}).</p></div></section>
<section aria-labelledby="worked-h"><h2 id="worked-h">Worked examples</h2>
<div class="track-grid">${worked.map((w) => `<article class="track-card"><h3 class="track-name">${S.esc(w.t)}</h3><p>${S.esc(w.a)}</p><p class="small">Lessons: ${w.lessons.map(L).join(', ')}</p></article>`).join('')}</div>
<p>For real, documented examples from companies, see the <a href="cases.html">case studies</a>. Practise by applying the nine steps to each one before reading its suggested workflow.</p></section>`;
  return { path: 'solve.html', title: 'Solve any case: decision guide', body, crumbs: [['Solve any case', 'solve.html']], wide: true, section: 'Practice', keywords: 'decision guide which approach rag fine-tuning classification regression agent choose problem case' };
}

// ---------- Maths names map (built from each lesson's "Maths behind it" section) ----------
function maths(S) {
  const ctx = S.ctxFor('maths.html');
  const rows = [];
  for (const m of S.MODULES) for (const id of m.groups.flatMap((g) => g.lessons)) {
    const sec = S.lessons[id].sections.find((x) => x.title === 'Maths behind it');
    const names = sec ? sec.body.split('\n').filter((x) => /^\s*-\s+/.test(x)).map((x) => x.replace(/^\s*-\s+/, '').trim()) : [];
    const has = S.lessons[id].sections.some((x) => x.title === 'Applied Maths - Statistics');
    rows.push([S.lessonLink(id, ctx) + (has ? ' <span class="pill pill-ok">formulas</span>' : ''), S.esc(m.short), names.length ? `<ul class="plain-list">${names.map((n) => `<li>${S.esc(n)}</li>`).join('')}</ul>` : '']);
  }
  const areas = [
    ['Statistics', 'Averages, spread, distributions, sampling, hypothesis tests, percentiles', 'Data exploration, evaluation, A/B tests, monitoring'],
    ['Probability', 'Chance of events, conditional probability, Bayes\u2019 theorem', 'Classifier scores, language-model sampling, spam filters'],
    ['Linear algebra', 'Vectors, matrices, dot products, matrix multiplication', 'Embeddings, neural networks, attention, recommenders, PCA'],
    ['Calculus', 'Derivatives, gradients, the chain rule', 'How every model is trained (gradient descent, backpropagation)'],
    ['Optimisation', 'Minimising a loss, learning rates, regularisation', 'Training ML and deep-learning models'],
    ['Information theory', 'Entropy, cross-entropy, KL divergence', 'Classification and language-model losses, perplexity, drift scores'],
    ['Graph theory', 'Nodes, edges, neighbours', 'Graph neural networks, knowledge graphs, recommendations'],
  ];
  const body = `
<h1>Maths map</h1>
<p class="lede">The libraries do the calculations for you, but knowing the idea behind them makes results easier to trust and debug. This page lists the maths behind each lesson. Open the lesson's “Applied Maths - Statistics” section for the main formulas and worked examples.</p>
<section aria-labelledby="areas-h"><h2 id="areas-h">The main areas</h2>
${table(S, 'Maths areas', ['Area', 'Topics it includes', 'Where it appears in AI and ML'], areas.map(([a, b, c]) => [S.esc(a), S.esc(b), S.esc(c)]))}</section>
<section aria-labelledby="by-lesson-h"><h2 id="by-lesson-h">By lesson</h2>
<p>Taken from the "Maths behind it" section of every lesson.</p>
${table(S, 'Maths names by lesson', ['Lesson', 'Part', 'Maths names'], rows)}</section>`;
  return { path: 'maths.html', title: 'Maths map', body, crumbs: [['Maths map', 'maths.html']], wide: true, section: 'Reference', keywords: 'maths map statistics probability linear algebra calculus formulas applied maths' };
}

// ---------- Part pages ----------
function modulePage(S, m) {
  const ctx = S.ctxFor(m.page);
  const ids = m.groups.flatMap((g) => g.lessons);
  const extra = { llm: llmExtra, apps: appsExtra, ops: opsExtra }[m.id];
  const body = `
<header class="page-intro"><div class="page-intro-main">
<h1>${S.esc(m.title)}</h1>
<p class="lede">${S.esc(m.intro)}</p>
<p class="meta-row"><span class="meta">${ids.length} lessons</span><span class="meta">About ${hoursOf(S, ids)} hours of study (estimate)</span><span class="meta"><span data-module-progress="${ids.map((i) => 'lesson:' + i).join(' ')}">0</span> of ${ids.length} completed in this browser</span></p>
${keyTerms(S, ids, ctx)}</div>${glance(S, m, ids, ctx)}</header>
${extra ? extra(S, ctx, 'before') : ''}
${m.groups.map((g, gi) => `<section aria-labelledby="g-${m.id}-${gi}">
  <h2 id="g-${m.id}-${gi}">${S.esc(g.title)}</h2>
  <ol class="lesson-list">${g.lessons.map((id) => {
    const l = S.lessons[id];
    return `<li class="lesson-item"><a href="${ctx.root}lessons/${id}.html" data-progress-id="lesson:${id}"><span class="nav-check" aria-hidden="true"></span><span class="lesson-item-title">${S.esc(l.title)}</span></a>
      <p>${S.esc(l.goal)}</p><p class="meta-row">${S.levelBadge(l.level)}<span class="meta">${S.fmtMinutes(l.minutes)}</span>${l.prereqs.length ? `<span class="meta">Needs: ${l.prereqs.map((p) => S.esc(S.lessons[p].title)).join(', ')}</span>` : ''}</p></li>`;
  }).join('')}</ol></section>`).join('')}
${extra ? extra(S, ctx, 'after') : ''}`;
  return { path: m.page, title: m.title, description: m.intro, body, crumbs: [[m.short, m.page]], section: m.short, keywords: `${m.intro} ${ids.join(' ')}` };
}

// "At a glance" panel for a part page: only facts that come from the guide's own data.
function glance(S, m, ids, ctx) {
  const i = S.MODULES.findIndex((x) => x.id === m.id);
  const prev = S.MODULES[i - 1], next = S.MODULES[i + 1];
  const levels = {};
  for (const id of ids) levels[S.lessons[id].level] = (levels[S.lessons[id].level] || 0) + 1;
  const projects = S.PROJECTS.filter((p) => (p.prereqs || []).some((x) => ids.includes(x)));
  const link = (mod) => `<a href="${ctx.root}${mod.page}">${S.esc(mod.title)}</a>`;
  return `<aside class="glance" aria-labelledby="glance-h"><details class="rail-details" open><summary><h2 id="glance-h" class="glance-title">This part at a glance</h2></summary>
<dl class="facts"><dt>Lessons</dt><dd>${ids.length}</dd><dt>Study time</dt><dd>About ${hoursOf(S, ids)} h</dd>
<dt>Levels</dt><dd>${Object.entries(levels).map(([lv, n]) => `${S.levelBadge(lv)} <span class="small muted">${n}</span>`).join(' ')}</dd>
${prev ? `<dt>Comes after</dt><dd>${link(prev)}</dd>` : ''}${next ? `<dt>Leads to</dt><dd>${link(next)}</dd>` : ''}</dl>
${projects.length ? `<h3 class="rail-sub">Capstones that use this part</h3><ul class="rail-list">${projects.map((p) => `<li><a href="${ctx.root}projects/${p.id}.html">${S.esc(p.title)}</a></li>`).join('')}</ul>` : ''}
</details></aside>`;
}

// Glossary terms explained in this part, as links (left column of the part intro).
function keyTerms(S, ids, ctx) {
  const terms = S.GLOSSARY.filter((g) => ids.includes(g[2])).map((g) => g[0]);
  if (!terms.length) return '';
  const shown = terms.slice(0, 30);
  return `<h2 class="key-terms-title">Key terms in this part (${terms.length})</h2><ul class="chip-list">${shown.map((x) => `<li><a href="${ctx.root}glossary.html#${S.slug(x)}">${S.esc(x)}</a></li>`).join('')}${terms.length > shown.length ? `<li><a href="${ctx.root}glossary.html">+ ${terms.length - shown.length} more in the glossary</a></li>` : ''}</ul>`;
}

function llmExtra(S, ctx, where) {
  if (where === 'after') return '';
  return `<ol class="hflow" aria-label="Order of the language-model part"><li><strong>Understand</strong><span>How LLMs work, tokens, sampling</span></li><li><strong>Design</strong><span>Size, context and vocabulary</span></li><li><strong>Train</strong><span>A small model on your laptop</span></li><li><strong>Scale</strong><span>The same code on GPUs and many machines</span></li><li><strong>Adapt and run</strong><span>Fine-tune, run locally, evaluate</span></li></ol>
<div class="callout callout-warn"><p><strong>Realistic scope.</strong> You will train small models that show every mechanism. Training a modern large model from scratch needs very large datasets, many GPUs and a specialised team; this part teaches the principles so you understand, adapt and run such models.</p></div>`;
}
function appsExtra(S, ctx, where) {
  if (where === 'after') return '';
  return `<ol class="hflow" aria-label="How an AI application grows"><li><strong>Call a model</strong><span>API or local, structured output</span></li><li><strong>Add knowledge</strong><span>Embeddings and RAG</span></li><li><strong>Add actions</strong><span>Tools and agents with approval</span></li><li><strong>Make it trustworthy</strong><span>Evaluation, security, responsibility</span></li></ol>`;
}
function opsExtra(S, ctx, where) {
  if (where === 'before') return '';
  return `<section aria-labelledby="hybrid-h"><h2 id="hybrid-h">The reference architecture: .NET application with a Python model service</h2>
<p>Many companies keep their business system in .NET and run ML models in Python. The two talk through a small, versioned contract. Details and code are in ${S.lessonLink('ops-architecture', ctx)}.</p>
<ol class="hflow" aria-label="Hybrid request flow">
  <li><strong>Client</strong><span>Web or mobile app</span></li>
  <li><strong>ASP.NET Core API</strong><span>Sign-in, permissions, business rules, audit</span></li>
  <li><strong>Python service /v1</strong><span>Model inference only; validated input and output</span></li>
  <li><strong>Model</strong><span>scikit-learn, PyTorch, ONNX or an LLM</span></li>
</ol></section>`;
}

// ---------- Capstone projects ----------
function projectsIndex(S) {
  const body = `
<h1>Capstone projects</h1>
<p class="lede">${S.PROJECTS.length} projects that combine many lessons into something you can show an employer. Each has a business requirement, an architecture, build steps, a Python route and a .NET route, tests and a definition of done. Effort values are study estimates.</p>
${filterBar(S, 'project-list', [['track', 'Area', Object.values(TRACK_LABEL)], ['level', 'Level', ['Intermediate', 'Advanced']]], 'Filter projects')}
<ol id="project-list" class="card-list">${S.PROJECTS.map((p) => `<li class="card" ${dataAttrs(S, { track: TRACK_LABEL[p.track], level: p.level })} data-text="${S.esc((p.title + ' ' + p.requirement + ' ' + p.python + ' ' + p.dotnet).toLowerCase())}">
  <p class="card-kicker">Capstone ${p.n} <span class="badge track-badge-${p.track}">${TRACK_LABEL[p.track]}</span> <span class="badge">${p.level}</span></p>
  <h2 class="card-title"><a href="projects/${p.id}.html" data-progress-id="project:${p.id}"><span class="nav-check" aria-hidden="true"></span>${S.esc(p.title)}</a></h2>
  <p>${S.esc(p.requirement)}</p>
  <p class="small muted">Effort ${S.esc(p.effort)}${p.reuses.length ? ` · Builds on ${p.reuses.map((r) => 'capstone ' + S.projectsById[r].n).join(', ')}` : ''}</p>
</li>`).join('')}</ol>
${emptyState('projects')}`;
  return { path: 'projects.html', title: 'Capstone projects', body, crumbs: [['Capstones', 'projects.html']], wide: true, section: 'Practice', keywords: 'capstone portfolio projects churn forecast vision rag agent tiny llm local assistant' };
}

function projectPage(S, p) {
  const path = `projects/${p.id}.html`;
  const ctx = S.ctxFor(path);
  const sec = (t, html) => `<section aria-labelledby="${S.slug(t)}"><h2 id="${S.slug(t)}">${t}</h2>${html}</section>`;
  const body = `
<header class="lesson-head"><p class="eyebrow-line">Capstone ${p.n} of ${S.PROJECTS.length}</p><h1>${S.esc(p.title)}</h1>
<div class="meta-row"><span class="badge track-badge-${p.track}">${TRACK_LABEL[p.track]}</span><span class="badge">${p.level}</span><span class="meta">Effort ${S.esc(p.effort)} (estimate)</span></div></header>
${sec('Business requirement', `<p>${S.esc(p.requirement)}</p>`)}
${sec('Lessons to finish first', `<ul>${p.prereqs.map((id) => `<li>${S.lessonLink(id, ctx)}</li>`).join('')}${p.reuses.map((r) => `<li>Capstone ${S.projectsById[r].n}: <a href="${r}.html">${S.esc(S.projectsById[r].title)}</a></li>`).join('')}</ul>`)}
${sec('Architecture', `<ol class="hflow vertical-sm">${p.architecture.map((a) => `<li><span>${S.esc(a)}</span></li>`).join('')}</ol>`)}
${sec('Build steps', `<ol>${p.steps.map((s) => `<li>${S.esc(s)}</li>`).join('')}</ol>`)}
${sec('Python route and .NET route', `<dl class="kv"><dt>Python</dt><dd>${S.esc(p.python)}</dd><dt>.NET (C#)</dt><dd>${S.esc(p.dotnet)}</dd></dl>`)}
${sec('Example input and output', `<dl class="kv"><dt>Input</dt><dd><code>${S.esc(p.io.input)}</code></dd><dt>Output</dt><dd><code>${S.esc(p.io.output)}</code></dd></dl>`)}
${sec('Data', `<p>${S.esc(p.data)}</p>`)}
${sec('Starter file structure', `<figure class="code"><figcaption>Structure (Python file | .NET project)</figcaption><pre tabindex="0"><code>${S.esc(p.structure)}</code></pre></figure>`)}
${sec('Tests', list(p.tests, S.esc))}
${sec('How it will be judged', list(p.rubric, S.esc))}
${sec('Security and privacy', `<p>${S.esc(p.security)}</p>`)}
${sec('Definition of done', list(p.acceptance, S.esc))}
${sec('Stretch goals', list(p.stretch, S.esc))}
${sec('What to show an employer', `<p>${S.esc(p.evidence)}</p>`)}
<section class="completion"><h2>Completion</h2><label class="check-row"><input type="checkbox" data-progress-checkbox="project:${p.id}"> I have met every item in the definition of done</label><p class="small muted">Saved in this browser only.</p></section>`;
  return { path, title: p.title, description: p.requirement, body, crumbs: [['Capstones', 'projects.html'], [`Capstone ${p.n}`, path]], section: 'Capstones', keywords: `${p.requirement} ${p.python} ${p.dotnet}` };
}

// ---------- Case studies ----------
const effortBucket = (e) => (parseInt(e, 10) >= 40 ? '40 h or more' : '25–39 h');
const TRACK_OPTS = [['AI application', 'applied'], ['Machine learning', 'ml'], ['Language models', 'lm'], ['.NET', 'dotnet'], ['Python', 'python']];
function casesIndex(S) {
  const uniq = (k) => [...new Set(S.CASES.map((c) => c[k]))].sort();
  const body = `
<h1>Real company cases</h1>
<p class="lede">${S.CASES.length} publicly documented uses of AI by real companies. Each page states only what the published sources say, then shows a <strong>suggested workflow written for this guide</strong> (not the company's confirmed internal system) and a small project to rebuild the idea yourself.</p>
${filterBar(S, 'case-list', [['industry', 'Industry', uniq('industry')], ['category', 'AI category', uniq('category')], ['difficulty', 'Difficulty', ['Beginner', 'Intermediate', 'Advanced']], ['tracks', 'Area', TRACK_OPTS], ['effort', 'Estimated effort', ['25–39 h', '40 h or more']]], 'Filter case studies')}
<ul id="case-list" class="card-list two">${S.CASES.map((c) => `<li class="card" ${dataAttrs(S, { industry: c.industry, category: c.category, difficulty: c.difficulty, tracks: c.tracks, effort: effortBucket(c.effort) })} data-text="${S.esc((c.company + ' ' + c.industry + ' ' + c.category + ' ' + c.problem + ' ' + c.project).toLowerCase())}">
  <p class="card-kicker"><span class="badge">${S.esc(c.industry)}</span> <span class="badge">${S.esc(c.category)}</span> <span class="badge">${c.difficulty}</span></p>
  <h2 class="card-title"><a href="cases/${c.id}.html">${S.esc(c.company)}</a></h2>
  <p>${S.esc(c.problem)}</p>
  <p class="small muted">Rebuild it: ${S.esc(c.project)} Effort ${S.esc(c.effort)}.</p>
</li>`).join('')}</ul>
${emptyState('case studies')}`;
  return { path: 'cases.html', title: 'Real company cases', body, crumbs: [['Company cases', 'cases.html']], wide: true, section: 'Practice', keywords: S.CASES.map((c) => c.company + ' ' + c.industry).join(' ') };
}

function casePage(S, c) {
  const path = `cases/${c.id}.html`;
  const body = `
<header class="lesson-head"><p class="eyebrow-line">Company case</p><h1>${S.esc(c.company)}: ${S.esc(c.category)}</h1>
<div class="meta-row"><span class="badge">${S.esc(c.industry)}</span><span class="badge">${c.difficulty}</span><span class="meta">Rebuild effort ${S.esc(c.effort)} (estimate)</span></div></header>
<section aria-labelledby="confirmed"><h2 id="confirmed">What the published sources confirm</h2><p>${S.esc(c.confirmed)}</p></section>
<section aria-labelledby="problem"><h2 id="problem">Business problem and AI concept</h2><dl class="kv"><dt>Problem</dt><dd>${S.esc(c.problem)}</dd><dt>Concept</dt><dd>${S.esc(c.concept)}</dd></dl></section>
<section aria-labelledby="results"><h2 id="results">Reported results</h2><ul class="results">${c.results.map((r) => `<li><p>${S.esc(r.text)}</p><p class="small muted">${S.esc(r.date)}. Caveat: ${S.esc(r.caveat)}</p></li>`).join('')}</ul></section>
<section aria-labelledby="workflow"><h2 id="workflow">Suggested workflow</h2>
<div class="callout callout-warn"><p><strong>Written for learning, not the company's system.</strong> This flow shows how you could build something similar. It is not a description of ${S.esc(c.company)}'s private architecture.</p></div>
<ol class="flow flow-simple">${c.workflow.map((w, i) => `<li class="node"><div class="node-card"><div class="node-head"><span class="node-n" aria-hidden="true">${i + 1}</span><p class="node-title"><span class="sr-only">Step ${i + 1}: </span>${S.esc(w)}</p></div></div></li>`).join('')}</ol></section>
<section aria-labelledby="tech"><h2 id="tech">Suggested technologies and alternatives</h2>
<div class="table-wrap stack-on-mobile" tabindex="0" role="region" aria-label="Technology choices"><table><thead><tr><th scope="col">Layer</th><th scope="col">Suggested</th><th scope="col">Alternatives</th></tr></thead><tbody>${c.tech.map(([a, b, d]) => `<tr><th scope="row">${S.esc(a)}</th><td data-label="Suggested">${S.esc(b)}</td><td data-label="Alternatives">${S.esc(d)}</td></tr>`).join('')}</tbody></table></div></section>
<section aria-labelledby="io"><h2 id="io">Small example</h2><dl class="kv"><dt>Input</dt><dd>${S.esc(c.example.input)}</dd><dt>Output</dt><dd>${S.esc(c.example.output)}</dd></dl></section>
<section aria-labelledby="repro"><h2 id="repro">Rebuild it yourself</h2><p>${S.esc(c.project)}</p><h3>Definition of done</h3>${list(c.acceptance, S.esc)}<h3>Security and privacy risks</h3>${list(c.risks, S.esc)}</section>
<section aria-labelledby="sources"><h2 id="sources">Sources</h2><p class="small muted">Listed by title and publisher. This guide contains no external links; search for the title if you want to read the original.</p><ul>${c.sources.map((s) => `<li><cite>${S.esc(s.title)}</cite>. <span class="small muted">${S.esc(s.publisher)}. ${S.esc(s.type)}.</span></li>`).join('')}</ul></section>`;
  return { path, title: `${c.company} case`, description: c.problem, body, crumbs: [['Company cases', 'cases.html'], [c.company, path]], section: 'Company cases', keywords: `${c.industry} ${c.category} ${c.problem}` };
}

// ---------- Hardware ----------
function hardware(S) {
  const ctx = S.ctxFor('hardware.html');
  const mark = { yes: ['Suitable', 'ok'], limited: ['Limited', 'mid'], no: ['Not practical', 'no'] };
  const body = `
<h1>Hardware: laptop to large-scale</h1>
<p class="lede">What each class of machine can reasonably do, how to estimate GPU memory, and when to move from your laptop to bigger hardware. Specifications checked ${S.REVIEWED}.</p>
<div class="callout callout-warn"><p><strong>No prices.</strong> Prices change by region and month and were not verified for this guide, so machines are grouped by relative cost. Nothing here is a purchasing recommendation.</p></div>
<section aria-labelledby="vram"><h2 id="vram">GPU memory: the simple arithmetic</h2>
<p>For running a model (<strong>weights only</strong>): number of parameters × bytes per weight. An 8-billion-parameter model at 16 bits (2 bytes) needs about 8 × 2 = 16 GB. That is the minimum; real use needs more.</p>
<div class="table-wrap" tabindex="0" role="region" aria-label="Memory estimates"><table><thead><tr><th scope="col">What</th><th scope="col">8B model estimate</th><th scope="col">Why it changes</th></tr></thead><tbody>
<tr><th scope="row">Weights at 32 / 16 / 8 / 4 bits</th><td data-label="Estimate">32 / 16 / 8 / 4 GB</td><td data-label="Why">Bytes per weight (see quantisation)</td></tr>
<tr><th scope="row">KV cache, 16-bit, 8,192 tokens</th><td data-label="Estimate">≈ 1.07 GB per conversation</td><td data-label="Why">Grows with context length and number of users (assumes 32 layers, 8 KV heads, head size 128)</td></tr>
<tr><th scope="row">Full fine-tuning (AdamW, mixed precision)</th><td data-label="Estimate">≈ 128 GB before activations</td><td data-label="Why">Weights, gradients and optimiser state ≈ 16 bytes per parameter</td></tr>
<tr><th scope="row">LoRA or QLoRA fine-tuning</th><td data-label="Estimate">Far less than full fine-tuning</td><td data-label="Why">Base model frozen (and quantised for QLoRA); only small adapters train</td></tr>
</tbody></table></div>
<p>These numbers come from <code>examples/memory-estimate/memory_estimate.py</code>. The method is explained in ${S.lessonLink('llm-scale', ctx)} and ${S.lessonLink('llm-local', ctx)}.</p></section>
<section aria-labelledby="tiers"><h2 id="tiers">Six hardware scenarios</h2>
${filterBar(S, 'hw-list', [['cost', 'Cost tier', [['No new spend', 'existing'], ['Low', 'low'], ['Medium', 'medium'], ['High', 'high'], ['Pay per use', 'usage']]], ['work', 'Workload that must be suitable', S.WORKLOADS.map((w) => w[1])]], 'Filter hardware scenarios')}
<ul id="hw-list" class="card-list two">${S.HARDWARE.map((h) => `<li class="card" ${dataAttrs(S, { cost: h.cost, work: S.WORKLOADS.filter(([k]) => h.supports[k] === 'yes').map((w) => w[1]) })} data-text="${S.esc((h.tier + ' ' + Object.values(h.spec).join(' ') + ' ' + h.note).toLowerCase())}">
  <p class="card-kicker"><span class="badge">Cost: ${S.esc(h.costLabel)}</span></p>
  <h3 class="card-title">${S.esc(h.tier)}</h3>
  <dl class="spec">${Object.entries(h.spec).map(([k, v]) => `<dt>${S.esc(k)}</dt><dd>${S.esc(v)}</dd>`).join('')}</dl>
  <h4>Reasonable workloads</h4>
  <ul class="support">${S.WORKLOADS.map(([k, label]) => `<li class="sup-${mark[h.supports[k]][1]}"><span class="sup-mark" aria-hidden="true"></span>${S.esc(label)}: <strong>${mark[h.supports[k]][0]}</strong></li>`).join('')}</ul>
  <p>${S.esc(h.note)}</p>
</li>`).join('')}</ul>
${emptyState('hardware scenarios')}
<p class="small muted">Ratings are planning guidance. Whether a model fits depends on precision, context length, batch size and the software used; always measure.</p></section>
<section aria-labelledby="scale"><h2 id="scale">From laptop to large-scale: what changes</h2>
${table(S, 'Scaling steps', ['Stage', 'Hardware', 'What changes in your code'], [
    ['Learn and prototype', 'Your laptop (CPU, maybe a small GPU)', 'Nothing special: small data, small models, short runs.'],
    ['Serious experiments', 'One desktop or cloud GPU (16–24 GB)', 'Move model and data to the GPU (<code>.to("cuda")</code>), use mixed precision, larger batches.'],
    ['Bigger models', 'One large GPU (48–96 GB) or several', 'Gradient accumulation, gradient checkpointing, quantised loading for fine-tuning (QLoRA).'],
    ['Many GPUs', 'A multi-GPU server or cluster', 'Data parallel training (DDP), then sharded training (FSDP or DeepSpeed) when the model no longer fits one GPU.'],
    ['Production serving', 'GPU servers behind a load balancer', 'A dedicated LLM server (for example vLLM), batching, autoscaling and monitoring.'],
  ].map(([a, b, c]) => [S.esc(a), S.esc(b), c]))}
<p>The laptop-to-GPU path is shown with real code in ${S.lessonLink('llm-train-laptop', ctx)} and ${S.lessonLink('llm-scale', ctx)}.</p></section>
<section aria-labelledby="decide"><h2 id="decide">Model API, own machine or cloud GPU?</h2>
<div class="three-col"><div><h3>Use a model API when</h3><p>You are building products, RAG or agents and do not need to change model weights. Check how the provider handles and stores your data.</p></div>
<div><h3>Use your own machine when</h3><p>You do classical ML, small deep-learning and language-model experiments, local models, or data must not leave the device.</p></div>
<div><h3>Rent cloud GPUs when</h3><p>A job does not fit your machine, needs several GPUs, or runs rarely. Estimate GPU-hours × hourly rate + storage, set a budget alert, and shut machines down when idle.</p></div></div></section>
<section aria-labelledby="check"><h2 id="check">Check your own machine</h2>
<figure class="code"><figcaption>Commands</figcaption><pre tabindex="0"><code>python --version                 # Python 3.10 or newer
python -c "import sklearn; print(sklearn.__version__)"
nvidia-smi                       # NVIDIA GPU name, memory and driver (if you have one)
python -c "import torch; print(torch.cuda.is_available())"   # True if PyTorch can use the GPU
dotnet --version                 # .NET SDK version</code></pre></figure>
<p>On Apple silicon Macs, PyTorch uses the GPU through <code>torch.backends.mps.is_available()</code>. ${S.lessonLink('s-setup', ctx)} walks through the full setup.</p></section>
<section aria-labelledby="hw-terms"><h2 id="hw-terms">Hardware terms</h2><dl class="kv">
<dt>VRAM</dt><dd>Memory on the GPU. Model weights, KV cache and training data in use must fit here.</dd>
<dt>System RAM</dt><dd>Main memory; holds datasets and can hold model parts that do not fit the GPU (much slower).</dd>
<dt>CUDA</dt><dd>NVIDIA's software platform for GPU computing; PyTorch builds target specific CUDA versions.</dd>
<dt>Mixed precision</dt><dd>Training with 16-bit numbers where safe and 32-bit where needed; faster and uses less memory.</dd>
<dt>NVMe SSD</dt><dd>Fast storage; models and datasets load faster.</dd>
<dt>Board power</dt><dd>How much power the GPU can draw; size the power supply and cooling to match.</dd>
</dl></section>`;
  return { path: 'hardware.html', title: 'Hardware: laptop to large-scale', body, crumbs: [['Hardware', 'hardware.html']], wide: true, section: 'Reference', keywords: 'gpu vram laptop desktop workstation cloud memory scale up 8b' };
}

// ---------- Glossary ----------
function glossary(S) {
  const ctx = S.ctxFor('glossary.html');
  const terms = [...S.GLOSSARY].sort((a, b) => a[0].localeCompare(b[0]));
  const body = `
<h1>Glossary</h1>
<p class="lede">${terms.length} terms in plain words, each linked to the lesson that explains it with an example.</p>
<div class="filters" data-filter-target="#gl-list" role="group" aria-label="Filter glossary"><label class="field field-grow"><span>Find a term</span><input type="search" data-filter-text placeholder="For example: token"></label><button type="button" class="btn" data-filter-reset>Reset filters</button><p class="filter-status" role="status" aria-live="polite"></p></div>
<dl id="gl-list" class="glossary">${terms.map(([t, d, l]) => `<div class="gl-item card-plain" data-text="${S.esc((t + ' ' + d).toLowerCase())}"><dt id="${S.slug(t)}">${S.esc(t)}</dt><dd>${S.esc(d)} <span class="small">Lesson: ${S.lessonLink(l, ctx)}</span></dd></div>`).join('')}</dl>
${emptyState('terms')}`;
  return { path: 'glossary.html', title: 'Glossary', body, crumbs: [['Glossary', 'glossary.html']], section: 'Reference', keywords: terms.map((t) => t[0]).join(' ') };
}

// ---------- Assessment ----------
function assessment(S) {
  const ready = {
    'AI engineer': ['Explain a RAG failure you found, how you measured it and how you fixed it', 'Build an API that calls a model with secrets in configuration and validated output', 'Show an evaluation set and the score you require before release', 'Choose between prompting, RAG and fine-tuning for a given problem and defend it', 'Describe the prompt-injection defences you built and tested'],
    'ML engineer': ['Choose a metric for a rare-event problem and justify it in business terms', 'Show a repeatable pipeline: same command, same data hash, same metrics', 'Explain an overfitting case and how you detected it', 'Serve a model as an API and describe how you monitor it for drift', 'Explain one prediction of your model to a non-technical person'],
  };
  const body = `
<h1>Checkpoints and readiness</h1>
<p class="lede">A short quiz for each of the ${S.CHECKPOINTS.length} parts. Use them to find gaps; they are self-checks, not a certificate.</p>
<div class="actions"><button type="button" class="btn btn-small" data-expand-all="#checkpoints">Show all explanations</button><button type="button" class="btn btn-small" data-collapse-all="#checkpoints">Hide all explanations</button></div>
<div id="checkpoints">${S.CHECKPOINTS.map((cp) => `<section class="checkpoint" aria-labelledby="${cp.id}"><h2 id="${cp.id}">${S.esc(cp.title)}</h2>
<ol class="mcq-list">${cp.questions.map((q, qi) => `<li><fieldset class="mcq" data-answer="${q.answer}"><legend>${S.esc(q.q)}</legend>
${q.options.map((o, oi) => `<label class="opt"><input type="radio" name="${cp.id}-${qi}" value="${oi}"> ${S.esc(o)}</label>`).join('')}
<div class="mcq-actions"><button type="button" class="btn btn-small" data-check-answer>Check answer</button><p class="mcq-feedback" role="status" aria-live="polite"></p></div>
<details><summary>Explanation</summary><p>${S.esc(q.why)}</p></details></fieldset></li>`).join('')}</ol></section>`).join('')}</div>
<section aria-labelledby="ready-h"><h2 id="ready-h">Interview readiness signals</h2><p>Things you can demonstrate with your own capstones. Tick them to track your self-assessment (stored in this browser only).</p>
<div class="two-col">${Object.entries(ready).map(([role, items]) => `<div><h3>${role}</h3><ul class="checklist">${items.map((it, i) => `<li><label class="check-row"><input type="checkbox" data-progress-checkbox="skill:${S.slug(role)}-${i}"> ${S.esc(it)}</label></li>`).join('')}</ul></div>`).join('')}</div></section>`;
  return { path: 'assessment.html', title: 'Checkpoints and readiness', body, crumbs: [['Checkpoints', 'assessment.html']], wide: true, section: 'Practice', keywords: 'quiz checkpoint interview readiness skills assessment' };
}

// ---------- Progress ----------
function progress(S) {
  const data = {
    modules: S.MODULES.map((m) => ({ id: m.id, title: m.title, lessons: m.groups.flatMap((g) => g.lessons).map((id) => ({ id, title: S.lessons[id].title, minutes: S.lessons[id].minutes })) })),
    projects: S.PROJECTS.map((p) => ({ id: p.id, title: p.title, effort: p.effort })),
    roadmaps: S.ROADMAPS.map((r) => ({ id: r.id, title: r.title, nodes: r.nodes.map((n) => ({ n: n.n, title: n.title, effort: n.effort, lessons: n.lessons })) })),
  };
  const body = `
<h1>My progress and study calendar</h1>
<div class="callout callout-note"><p><strong>How progress works.</strong> Completion marks are stored in this browser on this device. They are not uploaded or shared. Clearing browser data removes them, so export a file to keep a backup or move to another device.</p></div>
<p id="storage-warning" class="callout callout-warn" hidden>This browser is blocking local storage, so progress cannot be saved here. Lessons still work; use export before closing the page.</p>
<section aria-labelledby="dash-h"><h2 id="dash-h">Progress by part</h2><div id="progress-dashboard" class="dash"></div></section>
<section aria-labelledby="io-h"><h2 id="io-h">Export, import and reset</h2>
<div class="actions">
  <button type="button" class="btn" id="export-progress">Export progress as JSON</button>
  <label class="btn file-btn">Import progress from JSON<input type="file" id="import-progress" accept="application/json,.json" class="sr-only"></label>
  <button type="button" class="btn btn-danger" id="reset-progress">Reset learning progress</button>
</div>
<p id="io-status" role="status" aria-live="polite" class="small"></p>
<p class="small muted">Reset removes lesson, capstone and skill marks only; theme and layout choices stay. Import replaces current progress with the file's contents after checking its format (schema "aimlqp-progress", version 1).</p></section>
<section aria-labelledby="cal-h"><h2 id="cal-h">Study calendar</h2>
<p>Choose a roadmap and your weekly hours to see an estimated schedule. It uses each step's lower and upper effort; real progress varies.</p>
<div class="filters calendar-form" role="group" aria-label="Study calendar settings">
  <label class="field"><span>Roadmap</span><select id="cal-roadmap">${S.ROADMAPS.map((r) => `<option value="${r.id}">${S.esc(r.title)}</option>`).join('')}</select></label>
  <label class="field"><span>Hours per week</span><input id="cal-hours" type="number" min="2" max="40" step="1" value="8" inputmode="numeric" aria-describedby="cal-hours-help"></label>
  <span id="cal-hours-help" class="small muted">Between 2 and 40.</span>
</div>
<p id="cal-error" class="field-error" role="alert" hidden></p>
<div id="calendar-output"></div></section>
<script type="application/json" id="curriculum-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
  return { path: 'progress.html', title: 'My progress and study calendar', body, crumbs: [['Progress', 'progress.html']], wide: true, section: 'Reference', keywords: 'progress export import reset calendar schedule' };
}

// ---------- About ----------
function about(S) {
  const body = `
<h1>About, sources and privacy</h1>
<section aria-labelledby="about-h"><h2 id="about-h">About this guide</h2><p>A free, self-contained guide that takes someone new to AI to the point of planning and building industry AI and ML systems. It explains concepts and their implementation in Python and .NET with the maths kept short: lessons that use it have an "Applied Maths - Statistics" section with main formulas and simple worked examples, and the <a href="maths.html">maths map</a> collects the topics. Everything needed to learn is on these pages.</p>
<p>Content reviewed ${S.REVIEWED}. Tools, model versions and package APIs change quickly: each lesson shows its review date and states honestly whether its code was run. Python outputs quoted in lessons were copied from real runs; the C# examples were not compiled because no .NET SDK was available in the build environment. Durations are study estimates. Completing lessons does not certify job readiness.</p></section>
<section aria-labelledby="sources"><h2 id="sources">Sources for company cases</h2>
<p>Case facts and results come only from published sources, listed by title and publisher on each case page. Each case separates documented facts from the guide's suggested workflow. The full source register, with web addresses and confidence notes, is <code>CONTENT_SOURCES.md</code> in the source package.</p>
<ul>${S.CASES.map((c) => `<li><a href="cases/${c.id}.html">${S.esc(c.company)}</a>: ${c.sources.map((s) => S.esc(s.publisher)).join('; ')}</li>`).join('')}</ul></section>
<section aria-labelledby="privacy"><h2 id="privacy">Privacy</h2><p>What the site stores, what it shares and how advertising works is on the <a href="privacy.html">Privacy and cookies</a> page. In short: no account or sign-in, and your progress stays in your browser. All example data is synthetic. Do not paste confidential data into exercises that call outside model APIs.</p></section>
<section aria-labelledby="licence"><h2 id="licence">Licences</h2><p>Lesson text and diagrams: Creative Commons Attribution 4.0 (CC BY 4.0). Example code: MIT licence. Company and product names belong to their owners and are used only to identify them.</p></section>
<section aria-labelledby="a11y"><h2 id="a11y">Accessibility</h2><p>The site targets WCAG 2.2 level AA: semantic structure, keyboard operation for every control, visible focus, text contrast of at least 4.5:1 in light and dark themes, support for 200% zoom and reduced motion, and readable print output. Test results and their limits are in <code>QA_REPORT.md</code> in the source package.</p></section>`;
  return { path: 'about.html', title: 'About, sources and privacy', body, crumbs: [['About', 'about.html']], section: 'Reference', keywords: 'about privacy licence accessibility sources' };
}

// ---------- Privacy and cookies (wording depends on whether the AdSense build is on) ----------
function privacy(S) {
  const ads = !!S.ADS.client;
  const own = `<section aria-labelledby="own-h"><h2 id="own-h">What this site stores</h2><ul><li>No account, sign-in or analytics of our own.</li><li>Your progress and preferences (theme, sidebar, focus mode, completed lessons) are stored only in your browser under the key <code>aimlqp.v1</code>. Nothing is sent to a server. You can export or reset them on the <a href="progress.html">progress page</a>.</li><li>The site loads no external fonts or images.</li></ul></section>`;
  const adText = ads ? `<section aria-labelledby="ads-h"><h2 id="ads-h">Advertising</h2>
<p>This site shows advertisements served by Google AdSense. Advertisements pay for the free lessons. They are marked "Advertisement" and never appear inside lesson text, quizzes, code or diagrams.</p>
<ul><li>Google and its partners may use cookies or similar technologies to show and measure ads, and may show ads based on your earlier visits to this and other sites.</li><li>In the European Economic Area, the United Kingdom and Switzerland, a consent message asks for your choice before personalised ads are used. You can change your choice from the same message when it is shown.</li><li>You can manage personalised ads in your Google account ad settings, or block ads in your browser. The lessons work either way.</li></ul>
<p>The ad provider, not this site, receives the data that ad cookies collect. Read the provider's own privacy information for details.</p></section>` : `<section aria-labelledby="ads-h"><h2 id="ads-h">Advertising</h2><p>This edition shows no advertisements and sets no cookies.</p></section>`;
  const contact = process.env.CONTACT_EMAIL ? `<section aria-labelledby="contact-h"><h2 id="contact-h">Contact</h2><p>Questions about privacy or corrections to a lesson: <a href="mailto:${S.esc(process.env.CONTACT_EMAIL)}">${S.esc(process.env.CONTACT_EMAIL)}</a>.</p></section>` : '';
  const body = `<h1>Privacy and cookies</h1>\n${own}\n${adText}\n${contact}`;
  return { path: 'privacy.html', title: 'Privacy and cookies', body, crumbs: [['Privacy and cookies', 'privacy.html']], section: 'Reference', keywords: 'privacy cookies advertising adsense consent data storage' };
}

function notFound() {
  return { path: '404.html', title: 'Page not found', body: '<h1>Page not found</h1><p>The address may have changed. Use search above, or go to the <a href="index.html">welcome page</a> or <a href="lessons.html">all lessons</a>.</p>', crumbs: [] };
}
