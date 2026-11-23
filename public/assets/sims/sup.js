/* Simulation: supervised learning algorithms side by side on the same made-up points.
   k-nearest neighbours, logistic regression, a decision tree and Gaussian naive Bayes are written out here in plain
   JavaScript. The calculation is in AIQPSim.logic.sup so that scripts/check-sims.mjs can compare it with
   examples/sim-supervised/algorithms.py. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  Q.logic = Q.logic || {};

  function lcg(seed) { var s = seed >>> 0; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  var clamp = function (v) { return Math.max(-0.98, Math.min(0.98, v)); };

  // Made-up points in [-1, 1] x [-1, 1]. Class 1 is drawn blue, class 0 orange. Noise is a sum of three uniform numbers.
  function makeData(kind, n, seed) {
    var r = lcg(seed), X = [], y = [], g = function () { return (r() + r() + r() - 1.5) * 2; };
    for (var i = 0; i < n; i++) {
      var c = i % 2, x, v;
      if (kind === 'blobs') { var cx = c ? 0.4 : -0.4, cy = c ? 0.3 : -0.3; x = cx + 0.3 * g(); v = cy + 0.3 * g(); }
      else if (kind === 'moons') { var t = r() * Math.PI; if (c) { x = (1 - Math.cos(t) - 0.5) / 1.2 + 0.1 * g(); v = (1 - Math.sin(t) - 0.5) / 1.0 + 0.1 * g(); } else { x = (Math.cos(t) - 0.5) / 1.2 + 0.1 * g(); v = (Math.sin(t) - 0.25) / 1.0 + 0.1 * g(); } }
      else { var a = r() * 2 * Math.PI, rad = c ? 0.35 : 0.8; x = rad * Math.cos(a) + 0.09 * g(); v = rad * Math.sin(a) + 0.09 * g(); }
      X.push([clamp(x), clamp(v)]); y.push(c);
    }
    return { X: X, y: y };
  }

  // Each fit returns a function: point -> chance of class 1.
  function fitKnn(d, k) {
    return function (p) {
      var idx = d.X.map(function (q, i) { return { i: i, d: (q[0] - p[0]) * (q[0] - p[0]) + (q[1] - p[1]) * (q[1] - p[1]) }; });
      idx.sort(function (a, b) { return a.d - b.d || a.i - b.i; });
      var s = 0, kk = Math.min(k, idx.length); for (var j = 0; j < kk; j++) s += d.y[idx[j].i];
      return s / kk;
    };
  }
  function fitLogistic(d, steps) {
    var n = d.X.length, m = [0, 0], sd = [0, 0];
    for (var f = 0; f < 2; f++) { d.X.forEach(function (q) { m[f] += q[f] / n; }); d.X.forEach(function (q) { sd[f] += (q[f] - m[f]) * (q[f] - m[f]) / n; }); sd[f] = Math.sqrt(sd[f]) || 1; }
    var w = [0, 0], b = 0, Z = d.X.map(function (q) { return [(q[0] - m[0]) / sd[0], (q[1] - m[1]) / sd[1]]; });
    for (var s = 0; s < steps; s++) {
      var g0 = 0, g1 = 0, gb = 0;
      for (var i = 0; i < n; i++) { var p = 1 / (1 + Math.exp(-(w[0] * Z[i][0] + w[1] * Z[i][1] + b))), e = p - d.y[i]; g0 += e * Z[i][0] / n; g1 += e * Z[i][1] / n; gb += e / n; }
      w[0] -= 0.5 * g0; w[1] -= 0.5 * g1; b -= 0.5 * gb;
    }
    return function (p) { return 1 / (1 + Math.exp(-(w[0] * (p[0] - m[0]) / sd[0] + w[1] * (p[1] - m[1]) / sd[1] + b))); };
  }
  function gini(ones, n) { if (!n) return 0; var p = ones / n; return 2 * p * (1 - p); }
  // Entropy in bits: 0 for a pure group, 1 for a 50/50 mix of two classes.
  function entropy(ones, n) { if (!n) return 0; var p = ones / n; return p <= 0 || p >= 1 ? 0 : -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p)); }
  function buildTree(X, y, idx, depth, maxDepth, measure) {
    var imp = measure === 'entropy' ? entropy : gini;
    var ones = 0; idx.forEach(function (i) { ones += y[i]; });
    var node = { p: idx.length ? ones / idx.length : 0.5 };
    if (depth >= maxDepth || ones === 0 || ones === idx.length || idx.length < 2) return node;
    var best = null;
    for (var f = 0; f < 2; f++) {
      var s = idx.slice().sort(function (a, b) { return X[a][f] - X[b][f] || a - b; }), left1 = 0;
      for (var k = 0; k + 1 < s.length; k++) {
        left1 += y[s[k]];
        if (X[s[k]][f] === X[s[k + 1]][f]) continue;
        var nl = k + 1, nr = s.length - nl, score = (nl * imp(left1, nl) + nr * imp(ones - left1, nr)) / s.length;
        if (best === null || score < best.score - 1e-12) best = { score: score, f: f, t: (X[s[k]][f] + X[s[k + 1]][f]) / 2 };
      }
    }
    if (!best) return node;
    var L = [], R = []; idx.forEach(function (i) { (X[i][best.f] <= best.t ? L : R).push(i); });
    if (!L.length || !R.length) return node;
    node.f = best.f; node.t = best.t; node.l = buildTree(X, y, L, depth + 1, maxDepth, measure); node.r = buildTree(X, y, R, depth + 1, maxDepth, measure);
    return node;
  }
  function fitTree(d, depth, measure) {
    var root = buildTree(d.X, d.y, d.X.map(function (q, i) { return i; }), 0, depth, measure);
    return function (p) { var n = root; while (n.l) n = p[n.f] <= n.t ? n.l : n.r; return n.p; };
  }
  function fitNB(d) {
    var st = [0, 1].map(function (c) {
      var pts = d.X.filter(function (q, i) { return d.y[i] === c; }), n = pts.length, out = { prior: n / d.X.length, m: [0, 0], v: [0, 0] };
      for (var f = 0; f < 2; f++) { pts.forEach(function (q) { out.m[f] += q[f] / n; }); pts.forEach(function (q) { out.v[f] += (q[f] - out.m[f]) * (q[f] - out.m[f]) / n; }); out.v[f] += 1e-3; }
      return out;
    });
    return function (p) {
      var lp = st.map(function (s) { var t = Math.log(s.prior); for (var f = 0; f < 2; f++) t += -0.5 * Math.log(2 * Math.PI * s.v[f]) - (p[f] - s.m[f]) * (p[f] - s.m[f]) / (2 * s.v[f]); return t; });
      var m = Math.max(lp[0], lp[1]), e0 = Math.exp(lp[0] - m), e1 = Math.exp(lp[1] - m);
      return e1 / (e0 + e1);
    };
  }
  function evaluate(pred, d) {
    var hit = 0, tp = 0, fp = 0, fn = 0, tn = 0;
    d.X.forEach(function (p, i) { var c = pred(p) >= 0.5 ? 1 : 0; if (c === d.y[i]) hit++; if (c && d.y[i]) tp++; else if (c) fp++; else if (d.y[i]) fn++; else tn++; });
    return { acc: hit / d.X.length, tp: tp, fp: fp, fn: fn, tn: tn };
  }
  var ALGS = { knn: ['k-nearest neighbours', function (d, o) { return fitKnn(d, o.k); }], logistic: ['Logistic regression', function (d, o) { return fitLogistic(d, o.steps); }],
    tree: ['Decision tree', function (d, o) { return fitTree(d, o.depth, o.measure); }], nb: ['Naive Bayes', function (d) { return fitNB(d); }] };
  Q.logic.sup = { lcg: lcg, makeData: makeData, fitKnn: fitKnn, fitLogistic: fitLogistic, fitTree: fitTree, fitNB: fitNB, evaluate: evaluate, ALGS: ALGS,
    DEFAULTS: { trainN: 100, testN: 60, trainSeed: 3, testSeed: 17, k: 5, depth: 3, steps: 300 } };

  // ---- page part ----
  if (typeof document === 'undefined') return;
  var P = Q.logic.sup;
  function rgb(hex) { var h = hex.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function mix(a, b, t) { return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)]; }
  var pc = function (v) { return (v * 100).toFixed(0) + '%'; };

  Q.register('sup', function (S) {
    var D = P.DEFAULTS, st = { data: 'moons', alg: 'logistic', add: 'off', tr: null, te: null, extra: 0 };
    if (S.preset === 'circles') st.data = 'circles';
    if (S.preset === 'blobs') st.data = 'blobs';
    if (S.preset === 'tree') st.alg = 'tree';
    if (S.preset === 'knn') st.alg = 'knn';
    var cData = S.select('data', 'Pattern in the data', [['blobs', 'Two blobs'], ['moons', 'Two moons'], ['circles', 'Circle inside a ring']], st.data, function (v) { st.data = v; resetData(); });
    var cAlg = S.select('alg', 'Algorithm', Object.keys(P.ALGS).map(function (k) { return [k, P.ALGS[k][0]]; }), st.alg, function (v) { st.alg = v; showSettings(); draw(); });
    var cK = S.range('k', 'k: how many neighbours vote', { min: 1, max: 25, step: 1, value: D.k, onChange: function () { draw(); } });
    var cDepth = S.range('depth', 'Maximum depth of the tree', { min: 1, max: 8, step: 1, value: D.depth, onChange: function () { draw(); } });
    var cMeasure = S.select('measure', 'How the tree measures a mixed group', [['gini', 'Gini impurity'], ['entropy', 'Entropy (information gain)']], 'gini', function () { draw(); });
    var cSteps = S.range('steps', 'Training steps (gradient descent)', { min: 5, max: 500, step: 5, value: D.steps, onChange: function () { draw(); } });
    var cAdd = S.select('add', 'Clicking the map adds a training point of', [['off', 'nothing'], ['1', 'class 1 (circle)'], ['0', 'class 0 (square)']], 'off', function (v) { st.add = v; });
    var B = S.buttons([
      { id: 'a1', label: 'Add 5 random class 1 points', onClick: function () { addRandom(1); } },
      { id: 'a0', label: 'Add 5 random class 0 points', onClick: function () { addRandom(0); } },
      { id: 'reset', label: 'Reset the points', onClick: function () { resetData(); } }
    ]);
    function showSettings() { cK.input.closest('.sim-ctl').hidden = st.alg !== 'knn'; cDepth.input.closest('.sim-ctl').hidden = st.alg !== 'tree'; cMeasure.input.closest('.sim-ctl').hidden = st.alg !== 'tree'; cSteps.input.closest('.sim-ctl').hidden = st.alg !== 'logistic'; }

    var row = S.row();
    var cardMap = S.card('What the algorithm decides at each place (click to add a point if you chose a class)', row);
    var cv = S.canvas(300, 300, 'Map of two measurements. The background colour shows which class the chosen algorithm predicts at each place. Circles are class 1, squares are class 0, hollow shapes are test points.', cardMap);
    var leg = S.el('ul', { class: 'sim-legend' }); leg.innerHTML = '<li class="l0"><i></i>class 1 (circle)</li><li class="l1"><i></i>class 0 (square)</li><li>filled = used for learning</li><li>hollow = test point</li>'; cardMap.appendChild(leg);
    var cardCmp = S.card('All four algorithms on these points (your current settings)', row);
    var tbl = S.el('table', { class: 'sim-table' }); cardCmp.appendChild(tbl);
    var cardCm = S.card('Test results of the chosen algorithm (class 1 counts as "positive")', S.view);
    var tc = S.el('table', { class: 'sim-table' }); cardCm.appendChild(tc);
    var rTr = S.readout('tr', 'Training accuracy'), rTe = S.readout('te', 'Test accuracy'), rN = S.readout('n', 'Training points');

    function settings() { return { k: cK.get(), depth: cDepth.get(), steps: cSteps.get(), measure: cMeasure.get() }; }
    function resetData() { st.tr = P.makeData(st.data, D.trainN, D.trainSeed); st.te = P.makeData(st.data, D.testN, D.testSeed); st.extra = 0; draw(); }
    function addRandom(c) {
      var r = P.lcg(100 + st.extra * 7 + c), src = P.makeData(st.data, 40, 500 + st.extra * 13 + c), added = 0;
      for (var i = 0; i < src.X.length && added < 5; i++) if (src.y[i] === c) { st.tr.X.push(src.X[i]); st.tr.y.push(c); added++; }
      st.extra++; draw();
    }
    function draw() {
      var o = settings(), fit = P.ALGS[st.alg][1](st.tr, o), c = S.colours(), ctx = cv.getContext('2d'), W = cv.width, H = cv.height, N = 60, cell = W / N;
      var blue = rgb(c.c[0]), orange = rgb(c.c[1]), bg = rgb(c.bg);
      ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);
      for (var gy = 0; gy < N; gy++) for (var gx = 0; gx < N; gx++) {
        var p = fit([((gx + 0.5) / N) * 2 - 1, 1 - ((gy + 0.5) / N) * 2]), col = mix(orange, blue, p), t = mix(bg, col, 0.4 + 0.3 * Math.abs(p - 0.5) * 2);
        ctx.fillStyle = 'rgb(' + t[0] + ',' + t[1] + ',' + t[2] + ')'; ctx.fillRect(gx * cell, gy * cell, cell + 0.6, cell + 0.6);
      }
      function dots(d, hollow) {
        d.X.forEach(function (q, i) {
          var x = (q[0] + 1) / 2 * W, y = (1 - (q[1] + 1) / 2) * H, one = d.y[i] === 1, col = one ? c.c[0] : c.c[1];
          ctx.lineWidth = hollow ? 2 : 1.5; ctx.strokeStyle = hollow ? col : c.ink; ctx.fillStyle = hollow ? c.bg : col;
          ctx.beginPath(); if (one) ctx.arc(x, y, hollow ? 4.4 : 3.8, 0, 6.2832); else ctx.rect(x - 3.8, y - 3.8, 7.6, 7.6); ctx.fill(); ctx.stroke();
        });
      }
      dots(st.tr, false); dots(st.te, true);
      var a = P.evaluate(fit, st.tr), b = P.evaluate(fit, st.te);
      rTr.set(pc(a.acc)); rTe.set(pc(b.acc)); rN.set(String(st.tr.X.length));
      tc.innerHTML = '<thead><tr><th></th><th>Predicted 1</th><th>Predicted 0</th></tr></thead><tbody><tr><th>Really 1</th><td>' + b.tp + '</td><td>' + b.fn + '</td></tr><tr><th>Really 0</th><td>' + b.fp + '</td><td>' + b.tn + '</td></tr></tbody>';
      tbl.innerHTML = '<thead><tr><th>Algorithm</th><th>Training</th><th>Test</th></tr></thead>'; var tb = S.el('tbody');
      Object.keys(P.ALGS).forEach(function (k) { var f = P.ALGS[k][1](st.tr, o), e1 = P.evaluate(f, st.tr), e2 = P.evaluate(f, st.te), tr = S.el('tr'); tr.appendChild(S.el('th', { text: P.ALGS[k][0] + (k === st.alg ? ' (chosen)' : '') })); tr.appendChild(S.el('td', { text: pc(e1.acc) })); tr.appendChild(S.el('td', { text: pc(e2.acc) })); tb.appendChild(tr); });
      tbl.appendChild(tb);
      var gap = a.acc - b.acc, t2 = P.ALGS[st.alg][0] + ' on ' + { blobs: 'two blobs', moons: 'two moons', circles: 'a circle in a ring' }[st.data];
      S.narrate(t2 + ': ' + pc(b.acc) + ' right on the test points', a.acc >= 0.999 && gap > 0.05 ? 'Perfect on the points it learned from, worse on new ones: it has memorised the training points (overfitting).' : b.acc < 0.75 ? 'This algorithm cannot draw the boundary this pattern needs. Try another algorithm and compare the table.' : 'Training and test accuracy are close, so the boundary generalises to points it has not seen.');
      if (b.acc >= 0.9 && st.data === 'moons') S.challenge('moons');
      if (a.acc >= 0.999 && gap >= 0.05) S.challenge('overfit');
      if (st.alg === 'logistic' && st.data === 'circles' && b.acc < 0.75) S.challenge('line');
    }
    cv.addEventListener('click', function (ev) {
      if (st.add === 'off') return;
      var r = cv.getBoundingClientRect(), x = ((ev.clientX - r.left) / r.width) * 2 - 1, y = 1 - ((ev.clientY - r.top) / r.height) * 2;
      st.tr.X.push([x, y]); st.tr.y.push(Number(st.add)); draw();
    });
    S.onTheme(draw);
    showSettings(); resetData();
  });
})();
