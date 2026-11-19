/* Simulation: how a language model writes text one token at a time.
   The model here is tiny and is NOT a neural network: it is a table of how often each word followed the previous
   one or two words in a small text written for this guide. The loop around it (scores, temperature, top-k, top-p,
   pick one, append, repeat) is the same loop a large language model runs. The calculation is in AIQPSim.logic.gen
   so that scripts/check-sims.mjs can compare it with examples/sim-tokens/gen_tokens.py. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  Q.logic = Q.logic || {};

  var CORPUS = 'the cat sat on the mat . the cat saw a dog . the dog ran to the cat . the dog sat on the rug . ' +
    'a bird sat on the roof . the bird saw the cat . the cat ran to the bird . the bird flew over the roof . ' +
    'the dog saw the bird . the bird flew to the tree . the cat sat on the rug . the dog ran to the tree . ' +
    'the cat saw the mouse . the mouse ran to the hole . the cat ran to the hole . the dog sat by the tree . ' +
    'a cat and a dog sat on the mat . the bird and the cat sat on the roof .' +
    ' the cat slept on the mat . the dog slept by the door . the bird sat on the tree . the cat walked to the door . the dog walked to the tree . the cat sat under the tree . the dog saw a cat . a bird saw the mouse . the mouse sat on the mat . the dog ran to the door . the cat saw the dog . a dog ran to a cat .';
  var WINDOW = 24;

  function lcg(seed) { var s = seed >>> 0; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  function split(text) { return String(text).toLowerCase().replace(/\./g, ' . ').split(/\s+/).filter(Boolean); }

  function train(text) {
    var toks = split(text), uni = {}, bi = {}, tri = {};
    var add = function (t, k, w) { (t[k] = t[k] || {})[w] = ((t[k] || {})[w] || 0) + 1; };
    toks.forEach(function (w, i) {
      uni[w] = (uni[w] || 0) + 1;
      if (i >= 1) add(bi, toks[i - 1], w);
      if (i >= 2) add(tri, toks[i - 2] + ' ' + toks[i - 1], w);
    });
    var size = Object.keys(uni).length; Object.keys(bi).forEach(function (k) { size += Object.keys(bi[k]).length; }); Object.keys(tri).forEach(function (k) { size += Object.keys(tri[k]).length; });
    return { uni: uni, bi: bi, tri: tri, vocab: Object.keys(uni).sort(), size: size, n: toks.length };
  }

  // Counts for the next token, from the longest context that was seen in the text.
  function counts(model, ctx) {
    var n = ctx.length, t = n >= 2 ? model.tri[ctx[n - 2] + ' ' + ctx[n - 1]] : null;
    if (t) return { c: t, used: 'the last two words' };
    var b = n >= 1 ? model.bi[ctx[n - 1]] : null;
    if (b) return { c: b, used: 'only the last word' };
    return { c: model.uni, used: 'no match, so overall word frequency' };
  }

  // Probabilities after temperature, top-k and top-p. Returns candidates sorted high to low:
  // [{t, raw (temperature 1, no filters), p (final, 0 when filtered out)}]
  function distribution(model, ctx, temp, topK, topP) {
    var cc = counts(model, ctx), c = cc.c;
    var list = Object.keys(c).map(function (t) { return { t: t, n: c[t] }; });
    list.sort(function (a, b) { return b.n - a.n || (a.t < b.t ? -1 : a.t > b.t ? 1 : 0); });
    var total = 0; list.forEach(function (e) { total += e.n; }); list.forEach(function (e) { e.raw = e.n / total; });
    var z = 0; list.forEach(function (e) { e.w = Math.pow(e.n, 1 / temp); z += e.w; }); list.forEach(function (e) { e.p = e.w / z; });
    var norm = function (k) { var s = 0; list.forEach(function (e, i) { if (i < k) s += e.p; }); list.forEach(function (e, i) { e.p = i < k ? e.p / s : 0; }); };
    if (topK > 0 && topK < list.length) norm(topK);
    if (topP < 1) { var cum = 0, keep = 0; for (var i = 0; i < list.length; i++) { cum += list[i].p; keep = i + 1; if (cum >= topP - 1e-12) break; } norm(keep); }
    return { list: list, used: cc.used };
  }
  function pick(list, mode, rnd) {
    if (mode === 'greedy') { var b = 0; list.forEach(function (e, i) { if (e.p > list[b].p) b = i; }); return b; }
    var r = rnd(), cum = 0;
    for (var i = 0; i < list.length; i++) { cum += list[i].p; if (r < cum && list[i].p > 0) return i; }
    for (var j = list.length - 1; j >= 0; j--) if (list[j].p > 0) return j;
    return 0;
  }
  function generate(model, prompt, n, temp, topK, topP, mode, seed) {
    var ctx = split(prompt), rnd = lcg(seed), out = [];
    for (var s = 0; s < n; s++) { var d = distribution(model, ctx, temp, topK, topP), i = pick(d.list, mode, rnd); ctx.push(d.list[i].t); out.push(d.list[i].t); }
    return out;
  }
  Q.logic.gen = { CORPUS: CORPUS, WINDOW: WINDOW, lcg: lcg, split: split, train: train, counts: counts, distribution: distribution, pick: pick, generate: generate,
    DEFAULTS: { prompt: 'the cat', temp: 1, topK: 0, topP: 1, mode: 'sample', seed: 7 } };

  // ---- page part ----
  if (typeof document === 'undefined') return;
  var P = Q.logic.gen;
  var pct = function (v) { return (v * 100).toFixed(v > 0 && v < 0.0095 ? 1 : 0) + '%'; };

  Q.register('gen', function (S) {
    var model = P.train(P.CORPUS), D = P.DEFAULTS;
    var st = { ctx: P.split(D.prompt), gen: 0, rnd: P.lcg(D.seed), last: null, seed: D.seed, lowPick: false };
    var cPrompt = S.text('prompt', 'Start of the text (words from the training text)', D.prompt, function () { restart(); }, 40);
    var cTemp = S.range('temp', 'Temperature', { min: 0.1, max: 2, step: 0.05, value: S.preset === 'hot' ? 1.8 : D.temp, fmt: function (v) { return v.toFixed(2); }, onChange: function () { preview(); } });
    var cK = S.range('k', 'Top-k (0 = off)', { min: 0, max: 10, step: 1, value: 0, onChange: function () { preview(); } });
    var cP = S.range('p', 'Top-p', { min: 0.1, max: 1, step: 0.05, value: 1, fmt: function (v) { return v.toFixed(2); }, onChange: function () { preview(); } });
    var cMode = S.select('mode', 'How to choose', [['sample', 'Sample at random (seeded)'], ['greedy', 'Greedy: always the top word']], S.preset === 'greedy' ? 'greedy' : D.mode, function () { restart(); });
    var cSeed = S.range('seed', 'Random seed', { min: 1, max: 99, step: 1, value: D.seed, onChange: function () { restart(); } });
    var B = S.buttons([
      { id: 'step', label: 'Write next token', primary: true, onClick: function () { step(); } },
      { id: 'auto', label: 'Write 12 tokens', onClick: function () { for (var i = 0; i < 12; i++) step(true); finish(); } },
      { id: 'reset', label: 'Start again', onClick: function () { restart(); } }
    ]);
    var cardCtx = S.card('Text so far (the model reads the last two words; real models read the whole window)', S.view);
    var chips = S.el('ul', { class: 'sim-chips', 'aria-label': 'Tokens so far' }); cardCtx.appendChild(chips);
    var meter = S.el('p', { class: 'sim-card-t' }); cardCtx.appendChild(meter);
    var cardBars = S.card('Next-token probabilities (faint bar: temperature 1 and no filters; solid bar: with your settings)', S.view);
    var bars = S.el('ul', { class: 'sim-bars', 'aria-label': 'Candidate next tokens' }); cardBars.appendChild(bars);
    var rGen = S.readout('gen', 'Tokens written'), rCand = S.readout('cand', 'Candidates kept'), rPick = S.readout('pick', 'Chosen word chance'), rSize = S.readout('size', 'Counts in the model');
    rSize.set(String(model.size));

    function words(arr) { return arr.join(' ').replace(/ \./g, '.'); }
    function restart() {
      var ws = P.split(cPrompt.get()), known = ws.filter(function (w) { return model.uni[w]; });
      st.ctx = known.length ? known : ['the']; st.gen = 0; st.last = null; st.rnd = P.lcg(cSeed.get());
      var bad = ws.filter(function (w) { return !model.uni[w]; });
      preview();
      S.narrate('Ready', bad.length ? 'Not in the training text, so ignored: ' + bad.join(', ') + '. Words it knows: ' + model.vocab.filter(function (w) { return w !== '.'; }).join(', ') + '.' : 'Press "Write next token". The model looks up which words followed the last words in its training text.');
    }
    function dist() { return P.distribution(model, st.ctx, cTemp.get(), cK.get(), cP.get()); }
    function preview() { st.last = null; draw(dist(), -1); }
    function step(quiet) {
      if (st.ctx.length >= P.WINDOW) { S.narrate('The context window is full', 'A real model has a limit like this too. Press "Start again" to begin a new text.'); return; }
      var d = dist(), i = P.pick(d.list, cMode.get(), st.rnd), e = d.list[i];
      st.ctx.push(e.t); st.gen++; st.last = { t: e.t, p: e.p, raw: e.raw };
      draw(d, i);
      if (!quiet) finish();
      if (cMode.get() === 'greedy' && st.gen >= 10) S.challenge('greedy');
      if (cTemp.get() >= 1.5 && e.raw < 0.15) S.challenge('hot');
    }
    function finish() {
      if (!st.last) return;
      S.narrate('Wrote "' + st.last.t + '" (' + pct(st.last.p) + ')', 'The last words were looked up, the counts became probabilities, ' + (cMode.get() === 'greedy' ? 'and the most likely word was taken.' : 'and one word was drawn at random in proportion to those probabilities.') + ' Then it was added to the text and the loop started again.');
    }
    function draw(d, pickIdx) {
      chips.innerHTML = '';
      st.ctx.forEach(function (w, i) {
        var li = S.el('li', { class: 'sim-chip ' + (i < st.promptLen0() ? 'c2' : 'c0') + (st.last && i === st.ctx.length - 1 ? ' pick' : '') }); li.appendChild(document.createTextNode(w)); chips.appendChild(li);
      });
      meter.textContent = 'Context window: ' + st.ctx.length + ' of ' + P.WINDOW + ' tokens used. Text: ' + words(st.ctx);
      bars.innerHTML = '';
      d.list.slice(0, 8).forEach(function (e, i) {
        var li = S.el('li', { class: 'sim-bar' + (i === pickIdx ? ' pick' : '') + (e.p === 0 ? ' out' : '') });
        li.appendChild(S.el('span', { class: 'sim-bar-l', text: e.t }));
        var tr = S.el('span', { class: 'sim-bar-track' }), raw = S.el('span', { class: 'sim-bar-fill raw' }), fill = S.el('span', { class: 'sim-bar-fill' });
        raw.style.width = (e.raw * 100).toFixed(1) + '%'; fill.style.width = (e.p * 100).toFixed(1) + '%'; tr.appendChild(raw); tr.appendChild(fill); li.appendChild(tr);
        li.appendChild(S.el('span', { class: 'sim-bar-v', text: e.p === 0 ? 'out' : pct(e.p) })); bars.appendChild(li);
      });
      var shown = d.list.length - 8; if (shown > 0) bars.appendChild(S.el('li', { class: 'sim-none', text: '+ ' + shown + ' more candidates, each smaller than these.' }));
      rGen.set(String(st.gen)); rCand.set(String(d.list.filter(function (e) { return e.p > 0; }).length) + ' of ' + d.list.length); rPick.set(st.last ? pct(st.last.p) : '-');
    }
    st.promptLen0 = function () { return st.ctx.length - st.gen; };
    S.onTheme(function () { /* all colours come from CSS classes */ });
    restart();
  });
})();
