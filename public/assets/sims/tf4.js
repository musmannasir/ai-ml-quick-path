/* Simulation: one Transformer block, stage by stage (Transformer series, part 4). */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  var STAGES = [['1 Input (word + place)', 'The word’s own numbers from the first step.'], ['2 Attention output', 'What attention collected from the other words (both heads, joined and mixed by one more table of weights).'],
    ['3 Add', 'Input plus attention output. The “add” keeps the word’s own information while mixing in what it learned.'], ['4 Normalise', 'Rescale the 8 numbers to average 0 and spread 1, so no later step gets numbers that are too big or too small.'],
    ['5 Feed-forward', 'A small network (8 numbers, 16 hidden units, back to 8) that thinks about each word on its own.'], ['6 Add', 'Previous row plus the feed-forward output (the second add).'],
    ['7 Normalise (block output)', 'Rescale again. This row goes on to the output step and, in a large model, to the next block.']];
  Q.register('tf4', function (S) {
    var A = Q.logic.attn, model = Q.models && Q.models.attn;
    if (!model) { S.narrate('The model file did not load', 'attn-model.js is missing.'); return; }
    var st = { s: 0, pos: 4, stage: 7, noAttn: false, noFfn: false, noRes: false };
    S.select('sent', 'Sentence', A.SENTENCES.map(function (x, i) { return [String(i), x]; }), '0', function (v) { st.s = Number(v); fill(); draw(); });
    var cPos = S.select('pos', 'Word travelling through the block', [], '4', function (v) { st.pos = Number(v); draw(); });
    S.range('stage', 'Show stages up to', { min: 1, max: 7, value: 7, fmt: function (v) { return 'stage ' + v; }, onChange: function (v) { st.stage = v; draw(); } });
    S.toggle('att', 'Attention on', true, function (v) { st.noAttn = !v; draw(); });
    S.toggle('ffn', 'Feed-forward on', true, function (v) { st.noFfn = !v; draw(); });
    S.toggle('res', 'Add path on (as trained)', true, function (v) { st.noRes = !v; draw(); });
    var cv = S.card('The 8 numbers of one word, after each stage', S.view), svg = S.svgEl(368, 200, 'The 8 numbers of the selected word after each stage of the block.', cv);
    Q.ui.legend(S, cv);
    var cb = S.card('What the model predicts after this word', S.view), bars = S.el('ul', { class: 'sim-bars', 'aria-label': 'Next-word probabilities' }); cb.appendChild(bars);
    var rS = S.readout('mu', 'Row 7: average, spread'), rA = S.readout('ag', 'Chance on verbs that agree');
    function words() { return A.SENTENCES[st.s].split(' '); }
    function fill() { var w = words(), sel = cPos.input; sel.innerHTML = ''; w.forEach(function (x, i) { if (i < w.length - 1) sel.appendChild(S.el('option', { value: String(i), text: (i + 1) + ': ' + x })); }); if (st.pos > w.length - 2) st.pos = w.length - 2; sel.value = String(st.pos); }
    function draw() {
      var w = words(), q = st.pos, r = A.run(model, w, true, true), C = []; r.heads.forEach(function (h) { C = C.concat(h.O[q]); });
      var b = A.block(model, r.X[q], A.vecMat(C, model.Wo), { noAttn: st.noAttn, noFfn: st.noFfn, noRes: st.noRes });
      var rows = [b.x, b.back, b.s1, b.n1, b.g, b.s2, b.n2];
      Q.ui.vecRows(S, svg, rows.map(function (v, i) { return { label: STAGES[i][0], vec: v, dim: i + 1 > st.stage, bold: i + 1 === st.stage }; }), 3);
      var mu = b.n2.reduce(function (a, v) { return a + v; }, 0) / 8, sd = Math.sqrt(b.n2.reduce(function (a, v) { return a + (v - mu) * (v - mu); }, 0) / 8);
      var nextWord = w[q + 1], verbS = ['sleeps', 'runs', 'sits'], verbP = ['sleep', 'run', 'sit'], isVerb = verbS.concat(verbP).indexOf(nextWord) >= 0, set = verbS.indexOf(nextWord) >= 0 ? verbS : verbP, ag = 0;
      set.forEach(function (x) { ag += b.p[model.vocab.indexOf(x)]; });
      Q.ui.bars(S, bars, model.vocab, b.p, model.vocab.indexOf(nextWord), 5);
      rS.set(mu.toFixed(1) + ', ' + sd.toFixed(1)); rA.set(isVerb ? (ag * 100).toFixed(0) + '%' : 'not a verb slot');
      var parts = []; if (st.noAttn) parts.push('attention'); if (st.noFfn) parts.push('feed-forward'); if (st.noRes) parts.push('the add path');
      S.narrate('Stage ' + st.stage + ': ' + STAGES[st.stage - 1][0].slice(2), STAGES[st.stage - 1][1] + (parts.length ? ' Switched off: ' + parts.join(', ') + '. The model was trained with all of them on, so this shows what breaks, not a better model.' : ''));
      if (isVerb && st.noRes && ag < 0.6) S.challenge('nores');
    }
    fill(); draw();
  });
})();
