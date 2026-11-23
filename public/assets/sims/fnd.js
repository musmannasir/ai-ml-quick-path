/* Calculations for the Phase 6 simulations (rules against learning, the project loop, splits and leakage, cleaning, scaling,
   label noise, an LLM call, an agent chain, patches, prompt injection, test-set size, fairness). Everything is in
   AIQPSim.logic.fnd so scripts/check-sims.mjs can compare it with examples/sim-apps/apps.py. Needs sup.js (data, k-nearest). */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  Q.logic = Q.logic || {};
  function lcg(seed) { var s = seed >>> 0; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  function gauss(r) { return (r() + r() + r() - 1.5) * 2; }
  var F = {}, i;
  var words = function (m) { return m.split(' '); };

  // ---- rules against learning ----
  F.SPAM_TRAIN = ['win a free prize now', 'free money click now', 'urgent claim your prize', 'cheap pills free offer', 'win cash urgent reply', 'free gift card click', 'claim free reward today', 'urgent offer win now'];
  F.HAM_TRAIN = ['meeting moved to noon', 'lunch tomorrow with team', 'please review the report', 'call me after the meeting', 'notes from the workshop', 'can you send the file', 'dinner at seven tonight', 'project update attached'];
  F.SPAM_TEST = ['fr33 prize waiting for you', 'you won a reward claim today', 'limited cash offer inside', 'act now to receive money'];
  F.HAM_TEST = ['free for lunch tomorrow', 'urgent meeting at noon', 'the prize committee agenda', 'can we meet and win the client'];
  F.KEYWORDS = ['free', 'win', 'prize', 'urgent', 'click', 'now', 'cash', 'offer'];
  F.ruleSpam = function (ws, msg) { return ws.some(function (w) { return words(msg).indexOf(w) >= 0; }); };
  F.ruleAccuracy = function (ws, spam, ham) { var hit = 0; spam.forEach(function (m) { if (F.ruleSpam(ws, m)) hit++; }); ham.forEach(function (m) { if (!F.ruleSpam(ws, m)) hit++; }); return hit / (spam.length + ham.length); };
  F.nbModel = function () {
    var seen = {}, vocab = []; F.SPAM_TRAIN.concat(F.HAM_TRAIN).forEach(function (m) { words(m).forEach(function (w) { if (!seen[w]) { seen[w] = 1; vocab.push(w); } }); }); vocab.sort();
    var p = {}; [[1, F.SPAM_TRAIN], [0, F.HAM_TRAIN]].forEach(function (c) { p[c[0]] = {}; vocab.forEach(function (w) { var n = 0; c[1].forEach(function (m) { if (words(m).indexOf(w) >= 0) n++; }); p[c[0]][w] = (n + 1) / (c[1].length + 2); }); });
    return { vocab: vocab, p: p };
  };
  F.nbIsSpam = function (model, msg) { var ws = words(msg), score = {}; [1, 0].forEach(function (c) { var s = Math.log(0.5); model.vocab.forEach(function (w) { s += Math.log(ws.indexOf(w) >= 0 ? model.p[c][w] : 1 - model.p[c][w]); }); score[c] = s; }); return score[1] > score[0]; };
  F.nbAccuracy = function (model, spam, ham) { var hit = 0; spam.forEach(function (m) { if (F.nbIsSpam(model, m)) hit++; }); ham.forEach(function (m) { if (!F.nbIsSpam(model, m)) hit++; }); return hit / (spam.length + ham.length); };

  // ---- the project loop ----
  F.STAGES = ['Frame', 'Data', 'Prepare', 'Model', 'Evaluate', 'Deploy', 'Monitor'];
  F.FAULTS = [['Labels are wrong', 4, 1], ['Wrong success measure', 6, 0], ['Test data leaked into training', 6, 2], ['The world changed', 6, 1], ['A feature is not available when predicting', 5, 2]];

  // ---- splits and leakage ----
  F.splitData = function () { var r = lcg(41), y = [], leak = [], t; for (t = 0; t < 60; t++) y.push(20 + 0.5 * t + 5 * Math.sin(2 * Math.PI * t / 7) + 2 * gauss(r)); y.forEach(function (v) { leak.push(v + 0.2 * gauss(r)); }); return { y: y, leak: leak }; };
  F.shuffled = function (n, seed) { var r = lcg(seed), idx = [], k; for (k = 0; k < n; k++) idx.push(k); for (k = n - 1; k > 0; k--) { var j = Math.floor(r() * (k + 1)), t = idx[k]; idx[k] = idx[j]; idx[j] = t; } return idx; };
  F.splitMae = function (mode, feature) {
    var d = F.splitData(), feat = feature === 'day' ? d.y.map(function (v, k) { return k; }) : d.leak, test, train = [], k;
    if (mode === 'random') test = F.shuffled(60, 5).slice(0, 15).sort(function (a, b) { return a - b; }); else { test = []; for (k = 45; k < 60; k++) test.push(k); }
    for (k = 0; k < 60; k++) if (test.indexOf(k) < 0) train.push(k);
    var err = 0; test.forEach(function (ti) { var best = train[0]; train.forEach(function (j) { var a = Math.abs(feat[j] - feat[ti]), b = Math.abs(feat[best] - feat[ti]); if (a < b) best = j; }); err += Math.abs(d.y[best] - d.y[ti]); });
    return err / test.length;
  };

  // ---- cleaning ----
  F.INCOME = [32, 35, 31, null, 34, 36, 33, 37, 35, null, 36, 32, 120, 35, 33, 31, 38, 34, 36, 35];
  var median = function (a) { var s = a.slice().sort(function (x, y) { return x - y; }), n = s.length; return n % 2 === 0 ? (s[n / 2 - 1] + s[n / 2]) / 2 : s[(n - 1) / 2]; };
  F.cleanValues = function (method) {
    var present = F.INCOME.filter(function (v) { return v !== null; }), mean = present.reduce(function (a, b) { return a + b; }, 0) / present.length;
    if (method === 'drop') return present; var fill = method === 'mean' ? mean : method === 'median' ? median(present) : 0;
    return F.INCOME.map(function (v) { return v === null ? fill : v; });
  };
  F.cleanStats = function (method) { var v = F.cleanValues(method), m = v.reduce(function (a, b) { return a + b; }, 0) / v.length, s = 0; v.forEach(function (x) { s += (x - m) * (x - m); }); return { n: v.length, mean: m, median: median(v), sd: Math.sqrt(s / v.length) }; };

  // ---- scaling and encoding ----
  F.PEOPLE = [[25, 30000], [30, 32000], [45, 90000], [50, 95000], [28, 60000], [52, 31000], [35, 62000], [40, 88000]];
  F.nearestPerson = function (target, scale) {
    var mean = [0, 0], sd = [0, 0]; F.PEOPLE.forEach(function (p) { mean[0] += p[0] / 8; mean[1] += p[1] / 8; }); F.PEOPLE.forEach(function (p) { sd[0] += Math.pow(p[0] - mean[0], 2) / 8; sd[1] += Math.pow(p[1] - mean[1], 2) / 8; }); sd = [Math.sqrt(sd[0]), Math.sqrt(sd[1])];
    var z = function (p) { return scale ? [(p[0] - mean[0]) / sd[0], (p[1] - mean[1]) / sd[1]] : [p[0], p[1]]; }, zt = z(target), d = F.PEOPLE.map(function (p) { var q = z(p); return Math.sqrt(Math.pow(q[0] - zt[0], 2) + Math.pow(q[1] - zt[1], 2)); }), b = 0;
    d.forEach(function (v, k) { if (v < d[b]) b = k; }); return { i: b, d: d[b], all: d };
  };

  // ---- label noise ----
  F.noisyAccuracy = function (noise) {
    var S = Q.logic.sup, tr = S.makeData('blobs', 100, 3), te = S.makeData('blobs', 60, 17), r = lcg(77), y2 = tr.y.map(function (c) { return r() < noise ? 1 - c : c; });
    return S.evaluate(S.fitKnn({ X: tr.X, y: y2 }, 1), te).acc;
  };
  F.agreement = function (p, seed) { var r = lcg(seed), same = 0; for (var k = 0; k < 200; k++) { var a = r() < p, b = r() < p; if (a === b) same++; } return same / 200; };

  // ---- an LLM call with retries ----
  F.apiCalls = function (fail, retries, calls, seed) {
    retries = retries === undefined ? 3 : retries; calls = calls || 20; var r = lcg(seed || 9), okCalls = 0, attempts = 0, wait = 0, log = [];
    for (var c = 0; c < calls; c++) { var a = 0, ok = false; while (a <= retries) { a++; if (r() >= fail) { ok = true; break; } wait += Math.pow(2, a - 1); } attempts += a; if (ok) okCalls++; log.push({ attempts: a, ok: ok }); }
    return { ok: okCalls, attempts: attempts, wait: wait, cost: okCalls * (500 * 3 + 300 * 15) / 1e6, log: log };
  };

  // ---- an agent chain ----
  F.agentSuccess = function (p, n, check, runs, seed) {
    runs = runs || 500; var r = lcg(seed || 5), wins = 0;
    for (var k = 0; k < runs; k++) { var good = true; for (var s = 0; s < n; s++) { var ok = r() < p; if (!ok && check > 0 && r() < check) ok = r() < p; if (!ok) good = false; } if (good) wins++; }
    return wins / runs;
  };

  // ---- patches ----
  F.SQUARE = (function () { var m = []; for (var r = 0; r < 8; r++) { m.push([]); for (var c = 0; c < 8; c++) m[r].push(r >= 2 && r <= 5 && c >= 2 && c <= 5 ? 1 : 0); } return m; })();
  F.patches = function (size) { var n = 8 / size, out = []; for (var a = 0; a < n; a++) { out.push([]); for (var b = 0; b < n; b++) { var s = 0; for (var x = 0; x < size; x++) for (var y = 0; y < size; y++) s += F.SQUARE[a * size + x][b * size + y]; out[a].push(s / (size * size)); } } return out; };

  // ---- prompt injection ----
  F.ATTACKS = ['override', 'hidden', 'exfil'];
  F.STOPS = { sep: ['override', 'hidden'], approve: ['hidden', 'exfil'], least: ['exfil'] };
  F.injection = function (guards) { var o = {}; F.ATTACKS.forEach(function (a) { o[a] = !guards.some(function (g) { return F.STOPS[g].indexOf(a) >= 0; }); }); return o; };

  // ---- test-set size ----
  F.margin = function (p, n) { return 1.96 * Math.sqrt(p * (1 - p) / n); };
  F.sampleRates = function (n, truth, draws, seed) { truth = truth === undefined ? 0.8 : truth; draws = draws || 10; var r = lcg(seed || 5), out = []; for (var d = 0; d < draws; d++) { var c = 0; for (var k = 0; k < n; k++) if (r() < truth) c++; out.push(c / n); } return out; };

  // ---- fairness ----
  F.groups = function () { return [[1.0, 51], [0.6, 52]].map(function (g) { var r = lcg(g[1]), out = []; for (var k = 0; k < 200; k++) out.push([k % 2, (k % 2) * g[0] + 0.6 * gauss(r)]); return out; }); };
  F.fairMetrics = function (g, thr) { var tp = 0, pos = 0, sel = 0, ok = 0; g.forEach(function (e) { if (e[0] === 1) pos++; if (e[1] >= thr) sel++; if (e[0] === 1 && e[1] >= thr) tp++; if ((e[1] >= thr) === (e[0] === 1)) ok++; }); return { sel: sel / g.length, tpr: tp / pos, acc: ok / g.length }; };

  Q.logic.fnd = F;
})();
