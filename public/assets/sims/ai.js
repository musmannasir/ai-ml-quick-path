/* Calculations for the Phase 5 simulations (recommender, time series, probability of a test result, a treatment paradox,
   search and games, backtracking puzzle). Everything is in AIQPSim.logic.ai so scripts/check-sims.mjs can compare it
   with examples/sim-ai/ai.py. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  Q.logic = Q.logic || {};
  function lcg(seed) { var s = seed >>> 0; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  function gauss(r) { return (r() + r() + r() - 1.5) * 2; }
  var A = {}, i, j;

  // ---- recommender ----
  A.ITEMS = ['Film A', 'Film B', 'Film C', 'Film D', 'Film E', 'Film F'];
  A.RATINGS = [[5, 4, 0, 1, 0, 2], [5, 5, 4, 1, 0, 1], [4, 0, 5, 2, 1, 0], [1, 2, 1, 5, 4, 0], [0, 1, 2, 5, 5, 4], [2, 1, 0, 4, 0, 5]];
  A.userSimilarity = function (a, b) {
    var R = A.RATINGS, num = 0, na = 0, nb = 0, any = false;
    for (i = 0; i < 6; i++) if (R[a][i] && R[b][i]) { any = true; num += R[a][i] * R[b][i]; na += R[a][i] * R[a][i]; nb += R[b][i] * R[b][i]; }
    return any ? num / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
  };
  A.predict = function (user, item, k) {
    var cand = []; for (var u = 0; u < 6; u++) if (u !== user && A.RATINGS[u][item]) cand.push([A.userSimilarity(user, u), u]);
    cand.sort(function (a, b) { return b[0] - a[0] || a[1] - b[1]; }); var use = cand.slice(0, k), den = 0, num = 0;
    use.forEach(function (c) { den += c[0]; num += c[0] * A.RATINGS[c[1]][item]; });
    return { value: den ? num / den : null, used: use };
  };
  A.itemAverage = function (item) { var s = 0, n = 0; A.RATINGS.forEach(function (r) { if (r[item]) { s += r[item]; n++; } }); return s / n; };

  // ---- time series ----
  A.series = function () { var r = lcg(31), y = []; for (var t = 0; t < 48; t++) y.push(50 + 0.8 * t + 8 * Math.sin(2 * Math.PI * t / 12) + 3 * gauss(r)); return y; };
  A.fitTrendSeason = function (y, n) {
    var mt = 0, my = 0, t; for (t = 0; t < n; t++) { mt += t / n; my += y[t] / n; }
    var num = 0, den = 0; for (t = 0; t < n; t++) { num += (t - mt) * (y[t] - my); den += (t - mt) * (t - mt); }
    var b = num / den, a = my - b * mt, season = [];
    for (var m = 0; m < 12; m++) { var s = 0, c = 0; for (t = 0; t < n; t++) if (t % 12 === m) { s += y[t] - (a + b * t); c++; } season.push(s / c); }
    return { a: a, b: b, season: season };
  };
  A.forecast = function (model, y, h) {
    var out = [], k; if (model === 'naive') { for (k = 0; k < h; k++) out.push(y[35]); return out; }
    if (model === 'seasonal') { for (k = 0; k < h; k++) out.push(y[36 + k - 12]); return out; }
    var f = A.fitTrendSeason(y, 36); for (k = 0; k < h; k++) out.push(f.a + f.b * (36 + k) + f.season[(36 + k) % 12]); return out;
  };
  A.mae = function (model, y, h) { var f = A.forecast(model, y, h), s = 0; for (var k = 0; k < h; k++) s += Math.abs(f[k] - y[36 + k]); return s / h; };

  // ---- probability of a test result ----
  A.posterior = function (prior, sens, spec, positives) { var p = prior; for (var k = 0; k < positives; k++) p = p * sens / (p * sens + (1 - p) * (1 - spec)); return p; };
  A.counts = function (prior, sens, spec, n) { n = n || 10000; var ill = Math.floor(n * prior + 0.5), well = n - ill, tp = Math.floor(ill * sens + 0.5), fp = Math.floor(well * (1 - spec) + 0.5); return { tp: tp, fn: ill - tp, fp: fp, tn: well - fp }; };

  // ---- treatment paradox ----
  A.RATES = { A: [0.9, 0.7], B: [76 / 90, 0.5] };
  A.overall = function (t, hardShare) { return (1 - hardShare) * A.RATES[t][0] + hardShare * A.RATES[t][1]; };

  // ---- search ----
  A.MAZE = ['S.......', '.####.#.', '...#..#.', '.#.#.##.', '.#...#..', '.####.#.', '......#G', '.######.'];
  A.START = [0, 0]; A.GOAL = [7, 6]; A.DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  var key = function (p) { return p[0] + ',' + p[1]; };
  A.openCell = function (p) { return p[0] >= 0 && p[0] < 8 && p[1] >= 0 && p[1] < 8 && A.MAZE[p[1]].charAt(p[0]) !== '#'; };
  A.solve = function (algo) {
    var frontier = [{ p: A.START, c: 0 }], came = {}, g = {}, order = [], seen = {}, counter = 0, h = function (p) { return Math.abs(p[0] - A.GOAL[0]) + Math.abs(p[1] - A.GOAL[1]); };
    came[key(A.START)] = null; g[key(A.START)] = 0;
    while (frontier.length) {
      var cur;
      if (algo === 'bfs') cur = frontier.shift(); else if (algo === 'dfs') cur = frontier.pop();
      else { var bi = 0; frontier.forEach(function (e, q) { var fa = g[key(e.p)] + h(e.p), fb = g[key(frontier[bi].p)] + h(frontier[bi].p); if (fa < fb || (fa === fb && (h(e.p) < h(frontier[bi].p) || (h(e.p) === h(frontier[bi].p) && e.c < frontier[bi].c)))) bi = q; }); cur = frontier.splice(bi, 1)[0]; }
      if (seen[key(cur.p)]) continue; seen[key(cur.p)] = 1; order.push(cur.p);
      if (cur.p[0] === A.GOAL[0] && cur.p[1] === A.GOAL[1]) break;
      A.DIRS.forEach(function (d) { var nx = [cur.p[0] + d[0], cur.p[1] + d[1]]; if (A.openCell(nx) && came[key(nx)] === undefined) { came[key(nx)] = cur.p; g[key(nx)] = g[key(cur.p)] + 1; counter++; frontier.push({ p: nx, c: counter }); } });
    }
    var path = [], p = A.GOAL; while (p) { path.push(p); p = came[key(p)]; }
    return { order: order, length: path.length - 1, path: path.reverse() };
  };
  A.LEAVES = [3, 12, 8, 2, 4, 6, 14, 5, 2];
  A.minimax = function (prune) {
    var seen = 0, alpha = -Infinity, best = -Infinity, looked = [], m, k; for (k = 0; k < 9; k++) looked.push(false);
    for (m = 0; m < 3; m++) {
      var beta = Infinity, val = Infinity;
      for (k = 0; k < 3; k++) { seen++; looked[m * 3 + k] = true; val = Math.min(val, A.LEAVES[m * 3 + k]); if (prune) { beta = Math.min(beta, val); if (beta <= alpha) break; } }
      best = Math.max(best, val); alpha = Math.max(alpha, val);
    }
    return { best: best, seen: seen, looked: looked };
  };

  // ---- backtracking puzzle ----
  A.REGIONS = 7; A.BORDERS = [[0, 4], [1, 3], [1, 5], [1, 6], [3, 4], [3, 5], [4, 5], [4, 6], [5, 6]];
  A.NEIGH = []; for (i = 0; i < 7; i++) { A.NEIGH.push([]); A.BORDERS.forEach(function (e) { if (e[0] === i) A.NEIGH[i].push(e[1]); else if (e[1] === i) A.NEIGH[i].push(e[0]); }); }
  // Returns every attempt in order, so the page can replay it: { r, c, ok } for a try, { r, undo: true } for a backtrack.
  A.colourMap = function (smart) {
    var col = [null, null, null, null, null, null, null], tries = 0, back = 0, trace = [];
    var legalColours = function (r) { var out = []; for (var c = 0; c < 3; c++) if (A.NEIGH[r].every(function (n) { return col[n] !== c; })) out.push(c); return out; };
    function go() {
      var free = []; for (var r = 0; r < 7; r++) if (col[r] === null) free.push(r); if (!free.length) return true;
      var pick = free[0]; if (smart) free.forEach(function (x) { if (legalColours(x).length < legalColours(pick).length) pick = x; });
      for (var c = 0; c < 3; c++) {
        tries++; var ok = A.NEIGH[pick].every(function (n) { return col[n] !== c; }); trace.push({ r: pick, c: c, ok: ok });
        if (ok) { col[pick] = c; if (go()) return true; col[pick] = null; back++; trace.push({ r: pick, undo: true }); }
      }
      return false;
    }
    var solved = go(); return { ok: solved, tries: tries, back: back, col: col, trace: trace };
  };
  Q.logic.ai = A;
})();
