/* Simulation: PCA as the axis that keeps the most spread. Calculation: AIQPSim.logic.core. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('pca', function (S) {
    var C = Q.logic.core, P = Q.plot, W = 380, H = 270, pad = 14, xr = [-1.4, 1.4], yr = [-1.4, 1.4], m = P.map(W, H, pad, xr, yr);
    var X = C.pcaData(8, 40), st = C.pcaStats(X), best = C.bestAngle(st), tot = st[0] + st[1];
    var cA = S.range('ang', 'Angle of the axis (degrees)', { min: 0, max: 179, step: 1, value: 0, fmt: function (v) { return v.toFixed(0) + '°'; }, onChange: function () { draw(); } });
    S.buttons([{ id: 'best', label: 'Use the best axis', primary: true, onClick: function () { cA.set(Math.round(best) % 180); draw(); } }]);
    var c1 = S.card('Points, the axis, and each point’s shadow on the axis', S.view), svg = S.svgEl(W, H, 'Scatter plot of points with a rotatable axis and the projection of each point onto it.', c1);
    var rA = S.readout('a', 'Spread kept'), rB = S.readout('b', 'Best possible'), rC = S.readout('c', 'Best angle');
    function draw() {
      var a = cA.get(), t = a * Math.PI / 180, ux = Math.cos(t), uy = Math.sin(t), kept = C.varAlong(st, a) / tot;
      P.clear(svg); P.frame(S, svg, m, W, H, pad, xr, yr);
      svg.appendChild(S.svg('line', { x1: m.X(-1.3 * ux), y1: m.Y(-1.3 * uy), x2: m.X(1.3 * ux), y2: m.Y(1.3 * uy), class: 'edge sv-s0', 'stroke-width': 2.5 }));
      X.forEach(function (p) { var s = p[0] * ux + p[1] * uy, px = s * ux, py = s * uy; svg.appendChild(S.svg('line', { x1: m.X(p[0]), y1: m.Y(p[1]), x2: m.X(px), y2: m.Y(py), class: 'grid', 'stroke-dasharray': '2 3' })); svg.appendChild(S.svg('circle', { cx: m.X(px), cy: m.Y(py), r: 2.6, class: 'sv-f0' })); });
      X.forEach(function (p) { svg.appendChild(S.svg('circle', { cx: m.X(p[0]), cy: m.Y(p[1]), r: 3.8, class: 'sv-f1', 'fill-opacity': 0.8 })); });
      rA.set((kept * 100).toFixed(0) + '%'); rB.set((C.varAlong(st, best) / tot * 100).toFixed(0) + '%'); rC.set(best.toFixed(0) + '°');
      S.narrate('This axis keeps ' + (kept * 100).toFixed(0) + '% of the spread', 'Replacing each point by its shadow on the axis turns two numbers into one. The best axis is the one where the shadows stay most spread out, so the least information is lost. That axis is the first principal component.');
      if (Math.abs(a - best) <= 5 || Math.abs(a - best) >= 175) S.challenge('axis');
    }
    draw();
  });
})();
