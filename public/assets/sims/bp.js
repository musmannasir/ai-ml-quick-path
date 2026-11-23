/* Simulation: backpropagation on a small graph (one neuron: m = w*x, z = m + b, a = tanh(z), loss = (a - y)^2).
   The calculation is in AIQPSim.logic.bp so scripts/check-sims.mjs can compare it with examples/sim-backprop/graph.py. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  Q.logic = Q.logic || {};
  function forward(x, w, b, y) { var m = w * x, z = m + b, a = Math.tanh(z); return { m: m, z: z, a: a, loss: (a - y) * (a - y) }; }
  function backward(x, w, b, y) { var f = forward(x, w, b, y), da = 2 * (f.a - y), dz = da * (1 - f.a * f.a); return { a: da, z: dz, m: dz, b: dz, w: dz * x, x: dz * w }; }
  function nudge(x, w, b, y, which, h) { h = h || 0.0001; var base = forward(x, w, b, y).loss, a = { x: x, w: w, b: b }; a[which] += h; return (forward(a.x, a.w, a.b, y).loss - base) / h; }
  Q.logic.bp = { forward: forward, backward: backward, nudge: nudge };
  if (typeof document === 'undefined') return;
  var f2 = function (v) { return (Math.abs(v) < 0.005 ? '0.00' : v.toFixed(2)); };
  Q.register('bp', function (S) {
    var st = { shown: 0 };
    var cX = S.range('x', 'Input x', { min: -3, max: 3, step: 0.1, value: 2, fmt: f2, onChange: function () { st.shown = 0; draw(); } });
    var cW = S.range('w', 'Weight w', { min: -2, max: 2, step: 0.05, value: 0.3, fmt: f2, onChange: function () { st.shown = 0; draw(); } });
    var cB = S.range('b', 'Bias b', { min: -2, max: 2, step: 0.05, value: 0.1, fmt: f2, onChange: function () { st.shown = 0; draw(); } });
    var cY = S.range('y', 'Target y (the right answer)', { min: -1, max: 1, step: 0.1, value: 1, fmt: f2, onChange: function () { st.shown = 0; draw(); } });
    var cR = S.range('rate', 'Learning rate for the update', { min: -2, max: 0, step: 0.05, value: -1, log: true, fmt: function (v) { return v.toFixed(2); } });
    S.buttons([{ id: 'next', label: 'Next backward step', primary: true, onClick: function () { st.shown = Math.min(4, st.shown + 1); draw(); } }, { id: 'all', label: 'Show all', onClick: function () { st.shown = 4; draw(); } }, { id: 'hide', label: 'Hide gradients', onClick: function () { st.shown = 0; draw(); } }, { id: 'upd', label: 'Update w and b once', onClick: function () { update(); } }]);
    var cG = S.card('The graph: forward values on top, gradients appear as you go backwards', S.view), svg = S.svgEl(500, 200, 'A small calculation graph with a forward value and a gradient on each node.', cG);
    var cT = S.card('The chain rule, one line per backward step', S.view), ol = S.el('ol', { class: 'sim-merges' }); cT.appendChild(ol);
    var rL = S.readout('l', 'Loss'), rW = S.readout('w', 'Gradient of w'), rN = S.readout('n', 'Nudge check for w'), rU = S.readout('u', 'Updates made');
    var updates = 0;
    function vals() { return [cX.get(), cW.get(), cB.get(), cY.get()]; }
    function update() { var v = vals(), g = Q.logic.bp.backward(v[0], v[1], v[2], v[3]), r = cR.get(); cW.set(v[1] - r * g.w); cB.set(v[2] - r * g.b); updates++; st.shown = 0; draw(); }
    function draw() {
      var v = vals(), x = v[0], w = v[1], b = v[2], y = v[3], f = Q.logic.bp.forward(x, w, b, y), g = Q.logic.bp.backward(x, w, b, y), k = st.shown;
      var N = { x: [8, 12, 'x', x, g.x, 4], w: [8, 100, 'w', w, g.w, 4], m: [118, 56, 'm = w·x', f.m, g.m, 3], b: [118, 146, 'b', b, g.b, 3], z: [228, 100, 'z = m + b', f.z, g.z, 2], a: [328, 100, 'a = tanh z', f.a, g.a, 1], y: [418, 12, 'y (target)', y, null, 9], L: [418, 100, 'loss', f.loss, 1, 1] };
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var E = [['x', 'm'], ['w', 'm'], ['m', 'z'], ['b', 'z'], ['z', 'a'], ['a', 'L'], ['y', 'L']];
      E.forEach(function (e) { var p = N[e[0]], q = N[e[1]], vert = e[0] === 'y'; svg.appendChild(S.svg('line', { x1: vert ? p[0] + 35 : p[0] + 70, y1: vert ? p[1] + 46 : p[1] + 23, x2: vert ? q[0] + 35 : q[0], y2: vert ? q[1] : q[1] + 23, class: 'axis' })); });
      Object.keys(N).forEach(function (id) {
        var n = N[id], on = n[4] !== null && k >= n[5] && n[5] !== 9, grp = S.svg('g');
        grp.appendChild(S.svg('rect', { x: n[0], y: n[1], width: 70, height: 46, rx: 6, class: 'node' + (on ? ' sel' : '') }));
        grp.appendChild(S.svg('text', { x: n[0] + 35, y: n[1] + 13, 'text-anchor': 'middle', 'font-weight': 700, 'font-size': 10, text: n[2] }));
        grp.appendChild(S.svg('text', { x: n[0] + 35, y: n[1] + 27, 'text-anchor': 'middle', text: f2(n[3]) }));
        if (n[4] !== null) grp.appendChild(S.svg('text', { x: n[0] + 35, y: n[1] + 40, 'text-anchor': 'middle', class: on ? 'sv-f0' : 't2', 'font-size': 10, text: on ? 'grad ' + f2(n[4]) : 'grad ?' }));
        svg.appendChild(grp);
      });
      var lines = ['∂loss/∂a = 2 × (a − y) = 2 × (' + f2(f.a) + ' − ' + f2(y) + ') = ' + f2(g.a), '∂loss/∂z = ∂loss/∂a × (1 − a²) = ' + f2(g.a) + ' × ' + f2(1 - f.a * f.a) + ' = ' + f2(g.z) + '   (tanh has slope 1 − a²)',
        '∂loss/∂m = ∂loss/∂z = ' + f2(g.z) + ' and ∂loss/∂b = ∂loss/∂z = ' + f2(g.z) + '   (an add passes the gradient on unchanged)', '∂loss/∂w = ∂loss/∂m × x = ' + f2(g.m) + ' × ' + f2(x) + ' = ' + f2(g.w) + ' and ∂loss/∂x = ∂loss/∂m × w = ' + f2(g.m) + ' × ' + f2(w) + ' = ' + f2(g.x)];
      ol.innerHTML = ''; lines.slice(0, k).forEach(function (t, i) { ol.appendChild(S.el('li', { class: i === k - 1 ? 'sim-last' : '', text: t })); }); if (!k) ol.appendChild(S.el('li', { class: 'sim-none', text: 'Press “Next backward step”.' }));
      rL.set(f.loss.toFixed(4)); rW.set(k >= 4 ? f2(g.w) : '?'); rN.set(f2(Q.logic.bp.nudge(x, w, b, y, 'w'))); rU.set(String(updates));
      S.narrate(k ? 'Backward step ' + k + ' of 4' : 'Forward pass done: loss ' + f.loss.toFixed(3), k ? ['The loss is squared error, so the first gradient is 2 × (a − y).', 'The gradient passes back through tanh and is scaled by the tanh slope.', 'An addition hands its gradient to both of its inputs unchanged.', 'A product gives each input the other input as its scale. Now every weight has a gradient.'][k - 1] : 'Numbers flow forward from x and w to the loss. Press Next backward step to send gradients the other way.');
      if (k >= 4 && Math.abs(Q.logic.bp.nudge(x, w, b, y, 'w') - g.w) < 0.01) S.challenge('chain');
      if (updates >= 1 && f.loss < 0.02 && vals()[3] === 1 && x === 2) S.challenge('learn');
    }
    draw();
  });
})();
