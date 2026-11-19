/* Simulation: neural network playground. A small multilayer network is trained live, in this page, by plain
   gradient descent (forward pass, backward pass, weight update). The calculation is in AIQPSim.logic.nn so that
   scripts/check-sims.mjs can run it in Node and compare it with examples/sim-nn/nn_playground.py. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  Q.logic = Q.logic || {};

  // ---- calculation (no page code below this block) ----
  function lcg(seed) { var s = seed >>> 0; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

  // Points in [-1, 1] x [-1, 1] with a clear gap around the boundary. Class 1 is the "blue" class.
  function makeData(kind, n, seed) {
    var r = lcg(seed), X = [], y = [];
    while (X.length < n) {
      var a = r() * 2 - 1, b = r() * 2 - 1, label, ok = true;
      if (kind === 'line') { var s = 0.8 * a + 0.6 * b; ok = Math.abs(s) > 0.12; label = s > 0 ? 1 : 0; }
      else if (kind === 'xor') { ok = Math.abs(a) > 0.12 && Math.abs(b) > 0.12; label = a * b > 0 ? 1 : 0; }
      else { var d = Math.sqrt(a * a + b * b); ok = Math.abs(d - 0.55) > 0.08 && d < 1.0; label = d < 0.55 ? 1 : 0; }
      if (ok) { X.push([a, b]); y.push(label); }
    }
    return { X: X, y: y };
  }

  var ACT = {
    tanh: { f: Math.tanh, d: function (a) { return 1 - a * a; } },
    relu: { f: function (z) { return z > 0 ? z : 0; }, d: function (a) { return a > 0 ? 1 : 0; } },
    sigmoid: { f: function (z) { return 1 / (1 + Math.exp(-z)); }, d: function (a) { return a * (1 - a); } }
  };

  // sizes like [2, 4, 1]. W[l][j][i] connects unit i of layer l to unit j of layer l + 1.
  function makeNet(hidden, act, seed) {
    var sizes = [2].concat(hidden, [1]), r = lcg(seed), W = [], B = [];
    for (var l = 0; l < sizes.length - 1; l++) {
      var lim = Math.sqrt(6 / (sizes[l] + sizes[l + 1])), Wl = [], Bl = [];
      for (var j = 0; j < sizes[l + 1]; j++) { var row = []; for (var i = 0; i < sizes[l]; i++) row.push((r() * 2 - 1) * lim); Wl.push(row); Bl.push(0); }
      W.push(Wl); B.push(Bl);
    }
    return { sizes: sizes, W: W, B: B, act: act };
  }

  function forward(net, x) {
    var A = [x.slice()], f = ACT[net.act].f, last = net.W.length - 1;
    for (var l = 0; l <= last; l++) {
      var prev = A[l], out = [];
      for (var j = 0; j < net.W[l].length; j++) {
        var z = net.B[l][j]; for (var i = 0; i < prev.length; i++) z += net.W[l][j][i] * prev[i];
        out.push(l === last ? 1 / (1 + Math.exp(-z)) : f(z));
      }
      A.push(out);
    }
    return A;
  }

  function evaluate(net, data) {
    var loss = 0, hit = 0, eps = 1e-12;
    for (var k = 0; k < data.X.length; k++) {
      var p = forward(net, data.X[k]); p = p[p.length - 1][0];
      loss += -(data.y[k] * Math.log(p + eps) + (1 - data.y[k]) * Math.log(1 - p + eps));
      if ((p > 0.5 ? 1 : 0) === data.y[k]) hit++;
    }
    return { loss: loss / data.X.length, acc: hit / data.X.length };
  }

  // One full-batch gradient-descent step (an "epoch" here). Returns nothing; the net is changed in place.
  function trainEpoch(net, data, lr) {
    var L = net.W.length, n = data.X.length, d = ACT[net.act].d;
    var gW = net.W.map(function (m) { return m.map(function (row) { return row.map(function () { return 0; }); }); });
    var gB = net.B.map(function (v) { return v.map(function () { return 0; }); });
    for (var k = 0; k < n; k++) {
      var A = forward(net, data.X[k]);
      var delta = [A[L][0] - data.y[k]];                       // output layer: sigmoid with cross-entropy gives p - y
      for (var l = L - 1; l >= 0; l--) {
        for (var j = 0; j < delta.length; j++) {
          gB[l][j] += delta[j] / n;
          for (var i = 0; i < A[l].length; i++) gW[l][j][i] += delta[j] * A[l][i] / n;
        }
        if (l > 0) {
          var next = [];
          for (var i2 = 0; i2 < A[l].length; i2++) {
            var s = 0; for (var j2 = 0; j2 < delta.length; j2++) s += net.W[l][j2][i2] * delta[j2];
            next.push(s * d(A[l][i2]));
          }
          delta = next;
        }
      }
    }
    for (var l2 = 0; l2 < L; l2++) for (var j3 = 0; j3 < net.W[l2].length; j3++) {
      net.B[l2][j3] -= lr * gB[l2][j3];
      for (var i3 = 0; i3 < net.W[l2][j3].length; i3++) net.W[l2][j3][i3] -= lr * gW[l2][j3][i3];
    }
  }

  Q.logic.nn = { lcg: lcg, makeData: makeData, makeNet: makeNet, forward: forward, evaluate: evaluate, trainEpoch: trainEpoch,
    DEFAULTS: { data: 'xor', hidden: [4], act: 'tanh', lr: 0.5, trainN: 100, testN: 60, dataSeed: 11, testSeed: 23, netSeed: 5 } };

  // ---- page part ----
  if (typeof document === 'undefined') return;
  var P = Q.logic.nn;
  var HID = { '1': [1], '2': [2], '4': [4], '8': [8], '4,4': [4, 4], '6,3': [6, 3] };
  var HID_LABEL = [['1', '1 neuron'], ['2', '2 neurons'], ['4', '4 neurons'], ['8', '8 neurons'], ['4,4', '4 + 4 (two layers)'], ['6,3', '6 + 3 (two layers)']];

  function rgb(hex) { var h = hex.replace('#', ''); if (h.length === 3) h = h.replace(/(.)/g, '$1$1'); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function mix(a, b, t) { return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)]; }

  Q.register('nn', function (S) {
    var D = P.DEFAULTS, preset = S.preset;
    var st = { data: D.data, hidden: '4', act: D.act, lr: D.lr, speed: 5, epoch: 0, hist: [], follow: 0, tr: null, te: null, net: null, init: null, balls: [] };
    if (preset === 'one-neuron') { st.hidden = '1'; }
    if (preset === 'line') { st.data = 'line'; st.hidden = '2'; }

    var cDataset = S.select('data', 'Pattern to learn', [['line', 'Straight line'], ['xor', 'XOR (opposite corners)'], ['circle', 'Circle']], st.data, function (v) { st.data = v; reset(); });
    var cHid = S.select('hidden', 'Hidden layers', HID_LABEL, st.hidden, function (v) { st.hidden = v; reset(); });
    var cAct = S.select('act', 'Activation function', [['tanh', 'tanh'], ['relu', 'ReLU'], ['sigmoid', 'sigmoid']], st.act, function (v) { st.act = v; reset(); });
    var cLr = S.range('lr', 'Learning rate', { min: -2, max: 1, step: 0.05, value: Math.log10(st.lr), log: true, fmt: function (v) { return v < 0.1 ? v.toFixed(3) : v.toFixed(2); }, onChange: function (v) { st.lr = v; } });
    var cSpeed = S.select('speed', 'Speed', [['1', 'Slow: 1 epoch per frame'], ['5', 'Medium: 5 per frame'], ['25', 'Fast: 25 per frame']], '5', function (v) { st.speed = Number(v); });
    var B = S.buttons([
      { id: 'run', label: 'Train', primary: true, onClick: function () { if (loop.running()) loop.stop(); else if (S.reduced) { for (var i = 0; i < 50; i++) epoch(); draw(); } else loop.start(); } },
      { id: 'step', label: 'One epoch', onClick: function () { epoch(); draw(); } },
      { id: 'reset', label: 'Reset weights', onClick: function () { reset(); } },
      { id: 'next', label: 'Next example', onClick: function () { st.follow = (st.follow + 1) % st.tr.X.length; draw(); } }
    ]);

    var row = S.row();
    var cardNet = S.card('The network (line thickness = weight size; blue positive, orange negative)', row);
    var svgN = S.svgEl(360, 250, 'Diagram of the network: two input units, the hidden layers and one output unit, joined by lines whose thickness shows the size of each weight.', cardNet);
    var cardMap = S.card('What it predicts (click the map to follow a point)', row);
    var cv = S.canvas(280, 280, 'Map of the two input values. The background colour shows what the network predicts at each place; the dots are the training and test points.', cardMap);
    cv.setAttribute('tabindex', '0');
    var leg = S.el('ul', { class: 'sim-legend' }); leg.innerHTML = '<li class="l0"><i></i>class 1 (circle)</li><li class="l1"><i></i>class 0 (square)</li><li>hollow = test point</li><li>ring = the point followed</li>';
    cardMap.appendChild(leg);
    var cardLoss = S.card('Loss while training (lower is better)', S.view);
    var svgL = S.svgEl(520, 140, 'Line chart of the training loss and the test loss against the number of epochs.', cardLoss);
    var rEpoch = S.readout('epoch', 'Epoch'), rTL = S.readout('tl', 'Train loss'), rVL = S.readout('vl', 'Test loss'), rTA = S.readout('ta', 'Train accuracy'), rVA = S.readout('va', 'Test accuracy'), rSel = S.readout('sel', 'Followed point: p(class 1)');

    var loop = S.loop(function () { for (var i = 0; i < st.speed; i++) epoch(); draw(); return true; }, 30);
    loop.onState = function (on) { B.run.textContent = on ? 'Pause' : 'Train'; };

    function reset() {
      loop.stop();
      st.tr = P.makeData(st.data, D.trainN, D.dataSeed); st.te = P.makeData(st.data, D.testN, D.testSeed);
      st.net = P.makeNet(HID[st.hidden], st.act, D.netSeed);
      st.epoch = 0; st.hist = []; st.follow = 0; st.done = {};
      var e = P.evaluate(st.net, st.tr), v = P.evaluate(st.net, st.te); st.init = e.loss;
      st.hist.push([0, e.loss, v.loss]);
      buildNet(); draw();
      S.narrate('Untrained network', 'The weights are small random numbers, so the map is a guess. Press Train and watch the map and the loss.');
    }
    function epoch() {
      P.trainEpoch(st.net, st.tr, st.lr); st.epoch++;
      var e = P.evaluate(st.net, st.tr), v = P.evaluate(st.net, st.te);
      st.hist.push([st.epoch, e.loss, v.loss]); if (st.hist.length > 4000) st.hist.splice(1, 1);
    }

    // ---- drawing ----
    var layout = null;
    function buildNet() {
      while (svgN.firstChild) svgN.removeChild(svgN.firstChild);
      var sz = st.net.sizes, L = sz.length, W = 360, H = 250, xs = [], ys = [];
      for (var l = 0; l < L; l++) { xs.push(34 + l * ((W - 68) / (L - 1))); var n = sz[l], gap = Math.min(46, (H - 40) / Math.max(1, n)); var col = []; for (var j = 0; j < n; j++) col.push(H / 2 + (j - (n - 1) / 2) * gap); ys.push(col); }
      var edges = [], nodes = [], rad = Math.max(8, Math.min(15, (Math.min(46, (H - 40) / Math.max.apply(null, sz)) / 2) - 2));
      var eg = S.svg('g'), ng = S.svg('g'), tg = S.svg('g');
      for (l = 0; l < L - 1; l++) for (var j2 = 0; j2 < sz[l + 1]; j2++) for (var i = 0; i < sz[l]; i++) {
        var ln = S.svg('line', { x1: xs[l], y1: ys[l][i], x2: xs[l + 1], y2: ys[l + 1][j2], class: 'edge', 'stroke-width': 1 });
        eg.appendChild(ln); edges.push({ el: ln, l: l, j: j2, i: i });
      }
      for (l = 0; l < L; l++) for (var j3 = 0; j3 < sz[l]; j3++) {
        var c = S.svg('circle', { cx: xs[l], cy: ys[l][j3], r: rad, class: 'node' }); ng.appendChild(c);
        var fill = S.svg('circle', { cx: xs[l], cy: ys[l][j3], r: rad - 1.5, class: 'sv-f0', 'fill-opacity': 0 }); ng.appendChild(fill);
        var tx = S.svg('text', { x: xs[l], y: ys[l][j3] + 3.5, 'text-anchor': 'middle', 'font-size': rad > 11 ? 9.5 : 8, text: '' }); tg.appendChild(tx);
        nodes.push({ fill: fill, tx: tx, l: l, j: j3 });
      }
      var names = ['x', 'y']; for (var q = 0; q < 2; q++) tg.appendChild(S.svg('text', { x: xs[0] - 22, y: ys[0][q] + 3.5, 'text-anchor': 'end', class: 't2', text: names[q] }));
      tg.appendChild(S.svg('text', { x: xs[L - 1] + 22, y: ys[L - 1][0] + 3.5, 'text-anchor': 'start', class: 't2', text: 'p' }));
      svgN.appendChild(eg); svgN.appendChild(ng); svgN.appendChild(tg);
      layout = { edges: edges, nodes: nodes };
    }

    function drawNet() {
      var A = P.forward(st.net, st.tr.X[st.follow]);
      layout.edges.forEach(function (e) {
        var w = st.net.W[e.l][e.j][e.i];
        e.el.setAttribute('stroke-width', (0.4 + Math.min(Math.abs(w), 3) * 1.5).toFixed(2));
        e.el.setAttribute('class', 'edge ' + (w >= 0 ? 'sv-s0' : 'sv-s1'));
        e.el.setAttribute('stroke-opacity', '0.8');
      });
      layout.nodes.forEach(function (n) {
        var a = A[n.l][n.j];
        n.tx.textContent = (Math.abs(a) < 0.005 ? '0' : a.toFixed(2).replace(/^(-?)0\./, '$1.'));
        var op = Math.min(0.75, Math.abs(a) * 0.75);
        n.fill.setAttribute('class', a >= 0 ? 'sv-f0' : 'sv-f1');
        n.fill.setAttribute('fill-opacity', op.toFixed(2));
      });
      return A[A.length - 1][0];
    }

    function drawMap() {
      var c = S.colours(), ctx = cv.getContext('2d'), W = cv.width, H = cv.height, N = 56, cell = W / N;
      var blue = rgb(c.c[0]), orange = rgb(c.c[1]), bg = rgb(c.bg);
      ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);
      for (var gy = 0; gy < N; gy++) for (var gx = 0; gx < N; gx++) {
        var x = ((gx + 0.5) / N) * 2 - 1, y = 1 - ((gy + 0.5) / N) * 2;
        var p = P.forward(st.net, [x, y]); p = p[p.length - 1][0];
        var col = mix(orange, blue, p), t = mix(bg, col, 0.42 + 0.3 * Math.abs(p - 0.5) * 2);
        ctx.fillStyle = 'rgb(' + t[0] + ',' + t[1] + ',' + t[2] + ')'; ctx.fillRect(gx * cell, gy * cell, cell + 0.6, cell + 0.6);
      }
      var pt = function (a, b) { return [(a + 1) / 2 * W, (1 - (b + 1) / 2) * H]; };
      function dot(X, y, hollow) {
        for (var k = 0; k < X.length; k++) {
          var q = pt(X[k][0], X[k][1]), cls = y[k] === 1, col = cls ? c.c[0] : c.c[1];
          ctx.lineWidth = hollow ? 2 : 1.5; ctx.strokeStyle = hollow ? col : c.ink; ctx.fillStyle = hollow ? c.bg : col;
          ctx.beginPath(); if (cls) ctx.arc(q[0], q[1], hollow ? 4.2 : 3.6, 0, 6.2832); else ctx.rect(q[0] - 3.6, q[1] - 3.6, 7.2, 7.2);
          ctx.fill(); ctx.stroke();
        }
      }
      dot(st.tr.X, st.tr.y, false); dot(st.te.X, st.te.y, true);
      var f = pt(st.tr.X[st.follow][0], st.tr.X[st.follow][1]);
      ctx.lineWidth = 3; ctx.strokeStyle = c.accent; ctx.beginPath(); ctx.arc(f[0], f[1], 9, 0, 6.2832); ctx.stroke();
    }

    function drawLoss() {
      var W = 520, H = 140, m = { l: 40, r: 10, t: 8, b: 22 }, c = S.colours();
      while (svgL.firstChild) svgL.removeChild(svgL.firstChild);
      var xmax = Math.max(100, st.epoch), ymax = Math.max(0.8, Math.min(2, Math.max.apply(null, st.hist.map(function (h) { return Math.max(h[1], h[2]); }))));
      var X = function (e) { return m.l + (e / xmax) * (W - m.l - m.r); }, Y = function (v) { return m.t + (1 - Math.min(v, ymax) / ymax) * (H - m.t - m.b); };
      [0, 0.25, 0.5, 0.75, 1].forEach(function (f) { var v = ymax * f; svgL.appendChild(S.svg('line', { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v), class: 'grid' })); svgL.appendChild(S.svg('text', { x: m.l - 5, y: Y(v) + 3.5, 'text-anchor': 'end', class: 't2', text: v.toFixed(2) })); });
      svgL.appendChild(S.svg('text', { x: m.l, y: H - 5, class: 't2', text: '0' })); svgL.appendChild(S.svg('text', { x: W - m.r, y: H - 5, 'text-anchor': 'end', class: 't2', text: 'epoch ' + xmax }));
      var step = Math.max(1, Math.floor(st.hist.length / 260));
      var path = function (idx) { var d = ''; for (var k = 0; k < st.hist.length; k += step) d += (d ? 'L' : 'M') + X(st.hist[k][0]).toFixed(1) + ' ' + Y(st.hist[k][idx]).toFixed(1); var last = st.hist[st.hist.length - 1]; d += 'L' + X(last[0]).toFixed(1) + ' ' + Y(last[idx]).toFixed(1); return d; };
      svgL.appendChild(S.svg('path', { d: path(1), class: 'edge sv-s0', 'stroke-width': 2.4 }));
      svgL.appendChild(S.svg('path', { d: path(2), class: 'edge sv-s1', 'stroke-width': 2.4, 'stroke-dasharray': '6 4' }));
      svgL.appendChild(S.svg('text', { x: W - m.r - 4, y: m.t + 12, 'text-anchor': 'end', class: 't2', text: 'solid blue: train   dashed orange: test' }));
    }

    function draw() {
      var e = P.evaluate(st.net, st.tr), v = P.evaluate(st.net, st.te), p = drawNet();
      drawMap(); drawLoss();
      rEpoch.set(String(st.epoch)); rTL.set(e.loss.toFixed(3)); rVL.set(v.loss.toFixed(3));
      rTA.set((e.acc * 100).toFixed(0) + '%'); rVA.set((v.acc * 100).toFixed(0) + '%'); rSel.set(p.toFixed(3));
      var t = 'Epoch ' + st.epoch, x;
      if (st.epoch === 0) return;
      if (e.acc >= 0.95 && v.acc >= 0.95) { t += ': learned it'; x = 'Both accuracies are high, so the network has found the pattern and it holds on points it did not train on.'; }
      else if (e.acc - v.acc > 0.12) { t += ': memorising'; x = 'Training accuracy is well above test accuracy: the network is fitting the training points more than the pattern.'; }
      else if (st.epoch >= 60 && e.loss >= st.init - 0.02) { t += ': not improving'; x = 'The loss has barely moved. The learning rate may be too small (tiny steps) or too large (jumping over the answer), or the network may be too simple for this pattern.'; }
      else { x = 'The loss is falling and the map is bending towards the pattern.'; }
      S.narrate(t, x);
      if (st.data === 'xor' && e.acc >= 0.95 && v.acc >= 0.95) S.challenge('xor');
      if (st.data === 'circle' && e.acc >= 0.95 && v.acc >= 0.95) S.challenge('circle');
      if (st.data === 'xor' && st.hidden === '1' && st.epoch >= 300 && v.acc < 0.8) S.challenge('one');
    }

    cv.addEventListener('click', function (ev) {
      var r = cv.getBoundingClientRect(), x = ((ev.clientX - r.left) / r.width) * 2 - 1, y = 1 - ((ev.clientY - r.top) / r.height) * 2, best = 0, bd = 9;
      st.tr.X.forEach(function (q, k) { var d = (q[0] - x) * (q[0] - x) + (q[1] - y) * (q[1] - y); if (d < bd) { bd = d; best = k; } });
      st.follow = best; draw();
    });
    S.onTheme(function () { if (st.net) draw(); });
    reset();
  });
})();
