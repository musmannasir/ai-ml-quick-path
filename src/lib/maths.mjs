// Maths moments: small, step-by-step worked calculations placed inside a lesson exactly where the idea is needed.
// This module does three jobs:
//   1. evaluate()        a safe arithmetic evaluator (no eval) used to CHECK every worked step at build time;
//   2. renderMathMoment() turns a ```maths block into accessible HTML (steps, formula, why, try-it, optional widget);
//   3. scanArithmetic()   finds "expression = value" chains in ordinary prose (the older Applied Maths examples)
//                         and reports any that do not add up.
// A lesson cannot be built if one of its maths-moment steps is numerically wrong.

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------- tokeniser and evaluator ----------
const FUNCS = { sqrt: Math.sqrt, ln: Math.log, log2: Math.log2, log10: Math.log10, exp: Math.exp, abs: Math.abs };
function normalise(s) {
  return String(s).replace(/[×·]/g, '*').replace(/÷/g, '/').replace(/[−]/g, '-').replace(/²/g, '^2').replace(/³/g, '^3')
    .replace(/(\d),(?=\d{3}(?!\d))/g, '$1');
}
// Returns tokens: {t:'num',v,dec,pct} | {t:'op',v} | {t:'fn',v} | {t:'word',v} | {t:'sep',v}
export function tokenise(src) {
  const s = normalise(src); const out = []; let i = 0, sp = false;
  const push = (k) => { k.sp = sp; sp = false; out.push(k); };
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) { i++; sp = true; continue; }
    const num = s.slice(i).match(/^\d+(\.\d+)?(e[+-]?\d+)?/i);
    if (num) {
      let j = i + num[0].length; const pct = s[j] === '%'; if (pct) j++;
      // A number glued to letters ("3rd", "2x", "4k") is a word, not a quantity.
      if (/[A-Za-z_]/.test(s[j] || '')) { const w = s.slice(i).match(/^[\w.]+/)[0]; push({ t: 'word', v: w }); i += w.length; continue; }
      push({ t: 'num', v: Number(num[0]) / (pct ? 100 : 1), dec: (num[1] || '').length ? num[1].length - 1 : 0, pct });
      i = j; continue;
    }
    if ('+-*/^()'.includes(ch)) { push({ t: 'op', v: ch }); i++; continue; }
    const w = s.slice(i).match(/^[A-Za-z_]\w*/);   // letters then digits ("x1", "p95") stay one word
    if (w) { push(FUNCS[w[0]] ? { t: 'fn', v: w[0] } : { t: 'word', v: w[0] }); i += w[0].length; continue; }
    push({ t: 'sep', v: ch }); i++;
  }
  return out;
}
const isMath = (k) => k.t === 'num' || k.t === 'op' || k.t === 'fn';

// Recursive descent over a token array. Throws on anything that is not a complete arithmetic expression.
function parseTokens(toks) {
  let p = 0;
  const peek = () => toks[p];
  const eat = (v) => { if (peek() && peek().t === 'op' && peek().v === v) { p++; return true; } return false; };
  function primary() {
    const k = peek();
    if (!k) throw new Error('unexpected end');
    if (k.t === 'num') { p++; return k.v; }
    if (k.t === 'fn') { p++; if (!eat('(')) throw new Error('( expected'); const v = expr(); if (!eat(')')) throw new Error(') expected'); return FUNCS[k.v](v); }
    if (eat('(')) { const v = expr(); if (!eat(')')) throw new Error(') expected'); return v; }
    throw new Error('number expected');
  }
  function unary() { if (eat('-')) return -unary(); if (eat('+')) return unary(); return power(); }
  function power() { const b = primary(); if (eat('^')) return Math.pow(b, unary()); return b; }
  function term() {
    let v = unary();
    for (;;) {
      if (eat('*')) v *= unary(); else if (eat('/')) v /= unary();
      else if (peek() && !peek().sp && (peek().t === 'num' || peek().t === 'fn' || (peek().t === 'op' && peek().v === '('))) v *= power(); // 2(w - 3)
      else return v;
    }
  }
  function expr() { let v = term(); for (;;) { if (eat('+')) v += term(); else if (eat('-')) v -= term(); else return v; } }
  const v = expr();
  if (p !== toks.length) throw new Error('unexpected ' + JSON.stringify(toks[p].v));
  if (!Number.isFinite(v)) throw new Error('not a finite number');
  return v;
}
export function evaluate(src) {
  const toks = tokenise(src);
  if (!toks.length || !toks.every(isMath)) throw new Error(`not arithmetic: "${src.trim()}"`);
  return parseTokens(toks);
}
const single = (toks) => (toks.length === 1 && toks[0].t === 'num') || (toks.length === 2 && toks[0].t === 'op' && toks[0].v === '-' && toks[1].t === 'num');
const literalOf = (toks) => toks[toks.length - 1];
// Two values agree when they match to the precision shown by whichever side is a plain number.
function agree(a, at, b, bt, approx) {
  let tol = 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
  // The stated result (right side) sets the precision; a whole number must match exactly to the half unit.
  const t = single(bt) ? bt : single(at) ? at : null;
  if (t) { const k = literalOf(t); tol = Math.max(tol, (approx && k.dec > 0 ? 1 : 0.5) * Math.pow(10, -k.dec) / (k.pct ? 100 : 1) * 1.0000001); }
  return Math.abs(a - b) <= tol;
}

// ---------- strict check of one "a = b = c" chain (maths-moment steps) ----------
export function checkChain(chain) {
  const parts = chain.split(/\s(=|≈)\s/);
  if (parts.length < 3) throw new Error(`a step needs "calculation = result": "${chain}"`);
  let prev = null;
  for (let i = 0; i < parts.length; i += 2) {
    let toks = tokenise(parts[i]);
    if (i === parts.length - 1) { let n = toks.length; while (n > 0 && !toks.slice(0, n).every(isMath)) n--; toks = toks.slice(0, n); } // allow a unit after the last value
    if (!toks.length || !toks.every(isMath)) throw new Error(`cannot read "${parts[i].trim()}" as arithmetic in "${chain}"`);
    let v; try { v = parseTokens(toks); } catch (e) { throw new Error(`cannot read "${parts[i].trim()}" in "${chain}" (${e.message})`); }
    if (prev && !agree(prev.v, prev.toks, v, toks, parts[i - 1] === '≈')) throw new Error(`wrong arithmetic in "${chain}": ${parts[i - 2].trim()} is ${Number(prev.v.toPrecision(10))}, not ${parts[i].trim()}`);
    prev = { v, toks };
  }
  return prev.v;
}

// ---------- tolerant scan of prose: report equalities that do not add up ----------
// Prose shows rounded intermediate values, so the comparison is a little looser than for maths-moment steps:
// one unit in the last shown decimal place, or 1% when both sides are calculations.
const UNITS = { kb: 1e3, mb: 1e6, gb: 1e9, tb: 1e12, thousand: 1e3, million: 1e6, billion: 1e9, trillion: 1e12 };
const hasOp = (toks) => toks.some((k) => k.t === 'fn' || (k.t === 'op' && '+-*/^'.includes(k.v))) && !single(toks);
export function scanArithmetic(text) {
  const problems = []; let checked = 0;
  const clean = String(text).replace(/`/g, ' ').replace(/\*\*/g, ' ');
  for (const sentence of clean.split('\n')) {
    const parts = sentence.split(/(=|≈)/);
    for (let i = 0; i + 2 < parts.length; i += 2) {
      if (/[<>!=]$/.test(parts[i]) || /^=/.test(parts[i + 2])) continue; // <=, >=, !=, ==
      const L = tokenise(parts[i]), R = tokenise(parts[i + 2]);
      let a = L.length; while (a > 0 && isMath(L[a - 1])) a--;
      let b = 0; while (b < R.length && isMath(R[b])) b++;
      if (L.slice(a).length === 0 || b === 0) continue;
      // "name(…) = …" is a call to a function this checker does not know (tanh, sigmoid, ReLU): skip it.
      if (a > 0 && L[a - 1].t === 'word' && L[a].t === 'op' && L[a].v === '(' && !L[a].sp) continue;
      if (/±/.test(parts[i].slice(-40)) || /±/.test(parts[i + 2].slice(0, 40))) continue;
      let lt = null, lv, rt = null, rv;
      for (let s = a; s < L.length; s++) { try { lv = parseTokens(L.slice(s)); lt = L.slice(s); if (s > a) lt.cut = true; break; } catch { /* shorter */ } }
      for (let e = b; e > 0; e--) { try { rv = parseTokens(R.slice(0, e)); rt = R.slice(0, e); break; } catch { /* shorter */ } }
      if (!lt || !rt || lt.cut) continue;
      // Only a real calculation on the left is checked ("2 + 2 = 4"). "n = 4" and "recall@3 = 2 ÷ 3" are definitions.
      // The one exception is a conversion between a plain number and a percentage ("0.8 = 80%").
      if (!hasOp(lt) && !(single(lt) && single(rt) && literalOf(lt).pct !== literalOf(rt).pct)) continue;
      checked++;
      const both = hasOp(lt) && hasOp(rt);
      const near = (x, y) => (both ? Math.abs(x - y) <= 0.01 * Math.max(Math.abs(x), Math.abs(y)) + 1e-12 : agree(x, lt, y, rt, true));
      const unit = R[rt.length] && R[rt.length].t === 'word' ? UNITS[R[rt.length].v.toLowerCase()] : 0;
      let ok = near(lv, rv);
      if (!ok && unit) ok = near(lv / unit, rv);                               // "7,000,000,000 × 2 = 14 GB"
      if (!ok && single(rt) && literalOf(rt).pct) ok = near(lv / 100, rv);     // "30 ÷ 200 × 100 = 15%"
      if (!ok) problems.push(`${parts[i].trim().slice(-60)} ${parts[i + 1]} ${parts[i + 2].trim().slice(0, 40)}   (left side is ${Number(lv.toPrecision(8))})`);
    }
  }
  return { checked, problems };
}

// ---------- interactive widgets: parameters are validated here, the arithmetic runs in public/assets/app.js ----------
export const WIDGETS = {
  mean: { label: 'Average calculator', fields: (a) => a.map((v, i) => [`Value ${i + 1}`, v, -1000, 1000, 1]), min: 2, max: 6 },
  line: { label: 'Straight-line prediction', fields: (a) => [['Slope (weight)', a[0], -20, 20, 0.5], ['Intercept (bias)', a[1], -100, 100, 0.5], ['Input x', a[2], -100, 100, 0.5]], min: 3, max: 3 },
  confusion: { label: 'Precision and recall', fields: (a) => [['Flagged and truly positive (TP)', a[0], 0, 1000, 1], ['Flagged but actually negative (FP)', a[1], 0, 1000, 1], ['Missed positives (FN)', a[2], 0, 1000, 1], ['Correctly left alone (TN)', a[3], 0, 100000, 1]], min: 4, max: 4 },
  gradient: { label: 'One gradient-descent step', fields: (a) => [['Starting weight w', a[0], -10, 10, 0.1], ['Learning rate', a[1], 0, 1.5, 0.05]], min: 2, max: 2 },
  dot: { label: 'Dot product and cosine similarity', fields: (a) => [['a, first number', a[0], -10, 10, 1], ['a, second number', a[1], -10, 10, 1], ['b, first number', a[2], -10, 10, 1], ['b, second number', a[3], -10, 10, 1]], min: 4, max: 4 },
  softmax: { label: 'Scores to probabilities (temperature)', fields: (a) => [['Score for token A', a[0], -10, 10, 0.5], ['Score for token B', a[1], -10, 10, 0.5], ['Score for token C', a[2], -10, 10, 0.5], ['Temperature', a[3], 0.1, 5, 0.1]], min: 4, max: 4 },
  weighted: { label: 'Weighted sum', fields: (a) => [['Weight 1', a[0], 0, 1, 0.05], ['Value 1', a[1], -100, 100, 1], ['Weight 2', a[2], 0, 1, 0.05], ['Value 2', a[3], -100, 100, 1]], min: 4, max: 4 },
  memory: { label: 'Model weight memory', fields: (a) => [['Parameters (billions)', a[0], 0.1, 500, 0.5], ['Bytes per parameter', a[1], 0.5, 8, 0.5]], min: 2, max: 2 },
};

let seq = 0;
export const resetMathSeq = () => { seq = 0; };

// ---------- render a ```maths block ----------
// Line grammar (one item per line, "key: text"):
//   situation, find            the everyday setting and the plain question
//   table / row                a tiny input table:  table: Day | Items    row: Monday | 2
//   step                       step: what we do | 2 + 4 + 6 = 12        (checked by the build)
//   note                       a plain sentence between steps
//   result                     the answer in words
//   formula                    shown only after the hand calculation
//   means                      symbol-by-symbol meaning of the formula
//   why                        why ML / AI uses this number
//   caution                    what the toy example does not prove
//   try / answer               change-one-number exercise with a revealed, explained answer
//   widget                     widget: mean 2,4,6     (see WIDGETS)
//   deeper                     optional formal detail, collapsed
export function renderMathMoment(title, lines, inline, ctx, file) {
  const fail = (m) => { throw new Error(`${file}: maths moment "${title}": ${m}`); };
  if (!title) fail('needs a title on the fence line');
  const items = [];
  for (const raw of lines) {
    if (!raw.trim()) continue;
    const m = raw.match(/^([a-z]+):\s*(.*)$/);
    if (!m) { if (items.length) items[items.length - 1].text += ' ' + raw.trim(); else fail(`cannot read line "${raw}"`); continue; }
    items.push({ key: m[1], text: m[2].trim() });
  }
  const KEYS = ['situation', 'find', 'table', 'row', 'step', 'note', 'result', 'formula', 'means', 'why', 'caution', 'try', 'answer', 'widget', 'deeper'];
  for (const it of items) if (!KEYS.includes(it.key)) fail(`unknown line type "${it.key}:"`);
  const get = (k) => items.filter((x) => x.key === k);
  if (!get('situation').length || !get('find').length) fail('needs "situation:" and "find:" lines');
  if (get('step').length < 1) fail('needs at least one "step:" line');
  if (!get('why').length) fail('needs a "why:" line that ties the number back to ML or AI');
  if (get('try').length !== get('answer').length) fail('every "try:" needs an "answer:"');
  const n = ++seq; const id = `mm-${n}`;
  const p = (cls, label, text) => `<p class="${cls}">${label ? `<strong class="mm-k">${label}</strong> ` : ''}${inline(text, ctx)}</p>`;
  const out = [`<aside class="math-moment" aria-labelledby="${id}"><p class="mm-eyebrow">Maths moment</p><h3 class="mm-title" id="${id}">${inline(title, ctx)}</h3>`];
  out.push(p('mm-situation', '', get('situation').map((x) => x.text).join(' ')));
  out.push(p('mm-find', 'What we want to find:', get('find')[0].text));
  const head = get('table')[0];
  if (head) {
    const cells = (t) => t.split('|').map((c) => c.trim());
    const h = cells(head.text); const rows = get('row').map((r) => cells(r.text));
    for (const r of rows) if (r.length !== h.length) fail(`table row "${r.join(' | ')}" needs ${h.length} cells`);
    out.push(`<div class="table-wrap mm-table" tabindex="0" role="region" aria-label="${esc(h.join(', '))} table"><table><thead><tr>${h.map((c) => `<th scope="col">${inline(c, ctx)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, j) => `<td data-label="${esc(h[j])}">${inline(c, ctx)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
  }
  // Steps and notes in the order written.
  const seqItems = items.filter((x) => x.key === 'step' || x.key === 'note');
  let stepNo = 0; const body = [];
  for (const it of seqItems) {
    if (it.key === 'note') { body.push(`<li class="mm-note">${inline(it.text, ctx)}</li>`); continue; }
    const cut = it.text.lastIndexOf('|');
    if (cut < 0) fail(`step needs "what we do | calculation = result": "${it.text}"`);
    const label = it.text.slice(0, cut).trim(), calc = it.text.slice(cut + 1).trim();
    try { checkChain(calc); } catch (e) { fail(e.message); }
    stepNo++;
    body.push(`<li class="mm-step"><span class="mm-step-label"><span class="sr-only">Step ${stepNo}: </span>${inline(label, ctx)}</span><code class="mm-calc">${esc(calc.replace(/\^2(?![\d.])/g, '²').replace(/\^3(?![\d.])/g, '³'))}</code></li>`);
  }
  out.push(`<p class="mm-k mm-by-hand">Work it out by hand</p><ol class="mm-steps">${body.join('')}</ol>`);
  for (const r of get('result')) out.push(p('mm-result', 'Answer:', r.text));
  for (const f of get('formula')) out.push(`<div class="formula mm-formula" role="group" aria-label="Formula"><p class="formula-title">The same thing as a formula</p><pre tabindex="0"><code>${esc(f.text)}</code></pre></div>`);
  for (const r of get('means')) out.push(p('mm-means', 'Reading the formula:', r.text));
  out.push(p('mm-why', 'Why AI and ML use it:', get('why').map((x) => x.text).join(' ')));
  for (const r of get('caution')) out.push(p('mm-caution', 'Keep in mind:', r.text));
  for (const w of get('widget')) {
    const [type, argText = ''] = w.text.split(/\s+/);
    const def = WIDGETS[type]; if (!def) fail(`unknown widget "${type}"`);
    const a = argText.split(',').map(Number);
    if (a.some((v) => !Number.isFinite(v)) || a.length < def.min || a.length > def.max) fail(`widget ${type} needs ${def.min === def.max ? def.min : `${def.min} to ${def.max}`} numbers, for example "widget: ${type} ${def.fields(new Array(def.min).fill(1)).map((f) => f[1]).join(',')}"`);
    const fields = def.fields(a);
    for (const [lab, v, lo, hi] of fields) if (v < lo || v > hi) fail(`widget ${type}: "${lab}" must be between ${lo} and ${hi}`);
    out.push(`<div class="mm-widget" data-widget="${type}" hidden><p class="mm-k" id="${id}-w">Try it: ${esc(def.label)}</p>
<div class="mm-fields" role="group" aria-labelledby="${id}-w">${fields.map(([lab, v, lo, hi, step], k) => `<label class="field mm-field"><span>${esc(lab)}</span><input type="number" inputmode="decimal" value="${v}" min="${lo}" max="${hi}" step="${step}" data-default="${v}" data-k="${k}"></label>`).join('')}
<button type="button" class="btn btn-small" data-widget-reset>Reset</button></div>
<p class="mm-error field-error" role="alert" hidden></p>
<div class="mm-out" role="status" aria-live="polite"></div></div>`);
  }
  const tries = get('try'), answers = get('answer');
  tries.forEach((t, k) => out.push(`<div class="mm-try"><p><strong class="mm-k">Try one change:</strong> ${inline(t.text, ctx)}</p><details><summary>Show the answer and why</summary><div class="mm-answer">${inline(answers[k].text, ctx)}</div></details></div>`));
  for (const d of get('deeper')) out.push(`<details class="mm-deeper"><summary>Understand the maths deeper (optional)</summary><div class="mm-answer"><p>${inline(d.text, ctx)}</p></div></details>`);
  out.push('</aside>');
  return { html: out.join('\n'), summary: { title, find: get('find')[0].text, steps: seqItems.filter((x) => x.key === 'step').map((x) => x.text.slice(x.text.lastIndexOf('|') + 1).trim()), result: (get('result')[0] || {}).text || '', id } };
}
