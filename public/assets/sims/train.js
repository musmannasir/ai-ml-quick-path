/* Simulation: training dynamics, a race of three optimisers on a long narrow valley.
   The calculation is in AIQPSim.logic.train so scripts/check-sims.mjs can compare it with examples/sim-training/dynamics.py. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  Q.logic = Q.logic || {};
  function lcg(seed) { var s = seed >>> 0; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  function valley(x, y) { return 0.5 * (x * x + 20 * y * y); }
  // One optimiser: step() moves it once. kind: plain | momentum | adam. noise: size of the random error in the gradient (a small batch).
  function makeOpt(kind, lr, noise, seed) {
    var o = { kind: kind, x: -4, y: 1, vx: 0, vy: 0, mx: 0, my: 0, sx: 0, sy: 0, t: 0, rnd: lcg(seed || 3), path: [[-4, 1]], losses: [valley(-4, 1)] };
    o.step = function () {
      var gx = o.x, gy = 20 * o.y; o.t++;
      if (noise > 0) { gx += noise * (o.rnd() + o.rnd() + o.rnd() + o.rnd() - 2) * Math.sqrt(3); gy += noise * (o.rnd() + o.rnd() + o.rnd() + o.rnd() - 2) * Math.sqrt(3); }
      if (kind === 'plain') { o.x -= lr * gx; o.y -= lr * gy; }
      else if (kind === 'momentum') { o.vx = 0.9 * o.vx + gx; o.vy = 0.9 * o.vy + gy; o.x -= lr * o.vx; o.y -= lr * o.vy; }
      else {
        o.mx = 0.9 * o.mx + 0.1 * gx; o.my = 0.9 * o.my + 0.1 * gy; o.sx = 0.999 * o.sx + 0.001 * gx * gx; o.sy = 0.999 * o.sy + 0.001 * gy * gy;
        o.x -= lr * (o.mx / (1 - Math.pow(0.9, o.t))) / (Math.sqrt(o.sx / (1 - Math.pow(0.999, o.t))) + 1e-8);
        o.y -= lr * (o.my / (1 - Math.pow(0.9, o.t))) / (Math.sqrt(o.sy / (1 - Math.pow(0.999, o.t))) + 1e-8);
      }
      o.path.push([o.x, o.y]); o.losses.push(valley(o.x, o.y));
    };
    return o;
  }
  function race(kind, lr, noise, steps) { var o = makeOpt(kind, lr, noise); for (var i = 0; i < steps; i++) o.step(); return valley(o.x, o.y); }
  Q.logic.train = { makeOpt: makeOpt, race: race, valley: valley };
  if (typeof document === 'undefined') return;
  var KINDS = [['plain', 'Plain gradient descent'], ['momentum', 'Momentum'], ['adam', 'Adam']];
  Q.register('train', function (S) {
    var st = { opts: [] };
    var cL = S.range('lr', 'Learning rate', { min: -2, max: -0.4, step: 0.02, value: Math.log10(0.05), log: true, fmt: function (v) { return v.toFixed(3); }, onChange: function () { reset(); } });
    var cN = S.range('noise', 'Gradient noise (smaller batch = more)', { min: 0, max: 3, step: 0.25, value: 0, fmt: function (v) { return v.toFixed(2); }, onChange: function () { reset(); } });
    S.buttons([{ id: 'one', label: 'One step', onClick: function () { move(1); } }, { id: 'ten', label: 'Run 10 steps', primary: true, onClick: function () { move(10); } }, { id: 'sixty', label: 'Run to 60', onClick: function () { move(Math.max(0, 60 - st.opts[0].t)); } }, { id: 'again', label: 'Start again', onClick: function () { reset(); } }]);
    var cP = S.card('Paths on a long narrow valley (contour lines; the bottom is the middle)', S.view), svg = S.svgEl(380, 130, 'Contour lines of a long narrow valley with the paths of three optimisers.', cP);
    var u = S.el('ul', { class: 'sim-legend' }); KINDS.forEach(function (k, i) { u.appendChild(S.el('li', { class: 'l' + i }, [S.el('i'), document.createTextNode(k[1])])); }); cP.appendChild(u);
    var cH = S.card('Loss after each step (log scale; lower is better)', S.view), sv2 = S.svgEl(380, 130, 'Loss of each optimiser after each step, on a log scale.', cH);
    var rs = KINDS.map(function (k) { return S.readout(k[0], k[1].split(' ')[0] + ' loss'); }), rT = S.readout('t', 'Steps');
    function reset() { st.opts = KINDS.map(function (k) { return makeOpt(k[0], cL.get(), cN.get(), 3); }); draw(); }
    function move(n) { for (var i = 0; i < n; i++) st.opts.forEach(function (o) { o.step(); }); draw(); }
    function fmt(v) { return !isFinite(v) || v > 1e6 ? 'huge' : v < 0.001 ? v.toExponential(1) : v.toFixed(v < 10 ? 3 : 1); }
    function draw() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var X = function (v) { return 190 + Math.max(-5.2, Math.min(5.2, v)) * 36; }, Y = function (v) { return 65 + Math.max(-1.7, Math.min(1.7, v)) * 36; };
      [1, 3, 6, 10, 18].forEach(function (c) { svg.appendChild(S.svg('ellipse', { cx: X(0), cy: Y(0), rx: Math.sqrt(2 * c) * 36, ry: Math.sqrt(2 * c / 20) * 36, class: 'grid' })); });
      st.opts.forEach(function (o, i) {
        var d = ''; o.path.forEach(function (p, k) { d += (k ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); });
        svg.appendChild(S.svg('path', { d: d, class: 'edge sv-s' + i, fill: 'none', 'stroke-width': 2 })); var p = o.path[o.path.length - 1];
        svg.appendChild(S.svg('circle', { cx: X(p[0]), cy: Y(p[1]), r: 4.5, class: 'sv-f' + i }));
      });
      while (sv2.firstChild) sv2.removeChild(sv2.firstChild);
      var n = st.opts[0].t, m = Math.max(n, 20), lo = -3, hi = 3, LY = function (v) { var l = Math.log10(Math.max(v, 1e-9)); return 120 - (Math.max(lo, Math.min(hi, l)) - lo) / (hi - lo) * 112; };
      sv2.appendChild(S.svg('line', { x1: 40, y1: 120, x2: 376, y2: 120, class: 'axis' }));
      [hi, 0, lo].forEach(function (g) { sv2.appendChild(S.svg('text', { x: 4, y: LY(Math.pow(10, g)) + 4, class: 't2', text: g === 0 ? '1' : '1e' + g })); sv2.appendChild(S.svg('line', { x1: 40, y1: LY(Math.pow(10, g)), x2: 376, y2: LY(Math.pow(10, g)), class: 'grid' })); });
      st.opts.forEach(function (o, i) { var d = ''; o.losses.forEach(function (v, k) { d += (k ? 'L' : 'M') + (40 + k / m * 336).toFixed(1) + ' ' + LY(v).toFixed(1); }); sv2.appendChild(S.svg('path', { d: d, class: 'edge sv-s' + i, fill: 'none', 'stroke-width': 2 })); });
      sv2.appendChild(S.svg('text', { x: 376, y: 129, 'text-anchor': 'end', class: 't2', text: 'step ' + m }));
      var ls = st.opts.map(function (o) { return o.losses[o.losses.length - 1]; }); ls.forEach(function (v, i) { rs[i].set(fmt(v)); }); rT.set(String(n));
      var best = ls.indexOf(Math.min.apply(null, ls.map(function (v) { return isFinite(v) ? v : Infinity; })));
      S.narrate(n === 0 ? 'Ready: all three start at the same point' : 'After ' + n + ' steps the lowest loss is ' + KINDS[best][1].toLowerCase(), 'Plain steps follow the slope, so across a narrow valley they zigzag or crawl. Momentum remembers earlier steps and builds speed along the valley. Adam rescales each direction, so every direction moves at a similar pace. A noisy gradient (a small batch) makes every path wander.');
      if (n >= 1 && ls[0] > 1000) S.challenge('blow');
      if (n >= 60 && cN.get() === 0 && ls[1] < 0.01 && ls[0] > 0.1) S.challenge('momentum');
    }
    reset();
  });
})();
