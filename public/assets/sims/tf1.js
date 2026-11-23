/* Simulation: from words to numbers (Transformer series, part 1). Uses the model in attn-model.js and AIQPSim.logic.attn. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('tf1', function (S) {
    var A = Q.logic.attn, model = Q.models && Q.models.attn;
    if (!model) { S.narrate('The model file did not load', 'attn-model.js is missing.'); return; }
    var st = { s: 0, pos: true };
    S.select('sent', 'Sentence', A.SENTENCES.map(function (x, i) { return [String(i), x]; }), '0', function (v) { st.s = Number(v); draw(); });
    S.toggle('pos', 'Add position numbers (as trained)', true, function (v) { st.pos = v; draw(); });
    var c1 = S.card('1. Each word is looked up in a table: its row of 8 numbers (learned in training)', S.view), s1 = S.svgEl(368, 100, 'Rows of 8 numbers, one per word, taken from the word table.', c1);
    var c2 = S.card('2. Each place in the sentence has its own row of 8 numbers too', S.view), s2 = S.svgEl(368, 100, 'Rows of 8 numbers, one per position.', c2);
    var c3 = S.card('3. Added together: this is what goes into the first layer', S.view), s3 = S.svgEl(368, 100, 'Rows of 8 numbers: word plus position.', c3);
    Q.ui.legend(S, c3);
    var rA = S.readout('d', 'Distance between the two “the” rows'), rB = S.readout('n', 'Numbers per word');
    function draw() {
      var w = A.SENTENCES[st.s].split(' '), ids = w.map(function (x) { return model.vocab.indexOf(x); });
      var E = ids.map(function (id) { return model.E[id]; }), Pp = w.map(function (x, t) { return st.pos ? model.P[t] : model.P[t].map(function () { return 0; }); });
      var X = E.map(function (e, t) { return e.map(function (v, k) { return v + Pp[t][k]; }); });
      var lab = function (t) { return (t + 1) + ' ' + w[t]; };
      Q.ui.vecRows(S, s1, E.map(function (v, t) { return { label: lab(t), vec: v }; }));
      Q.ui.vecRows(S, s2, Pp.map(function (v, t) { return { label: 'place ' + (t + 1), vec: v, dim: !st.pos }; }));
      Q.ui.vecRows(S, s3, X.map(function (v, t) { return { label: lab(t), vec: v, bold: t === 0 || t === 3 }; }));
      var d = 0; for (var k = 0; k < 8; k++) d += Math.pow(X[0][k] - X[3][k], 2); d = Math.sqrt(d);
      rA.set(d.toFixed(2)); rB.set('8');
      S.narrate(st.pos ? 'Word row plus place row: the two “the” rows differ (distance ' + d.toFixed(2) + ')' : 'No position numbers: the two “the” rows are the same (distance ' + d.toFixed(2) + ')',
        st.pos ? 'The same word at place 1 and place 4 now gives different numbers, so the model can tell where a word sits.' : 'Without position numbers the word “the” at place 1 and at place 4 gives exactly the same 8 numbers. The layers after this one would see a bag of words with no order.');
      if (!st.pos && d < 1e-9) S.challenge('same');
    }
    draw();
  });
})();
