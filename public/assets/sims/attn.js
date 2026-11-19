/* Simulation: one attention layer, step by step, in a tiny model trained for this guide.
   The weights come from attn-model.js (written by examples/sim-attention/train_tiny.py). The page runs the real
   forward pass with them. The calculation is in AIQPSim.logic.attn so that scripts/check-sims.mjs can compare it
   with examples/sim-attention/attention_forward.py. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  Q.logic = Q.logic || {};

  var dot = function (a, b) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
  function vecMat(v, M) { var out = []; for (var j = 0; j < M[0].length; j++) { var s = 0; for (var i = 0; i < v.length; i++) s += v[i] * M[i][j]; out.push(s); } return out; }
  function softmax(a) { var m = Math.max.apply(null, a), e = a.map(function (x) { return Math.exp(x - m); }), z = 0; e.forEach(function (x) { z += x; }); return e.map(function (x) { return x / z; }); }

  function lnorm(x) { var n = x.length, mu = 0, v = 0, i; for (i = 0; i < n; i++) mu += x[i]; mu /= n; for (i = 0; i < n; i++) v += (x[i] - mu) * (x[i] - mu); var sd = Math.sqrt(v / n + 1e-5); return x.map(function (a) { return (a - mu) / sd; }); }
  // One Transformer block for one word: attention output "back" joins the word's own vector x (the add), is normalised,
  // goes through the feed-forward network, is added and normalised again. opts: noAttn, noFfn, noRes (switch parts off).
  function block(model, x, back, opts) {
    opts = opts || {};
    var s1 = opts.noAttn ? x.slice() : x.map(function (v, k) { return opts.noRes ? back[k] : v + back[k]; });
    var n1 = lnorm(s1);
    var hid = vecMat(n1, model.W1).map(function (v, i) { return Math.max(0, v + model.b1[i]); });
    var g = vecMat(hid, model.W2).map(function (v, i) { return v + model.b2[i]; });
    var s2 = opts.noFfn ? n1.slice() : n1.map(function (v, k) { return opts.noRes ? g[k] : v + g[k]; });
    var n2 = lnorm(s2);
    var logits = vecMat(n2, model.Wout).map(function (v, i) { return v + model.b[i]; });
    return { x: x, back: back, s1: s1, n1: n1, hid: hid, g: g, s2: s2, n2: n2, logits: logits, p: softmax(logits) };
  }

  // words -> everything the page shows. causal: hide later words. scaled: divide scores by sqrt(head size).
  function run(model, words, causal, scaled) {
    var T = words.length, dh = model.dh, ids = words.map(function (w) { return model.vocab.indexOf(w); });
    var X = ids.map(function (id, t) { return model.E[id].map(function (v, k) { return v + model.P[t][k]; }); });
    var heads = [];
    for (var h = 0; h < model.heads; h++) {
      var Qm = X.map(function (x) { return vecMat(x, model.Wq[h]); }), Km = X.map(function (x) { return vecMat(x, model.Wk[h]); }), Vm = X.map(function (x) { return vecMat(x, model.Wv[h]); });
      var raw = [], sc = [], A = [], O = [];
      for (var t = 0; t < T; t++) {
        var r = [], s = [], allowed = [];
        for (var j = 0; j < T; j++) { var d = dot(Qm[t], Km[j]); r.push(d); s.push(scaled ? d / Math.sqrt(dh) : d); if (!causal || j <= t) allowed.push(j); }
        var sm = softmax(allowed.map(function (j) { return s[j]; })), a = []; for (var j2 = 0; j2 < T; j2++) a.push(0);
        allowed.forEach(function (j, i) { a[j] = sm[i]; });
        var o = []; for (var k = 0; k < dh; k++) { var acc = 0; for (var j3 = 0; j3 < T; j3++) acc += a[j3] * Vm[j3][k]; o.push(acc); }
        raw.push(r); sc.push(s); A.push(a); O.push(o);
      }
      heads.push({ Q: Qm, K: Km, V: Vm, raw: raw, scores: sc, A: A, O: O });
    }
    var blk = X.map(function (x, t) {
      var C = []; heads.forEach(function (hd) { C = C.concat(hd.O[t]); });
      return block(model, x, vecMat(C, model.Wo), null);
    });
    var P = blk.map(function (b) { return b.p; });
    return { words: words, ids: ids, X: X, heads: heads, blk: blk, P: P };
  }
  Q.logic.attn = { run: run, block: block, lnorm: lnorm, vecMat: vecMat, softmax: softmax,
    SENTENCES: ['the cats near the box sleep .', 'the cat near the boxes sleeps .', 'the dog near the mat runs .', 'the birds near the rugs sit .', 'the dogs near the rug run .', 'the bird near the mats sits .'],
    DEFAULTS: { sentence: 0, head: 1, pos: 4 } };

  // ---- page part ----
  if (typeof document === 'undefined') return;
  var P = Q.logic.attn;
  // Shared by the Transformer series: rows of 8 numbers drawn as coloured cells (colour = sign, strength = size).
  Q.ui = {
    cw: 34, ch: 22, lw: 112,
    legend: function (S, parent) { var u = S.el('ul', { class: 'sim-legend' }); u.appendChild(S.el('li', { class: 'l0' }, [S.el('i'), document.createTextNode('positive number')])); u.appendChild(S.el('li', { class: 'l1' }, [S.el('i'), document.createTextNode('negative number')])); parent.appendChild(u); },
    vecRows: function (S, svg, rows, scale) {
      var u = Q.ui, lw = Math.max(64, Math.max.apply(null, rows.map(function (r) { return r.label.length; })) * 6.4 + 12), d = rows.length ? rows[0].vec.length : 8, W = lw + d * u.cw + 4, H = rows.length * (u.ch + 4) + 4;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      rows.forEach(function (r, i) {
        var y = 2 + i * (u.ch + 4), g = S.svg('g', { opacity: r.dim ? 0.25 : 1 });
        g.appendChild(S.svg('text', { x: lw - 6, y: y + u.ch / 2 + 3.5, 'text-anchor': 'end', 'font-weight': r.bold ? 700 : 400, text: r.label }));
        r.vec.forEach(function (v, k) {
          var op = Math.min(1, Math.abs(v) / (scale || 2.5)), a = 0.1 + 0.85 * op;
          g.appendChild(S.svg('rect', { x: lw + k * u.cw, y: y, width: u.cw - 2, height: u.ch, rx: 3, class: v >= 0 ? 'sv-f0' : 'sv-f1', 'fill-opacity': a.toFixed(3) }));
          g.appendChild(S.svg('text', { x: lw + k * u.cw + (u.cw - 2) / 2, y: y + u.ch / 2 + 3.5, 'text-anchor': 'middle', 'font-size': 10, class: a > 0.6 ? 'inv' : '', text: (Math.abs(v) < 0.05 ? '0.0' : v.toFixed(1)) }));
        });
        svg.appendChild(g);
      });
    },
    bars: function (S, ul, vocab, pr, pickId, n, raw) {
      ul.innerHTML = '';
      var order = pr.map(function (p, i) { return i; }).sort(function (a, b) { return pr[b] - pr[a] || a - b; }).slice(0, n || 5);
      order.forEach(function (i) {
        var li = S.el('li', { class: 'sim-bar' + (i === pickId ? ' pick' : '') }); li.appendChild(S.el('span', { class: 'sim-bar-l', text: vocab[i] }));
        var tr = S.el('span', { class: 'sim-bar-track' }); if (raw) { var rw = S.el('span', { class: 'sim-bar-fill raw' }); rw.style.width = (raw[i] * 100).toFixed(1) + '%'; tr.appendChild(rw); }
        var fl = S.el('span', { class: 'sim-bar-fill' }); fl.style.width = (pr[i] * 100).toFixed(1) + '%'; tr.appendChild(fl); li.appendChild(tr);
        li.appendChild(S.el('span', { class: 'sim-bar-v', text: pct(pr[i]) })); ul.appendChild(li);
      });
    }
  };
  var f2 = function (v) { return (Math.abs(v) < 0.005 ? '0.00' : v.toFixed(2)); };
  var pct = function (v) { return (v * 100).toFixed(v > 0 && v < 0.0095 ? 1 : 0) + '%'; };

  Q.register('attn', function (S) {
    var model = Q.models && Q.models.attn;
    if (!model) { S.narrate('The model file did not load', 'attn-model.js is missing, so this simulation cannot run.'); return; }
    var st = { s: 0, head: 0, pos: 4, causal: true, scaled: true };
    var cSent = S.select('sent', 'Sentence', P.SENTENCES.map(function (s, i) { return [String(i), s]; }), '0', function (v) { st.s = Number(v); draw(); });
    var cHead = S.select('head', 'Attention head', [['0', 'Head 1'], ['1', 'Head 2']], '0', function (v) { st.head = Number(v); draw(); });
    var cPos = S.select('pos', 'Word that is looking', [], '4', function (v) { st.pos = Number(v); draw(); });
    var cMask = S.toggle('mask', 'Hide later words (causal mask, as trained)', true, function (v) { st.causal = v; if (!v) st.unmasked = true; draw(); });
    var cScale = S.toggle('scale', 'Divide scores by √4 = 2 (as trained)', true, function (v) { st.scaled = v; draw(); });
    var cardWords = S.card('The sentence (position numbers start at 1)', S.view);
    var chips = S.el('ul', { class: 'sim-chips', 'aria-label': 'Words of the sentence' }); cardWords.appendChild(chips);
    var cardMap = S.card('Attention weights: each row is a word looking back; the weights in a row add up to 1', S.view);
    var svg = S.svgEl(372, 330, 'Grid of attention weights. Rows are the words doing the looking, columns are the words being looked at. Darker cells mean more attention.', cardMap);
    var cardNum = S.card('The arithmetic for the selected word', S.view);
    var tbl = S.el('table', { class: 'sim-table' }); cardNum.appendChild(tbl);
    var outP = S.el('p', { class: 'sim-card-t' }); cardNum.appendChild(outP);
    var cardPred = S.card('What the whole model predicts after this word (whole block, as trained)', S.view);
    var bars = S.el('ul', { class: 'sim-bars', 'aria-label': 'Next-word probabilities' }); cardPred.appendChild(bars);
    var rWho = S.readout('who', 'Looking word'), rMost = S.readout('most', 'Looks most at'), rTrue = S.readout('true', 'Chance on the real next word');

    function sentence() { return P.SENTENCES[st.s].split(' '); }
    function fillPos() {
      var w = sentence(), sel = cPos.input; sel.innerHTML = '';
      w.forEach(function (x, i) { if (i === w.length - 1) return; var o = S.el('option', { value: String(i), text: (i + 1) + ': ' + x }); if (i === st.pos) o.selected = true; sel.appendChild(o); });
      if (st.pos > w.length - 2) st.pos = w.length - 2;
    }
    function draw() {
      var w = sentence(), T = w.length;
      if (cPos.input.options.length !== T - 1) fillPos();
      cPos.input.value = String(st.pos);
      var view = P.run(model, w, st.causal, st.scaled), real = P.run(model, w, true, true), hd = view.heads[st.head];
      chips.innerHTML = '';
      w.forEach(function (x, i) { var li = S.el('li', { class: 'sim-chip c' + (i === st.pos ? '1' : '0') + (i === st.pos ? ' pick' : '') }); li.appendChild(document.createTextNode(x)); li.appendChild(S.el('small', { text: String(i + 1) })); chips.appendChild(li); });
      // heat map
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var L = 74, Tp = 62, cs = Math.min(40, Math.floor(280 / T));
      w.forEach(function (x, j) {
        var tx = S.svg('text', { x: L + j * cs + cs / 2, y: Tp - 8, 'text-anchor': 'start', transform: 'rotate(-40 ' + (L + j * cs + cs / 2) + ' ' + (Tp - 8) + ')', class: 't2', text: x }); svg.appendChild(tx);
        svg.appendChild(S.svg('text', { x: L - 6, y: Tp + j * cs + cs / 2 + 3.5, 'text-anchor': 'end', class: j === st.pos ? '' : 't2', 'font-weight': j === st.pos ? 700 : 400, text: (j + 1) + ' ' + x }));
      });
      for (var i = 0; i < T; i++) for (var j = 0; j < T; j++) {
        var a = hd.A[i][j], masked = st.causal && j > i;
        var cell = S.svg('rect', { x: L + j * cs, y: Tp + i * cs, width: cs - 1, height: cs - 1, rx: 3, class: masked ? 'grid' : 'sv-f0', 'fill-opacity': masked ? 0 : (0.06 + 0.88 * a).toFixed(3) });
        if (masked) cell.setAttribute('stroke-dasharray', '3 3');
        svg.appendChild(cell);
        if (!masked && a >= 0.005) svg.appendChild(S.svg('text', { x: L + j * cs + cs / 2 - 0.5, y: Tp + i * cs + cs / 2 + 3.5, 'text-anchor': 'middle', 'font-size': cs < 34 ? 9 : 10.5, class: a > 0.55 ? 'inv' : '', text: f2(a) }));
      }
      svg.appendChild(S.svg('rect', { x: L - 2, y: Tp + st.pos * cs - 2, width: T * cs + 3, height: cs + 3, rx: 4, class: 'cellbox' }));
      for (var r = 0; r < T - 1; r++) (function (r) {
        var hit = S.svg('rect', { x: 0, y: Tp + r * cs, width: L + T * cs, height: cs - 1, class: 'hit', tabindex: 0, role: 'button', 'aria-label': 'Show the arithmetic for position ' + (r + 1) + ', ' + w[r] });
        hit.addEventListener('click', function () { st.pos = r; draw(); });
        hit.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); st.pos = r; draw(); } });
        svg.appendChild(hit);
      })(r);
      // arithmetic table for the selected word
      var q = st.pos, qv = hd.Q[q];
      tbl.innerHTML = '<thead><tr><th>Looked at</th><th>Query · key</th><th>' + (st.scaled ? 'Score (÷ 2)' : 'Score') + '</th><th>Weight</th></tr></thead>';
      var tb = S.el('tbody');
      for (var j2 = 0; j2 < T; j2++) {
        var tr = S.el('tr'), masked2 = st.causal && j2 > q;
        tr.appendChild(S.el('th', { text: (j2 + 1) + ' ' + w[j2] }));
        tr.appendChild(S.el('td', { text: masked2 ? 'hidden' : f2(hd.raw[q][j2]) })); tr.appendChild(S.el('td', { text: masked2 ? 'hidden' : f2(hd.scores[q][j2]) })); tr.appendChild(S.el('td', { text: masked2 ? '0' : f2(hd.A[q][j2]) }));
        tb.appendChild(tr);
      }
      tbl.appendChild(tb);
      outP.textContent = 'Head ' + (st.head + 1) + ' hands on: ' + hd.O[q].map(f2).join(', ') + ' (each value vector times its weight, added up). Query of this word: ' + qv.map(f2).join(', ') + '.';
      // prediction
      var pr = real.P[q], order = pr.map(function (p, i) { return i; }).sort(function (a2, b2) { return pr[b2] - pr[a2]; }).slice(0, 5), nextWord = w[q + 1], nextId = model.vocab.indexOf(nextWord);
      bars.innerHTML = '';
      order.forEach(function (i) { var li = S.el('li', { class: 'sim-bar' + (i === nextId ? ' pick' : '') }); li.appendChild(S.el('span', { class: 'sim-bar-l', text: model.vocab[i] })); var tr2 = S.el('span', { class: 'sim-bar-track' }), fl = S.el('span', { class: 'sim-bar-fill' }); fl.style.width = (pr[i] * 100).toFixed(1) + '%'; tr2.appendChild(fl); li.appendChild(tr2); li.appendChild(S.el('span', { class: 'sim-bar-v', text: pct(pr[i]) })); bars.appendChild(li); });
      // the "chance on the real next word" is only meaningful when the real next word is the only one that fits; at the verb, the right NUMBER matters
      var verbS = ['sleeps', 'runs', 'sits'], verbP = ['sleep', 'run', 'sit'], isVerb = verbS.concat(verbP).indexOf(nextWord) >= 0;
      var agreeSet = verbS.indexOf(nextWord) >= 0 ? verbS : verbP, agree = 0; agreeSet.forEach(function (v) { agree += pr[model.vocab.indexOf(v)]; });
      rWho.set((q + 1) + ' ' + w[q]);
      var bj = 0; hd.A[q].forEach(function (v, j) { if (v > hd.A[q][bj]) bj = j; }); rMost.set((bj + 1) + ' ' + w[bj] + ' (' + pct(hd.A[q][bj]) + ')');
      rTrue.set(isVerb ? pct(agree) + ' on verbs that agree' : pct(pr[nextId]));
      var plural = /s$/.test(w[1]) && w[1] !== 'bus';
      var t1 = 'Head ' + (st.head + 1) + ', word ' + (q + 1) + ' "' + w[q] + '"';
      S.narrate(t1 + ' looks most at word ' + (bj + 1) + ' "' + w[bj] + '" (' + pct(hd.A[q][bj]) + ')', isVerb ? 'The next word is a verb, and it must agree in number with the subject "' + w[1] + '". After both heads, the model puts ' + pct(agree) + ' of its probability on verbs of the matching number.' : 'The weights in this row add up to 1. They decide how much of each earlier word’s value vector is mixed into this word.');
      if (q >= 2 && st.causal && st.scaled && plural && hd.A[q][1] >= 0.9) S.challenge('subject');
      if (!st.causal) { var fut = 0; for (var a3 = 0; a3 < T; a3++) for (var b3 = a3 + 1; b3 < T; b3++) fut += hd.A[a3][b3]; if (fut > 0.05) S.challenge('future'); }
    }
    S.onTheme(function () { /* colours come from CSS classes */ });
    fillPos(); draw();
  });
})();
