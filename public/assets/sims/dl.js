/* Calculations for the Phase 4 simulations (convolution, a running state over a sentence, word weights, autoencoder and
   diffusion, message passing on a graph, spectrogram, reinforcement learning). Everything is in AIQPSim.logic.dl so
   scripts/check-sims.mjs can compare it with examples/sim-dl/dl.py. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  Q.logic = Q.logic || {};
  function lcg(seed) { var s = seed >>> 0; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  function gauss(r) { return (r() + r() + r() - 1.5) * 2; }
  var D = {}, i, j;

  // ---- convolution ----
  function grid(f) { var m = []; for (var r = 0; r < 8; r++) { m.push([]); for (var c = 0; c < 8; c++) m[r].push(f(r, c) ? 1 : 0); } return m; }
  D.IMAGES = { bar: grid(function (r, c) { return c === 3 || c === 4; }), square: grid(function (r, c) { return r >= 2 && r <= 5 && c >= 2 && c <= 5; }), diagonal: grid(function (r, c) { return r === c; }) };
  D.KERNELS = { 'vertical edge': [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]], 'horizontal edge': [[-1, -1, -1], [0, 0, 0], [1, 1, 1]], blur: [[1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9]] };
  D.conv2d = function (img, ker, stride, pad) {
    var n = img.length, k = ker.length, P = [], r, c, a, b;
    for (r = 0; r < n + 2 * pad; r++) { P.push([]); for (c = 0; c < n + 2 * pad; c++) P[r].push(0); }
    for (r = 0; r < n; r++) for (c = 0; c < n; c++) P[r + pad][c + pad] = img[r][c];
    var size = Math.floor((n + 2 * pad - k) / stride) + 1, out = [];
    for (r = 0; r < size; r++) { out.push([]); for (c = 0; c < size; c++) { var s = 0; for (a = 0; a < k; a++) for (b = 0; b < k; b++) s += P[r * stride + a][c * stride + b] * ker[a][b]; out[r].push(s); } }
    return out;
  };
  D.maxpool2 = function (m) { var s = Math.floor(m.length / 2), out = []; for (var r = 0; r < s; r++) { out.push([]); for (var c = 0; c < s; c++) out[r].push(Math.max(m[2 * r][2 * c], m[2 * r][2 * c + 1], m[2 * r + 1][2 * c], m[2 * r + 1][2 * c + 1])); } return out; };

  // ---- a running state over a sentence ----
  D.SENTENCES = [[['great', 1], ['opening', 0], ['but', 0], ['dull', -1], ['slow', -1], ['ending', 0]], [['awful', -1], ['start', 0], ['then', 0], ['improves', 1], ['gets', 0], ['great', 1]]];
  D.runState = function (sent, a, b) { var h = 0, out = []; sent.forEach(function (w) { h = Math.tanh(a * h + b * w[1]); out.push(h); }); return out; };

  // ---- word weights ----
  D.DOCS = ['great film great acting loved the film', 'boring film slow plot hated the plot', 'great plot fast acting loved it', 'slow boring ending hated it'];
  var STOP = { the: 1, it: 1 };
  D.tfVectors = function (useIdf) {
    var docs = D.DOCS.map(function (d) { return d.split(' ').filter(function (w) { return !STOP[w]; }); }), n = docs.length, seen = {}, vocab = [];
    docs.forEach(function (d) { d.forEach(function (w) { if (!seen[w]) { seen[w] = 1; vocab.push(w); } }); }); vocab.sort();
    var idf = {}; vocab.forEach(function (w) { var df = 0; docs.forEach(function (d) { if (d.indexOf(w) >= 0) df++; }); idf[w] = useIdf ? Math.log((n + 1) / (df + 1)) + 1 : 1; });
    return docs.map(function (d) { var v = {}; vocab.forEach(function (w) { var c = 0; d.forEach(function (x) { if (x === w) c++; }); if (d.indexOf(w) >= 0) v[w] = c * idf[w]; }); return v; });
  };
  D.cosine = function (a, b) { var num = 0, na = 0, nb = 0; Object.keys(a).forEach(function (w) { num += a[w] * (b[w] || 0); na += a[w] * a[w]; }); Object.keys(b).forEach(function (w) { nb += b[w] * b[w]; }); return num / (Math.sqrt(na) * Math.sqrt(nb)); };

  // ---- autoencoder and diffusion ----
  D.aeData = function () {
    var r = lcg(21), u = [], v = [], X = [], k;
    for (i = 0; i < 8; i++) u.push(gauss(r)); for (i = 0; i < 8; i++) v.push(gauss(r));
    for (k = 0; k < 40; k++) { var z1 = gauss(r), z2 = 0.6 * gauss(r), row = []; for (i = 0; i < 8; i++) row.push(z1 * u[i] + z2 * v[i] + 0.1 * gauss(r)); X.push(row); }
    var mean = []; for (i = 0; i < 8; i++) { var s = 0; X.forEach(function (row) { s += row[i]; }); mean.push(s / 40); }
    return X.map(function (row) { return row.map(function (x, q) { return x - mean[q]; }); });
  };
  D.components = function (X, count) {
    var n = X.length, C = [], out = [], c, it;
    for (i = 0; i < 8; i++) { C.push([]); for (j = 0; j < 8; j++) { var s = 0; for (var k = 0; k < n; k++) s += X[k][i] * X[k][j]; C[i].push(s / n); } }
    for (c = 0; c < count; c++) {
      var w = []; for (i = 0; i < 8; i++) w.push(1 / Math.sqrt(8)); var lam = 0;
      for (it = 0; it < 80; it++) { var y = []; for (i = 0; i < 8; i++) { var t = 0; for (j = 0; j < 8; j++) t += C[i][j] * w[j]; y.push(t); } lam = 0; y.forEach(function (q) { lam += q * q; }); lam = Math.sqrt(lam); w = y.map(function (q) { return q / lam; }); }
      out.push(w); for (i = 0; i < 8; i++) for (j = 0; j < 8; j++) C[i][j] -= lam * w[i] * w[j];
    }
    return out;
  };
  D.reconstruct = function (x, comps) { var out = []; for (i = 0; i < 8; i++) out.push(0); comps.forEach(function (w) { var s = 0; for (i = 0; i < 8; i++) s += x[i] * w[i]; for (i = 0; i < 8; i++) out[i] += s * w[i]; }); return out; };
  D.aeError = function (X, comps) { var num = 0, den = 0; X.forEach(function (x) { var rc = D.reconstruct(x, comps); for (var q = 0; q < 8; q++) { num += Math.pow(x[q] - rc[q], 2); den += x[q] * x[q]; } }); return Math.sqrt(num / den); };
  D.SIGNAL = []; for (i = 0; i < 32; i++) D.SIGNAL.push(Math.sin(2 * Math.PI * i / 32));
  D.alphaBar = function (t) { var a = 1; for (var s = 1; s <= t; s++) a *= 1 - (0.01 + 0.29 * (s - 1) / 19); return a; };
  D.noisy = function (t, eps) { var ab = D.alphaBar(t); return D.SIGNAL.map(function (s, q) { return Math.sqrt(ab) * s + Math.sqrt(1 - ab) * eps[q]; }); };
  D.rms = function (a, b) { var s = 0; a.forEach(function (x, q) { s += (x - b[q]) * (x - b[q]); }); return Math.sqrt(s / a.length); };
  D.noise = function (seed) { var r = lcg(seed), o = []; for (var q = 0; q < 32; q++) o.push(gauss(r)); return o; };

  // ---- message passing on a graph ----
  D.EDGES = [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [4, 5]];
  D.NODES = [[0.1, 0.5], [0.3, 0.5], [0.5, 0.2], [0.8, 0.2], [0.9, 0.7], [0.55, 0.8]];
  D.neighbours = function () { var nb = [[], [], [], [], [], []]; D.EDGES.forEach(function (e) { nb[e[0]].push(e[1]); nb[e[1]].push(e[0]); }); return nb; };
  D.messageRound = function (h, w) { var nb = D.neighbours(); return h.map(function (v, q) { var s = 0; nb[q].forEach(function (k) { s += h[k]; }); return w * v + (1 - w) * s / nb[q].length; }); };

  // ---- spectrogram ----
  D.signal = function () { var out = []; for (var n = 0; n < 512; n++) { var v = Math.sin(2 * Math.PI * (n < 256 ? 100 : 250) * n / 1000); if (n === 300) v += 3; out.push(v); } return out; };
  D.spectrogram = function (sig, N) {
    var hop = Math.floor(N / 2), frames = Math.floor((sig.length - N) / hop) + 1, win = [], out = [], f, b, k;
    for (k = 0; k < N; k++) win.push(0.5 - 0.5 * Math.cos(2 * Math.PI * k / (N - 1)));
    for (f = 0; f < frames; f++) { var seg = []; for (k = 0; k < N; k++) seg.push(sig[f * hop + k] * win[k]); var row = []; for (b = 0; b <= N / 2; b++) { var re = 0, im = 0; for (k = 0; k < N; k++) { re += seg[k] * Math.cos(2 * Math.PI * b * k / N); im += seg[k] * Math.sin(2 * Math.PI * b * k / N); } row.push(Math.sqrt(re * re + im * im)); } out.push(row); }
    return out;
  };
  D.peak = function (row, N) { var b = 0; row.forEach(function (v, q) { if (v > row[b]) b = q; }); return b * 1000 / N; };

  // ---- reinforcement learning ----
  D.MOVES = [[0, 1], [1, 0], [0, -1], [-1, 0]]; D.GOAL = 15; D.PIT = 6; D.ARROWS = ['↑', '→', '↓', '←'];
  D.gridStep = function (s, a) { var x = Math.min(3, Math.max(0, s % 4 + D.MOVES[a][0])), y = Math.min(3, Math.max(0, Math.floor(s / 4) + D.MOVES[a][1])), t = y * 4 + x; if (t === D.GOAL) return { t: t, r: 1, done: true }; if (t === D.PIT) return { t: t, r: -1, done: true }; return { t: t, r: -0.04, done: false }; };
  D.best = function (q) { var b = 0; for (var k = 1; k < q.length; k++) if (q[k] > q[b]) b = k; return b; };
  D.newQ = function () { var Qm = []; for (var s = 0; s < 16; s++) Qm.push([0, 0, 0, 0]); return Qm; };
  // One episode of Q-learning. rnd is a random-number function; returns the number of steps and the final reward.
  D.episode = function (Qm, eps, alpha, gamma, rnd) {
    var s = 0, steps = 0, last = 0;
    for (var k = 0; k < 40; k++) {
      var a = rnd() < eps ? Math.floor(rnd() * 4) : D.best(Qm[s]), st = D.gridStep(s, a);
      Qm[s][a] += alpha * (st.r + (st.done ? 0 : gamma * Math.max.apply(null, Qm[st.t])) - Qm[s][a]);
      s = st.t; steps++; last = st.r; if (st.done) break;
    }
    return { steps: steps, reward: last };
  };
  D.qLearn = function (eps, alpha, gamma, episodes, seed) { var r = lcg(seed), Qm = D.newQ(); for (var e = 0; e < episodes; e++) D.episode(Qm, eps, alpha, gamma, r); return Qm; };
  D.greedyPath = function (Qm) { var s = 0, path = [0]; for (var k = 0; k < 12; k++) { var st = D.gridStep(s, D.best(Qm[s])); s = st.t; path.push(s); if (st.done) break; } return path; };
  D.BANDIT_P = [0.3, 0.5, 0.7];
  D.banditNew = function (seed) { return { r: lcg(seed || 3), est: [0, 0, 0], n: [0, 0, 0], got: 0, pulls: 0 }; };
  D.banditPull = function (b, eps) {
    var a; if (b.r() < eps) a = Math.floor(b.r() * 3); else { a = 0; for (var k = 1; k < 3; k++) if (b.est[k] > b.est[a]) a = k; }
    var rew = b.r() < D.BANDIT_P[a] ? 1 : 0; b.n[a]++; b.est[a] += (rew - b.est[a]) / b.n[a]; b.got += D.BANDIT_P[a]; b.pulls++; return a;
  };
  D.bandit = function (eps, pulls) { var b = D.banditNew(3); for (var k = 0; k < pulls; k++) D.banditPull(b, eps); return { n: b.n, est: b.est, regret: pulls * 0.7 - b.got }; };

  Q.logic.dl = D;
})();
