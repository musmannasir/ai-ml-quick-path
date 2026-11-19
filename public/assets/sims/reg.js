/* Simulation: regression by hand against the best fit, with an outlier and a ridge penalty. Calculation: AIQPSim.logic.core. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('reg', function (S) {
    var C = Q.logic.core, P = Q.plot, W = 380, H = 250, pad = 22, xr = [-1.1, 1.1], yr = [-2.2, 2.2], m = P.map(W, H, pad, xr, yr), moved = false;
    var cA = S.range('a', 'Your slope', { min: -3, max: 3, step: 0.05, value: 0.5, fmt: function (v) { return v.toFixed(2); }, onChange: function () { moved = true; draw(); } });
    var cB = S.range('b', 'Your intercept', { min: -1.5, max: 1.5, step: 0.05, value: -0.5, fmt: function (v) { return v.toFixed(2); }, onChange: function () { moved = true; draw(); } });
    var cO = S.toggle('out', 'Add one outlier point', false, function () { draw(); });
    var cR = S.range('pen', 'Ridge penalty (shrinks the slope)', { min: 0, max: 5, step: 0.1, value: 0, fmt: function (v) { return v.toFixed(1); }, onChange: function () { draw(); } });
    S.buttons([{ id: 'best', label: 'Use the best fit', primary: true, onClick: function () { var d = data(), o = C.ols(d.X, d.Y, 0); cA.set(Math.max(-3, Math.min(3, o.a))); cB.set(Math.max(-1.5, Math.min(1.5, o.b))); moved = true; draw(); } }]);
    var cv = S.card('Points, residuals (dashed), your line, the best-fit line, and the penalised line', S.view), svg = S.svgEl(W, H, 'Scatter plot of points with a line you control and the least-squares best-fit line.', cv);
    var u = S.el('ul', { class: 'sim-legend' }); [['l0', 'Your line'], ['l2', 'Best fit (least squares)'], ['l3', 'Penalised fit']].forEach(function (x) { u.appendChild(S.el('li', { class: x[0] }, [S.el('i'), document.createTextNode(x[1])])); }); cv.appendChild(u);
    var rM = S.readout('mse', 'Your error (MSE)'), rR = S.readout('r2', 'Your R²'), rS = S.readout('bs', 'Best-fit slope'), rP = S.readout('ps', 'Penalised slope');
    function data() { return C.regData(5, 12, 0.3, cO.get()); }
    function line(a, b, cls, dash) { var e = S.svg('line', { x1: m.X(xr[0]), y1: m.Y(a * xr[0] + b), x2: m.X(xr[1]), y2: m.Y(a * xr[1] + b), class: 'edge ' + cls, 'stroke-width': 2.4 }); if (dash) e.setAttribute('stroke-dasharray', dash); svg.appendChild(e); }
    function draw() {
      var d = data(), a = cA.get(), b = cB.get(), best = C.ols(d.X, d.Y, 0), pen = C.ols(d.X, d.Y, cR.get()), mse = C.mse(d.X, d.Y, a, b), bm = C.mse(d.X, d.Y, best.a, best.b);
      P.clear(svg); P.frame(S, svg, m, W, H, pad, xr, yr);
      d.X.forEach(function (x, i) { svg.appendChild(S.svg('line', { x1: m.X(x), y1: m.Y(d.Y[i]), x2: m.X(x), y2: m.Y(a * x + b), class: 'grid', 'stroke-dasharray': '3 3' })); });
      line(best.a, best.b, 'sv-s2', '6 4'); if (cR.get() > 0) line(pen.a, pen.b, 'sv-s3', '2 3'); line(a, b, 'sv-s0');
      d.X.forEach(function (x, i) { var odd = i === 12; svg.appendChild(S.svg('circle', { cx: m.X(x), cy: m.Y(d.Y[i]), r: odd ? 6 : 4, class: odd ? 'sv-f1' : 'sv-f0' })); });
      rM.set(mse.toFixed(3)); rR.set(C.r2(d.X, d.Y, a, b).toFixed(2)); rS.set(best.a.toFixed(2)); rP.set(pen.a.toFixed(2));
      S.narrate(mse <= bm * 1.1 ? 'Your line is about as good as the best fit' : 'Your error is ' + (mse / bm).toFixed(1) + ' times the best fit',
        'Each dashed line is a residual: the gap between a point and the line. The error (MSE) is the average of the squared gaps, and the best-fit line makes it as small as possible. ' + (cO.get() ? 'The outlier is the large point: one odd point drags the best-fit line toward it. ' : '') + (cR.get() > 0 ? 'The ridge penalty pulls the slope toward zero (' + pen.a.toFixed(2) + ' instead of ' + best.a.toFixed(2) + '), which trades a little fit for steadiness.' : ''));
      if (moved && mse <= bm * 1.1) S.challenge('close');
      if (cO.get() && Math.abs(best.a - C.ols(C.regData(5, 12, 0.3, false).X, C.regData(5, 12, 0.3, false).Y, 0).a) > 0.3) S.challenge('outlier');
    }
    draw();
  });
})();
