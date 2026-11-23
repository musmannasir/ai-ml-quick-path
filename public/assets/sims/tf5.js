/* Simulation: how a Transformer writes one word at a time, and what the cache saves (Transformer series, part 5).
   The calculation (generate) is in AIQPSim.logic.tf5 so Node can run it. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  Q.logic = Q.logic || {};
  function lcg(seed) { var s = seed >>> 0; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  // Scores of the last word -> probabilities after temperature and top-k. Returns { raw, p }.
  function dist(model, words, temp, topk) {
    var A = Q.logic.attn, r = A.run(model, words, true, true), lg = r.blk[words.length - 1].logits, raw = A.softmax(lg), p = A.softmax(lg.map(function (v) { return v / temp; }));
    if (topk > 0 && topk < p.length) { var order = p.map(function (v, i) { return i; }).sort(function (a, b) { return p[b] - p[a] || a - b; }), keep = order.slice(0, topk), z = 0; keep.forEach(function (i) { z += p[i]; }); p = p.map(function (v, i) { return keep.indexOf(i) >= 0 ? v / z : 0; }); }
    return { raw: raw, p: p };
  }
  function pick(p, mode, rnd) {
    if (mode === 'greedy') { var b = 0; p.forEach(function (v, i) { if (v > p[b]) b = i; }); return b; }
    var r = rnd(), c = 0, i; for (i = 0; i < p.length; i++) { c += p[i]; if (r < c && p[i] > 0) return i; }
    for (i = p.length - 1; i >= 0; i--) if (p[i] > 0) return i; return 0;
  }
  function generate(model, prompt, temp, topk, mode, seed) {
    var w = prompt.slice(), rnd = lcg(seed), steps = [];
    while (w.length < model.maxlen && w[w.length - 1] !== '.') { var d = dist(model, w, temp, topk), i = pick(d.p, mode, rnd); steps.push({ ctx: w.length, id: i, p: d.p[i] }); w.push(model.vocab[i]); }
    return { words: w, steps: steps };
  }
  Q.logic.tf5 = { generate: generate, dist: dist, pick: pick, lcg: lcg, PROMPTS: ['the', 'the cats', 'the cat near', 'the dogs near the rug'] };
  if (typeof document === 'undefined') return;
  Q.register('tf5', function (S) {
    var G = Q.logic.tf5, model = Q.models && Q.models.attn;
    if (!model) { S.narrate('The model file did not load', 'attn-model.js is missing.'); return; }
    var st = { prompt: 0, words: [], steps: [], rnd: null };
    S.select('prompt', 'Start with', G.PROMPTS.map(function (x, i) { return [String(i), x]; }), '0', function (v) { st.prompt = Number(v); reset(); });
    var cT = S.range('temp', 'Temperature', { min: -1, max: 0.4, step: 0.05, value: 0, log: true, fmt: function (v) { return v.toFixed(2); }, onChange: function () { show(); } });
    var cK = S.range('topk', 'Top-k (0 = off)', { min: 0, max: 10, value: 0, onChange: function () { show(); } });
    var cM = S.select('mode', 'Choose the next word by', [['greedy', 'Greedy (highest chance)'], ['sample', 'Sampling (random, seeded)']], 'greedy', function () { reset(); });
    var cS = S.range('seed', 'Random seed', { min: 1, max: 20, value: 7, onChange: function () { reset(); } });
    var cC = S.toggle('cache', 'Key-value cache on', true, function () { show(); });
    S.buttons([{ id: 'step', label: 'Write next word', primary: true, onClick: function () { step(); } }, { id: 'all', label: 'Write to the end', onClick: function () { while (step()); } }, { id: 'reset', label: 'Start again', onClick: function () { reset(); } }]);
    var cT1 = S.card('Text so far', S.view), chips = S.el('ul', { class: 'sim-chips', 'aria-label': 'Words so far' }); cT1.appendChild(chips);
    var cD = S.card('Chances for the next word (pale bar = before temperature and top-k)', S.view), bars = S.el('ul', { class: 'sim-bars', 'aria-label': 'Next-word chances' }); cD.appendChild(bars);
    var cH = S.card('Work done so far, in “word passes” (one word through the whole block)', S.view), tbl = S.el('table', { class: 'sim-table' }); cH.appendChild(tbl);
    var rA = S.readout('nc', 'Without cache'), rB = S.readout('c', 'With cache'), rC = S.readout('use', 'Work in use');
    function reset() { st.words = G.PROMPTS[st.prompt].split(' '); st.steps = []; st.rnd = G.lcg(cS.get()); show(); }
    function done() { return st.words.length >= model.maxlen || st.words[st.words.length - 1] === '.'; }
    function step() {
      if (done()) return false;
      var d = G.dist(model, st.words, cT.get(), cK.get()), i = G.pick(d.p, cM.get(), st.rnd);
      st.steps.push({ ctx: st.words.length, w: model.vocab[i], p: d.p[i] }); st.words.push(model.vocab[i]); show(); return !done();
    }
    function tot() { var a = 0, b = 0; st.steps.forEach(function (s, k) { a += s.ctx; b += k === 0 ? s.ctx : 1; }); return [a, b]; }
    function show() {
      var n0 = G.PROMPTS[st.prompt].split(' ').length;
      chips.innerHTML = ''; st.words.forEach(function (x, i) { chips.appendChild(S.el('li', { class: 'sim-chip c' + (i < n0 ? '0' : '1') }, [document.createTextNode(x), S.el('small', { text: String(i + 1) })])); });
      if (!done()) { var d = G.dist(model, st.words, cT.get(), cK.get()); Q.ui.bars(S, bars, model.vocab, d.p, -1, 6, d.raw); } else bars.innerHTML = '<li class="sim-none">The text is finished (it ended with a full stop, or the model’s longest text of 8 words is full).</li>';
      tbl.innerHTML = '<thead><tr><th>Step</th><th>Words run (no cache)</th><th>Words run (cache)</th><th>Chose</th></tr></thead>';
      var tb = S.el('tbody'); st.steps.forEach(function (s, k) { var tr = S.el('tr'); tr.appendChild(S.el('th', { text: String(k + 1) })); tr.appendChild(S.el('td', { text: String(s.ctx) })); tr.appendChild(S.el('td', { text: String(k === 0 ? s.ctx : 1) })); tr.appendChild(S.el('td', { text: s.w + ' (' + (s.p * 100).toFixed(0) + '%)' })); tb.appendChild(tr); }); tbl.appendChild(tb);
      var t = tot(); rA.set(String(t[0])); rB.set(String(t[1])); rC.set(String(cC.get() ? t[1] : t[0]));
      var last = st.steps[st.steps.length - 1];
      S.narrate(last ? 'Wrote “' + last.w + '” after ' + last.ctx + ' words' : 'Pick settings, then write the next word', 'Each step runs the whole text through the model and keeps only the scores of the last word. With the cache the model keeps the keys and values of earlier words, so after the first step only the new word is run (' + t[1] + ' word passes instead of ' + t[0] + ').');
      if (done() && st.steps.length >= 3 && t[0] - t[1] >= 5) S.challenge('cache');
    }
    reset();
  });
})();
