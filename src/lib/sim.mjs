// Simulation blocks for lessons. A fenced block
//
//   ```sim <module> <Title>
//   preset: optional starting set-up named by the module
//   question: What happens when ...?
//   watch: what to look at (one or more lines)
//   try: id | a small goal the page can detect (zero or more)
//   predict: Question? | Option A | Option B | Option C
//   answer: 2 | Why that option is right (1-based option number, then the explanation)
//   leaves-out: what this simulation does not show (required)
//   reference: examples/.../file.py   (optional: program that prints the same headline numbers)
//   ```
//
// becomes static, accessible markup (readable without scripts). public/assets/sim.js and the module file named
// public/assets/sims/<module>.js bring it to life. No inline styles or scripts; colours come from theme tokens.
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SIM_SECTION = 'Live simulation';
export const SIM_MODULES = ['nn', 'bpe', 'gen', 'attn', 'sup', 'tf1', 'tf4', 'tf5', 'tf6', 'gd', 'train', 'bp', 'reg', 'cls', 'bv', 'cv', 'km', 'pca', 'anom', 'mb', 'lw', 'emb', 'lora', 'hw', 'vs', 'rag', 'cnn', 'seq', 'txt', 'ae', 'gnn', 'spec', 'rl', 'rec', 'ts', 'bay', 'cau', 'srch', 'csp', 'rul', 'loop', 'spl', 'cln', 'feat', 'lab', 'api', 'agent', 'mm', 'inj', 'evl', 'fair', 'mcp', 'val', 'rel', 'mon', 'srv', 'arch', 'ppl'];
// Files a module needs, in load order (a module may bring a data file such as trained weights).
export const SIM_FILES = { attn: ['attn-model.js', 'attn.js'], tf1: ['attn-model.js', 'attn.js', 'tf1.js'], tf4: ['attn-model.js', 'attn.js', 'tf4.js'], tf5: ['attn-model.js', 'attn.js', 'tf5.js'], tf6: ['attn-model.js', 'attn.js', 'tf6.js'], reg: ['sup.js', 'core.js', 'reg.js'], cls: ['sup.js', 'core.js', 'cls.js'], bv: ['sup.js', 'core.js', 'bv.js'], cv: ['sup.js', 'core.js', 'cv.js'], km: ['sup.js', 'core.js', 'km.js'], pca: ['sup.js', 'core.js', 'pca.js'], anom: ['sup.js', 'core.js', 'anom.js'], mb: ['llm.js', 'mb.js'], lw: ['gen.js', 'llm.js', 'lw.js'], emb: ['core.js', 'llm.js', 'emb.js'], lora: ['llm.js', 'lora.js'], hw: ['llm.js', 'hw.js'], vs: ['core.js', 'llm.js', 'vs.js'], rag: ['llm.js', 'rag.js'], cnn: ['dl.js', 'cnn.js'], seq: ['dl.js', 'seq.js'], txt: ['dl.js', 'txt.js'], ae: ['attn-model.js', 'attn.js', 'dl.js', 'ae.js'], gnn: ['dl.js', 'gnn.js'], spec: ['dl.js', 'spec.js'], rl: ['dl.js', 'rl.js'], rec: ['ai.js', 'rec.js'], ts: ['ai.js', 'ts.js'], bay: ['ai.js', 'bay.js'], cau: ['ai.js', 'cau.js'], srch: ['ai.js', 'srch.js'], csp: ['ai.js', 'csp.js'], rul: ['fnd.js', 'rul.js'], loop: ['fnd.js', 'loop.js'], spl: ['fnd.js', 'spl.js'], cln: ['fnd.js', 'cln.js'], feat: ['fnd.js', 'feat.js'], lab: ['sup.js', 'fnd.js', 'lab.js'], api: ['fnd.js', 'api.js'], agent: ['fnd.js', 'agent.js'], mm: ['fnd.js', 'mm.js'], inj: ['fnd.js', 'inj.js'], evl: ['fnd.js', 'evl.js'], fair: ['fnd.js', 'fair.js'], mcp: ['fnd.js', 'mcp.js'], val: ['ops.js', 'val.js'], rel: ['ops.js', 'rel.js'], mon: ['ops.js', 'mon.js'], srv: ['ops.js', 'srv.js'], arch: ['ops.js', 'arch.js'], ppl: ['gen.js', 'llm.js', 'ops.js', 'ppl.js'] };
export const simScripts = (mods) => ['assets/sim.js', ...[...mods].sort().flatMap((m) => (SIM_FILES[m] || [`${m}.js`]).map((f) => `assets/sims/${f}`))];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
let counter = 0;

export function parseSim(info, bodyLines, where = 'sim') {
  const m = info.trim().match(/^(\w+)\s+(.+)$/);
  if (!m) throw new Error(`${where}: write "sim <module> <title>"`);
  const mod = m[1].toLowerCase(), title = m[2].trim();
  if (!SIM_MODULES.includes(mod)) throw new Error(`${where}: unknown simulation module "${mod}" (use ${SIM_MODULES.join(', ')})`);
  if (!existsSync(join(ROOT, 'public/assets/sims', `${mod}.js`))) throw new Error(`${where}: public/assets/sims/${mod}.js is missing`);
  const s = { mod, title, preset: '', question: '', watch: [], tries: [], predict: null, answer: null, leaves: '', reference: '' };
  for (const raw of bodyLines) {
    const line = raw.trim();
    if (!line) continue;
    const k = line.match(/^([a-z-]+):\s*(.+)$/);
    if (!k) throw new Error(`${where}: cannot read line "${line}" (use "key: value")`);
    const [, key, val] = k;
    if (key === 'preset') s.preset = val.trim();
    else if (key === 'question') s.question = val;
    else if (key === 'watch') s.watch.push(val);
    else if (key === 'try') { const [id, ...rest] = val.split('|'); if (!rest.length || !/^[a-z0-9-]+$/.test(id.trim())) throw new Error(`${where}: write "try: id | goal"`); s.tries.push({ id: id.trim(), text: rest.join('|').trim() }); }
    else if (key === 'predict') { const f = val.split('|').map((x) => x.trim()); if (f.length < 3) throw new Error(`${where}: "predict:" needs a question and at least two options`); s.predict = { q: f[0], options: f.slice(1) }; }
    else if (key === 'answer') { const [n, ...rest] = val.split('|'); s.answer = { n: Number(n.trim()), text: rest.join('|').trim() }; }
    else if (key === 'leaves-out') s.leaves = val;
    else if (key === 'reference') s.reference = val.trim();
    else throw new Error(`${where}: unknown key "${key}"`);
  }
  const need = (c, msg) => { if (!c) throw new Error(`${where} (sim ${mod} "${title}"): ${msg}`); };
  need(s.question, 'needs a "question:" line');
  need(s.watch.length >= 1 && s.watch.length <= 4, 'needs 1 to 4 "watch:" lines');
  need(s.leaves, 'needs a "leaves-out:" line (what this simulation does not show)');
  need(s.tries.length <= 4, 'at most 4 "try:" lines');
  if (s.predict) need(s.answer && s.answer.n >= 1 && s.answer.n <= s.predict.options.length && s.answer.text, '"predict:" needs "answer: n | explanation" with n between 1 and the number of options');
  if (s.reference) need(existsSync(join(ROOT, s.reference)), `reference file "${s.reference}" does not exist`);
  return s;
}

export function renderSim(info, bodyLines, inline, ctx, where) {
  const s = parseSim(info, bodyLines, where);
  const inl = (t) => inline(t, ctx);
  const id = `sim-${++counter}`;
  (ctx.sims ||= new Set()).add(s.mod);
  const predict = s.predict ? `<fieldset class="sim-predict" data-answer="${s.answer.n}" hidden><legend>Predict first</legend><p class="sim-predict-q">${inl(s.predict.q)}</p>${s.predict.options.map((o, i) => `<label class="sim-opt"><input type="radio" name="${id}-p" value="${i + 1}"> ${inl(o)}</label>`).join('')}<button type="button" class="btn btn-small" data-sim-check>Check my guess</button><p class="sim-reveal" data-reveal="${esc(s.answer.text)}" role="status" aria-live="polite"></p></fieldset>` : '';
  const tries = s.tries.length ? `<div class="sim-try"><p class="sim-h">Try this</p><ul>${s.tries.map((t) => `<li data-try="${esc(t.id)}"><span class="sim-tick" aria-hidden="true"></span> ${inl(t.text)} <span class="sim-tick-word"></span></li>`).join('')}</ul></div>` : '';
  return `<figure class="sim" id="${id}" data-sim="${s.mod}" data-preset="${esc(s.preset)}" role="group" aria-labelledby="${id}-t">
<figcaption id="${id}-t"><span class="dg-kicker">Simulation</span> ${inl(s.title)}</figcaption>
<p class="sim-q"><strong>The question.</strong> ${inl(s.question)}</p>
<div class="sim-watch"><p class="sim-h">What to watch</p><ul>${s.watch.map((w) => `<li>${inl(w)}</li>`).join('')}</ul></div>
<p class="sim-nojs">This simulation needs JavaScript, which is switched off or not loaded. The lists above say what it shows, and the example programs below print the same kind of numbers.</p>
${predict}
<div class="sim-stage" hidden></div>
${tries}
<p class="sim-leaves"><strong>What this leaves out.</strong> ${inl(s.leaves)}</p>${s.reference ? `\n<p class="sim-ref small muted">Python program that prints the same headline numbers: <code>${esc(s.reference)}</code>.</p>` : ''}
</figure>`;
}
