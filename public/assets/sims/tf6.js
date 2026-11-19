/* Simulation: training (every position at once) against using (one word at a time). Transformer series, part 6. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  Q.logic = Q.logic || {};
  // Loss of each position when the model is shown the real sentence: -ln(chance on the real next word).
  function losses(model, words) {
    var A = Q.logic.attn, r = A.run(model, words, true, true), out = [];
    for (var t = 0; t < words.length - 1; t++) out.push({ ctx: words.slice(0, t + 1).join(' '), next: words[t + 1], p: r.P[t][model.vocab.indexOf(words[t + 1])] });
    out.forEach(function (o) { o.loss = -Math.log(o.p + 1e-12); });
    return out;
  }
  Q.logic.tf6 = { losses: losses };
  if (typeof document === 'undefined') return;
  Q.register('tf6', function (S) {
    var A = Q.logic.attn, G = Q.logic.tf6, model = Q.models && Q.models.attn;
    if (!model) { S.narrate('The model file did not load', 'attn-model.js is missing.'); return; }
    var st = { s: 0, mode: 'train', k: 0 };
    S.select('sent', 'Sentence', A.SENTENCES.map(function (x, i) { return [String(i), x]; }), '0', function (v) { st.s = Number(v); st.k = 0; draw(); });
    S.select('mode', 'Mode', [['train', 'Training: all positions at once'], ['use', 'Using: one word at a time']], 'train', function (v) { st.mode = v; st.k = 0; draw(); });
    S.buttons([{ id: 'next', label: 'Next word (using mode)', onClick: function () { if (st.mode === 'use') { st.k++; draw(); } } }, { id: 'rs', label: 'Start again', onClick: function () { st.k = 0; draw(); } }]);
    var c = S.card('One row per position: what the model sees, what it must predict, and how wrong it was', S.view), tbl = S.el('table', { class: 'sim-table' }); c.appendChild(tbl);
    var rA = S.readout('p', 'Passes through the model'), rB = S.readout('n', 'Words predicted'), rC = S.readout('l', 'Average loss'), rD = S.readout('g', 'Loss of random guessing');
    function draw() {
      var w = A.SENTENCES[st.s].split(' '), L = G.losses(model, w), n = L.length, shown = st.mode === 'train' ? n : Math.min(st.k, n);
      tbl.innerHTML = '<thead><tr><th>Position</th><th>Model sees</th><th>Must predict</th><th>Chance on it</th><th>Loss</th></tr></thead>';
      var tb = S.el('tbody'), sum = 0;
      L.forEach(function (o, t) { var on = t < shown; if (on) sum += o.loss; var tr = S.el('tr'); tr.appendChild(S.el('th', { text: String(t + 1) })); tr.appendChild(S.el('td', { text: on ? o.ctx : '…' })); tr.appendChild(S.el('td', { text: on ? o.next : '…' })); tr.appendChild(S.el('td', { text: on ? (o.p * 100).toFixed(0) + '%' : '…' })); tr.appendChild(S.el('td', { text: on ? o.loss.toFixed(2) : '…' })); tb.appendChild(tr); });
      tbl.appendChild(tb);
      rA.set(st.mode === 'train' ? '1' : String(shown)); rB.set(String(shown)); rC.set(shown ? (sum / shown).toFixed(2) : '-'); rD.set(Math.log(model.vocab.length).toFixed(2));
      S.narrate(st.mode === 'train' ? 'Training: all ' + n + ' predictions come out of one pass' : 'Using: ' + shown + ' of ' + n + ' words written, one pass each',
        st.mode === 'train' ? 'The whole sentence goes in at once. The causal mask hides later words from each position, so every position can safely predict its own next word in the same pass. The loss is the average of the rows.' : 'When the model writes, the next word does not exist yet, so each word needs the pass before it. This is why training can use many positions in parallel and generation cannot.');
      if (st.mode === 'use' && shown >= n) S.challenge('serial');
    }
    draw();
  });
})();
