/* Simulation: perplexity of a tiny language model, and one benchmark question scored four ways. Calculation: AIQPSim.logic.ops and llm. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  var NAMES = { exact: 'Exact match', normalised: 'Exact match after tidying', contains: 'Contains the answer', f1: 'Word overlap (F1)' };
  Q.register('ppl', function (S) {
    var O = Q.logic.ops, L = Q.logic.llm, N = L.trainLen(), pts = [10, 20, 40, 60, 80, 100, 120, 140, N], curve = pts.map(function (n) { return [n, Math.exp(L.holdoutLoss(n))]; });
    var cN = S.range('n', 'Words of text the model has read', { min: 10, max: N, step: 1, value: 10, onChange: function () { draw(); } });
    var cK = S.select('kind', 'Score the answers by', Object.keys(NAMES).map(function (k) { return [k, NAMES[k]]; }), 'contains', function () { draw(); });
    var c1 = S.card('Perplexity on text the model never read (lower is better)', S.view), svg = S.svgEl(380, 150, 'Line chart of perplexity against words read.', c1);
    var c2 = S.card('One question, “What is the capital of France?”, with four model answers (gold answer: Paris)', S.view), tbl = S.el('table', { class: 'sim-table' }); c2.appendChild(tbl);
    var rP = S.readout('p', 'Perplexity'), rS = S.readout('s', 'Answers marked right');
    function draw() {
      var n = cN.get(), ppx = Math.exp(L.holdoutLoss(n)); while (svg.firstChild) svg.removeChild(svg.firstChild); var X = function (v) { return 34 + (Math.log(v) - Math.log(10)) / (Math.log(N) - Math.log(10)) * 330; }, Y = function (v) { return 130 - v / 26 * 115; };
      svg.appendChild(S.svg('line', { x1: 34, y1: 130, x2: 370, y2: 130, class: 'axis' })); svg.appendChild(S.svg('line', { x1: 34, y1: 12, x2: 34, y2: 130, class: 'axis' }));
      var d = ''; curve.forEach(function (c, i) { d += (i ? 'L' : 'M') + X(c[0]).toFixed(1) + ' ' + Y(c[1]).toFixed(1); }); svg.appendChild(S.svg('path', { d: d, class: 'edge sv-s0', fill: 'none', 'stroke-width': 2.2 })); svg.appendChild(S.svg('circle', { cx: X(n), cy: Y(ppx), r: 6, class: 'sv-f1' })); svg.appendChild(S.svg('text', { x: 4, y: 20, class: 't2', 'font-size': 9, text: 'perplexity' })); svg.appendChild(S.svg('text', { x: 370, y: 146, 'text-anchor': 'end', class: 't2', 'font-size': 9, text: 'words read (log scale)' }));
      var kind = cK.get(); tbl.innerHTML = '<thead><tr><th>Model answer</th><th>Score (' + NAMES[kind] + ')</th></tr></thead>'; var tb = S.el('tbody'), tot = 0;
      O.ANSWERS.forEach(function (a) { var v = O.score(kind, a[0], a[1]); tot += v; var tr = S.el('tr'); tr.appendChild(S.el('th', { text: '“' + a[0] + '”' })); tr.appendChild(S.el('td', { text: v.toFixed(2) })); tb.appendChild(tr); }); tbl.appendChild(tb);
      rP.set(ppx.toFixed(1)); rS.set(tot.toFixed(2) + ' of 4');
      S.narrate('Perplexity ' + ppx.toFixed(1) + '; ' + NAMES[kind] + ' gives ' + tot.toFixed(2) + ' of 4', 'Perplexity says how many equally likely words the model is torn between at each step, so lower is better. It measures how well a model predicts text, not whether its answers are useful. For answers, the way of scoring changes the result: strict exact match marks “The capital is Paris.” wrong, while a looser rule marks it right but also lets some wrong answers through. State how you scored.');
      if (ppx <= 8) S.challenge('low'); if (kind === 'exact' && tot < 2) S.challenge('strict');
    }
    draw();
  });
})();
