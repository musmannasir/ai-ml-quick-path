/* Simulation: k-fold cross-validation, fold by fold. Calculation: AIQPSim.logic.core and sup. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('cv', function (S) {
    var C = Q.logic.core, SU = Q.logic.sup, P = Q.plot, W = 380, H = 260, pad = 14, xr = [-1, 1], yr = [-1, 1], m = P.map(W, H, pad, xr, yr);
    var d = SU.makeData('blobs', 40, 21), st = { shown: 0 };
    var cK = S.range('folds', 'Number of folds', { min: 2, max: 10, step: 1, value: 5, onChange: function () { st.shown = 0; draw(); } });
    var cM = S.select('k', 'Model', [['1', 'k-nearest neighbours, k = 1'], ['3', 'k-nearest neighbours, k = 3']], '3', function () { st.shown = 0; draw(); });
    S.buttons([{ id: 'next', label: 'Test the next fold', primary: true, onClick: function () { st.shown = Math.min(cK.get(), st.shown + 1); draw(); } }, { id: 'all', label: 'Test every fold', onClick: function () { st.shown = cK.get(); draw(); } }, { id: 'reset', label: 'Start again', onClick: function () { st.shown = 0; draw(); } }]);
    var c1 = S.card('The data: ringed points are held out as the test fold', S.view), svg = S.svgEl(W, H, 'Scatter plot of points, with the points of the current test fold ringed.', c1);
    var c2 = S.card('Accuracy on each held-out fold', S.view), tbl = S.el('table', { class: 'sim-table' }); c2.appendChild(tbl);
    var rF = S.readout('f', 'Folds tested'), rM = S.readout('m', 'Average accuracy'), rS = S.readout('s', 'Lowest to highest');
    function draw() {
      var k = cK.get(), kk = Number(cM.get()), fold = C.folds(d.X.length, k, 7), sc = C.cvScores(d.X, d.y, k, 7, kk), cur = st.shown - 1;
      P.clear(svg); P.frame(S, svg, m, W, H, pad, xr, yr);
      d.X.forEach(function (q, i) { var held = cur >= 0 && fold[i] === cur; P.dot(S, svg, m.X(q[0]), m.Y(q[1]), d.y[i], cur >= 0 && !held); if (held) svg.appendChild(S.svg('circle', { cx: m.X(q[0]), cy: m.Y(q[1]), r: 8, class: 'cellbox' })); });
      tbl.innerHTML = '<thead><tr><th>Fold</th><th>Test points</th><th>Accuracy</th></tr></thead>'; var tb = S.el('tbody'), got = sc.slice(0, st.shown);
      sc.forEach(function (v, f) { var cnt = fold.filter(function (x) { return x === f; }).length, tr = S.el('tr'); tr.appendChild(S.el('th', { text: String(f + 1) })); tr.appendChild(S.el('td', { text: String(cnt) })); tr.appendChild(S.el('td', { text: f < st.shown ? (v * 100).toFixed(0) + '%' : '…' })); tb.appendChild(tr); }); tbl.appendChild(tb);
      var mean = got.length ? got.reduce(function (a, b) { return a + b; }, 0) / got.length : 0;
      rF.set(st.shown + ' of ' + k); rM.set(got.length ? (mean * 100).toFixed(0) + '%' : '-'); rS.set(got.length ? (Math.min.apply(null, got) * 100).toFixed(0) + '% to ' + (Math.max.apply(null, got) * 100).toFixed(0) + '%' : '-');
      S.narrate(cur >= 0 ? 'Fold ' + (cur + 1) + ' is held out; the model trains on the rest' : 'Press “Test the next fold”', 'Every point is used for testing exactly once and for training in all the other rounds. One single split could be lucky or unlucky; the spread across folds shows how much the score depends on which points were held out.');
      if (st.shown >= k && k >= 5) S.challenge('all');
    }
    draw();
  });
})();
