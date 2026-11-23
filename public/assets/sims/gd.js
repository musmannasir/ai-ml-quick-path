/* Simulation: gradient descent, a ball rolling down a curve (one number to learn).
   The calculation is in AIQPSim.logic.gd so scripts/check-sims.mjs can compare it with examples/sim-training/dynamics.py. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  Q.logic = Q.logic || {};
  var CURVES = {
    bowl: { f: function (x) { return (x - 3) * (x - 3); }, g: function (x) { return 2 * (x - 3); }, xr: [-1, 7], yr: [0, 40], start: 0, label: 'Bowl: one valley, lowest at x = 3' },
    valleys: { f: function (x) { return 0.25 * Math.pow(x, 4) - x * x + 0.3 * x; }, g: function (x) { return Math.pow(x, 3) - 2 * x + 0.3; }, xr: [-3, 3], yr: [-2.5, 8], start: -2, label: 'Two valleys: a deep one and a shallow one' }
  };
  function descend(curve, x, lr, steps) { var c = CURVES[curve], xs = [x]; for (var i = 0; i < steps; i++) { x = x - lr * c.g(x); xs.push(x); } return xs; }
  Q.logic.gd = { CURVES: CURVES, descend: descend };
  if (typeof document === 'undefined') return;
  Q.register('gd', function (S) {
    var st = { curve: 'bowl', xs: [0] };
    var cC = S.select('curve', 'Curve (the loss)', [['bowl', CURVES.bowl.label], ['valleys', CURVES.valleys.label]], S.preset === 'valleys' ? 'valleys' : 'bowl', function (v) { st.curve = v; setCurve(); });
    var cL = S.range('lr', 'Learning rate', { min: -2, max: 0.2, step: 0.02, value: -1, log: true, fmt: function (v) { return v.toFixed(2); }, onChange: function () { reset(); } });
    var cX = S.range('start', 'Starting point', { min: -1, max: 7, step: 0.5, value: 0, fmt: function (v) { return v.toFixed(1); }, onChange: function () { reset(); } });
    S.buttons([{ id: 'one', label: 'One step', primary: true, onClick: function () { move(1); } }, { id: 'twenty', label: 'Run 20 steps', onClick: function () { move(20); } }, { id: 'again', label: 'Start again', onClick: function () { reset(); } }]);
    var cP = S.card('The loss curve and the ball (each dot is one step)', S.view), svg = S.svgEl(380, 190, 'A curve showing the loss. A ball and its earlier positions show where gradient descent has been.', cP);
    var cH = S.card('Loss after each step', S.view), sv2 = S.svgEl(380, 110, 'Line chart of the loss after each step.', cH);
    var rS = S.readout('s', 'Steps'), rX = S.readout('x', 'x now'), rL = S.readout('l', 'Loss now'), rG = S.readout('g', 'Slope now');
    function cur() { return CURVES[st.curve]; }
    function setCurve() { var c = cur(), i = cX.input; i.min = c.xr[0]; i.max = c.xr[1]; cX.set(c.start); reset(); }
    function reset() { st.xs = [cX.get()]; draw(); }
    function move(n) { var c = cur(), lr = cL.get(), x = st.xs[st.xs.length - 1]; for (var i = 0; i < n; i++) { x = x - lr * c.g(x); st.xs.push(x); if (!isFinite(x) || Math.abs(x) > 1e6) break; } draw(); }
    function clampY(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function draw() {
      var c = cur(), x = st.xs[st.xs.length - 1], loss = c.f(x), lr = cL.get(), n = st.xs.length - 1;
      var L = 34, R = 372, T = 10, B = 170, X = function (v) { return L + (clampY(v, c.xr[0], c.xr[1]) - c.xr[0]) / (c.xr[1] - c.xr[0]) * (R - L); }, Y = function (v) { return B - (clampY(v, c.yr[0], c.yr[1]) - c.yr[0]) / (c.yr[1] - c.yr[0]) * (B - T); };
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(S.svg('line', { x1: L, y1: B, x2: R, y2: B, class: 'axis' })); svg.appendChild(S.svg('line', { x1: L, y1: T, x2: L, y2: B, class: 'axis' }));
      var d = '', k; for (k = 0; k <= 120; k++) { var xv = c.xr[0] + (c.xr[1] - c.xr[0]) * k / 120; d += (k ? 'L' : 'M') + X(xv).toFixed(1) + ' ' + Y(c.f(xv)).toFixed(1); }
      svg.appendChild(S.svg('path', { d: d, class: 'edge sv-s0', fill: 'none', 'stroke-width': 2.5 }));
      st.xs.forEach(function (v, i) { if (i < st.xs.length - 1 && isFinite(v)) svg.appendChild(S.svg('circle', { cx: X(v), cy: Y(c.f(v)), r: 3, class: 'sv-f2', 'fill-opacity': 0.55 })); });
      svg.appendChild(S.svg('circle', { cx: X(x), cy: Y(loss), r: 7, class: 'sv-f1', stroke: 'currentColor', 'stroke-width': 1 }));
      svg.appendChild(S.svg('text', { x: R, y: B + 14, 'text-anchor': 'end', class: 't2', text: 'x' })); svg.appendChild(S.svg('text', { x: L + 4, y: T + 8, class: 't2', text: 'loss' }));
      while (sv2.firstChild) sv2.removeChild(sv2.firstChild);
      var ls = st.xs.map(function (v) { return c.f(v); }), top = Math.max(1, Math.min(Math.max.apply(null, ls.filter(isFinite)), 100)), W2 = 372, H2 = 90, T2 = 8, m = Math.max(n, 20);
      sv2.appendChild(S.svg('line', { x1: 34, y1: T2 + H2, x2: W2, y2: T2 + H2, class: 'axis' }));
      var dd = ''; ls.forEach(function (v, i) { dd += (i ? 'L' : 'M') + (34 + i / m * (W2 - 34)).toFixed(1) + ' ' + (T2 + H2 - clampY(v, 0, top) / top * H2).toFixed(1); });
      sv2.appendChild(S.svg('path', { d: dd, class: 'edge sv-s1', fill: 'none', 'stroke-width': 2.2 }));
      sv2.appendChild(S.svg('text', { x: 4, y: T2 + 8, class: 't2', text: top >= 10 ? top.toFixed(0) : top.toFixed(1) })); sv2.appendChild(S.svg('text', { x: 4, y: T2 + H2, class: 't2', text: '0' })); sv2.appendChild(S.svg('text', { x: W2, y: T2 + H2 + 12, 'text-anchor': 'end', class: 't2', text: 'step ' + m }));
      var slope = c.g(x); rS.set(String(n)); rX.set(isFinite(x) && Math.abs(x) < 1e6 ? x.toFixed(2) : 'huge'); rL.set(loss < 1e6 ? loss.toFixed(3) : 'huge'); rG.set(Math.abs(slope) < 1e6 ? slope.toFixed(3) : 'huge');
      var title, text;
      if (!isFinite(loss) || loss > 1e6) { title = 'It has blown up'; text = 'The step is so big that each move lands farther from the bottom than the last one. The loss grows without limit.'; }
      else if (st.curve === 'bowl' && lr >= 0.95 && lr < 1.05 && n >= 2) { title = 'The ball bounces back and forth'; text = 'With this learning rate on this bowl, each step jumps exactly to the mirror image of where it was, so it never settles.'; }
      else if (st.curve === 'bowl' && lr > 1.05 && n >= 2) { title = 'Each step overshoots farther'; text = 'The step is larger than the distance to the bottom, so the ball lands farther away each time.'; }
      else if (n === 0) { title = 'Ready'; text = 'Press One step. Each step moves x by (learning rate × slope) downhill.'; }
      else if (Math.abs(slope) < 0.01) { title = 'Settled at x = ' + x.toFixed(2); text = 'The slope is almost zero, so steps are almost zero. ' + (st.curve === 'valleys' ? (x > 0 ? 'This is the shallower valley: it is a bottom, but not the lowest one.' : 'This is the deeper valley, the lowest point.') : 'This is the lowest point of the bowl.'); }
      else { title = 'Step ' + n + ': x moved to ' + x.toFixed(2); text = 'Slope ' + slope.toFixed(2) + ' times learning rate ' + lr.toFixed(2) + ' gives a move of ' + (-lr * slope).toFixed(2) + '. Steps shrink as the slope shrinks.'; }
      S.narrate(title, text);
      if (st.curve === 'bowl' && loss < 0.01 && n >= 1 && n <= 15) S.challenge('fast');
      if (loss > 1000 && isFinite(loss)) S.challenge('blow');
      if (st.curve === 'valleys' && Math.abs(slope) < 0.01 && x > 0.5) S.challenge('local');
    }
    setCurve();
  });
})();
