/* Calculations shared by the Phase 2 simulations (regression, classification, bias and variance, cross-validation,
   clustering, PCA, anomalies). Everything is in AIQPSim.logic.core so scripts/check-sims.mjs can compare it with
   examples/sim-core/core.py. Needs sup.js (made-up data, k-nearest neighbours, logistic regression). */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  Q.logic = Q.logic || {};
  function lcg(seed) { var s = seed >>> 0; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  function gauss(r) { return (r() + r() + r() - 1.5) * 2; }
  function sum(a) { var s = 0; a.forEach(function (v) { s += v; }); return s; }
  function d2(a, b) { return (a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]); }
  var C = {};

  // ---- regression ----
  C.regData = function (seed, n, noise, outlier) { var r = lcg(seed), X = [], Y = []; for (var i = 0; i < n; i++) { var x = -0.9 + 1.8 * r(); X.push(x); Y.push(1.5 * x + 0.3 + noise * gauss(r)); } if (outlier) { X.push(0.9); Y.push(-1.5); } return { X: X, Y: Y }; };
  C.ols = function (X, Y, lam) { var n = X.length, mx = sum(X) / n, my = sum(Y) / n, sxx = 0, sxy = 0; X.forEach(function (x, i) { sxx += (x - mx) * (x - mx); sxy += (x - mx) * (Y[i] - my); }); var a = sxy / (sxx + lam); return { a: a, b: my - a * mx }; };
  C.mse = function (X, Y, a, b) { var s = 0; X.forEach(function (x, i) { s += Math.pow(Y[i] - (a * x + b), 2); }); return s / X.length; };
  C.r2 = function (X, Y, a, b) { var my = sum(Y) / Y.length, e = 0, t = 0; X.forEach(function (x, i) { e += Math.pow(Y[i] - (a * x + b), 2); t += Math.pow(Y[i] - my, 2); }); return 1 - e / t; };

  // ---- classification ----
  C.clsData = function (seed, n) { var r = lcg(seed), X = [], y = []; for (var i = 0; i < n; i++) { var c = i % 2, cx = c ? 0.22 : -0.22, cy = c ? 0.18 : -0.18; X.push([cx + 0.3 * gauss(r), cy + 0.3 * gauss(r)]); y.push(c); } return { X: X, y: y }; };
  C.confusion = function (p, y, thr) { var tp = 0, fp = 0, fn = 0, tn = 0; p.forEach(function (a, i) { if (a >= thr) { if (y[i]) tp++; else fp++; } else if (y[i]) fn++; else tn++; }); return { tp: tp, fp: fp, fn: fn, tn: tn }; };
  C.roc = function (p, y) {
    var order = p.map(function (v, i) { return i; }).sort(function (a, b) { return p[b] - p[a] || a - b; }), P = sum(y), N = y.length - P, tp = 0, fp = 0, pts = [[0, 0]], auc = 0;
    order.forEach(function (i) { if (y[i]) tp++; else fp++; pts.push([fp / N, tp / P]); });
    for (var i = 1; i < pts.length; i++) auc += (pts[i][0] - pts[i - 1][0]) * (pts[i][1] + pts[i - 1][1]) / 2;
    return { pts: pts, auc: auc };
  };

  // ---- bias and variance ----
  C.polyData = function (seed, n, noise) { var r = lcg(seed), X = [], Y = []; for (var i = 0; i < n; i++) { var x = -1 + 2 * r(); X.push(x); Y.push(Math.sin(3 * x) + noise * gauss(r)); } return { X: X, Y: Y }; };
  C.polyFit = function (X, Y, deg) {
    var m = deg + 1, A = [], b = [], i, j, k, c;
    for (i = 0; i < m; i++) { A.push([]); for (j = 0; j < m; j++) { var s = 0; X.forEach(function (x) { s += Math.pow(x, i + j); }); A[i].push(s); } var t = 0; X.forEach(function (x, q) { t += Y[q] * Math.pow(x, i); }); b.push(t); }
    for (c = 0; c < m; c++) {
      var piv = c; for (i = c + 1; i < m; i++) if (Math.abs(A[i][c]) > Math.abs(A[piv][c])) piv = i;
      var tmp = A[c]; A[c] = A[piv]; A[piv] = tmp; var tb = b[c]; b[c] = b[piv]; b[piv] = tb;
      for (i = c + 1; i < m; i++) { var f = A[i][c] / A[c][c]; for (k = c; k < m; k++) A[i][k] -= f * A[c][k]; b[i] -= f * b[c]; }
    }
    var w = []; for (i = 0; i < m; i++) w.push(0);
    for (i = m - 1; i >= 0; i--) { var u = b[i]; for (j = i + 1; j < m; j++) u -= A[i][j] * w[j]; w[i] = u / A[i][i]; }
    return w;
  };
  C.polyAt = function (w, x) { var s = 0; w.forEach(function (c, i) { s += c * Math.pow(x, i); }); return s; };
  C.polyMse = function (w, X, Y) { var s = 0; X.forEach(function (x, i) { s += Math.pow(Y[i] - C.polyAt(w, x), 2); }); return s / X.length; };

  // ---- cross-validation ----
  C.folds = function (n, k, seed) { var r = lcg(seed), idx = [], i; for (i = 0; i < n; i++) idx.push(i); for (i = n - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = idx[i]; idx[i] = idx[j]; idx[j] = t; } var fold = []; idx.forEach(function (v, pos) { fold[v] = pos % k; }); return fold; };
  C.cvScores = function (X, y, k, seed, kk) {
    var S = Q.logic.sup, fold = C.folds(X.length, k, seed), out = [];
    for (var f = 0; f < k; f++) {
      var tr = [], te = []; X.forEach(function (q, i) { (fold[i] === f ? te : tr).push(i); });
      var pred = S.fitKnn({ X: tr.map(function (i) { return X[i]; }), y: tr.map(function (i) { return y[i]; }) }, kk), hit = 0;
      te.forEach(function (i) { if ((pred(X[i]) >= 0.5 ? 1 : 0) === y[i]) hit++; }); out.push(hit / te.length);
    }
    return out;
  };

  // ---- clustering ----
  C.blobs3 = function (n, seed) { var r = lcg(seed), cs = [[-0.6, -0.5], [0.6, -0.4], [0, 0.6]], X = []; for (var i = 0; i < n; i++) { var c = cs[i % 3], x = c[0] + 0.18 * gauss(r), y = c[1] + 0.18 * gauss(r); X.push([x, y]); } return X; };
  // History of k-means: each entry is one assign or move, with the centres, labels and inertia at that moment.
  C.kmeans = function (X, k, seed, maxIter) {
    var r = lcg(seed), pick = [], i, c; while (pick.length < k) { i = Math.floor(r() * X.length); if (pick.indexOf(i) < 0) pick.push(i); }
    var Ce = pick.map(function (j) { return X[j].slice(); }), prev = null, hist = [], lab;
    for (var it = 0; it < (maxIter || 30); it++) {
      lab = X.map(function (p) { var b = 0; for (c = 1; c < k; c++) if (d2(p, Ce[c]) < d2(p, Ce[b])) b = c; return b; });
      var inertia = 0; X.forEach(function (p, q) { inertia += d2(p, Ce[lab[q]]); });
      hist.push({ phase: 'assign', C: Ce.map(function (a) { return a.slice(); }), lab: lab, inertia: inertia });
      if (prev && prev.join() === lab.join()) break;
      prev = lab;
      for (c = 0; c < k; c++) { var mx = 0, my = 0, cnt = 0; X.forEach(function (p, q) { if (lab[q] === c) { mx += p[0]; my += p[1]; cnt++; } }); if (cnt) Ce[c] = [mx / cnt, my / cnt]; }
      var in2 = 0; X.forEach(function (p, q) { in2 += d2(p, Ce[lab[q]]); });
      hist.push({ phase: 'move', C: Ce.map(function (a) { return a.slice(); }), lab: lab, inertia: in2 });
    }
    return hist;
  };
  C.dbscan = function (X, eps, minPts) {
    var n = X.length, nb = [], lab = [], i, j, c = -1;
    for (i = 0; i < n; i++) { var l = []; for (j = 0; j < n; j++) if (d2(X[i], X[j]) <= eps * eps) l.push(j); nb.push(l); lab.push(null); }
    for (i = 0; i < n; i++) {
      if (lab[i] !== null || nb[i].length < minPts) continue;
      c++; lab[i] = c; var queue = nb[i].slice();
      while (queue.length) { j = queue.shift(); if (lab[j] === null) { lab[j] = c; if (nb[j].length >= minPts) queue = queue.concat(nb[j]); } }
    }
    return lab;
  };

  // ---- PCA ----
  C.pcaData = function (seed, n) {
    var r = lcg(seed), X = [], ca = Math.cos(30 * Math.PI / 180), sa = Math.sin(30 * Math.PI / 180);
    for (var i = 0; i < n; i++) { var t = 0.6 * gauss(r), e = 0.15 * gauss(r); X.push([t * ca - e * sa, t * sa + e * ca]); }
    var mx = 0, my = 0; X.forEach(function (p) { mx += p[0] / n; my += p[1] / n; });
    return X.map(function (p) { return [p[0] - mx, p[1] - my]; });
  };
  C.pcaStats = function (X) { var n = X.length, a = 0, b = 0, c = 0; X.forEach(function (p) { a += p[0] * p[0]; b += p[1] * p[1]; c += p[0] * p[1]; }); return [a / n, b / n, c / n]; };
  C.varAlong = function (s, deg) { var t = deg * Math.PI / 180, co = Math.cos(t), si = Math.sin(t); return s[0] * co * co + 2 * s[2] * si * co + s[1] * si * si; };
  C.bestAngle = function (s) { var d = 0.5 * Math.atan2(2 * s[2], s[0] - s[1]) * 180 / Math.PI; return ((d % 180) + 180) % 180; };

  // ---- anomalies ----
  C.ODD = [[0.9, 0.85], [-0.9, 0.7], [0.8, -0.9], [-0.85, -0.8]];
  C.anomalyData = function (seed, n) { var r = lcg(seed), X = []; for (var i = 0; i < n; i++) X.push([0.25 * gauss(r), 0.25 * gauss(r)]); return X.concat(C.ODD.map(function (p) { return p.slice(); })); };
  C.knnScores = function (X, k) { return X.map(function (p, i) { var ds = []; X.forEach(function (q, j) { if (j !== i) ds.push(Math.sqrt(d2(p, q))); }); ds.sort(function (a, b) { return a - b; }); return ds[k - 1]; }); };
  C.flag = function (scores, contamination) { var cnt = Math.ceil(contamination * scores.length - 1e-9), order = scores.map(function (v, i) { return i; }).sort(function (a, b) { return scores[b] - scores[a] || a - b; }), set = {}; order.slice(0, cnt).forEach(function (i) { set[i] = 1; }); return set; };

  Q.logic.core = C;
  if (typeof document === 'undefined') return;
  // Small SVG scatter helper: map(W, H, pad, xr, yr) gives X() and Y(); frame() draws the axes; dots() draws points.
  Q.plot = {
    map: function (W, H, pad, xr, yr) { return { X: function (v) { return pad + (v - xr[0]) / (xr[1] - xr[0]) * (W - 2 * pad); }, Y: function (v) { return H - pad - (v - yr[0]) / (yr[1] - yr[0]) * (H - 2 * pad); } }; },
    clear: function (svg) { while (svg.firstChild) svg.removeChild(svg.firstChild); },
    frame: function (S, svg, m, W, H, pad, xr, yr) { svg.appendChild(S.svg('line', { x1: pad, y1: m.Y(yr[0]), x2: W - pad, y2: m.Y(yr[0]), class: 'axis' })); svg.appendChild(S.svg('line', { x1: m.X(xr[0]), y1: pad, x2: m.X(xr[0]), y2: H - pad, class: 'axis' })); },
    dot: function (S, svg, x, y, cls, hollow) { var cc = cls ? 'sv-f0' : 'sv-f1'; return svg.appendChild(cls ? S.svg('circle', { cx: x, cy: y, r: 4.2, class: cc, 'fill-opacity': hollow ? 0.35 : 0.9 }) : S.svg('rect', { x: x - 3.8, y: y - 3.8, width: 7.6, height: 7.6, class: cc, 'fill-opacity': hollow ? 0.35 : 0.9 })); }
  };
})();
