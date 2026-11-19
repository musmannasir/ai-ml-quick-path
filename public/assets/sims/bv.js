/* Simulation: bias, variance and learning curves with polynomial fits. Calculation: AIQPSim.logic.core. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('bv', function (S) {
    var C = Q.logic.core, P = Q.plot, W = 380, H = 240, pad = 20, xr = [-1, 1], yr = [-1.8, 1.8], m = P.map(W, H, pad, xr, yr);
    var cD = S.range('deg', 'Degree of the curve (how wiggly it may be)', { min: 1, max: 9, step: 1, value: 1, onChange: function () { draw(); } });
    var cN = S.range('n', 'Training points', { min: 10, max: 60, step: 5, value: 15, onChange: function () { draw(); } });
    var cE = S.range('noise', 'Noise in the data', { min: 0, max: 0.6, step: 0.05, value: 0.25, fmt: function (v) { return v.toFixed(2); }, onChange: function () { draw(); } });
    var c1 = S.card('Training points (dots), the true curve (grey) and the fitted curve', S.view), svg = S.svgEl(W, H, 'Scatter of training points with the true sine curve and a fitted polynomial curve.', c1);
    var c2 = S.card('Error on the training points and on new points, for every degree (capped at 1)', S.view), sv2 = S.svgEl(W, 170, 'Line chart of training error and test error against polynomial degree.', c2);
    var u = S.el('ul', { class: 'sim-legend' }); [['l0', 'Training error'], ['l1', 'Error on new points']].forEach(function (x) { u.appendChild(S.el('li', { class: x[0] }, [S.el('i'), document.createTextNode(x[1])])); }); c2.appendChild(u);
    var rT = S.readout('tr', 'Training error'), rE = S.readout('te', 'Error on new points'), rG = S.readout('g', 'Gap');
    function draw() {
      var n = cN.get(), noise = cE.get(), deg = cD.get(), tr = C.polyData(3, n, noise), te = C.polyData(4, 200, noise), w = C.polyFit(tr.X, tr.Y, deg);
      P.clear(svg); P.frame(S, svg, m, W, H, pad, xr, yr);
      var d1 = '', d2 = '', k; for (k = 0; k <= 100; k++) { var x = -1 + k / 50; d1 += (k ? 'L' : 'M') + m.X(x).toFixed(1) + ' ' + m.Y(Math.sin(3 * x)).toFixed(1); var y = Math.max(yr[0], Math.min(yr[1], C.polyAt(w, x))); d2 += (k ? 'L' : 'M') + m.X(x).toFixed(1) + ' ' + m.Y(y).toFixed(1); }
      svg.appendChild(S.svg('path', { d: d1, class: 'grid', fill: 'none', 'stroke-width': 2.5 })); svg.appendChild(S.svg('path', { d: d2, class: 'edge sv-s0', fill: 'none', 'stroke-width': 2.4 }));
      tr.X.forEach(function (x, i) { svg.appendChild(S.svg('circle', { cx: m.X(x), cy: m.Y(tr.Y[i]), r: 3.6, class: 'sv-f1' })); });
      var a = C.polyMse(w, tr.X, tr.Y), b = C.polyMse(w, te.X, te.Y);
      P.clear(sv2); var X = function (g) { return 30 + (g - 1) / 8 * 330; }, Y = function (v) { return 150 - Math.min(1, v) * 135; }, da = '', db = '';
      sv2.appendChild(S.svg('line', { x1: 30, y1: 150, x2: 366, y2: 150, class: 'axis' }));
      for (var g = 1; g <= 9; g++) { var ww = C.polyFit(tr.X, tr.Y, g); da += (g > 1 ? 'L' : 'M') + X(g).toFixed(1) + ' ' + Y(C.polyMse(ww, tr.X, tr.Y)).toFixed(1); db += (g > 1 ? 'L' : 'M') + X(g).toFixed(1) + ' ' + Y(C.polyMse(ww, te.X, te.Y)).toFixed(1); sv2.appendChild(S.svg('text', { x: X(g), y: 164, 'text-anchor': 'middle', class: 't2', text: String(g) })); }
      sv2.appendChild(S.svg('path', { d: da, class: 'edge sv-s0', fill: 'none', 'stroke-width': 2.2 })); sv2.appendChild(S.svg('path', { d: db, class: 'edge sv-s1', fill: 'none', 'stroke-width': 2.2 }));
      sv2.appendChild(S.svg('line', { x1: X(deg), y1: 10, x2: X(deg), y2: 150, class: 'grid' }));
      rT.set(a.toFixed(3)); rE.set(b < 1000 ? b.toFixed(3) : 'huge'); rG.set(b < 1000 ? (b / Math.max(a, 1e-9)).toFixed(1) + '×' : 'huge');
      var title = deg <= 1 ? 'Too stiff: both errors are high (bias)' : b > a * 3 ? 'Too wiggly: it fits the noise, so new points do badly (variance)' : 'A reasonable fit: training and new-point errors are close';
      S.narrate(title, 'Training error keeps falling as the curve gets more wiggly, but error on new points falls and then rises. More training points steady a wiggly curve, and more noise makes the gap worse.');
      if (deg >= 7 && n === 15 && b > a * 3) S.challenge('overfit');
      if (deg >= 7 && n >= 50 && b < a * 1.5) S.challenge('more');
    }
    draw();
  });
})();
