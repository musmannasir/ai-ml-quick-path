/* Simulation: how text becomes tokens (byte-pair encoding, learned live on a small bundled text).
   The calculation is in AIQPSim.logic.bpe so that scripts/check-sims.mjs can compare it with examples/sim-tokens/bpe_tokens.py. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  Q.logic = Q.logic || {};

  // A small text written for this guide. Word counts matter, because the most common pair is merged first.
  var CORPUS = 'the lower tower is lower than the lowest tower the newer house is newer than the newest house ' +
    'a wider road is wider than the widest road the cat is sitting on the mat the dog is sitting near the cat ' +
    'the cat is walking and the dog is walking the lower the newer the wider the lowest the newest the widest';
  var END = '_';

  function wordCounts(text) {
    var m = {}, order = [];
    text.split(/\s+/).forEach(function (w) { if (!w) return; if (!(w in m)) { m[w] = 0; order.push(w); } m[w]++; });
    return order.map(function (w) { return { w: w, n: m[w] }; });
  }

  // Learn up to `max` merges. Ties go to the pair that sorts first, so every run gives the same list.
  function learn(text, max) {
    var words = wordCounts(text).map(function (e) { return { syms: e.w.split('').concat([END]), n: e.n }; });
    var base = {}; words.forEach(function (e) { e.syms.forEach(function (s) { base[s] = 1; }); });
    var baseList = Object.keys(base).sort(), merges = [];
    for (var m = 0; m < max; m++) {
      var counts = {};
      words.forEach(function (e) { for (var i = 0; i + 1 < e.syms.length; i++) { var k = e.syms[i] + '\u0000' + e.syms[i + 1]; counts[k] = (counts[k] || 0) + e.n; } });
      var best = null, bc = 0;
      Object.keys(counts).sort().forEach(function (k) { if (counts[k] > bc) { bc = counts[k]; best = k; } });
      if (best === null || bc < 2) break;
      var ab = best.split('\u0000');
      merges.push({ a: ab[0], b: ab[1], sym: ab[0] + ab[1], count: bc });
      words.forEach(function (e) { e.syms = joinPair(e.syms, ab[0], ab[1]); });
    }
    return { base: baseList, merges: merges };
  }
  function joinPair(syms, a, b) {
    var out = [];
    for (var i = 0; i < syms.length; i++) { if (i + 1 < syms.length && syms[i] === a && syms[i + 1] === b) { out.push(a + b); i++; } else out.push(syms[i]); }
    return out;
  }
  function segment(word, merges, k) {
    var s = word.split('').concat([END]);
    for (var i = 0; i < k && i < merges.length; i++) s = joinPair(s, merges[i].a, merges[i].b);
    return s;
  }
  // Text to tokens: lower-case, letters and apostrophes kept, everything else treated as a space.
  function clean(text) { return String(text).toLowerCase().replace(/_/g, ' ').replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function tokenise(text, model, k) {
    var ids = {}; model.base.forEach(function (s, i) { ids[s] = i; }); model.merges.forEach(function (m, i) { ids[m.sym] = model.base.length + i; });
    var out = [];
    clean(text).split(' ').forEach(function (w, wi) {
      if (!w) return;
      segment(w, model.merges, k).forEach(function (t) {
        var id = (t in ids && (ids[t] < model.base.length || ids[t] - model.base.length < k)) ? ids[t] : null;
        out.push({ t: t, id: id, w: wi });
      });
    });
    return out;
  }
  Q.logic.bpe = { CORPUS: CORPUS, learn: learn, segment: segment, tokenise: tokenise, clean: clean, wordCounts: wordCounts,
    DEFAULTS: { text: 'the lowest newer widest cat', merges: 12 } };

  // ---- page part ----
  if (typeof document === 'undefined') return;
  var P = Q.logic.bpe;
  var show = function (t) { return t.replace(/_$/, '·').replace(/_/g, '·'); };

  Q.register('bpe', function (S) {
    var model = P.learn(P.CORPUS, 60), maxK = model.merges.length, st = { k: P.DEFAULTS.merges, text: P.DEFAULTS.text, last: -1 };
    if (S.preset === 'zero') st.k = 0;
    if (st.k > maxK) st.k = maxK;
    var cText = S.text('text', 'Text to split into tokens', st.text, function (v) { st.text = v; draw(); }, 80);
    var cK = S.range('k', 'Merges learned', { min: 0, max: maxK, step: 1, value: st.k, onChange: function (v) { st.last = -1; st.k = v; draw(); } });
    S.buttons([
      { id: 'next', label: 'Learn one more merge', primary: true, onClick: function () { if (st.k < maxK) { st.k++; st.last = st.k - 1; cK.set(st.k); draw(); } } },
      { id: 'zero', label: 'Start again (0 merges)', onClick: function () { st.k = 0; st.last = -1; cK.set(0); draw(); } }
    ]);
    var row = S.row();
    var cardTok = S.card('Your text as tokens (a dot marks the end of a word; the number is the token id)', S.view);
    var chips = S.el('ul', { class: 'sim-chips', 'aria-label': 'Tokens of your text' }); cardTok.appendChild(chips);
    var rTok = S.readout('tok', 'Tokens'), rCh = S.readout('ch', 'Characters'), rCpt = S.readout('cpt', 'Characters per token'), rV = S.readout('v', 'Vocabulary size');
    var cardM = S.card('Merges learned so far (most common pair first)', row);
    var olM = S.el('ol', { class: 'sim-merges' }); cardM.appendChild(olM);
    var cardC = S.card('The training text, split with these merges (most common words)', row);
    var tbl = S.el('table', { class: 'sim-table' }); cardC.appendChild(tbl);

    function draw() {
      var toks = P.tokenise(st.text, model, st.k);
      chips.innerHTML = '';
      toks.forEach(function (t) {
        var li = S.el('li', { class: 'sim-chip c' + (t.w % 4) }); li.appendChild(document.createTextNode(show(t.t)));
        li.appendChild(S.el('small', { text: t.id === null ? 'no id' : String(t.id) })); chips.appendChild(li);
      });
      if (!toks.length) chips.appendChild(S.el('li', { text: 'Type some letters above.' }));
      var chars = P.clean(st.text).length;
      rTok.set(String(toks.length)); rCh.set(String(chars)); rCpt.set(toks.length ? (chars / toks.length).toFixed(2) : '-'); rV.set(String(model.base.length + st.k));
      olM.innerHTML = '';
      model.merges.slice(0, st.k).forEach(function (m, i) {
        var li = S.el('li', { text: show(m.a) + ' + ' + show(m.b) + ' → ' + show(m.sym) + '   (seen ' + m.count + ' times)' });
        if (i === st.last) li.className = 'sim-last'; olM.appendChild(li);
      });
      if (!st.k) olM.appendChild(S.el('li', { class: 'sim-none', text: 'None yet: every letter is its own token.' }));
      // Top words of the training text
      var counts = P.wordCounts(P.CORPUS).sort(function (a, b) { return b.n - a.n || (a.w < b.w ? -1 : 1); }).slice(0, 8);
      tbl.innerHTML = '<thead><tr><th>Word</th><th>Times</th><th>Tokens</th></tr></thead>';
      var tb = S.el('tbody'); counts.forEach(function (e) { var tr = S.el('tr'); tr.appendChild(S.el('th', { text: e.w })); tr.appendChild(S.el('td', { text: String(e.n) })); tr.appendChild(S.el('td', { text: P.segment(e.w, model.merges, st.k).map(show).join(' | ') })); tb.appendChild(tr); }); tbl.appendChild(tb);
      if (st.last >= 0 && model.merges[st.last]) { var m = model.merges[st.last]; S.narrate('Merge ' + (st.last + 1) + ': ' + show(m.a) + ' + ' + show(m.b) + ' → ' + show(m.sym), 'This pair was the most common one left in the training text (' + m.count + ' times), so it becomes a single token.'); }
      else S.narrate(st.k ? st.k + ' merges learned' : 'No merges yet', st.k ? 'Common letter groups are now single tokens, so the same text needs fewer tokens. Rare words still break into pieces.' : 'Every letter is a separate token. Each merge joins the most common neighbouring pair.');
      var nt = P.segment('newest', model.merges, st.k).length;
      if (nt <= 2) S.challenge('short');
      if (toks.some(function (t) { return t.id === null; })) S.challenge('unseen');
    }
    S.onTheme(draw);
    draw();
  });
})();
