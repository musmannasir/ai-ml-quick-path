/* Calculations for the Phase 3 simulations (model builder, learning to write, embedding training, LoRA and
   quantisation, vector search, retrieval for RAG). Everything is in AIQPSim.logic.llm so scripts/check-sims.mjs can
   compare it with examples/sim-llm/llm.py. Needs gen.js for the made-up text. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  Q.logic = Q.logic || {};
  function lcg(seed) { var s = seed >>> 0; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  function gauss(r) { return (r() + r() + r() - 1.5) * 2; }
  var L = {};

  // ---- model builder ----
  L.params = function (layers, d, vocab) { return 12 * layers * d * d + vocab * d; };
  L.weightBytes = function (n, bits) { return n * bits / 8; };
  L.kvBytesPerToken = function (layers, d, bits) { return 2 * layers * d * bits / 8; };
  L.trainFlops = function (n, tokens) { return 6 * n * tokens; };

  // ---- learning to write ----
  L.sentences = function () { var G = Q.logic.gen, out = []; G.CORPUS.split('.').forEach(function (s) { s = s.trim(); if (s) out.push(G.split(s).concat(['.'])); }); return out; };
  L.trainTokens = function () { var t = []; L.sentences().forEach(function (s, i) { if (i % 4 !== 3) t = t.concat(s); }); return t; };
  L.trainLen = function () { return L.trainTokens().length; };
  // Loss on every fourth sentence, which the model never reads, after it has read the first nTrain words of the rest.
  L.holdoutLoss = function (nTrain) {
    var G = Q.logic.gen, seen = {}, vocab = 0; G.split(G.CORPUS).forEach(function (t) { if (!seen[t]) { seen[t] = 1; vocab++; } });
    var model = G.train(L.trainTokens().slice(0, nTrain).join(' ')), total = 0, cnt = 0;
    L.sentences().forEach(function (sent, i) {
      if (i % 4 !== 3) return;
      for (var j = 1; j < sent.length; j++) { var c = G.counts(model, sent.slice(Math.max(0, j - 2), j)).c, tot = 0; Object.keys(c).forEach(function (k) { tot += c[k]; }); total += -Math.log(((c[sent[j]] || 0) + 0.1) / (tot + 0.1 * vocab)); cnt++; }
    });
    return total / cnt;
  };

  // ---- embedding training ----
  L.WORDS = ['cat', 'dog', 'bird', 'fish', 'bread', 'rice', 'soup', 'cake', 'car', 'bus', 'train', 'boat'];
  L.embInit = function () { var r = lcg(4); return L.WORDS.map(function () { return [(r() * 2 - 1) * 0.8, (r() * 2 - 1) * 0.8]; }); };
  L.embStep = function (P, tau, lr) {
    var n = P.length, G = P.map(function () { return [0, 0]; }), loss = 0, i, k, a;
    for (i = 0; i < n; i++) {
      var g = Math.floor(i / 4), j = g * 4 + (i % 4 + 1) % 4, cand = [j]; for (k = 0; k < n; k++) if (Math.floor(k / 4) !== g) cand.push(k);
      var z = cand.map(function (c) { return -(Math.pow(P[i][0] - P[c][0], 2) + Math.pow(P[i][1] - P[c][1], 2)) / tau; }), mx = Math.max.apply(null, z), e = z.map(function (v) { return Math.exp(v - mx); }), s = 0; e.forEach(function (v) { s += v; });
      var q = e.map(function (v) { return v / s; }); loss += -Math.log(q[0]);
      cand.forEach(function (c, idx) { var coef = q[idx] - (idx === 0 ? 1 : 0); for (a = 0; a < 2; a++) { var diff = P[i][a] - P[c][a]; G[i][a] += coef * (-2 * diff / tau); G[c][a] += coef * (2 * diff / tau); } });
    }
    for (i = 0; i < n; i++) for (a = 0; a < 2; a++) P[i][a] -= lr * G[i][a] / n;
    return loss / n;
  };
  L.embAccuracy = function (P) {
    var ok = 0; P.forEach(function (p, i) { var best = -1, bd = Infinity; P.forEach(function (q, k) { if (k === i) return; var d = Math.pow(p[0] - q[0], 2) + Math.pow(p[1] - q[1], 2); if (d < bd) { bd = d; best = k; } }); if (Math.floor(best / 4) === Math.floor(i / 4)) ok++; });
    return ok / P.length;
  };

  // ---- LoRA and quantisation ----
  L.loraTarget = function () {
    var r = lcg(7), A = [], B = [], M = [], i, j, k;
    for (i = 0; i < 8; i++) { A.push([0.5 * gauss(r), 0.5 * gauss(r)]); }
    for (k = 0; k < 2; k++) { B.push([]); for (j = 0; j < 8; j++) B[k].push(0.5 * gauss(r)); }
    for (i = 0; i < 8; i++) { M.push([]); for (j = 0; j < 8; j++) { var s = 0; for (k = 0; k < 2; k++) s += A[i][k] * B[k][j]; M[i].push(s + 0.05 * gauss(r)); } }
    return M;
  };
  function frob(M) { var s = 0; M.forEach(function (row) { row.forEach(function (v) { s += v * v; }); }); return Math.sqrt(s); }
  // Returns the relative error left after removing `rank` components, and the matrix that is left.
  L.lowRank = function (M, rank) {
    var R = M.map(function (r) { return r.slice(); }), base = frob(M), i, j, it, c;
    for (c = 0; c < rank; c++) {
      var v = []; for (j = 0; j < 8; j++) v.push(1 / Math.sqrt(8)); var u, sig;
      for (it = 0; it < 60; it++) {
        u = []; for (i = 0; i < 8; i++) { var s = 0; for (j = 0; j < 8; j++) s += R[i][j] * v[j]; u.push(s); }
        var nu = 0; u.forEach(function (x) { nu += x * x; }); nu = Math.sqrt(nu); u = u.map(function (x) { return x / nu; });
        var w = []; for (j = 0; j < 8; j++) { var t = 0; for (i = 0; i < 8; i++) t += R[i][j] * u[i]; w.push(t); }
        sig = 0; w.forEach(function (x) { sig += x * x; }); sig = Math.sqrt(sig); v = w.map(function (x) { return x / sig; });
      }
      for (i = 0; i < 8; i++) for (j = 0; j < 8; j++) R[i][j] -= sig * u[i] * v[j];
    }
    return { err: frob(R) / base, rest: R };
  };
  // Trainable numbers for one square layer of width d at rank r: LoRA trains A (d by r) and B (r by d); LoRA-FA freezes A and trains B only;
  // VeRA freezes a shared random A and B and trains one scaling vector of length r and one of length d; LoRA+ trains the same numbers as LoRA
  // (B just learns faster); Delta-LoRA trains the same numbers as LoRA and also moves W with the change in A times B.
  L.loraVariants = function (d, r) { return { lora: 2 * d * r, fa: d * r, vera: d + r, plus: 2 * d * r, delta: 2 * d * r }; };
  L.quantWeights = function () { var r = lcg(9), W = []; for (var i = 0; i < 400; i++) W.push(0.05 * gauss(r)); return W; };
  L.quantise = function (W, bits) { var levels = Math.pow(2, bits - 1) - 1, mx = 0; W.forEach(function (w) { mx = Math.max(mx, Math.abs(w)); }); var scale = mx / levels; return W.map(function (w) { return Math.floor(w / scale + 0.5) * scale; }); };
  L.quantRmse = function (W, bits) { var q = L.quantise(W, bits), s = 0; W.forEach(function (w, i) { s += (w - q[i]) * (w - q[i]); }); return Math.sqrt(s / W.length); };

  // ---- vector search ----
  L.TOPICS = [['animals', ['cat', 'dog', 'bird', 'fish', 'horse', 'mouse']], ['food', ['bread', 'rice', 'soup', 'cake', 'pasta', 'apple']], ['vehicles', ['car', 'bus', 'train', 'boat', 'plane', 'bike']], ['places', ['park', 'city', 'farm', 'beach', 'lake', 'hill']]];
  L.vsPoints = function () {
    var r = lcg(12), pts = [];
    L.TOPICS.forEach(function (tp, t) { var ang = (20 + 90 * t) * Math.PI / 180; tp[1].forEach(function (w) { pts.push({ w: w, t: t, x: 0.8 * Math.cos(ang) + 0.12 * gauss(r), y: 0.8 * Math.sin(ang) + 0.12 * gauss(r) }); }); });
    return pts;
  };
  L.vsSearch = function (pts, q, k, metric) {
    var sc = pts.map(function (p) { return metric === 'cos' ? (p.x * q[0] + p.y * q[1]) / (Math.hypot(p.x, p.y) * Math.hypot(q[0], q[1])) : -Math.hypot(p.x - q[0], p.y - q[1]); });
    return sc.map(function (v, i) { return i; }).sort(function (a, b) { return sc[b] - sc[a] || a - b; }).slice(0, k).map(function (i) { return { i: i, w: pts[i].w, s: sc[i] }; });
  };

  // ---- RAG ----
  L.DOC = 'Riverbend Library lets members borrow up to six books at one time. A book can be kept for twenty one days. ' +
    'Members may renew a book twice, unless another member has reserved it. Late books cost ten cents for each day. ' +
    'The library never charges more than five dollars for one late book. Reserved books wait at the front desk for four days. ' +
    'Study rooms can be booked for two hours at a time. Members who need a room for longer must ask a librarian. ' +
    'The reading room opens at eight in the morning and closes at six in the evening on weekdays. ' +
    'On Saturdays it closes at two in the afternoon. The library is closed on Sundays. A new member card is free for residents. ' +
    'Visitors pay a deposit of ten dollars, which is returned when the card is handed back.';
  L.QUESTIONS = [['How many books can I borrow at once?', 'six books'], ['How much is the late fee for each day?', 'ten cents'], ['When does the library close on Saturdays?', 'two in the afternoon'], ['How much is the deposit for visitors?', 'ten dollars']];
  var STOP = {}; 'the a an of at is are how much many can i do does when on for to and in per each it be by or than who may up'.split(' ').forEach(function (w) { STOP[w] = 1; });
  L.wordsOf = function (t) { return t.toLowerCase().replace(/\./g, ' ').replace(/,/g, ' ').split(/\s+/).filter(Boolean); };
  L.chunk = function (size, overlap) { var w = L.wordsOf(L.DOC), step = Math.max(1, size - overlap), out = [], i = 0; while (i < w.length) { out.push(w.slice(i, i + size)); if (i + size >= w.length) break; i += step; } return out; };
  L.rank = function (chunks, question) {
    var docs = chunks.map(function (c) { return c.filter(function (t) { return !STOP[t]; }); }), qt = L.wordsOf(question).filter(function (t) { return !STOP[t]; }), n = docs.length, idf = {};
    docs.reduce(function (a, d) { return a.concat(d); }, []).concat(qt).forEach(function (t) { if (idf[t] === undefined) { var df = 0; docs.forEach(function (d) { if (d.indexOf(t) >= 0) df++; }); idf[t] = Math.log((n + 1) / (df + 1)) + 1; } });
    var vec = function (toks) { var v = {}; toks.forEach(function (t) { v[t] = (v[t] || 0) + idf[t]; }); return v; };
    var norm = function (v) { var s = 0; Object.keys(v).forEach(function (k) { s += v[k] * v[k]; }); return Math.sqrt(s); };
    var cos = function (a, b) { var num = 0; Object.keys(a).forEach(function (t) { num += a[t] * (b[t] || 0); }); var den = norm(a) * norm(b); return den ? num / den : 0; };
    var qv = vec(qt), sc = docs.map(function (d) { return cos(qv, vec(d)); });
    return { order: sc.map(function (v, i) { return i; }).sort(function (a, b) { return sc[b] - sc[a] || a - b; }), scores: sc };
  };
  L.ragHit = function (size, overlap, k, qi) { var ch = L.chunk(size, overlap), r = L.rank(ch, L.QUESTIONS[qi][0]), text = r.order.slice(0, k).map(function (i) { return ch[i].join(' '); }).join(' '); return text.indexOf(L.QUESTIONS[qi][1]) >= 0; };

  Q.logic.llm = L;
})();
