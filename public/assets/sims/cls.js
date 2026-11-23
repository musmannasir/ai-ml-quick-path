/* Simulation: classification threshold, confusion matrix and ROC curve. Calculation: AIQPSim.logic.core and sup. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('cls', function (S) {
    var C = Q.logic.core, SU = Q.logic.sup, P = Q.plot, W = 380, H = 280, pad = 14, xr = [-1, 1], yr = [-1, 1], m = P.map(W, H, pad, xr, yr);
    var d = C.clsData(11, 100), model = SU.fitLogistic(d, 300), p = d.X.map(function (q) { return model(q); }), roc = C.roc(p, d.y);
    var cT = S.range('thr', 'Decision threshold (call it class 1 at or above)', { min: 0.05, max: 0.95, step: 0.05, value: 0.5, fmt: function (v) { return v.toFixed(2); }, onChange: function () { draw(); } });
    var cm = S.card('Points and the decision boundary (shaded = predicted class 1)', S.view), svg = S.svgEl(W, H, 'Scatter plot of two classes of points with the region predicted as class 1 shaded.', cm);
    var row = S.row(), c1 = S.card('Confusion matrix', row), tbl = S.el('table', { class: 'sim-table' }); c1.appendChild(tbl);
    var c2 = S.card('ROC curve (one dot = the threshold you chose)', row), rs = S.svgEl(200, 200, 'ROC curve: true positive rate against false positive rate, with the chosen threshold marked.', c2);
    var rP = S.readout('p', 'Precision'), rR = S.readout('r', 'Recall'), rA = S.readout('a', 'Accuracy'), rU = S.readout('u', 'Area under ROC');
    function draw() {
      var t = cT.get(), c = C.confusion(p, d.y, t), prec = c.tp / Math.max(1, c.tp + c.fp), rec = c.tp / Math.max(1, c.tp + c.fn), acc = (c.tp + c.tn) / d.y.length;
      P.clear(svg); var g, i, j;
      for (i = 0; i < 24; i++) for (j = 0; j < 24; j++) { var x = -1 + (i + 0.5) / 12, y = -1 + (j + 0.5) / 12; if (model([x, y]) >= t) svg.appendChild(S.svg('rect', { x: m.X(x - 1 / 24), y: m.Y(y + 1 / 24), width: (W - 2 * pad) / 24 + 0.5, height: (H - 2 * pad) / 24 + 0.5, class: 'sv-f0', 'fill-opacity': 0.13 })); }
      P.frame(S, svg, m, W, H, pad, xr, yr);
      d.X.forEach(function (q, k) { P.dot(S, svg, m.X(q[0]), m.Y(q[1]), d.y[k], false); });
      tbl.innerHTML = '<thead><tr><th></th><th>Predicted 1</th><th>Predicted 0</th></tr></thead><tbody><tr><th>Really 1</th><td>' + c.tp + ' (true positive)</td><td>' + c.fn + ' (missed)</td></tr><tr><th>Really 0</th><td>' + c.fp + ' (false alarm)</td><td>' + c.tn + ' (true negative)</td></tr></tbody>';
      P.clear(rs); var X = function (v) { return 24 + v * 168; }, Y = function (v) { return 176 - v * 160; };
      rs.appendChild(S.svg('line', { x1: X(0), y1: Y(0), x2: X(1), y2: Y(1), class: 'grid' })); rs.appendChild(S.svg('rect', { x: X(0), y: Y(1), width: 168, height: 160, class: 'axis' }));
      var dd = ''; roc.pts.forEach(function (q, k) { dd += (k ? 'L' : 'M') + X(q[0]).toFixed(1) + ' ' + Y(q[1]).toFixed(1); }); rs.appendChild(S.svg('path', { d: dd, class: 'edge sv-s0', fill: 'none', 'stroke-width': 2.2 }));
      rs.appendChild(S.svg('circle', { cx: X(c.fp / (c.fp + c.tn)), cy: Y(c.tp / (c.tp + c.fn)), r: 6, class: 'sv-f1' }));
      rs.appendChild(S.svg('text', { x: 108, y: 196, 'text-anchor': 'middle', class: 't2', text: 'false alarm rate' })); rs.appendChild(S.svg('text', { x: 4, y: 12, class: 't2', text: 'recall' }));
      rP.set((prec * 100).toFixed(0) + '%'); rR.set((rec * 100).toFixed(0) + '%'); rA.set((acc * 100).toFixed(0) + '%'); rU.set(roc.auc.toFixed(2));
      S.narrate('Threshold ' + t.toFixed(2) + ': ' + c.fp + ' false alarms and ' + c.fn + ' missed', 'Lowering the threshold catches more real class 1 points (higher recall) but raises more false alarms (lower precision). The model is the same; only the line we draw on its scores moves. The ROC curve shows every threshold at once.');
      if (rec >= 0.9) S.challenge('recall');
      if (prec >= 0.95 && rec >= 0.5) S.challenge('precision');
    }
    draw();
  });
})();
