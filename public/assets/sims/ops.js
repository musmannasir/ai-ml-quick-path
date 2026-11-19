/* Calculations for the Phase 7 simulations (data checks, a safe release, drift alerts, serving and scaling, a production
   request, and two ways to score a language model). Everything is in AIQPSim.logic.ops so scripts/check-sims.mjs can
   compare it with examples/sim-ops/ops.py. The scoring part needs gen.js and llm.js. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  Q.logic = Q.logic || {};
  function lcg(seed) { var s = seed >>> 0; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  function gauss(r) { return (r() + r() + r() - 1.5) * 2; }
  var O = {};

  // ---- data checks ----
  O.ROWS = [[34, 'a@x.com', 'UK'], [-3, 'b@x.com', 'UK'], [29, 'c.x.com', 'US'], [41, 'd@x.com', 'XX'], [250, 'e@x.com', 'DE'], [null, 'f@x.com', 'US'], [52, 'g@x.com', 'DE'], [38, '', 'UK'], [27, 'i@x.com', 'US'], [45, 'j@x.com', 'FR']];
  O.CHECKS = ['schema', 'age_present', 'age_range', 'email', 'country'];
  O.validate = function (enabled, renamed) {
    var has = function (c) { return enabled.indexOf(c) >= 0; };
    if (renamed && has('schema')) return { pass: 0, fails: { schema: 10 }, stopped: true, bad: O.ROWS.map(function () { return ['schema']; }) };
    var fails = {}, pass = 0, bad = []; enabled.forEach(function (c) { if (c !== 'schema') fails[c] = 0; });
    O.ROWS.forEach(function (row) {
      var a = renamed ? null : row[0], why = [];
      if (has('age_present') && a === null) { fails.age_present++; why.push('age_present'); }
      if (has('age_range') && (a === null || a < 0 || a > 120)) { fails.age_range++; why.push('age_range'); }
      if (has('email') && row[1].indexOf('@') < 0) { fails.email++; why.push('email'); }
      if (has('country') && ['UK', 'US', 'DE', 'FR'].indexOf(row[2]) < 0) { fails.country++; why.push('country'); }
      if (!why.length) pass++; bad.push(why);
    });
    return { pass: pass, fails: fails, stopped: false, bad: bad };
  };

  // ---- a safe release ----
  O.SCENARIOS = { same: [0.05, 0.05], slight: [0.05, 0.08], bad: [0.05, 0.15] };
  O.release = function (scenario, share, thr) {
    var p = O.SCENARIOS[scenario], r = lcg(13), cn = 0, kn = 0, ce = 0, ke = 0;
    for (var k = 0; k < 2000; k++) { var canary = r() < share, err = r() < (canary ? p[1] : p[0]); if (canary) { cn++; if (err) ce++; } else { kn++; if (err) ke++; } }
    var rc = ce / Math.max(1, cn), rk = ke / Math.max(1, kn);
    return { cn: cn, ce: ce, rc: rc, rk: rk, decision: cn < 30 ? 'wait' : (rc - rk > thr / 100 ? 'roll back' : 'promote') };
  };

  // ---- drift alerts ----
  O.driftSeries = function (shift) { var r = lcg(21), x = []; for (var t = 0; t < 100; t++) x.push(50 + 5 * gauss(r) + (t >= 60 ? shift : 0)); return x; };
  O.drift = function (shift, window, thr) {
    var x = O.driftSeries(shift), base = 0, sd = 0, t, k; for (t = 0; t < 40; t++) base += x[t]; base /= 40; for (t = 0; t < 40; t++) sd += (x[t] - base) * (x[t] - base); sd = Math.sqrt(sd / 40);
    var alerts = []; for (t = 40; t < 100; t++) { var m = 0; for (k = t - window + 1; k <= t; k++) m += x[k]; m /= window; if (Math.abs((m - base) / (sd / Math.sqrt(window))) > thr) alerts.push(t); }
    var fa = alerts.filter(function (a) { return a < 60; }).length, first = null; alerts.forEach(function (a) { if (first === null && a >= 60) first = a; });
    return { false: fa, delay: first === null ? null : first - 60, alerts: alerts, x: x, base: base };
  };

  // ---- serving and scaling ----
  O.serve = function (lam, servers, batch, autoscale, seed) {
    var r = lcg(seed || 17), t = 0, arr = [], queue = [], busy = [0, 0, 0, 0, 0, 0], n = servers, nxt = 0, lat = [], sec = 0, k, s, hist = [];
    for (;;) { t += -Math.log(1 - r()) / lam; if (t >= 200) break; arr.push(t); }
    for (k = 0; k < 2000; k++) {
      var T = k * 0.1; while (nxt < arr.length && arr[nxt] <= T) { queue.push(arr[nxt]); nxt++; }
      if (autoscale && k % 10 === 0) { if (queue.length > 5 * n) n = Math.min(6, n + 1); else if (!queue.length && n > 1 && busy[n - 1] <= T) n--; }
      for (s = 0; s < n; s++) if (busy[s] <= T && queue.length) { var take = queue.splice(0, batch), fin = T + 0.2 + 0.05 * take.length; busy[s] = fin; take.forEach(function (a) { lat.push(fin - a); }); }
      sec += n * 0.1; if (k % 20 === 0) hist.push([T, queue.length, n]);
    }
    lat.sort(function (a, b) { return a - b; });
    return { served: lat.length, p50: lat.length ? lat[Math.floor(0.5 * (lat.length - 1))] : 0, p95: lat.length ? lat[Math.floor(0.95 * (lat.length - 1))] : 0, queue: queue.length, cost: sec / 200 * 2, hist: hist };
  };

  // ---- a production request ----
  O.PARTS = ['Client', 'Gateway', 'Sign-in check', 'Cache', 'Model server', 'Vector store', 'Logging'];
  O.EFFECT = { 'Client': ['failed', 'Nothing reaches the system; the person sees an error in the app.'], 'Gateway': ['failed', 'Requests cannot enter, so every request fails.'], 'Sign-in check': ['failed', 'The system refuses requests it cannot check. It fails safe, not open.'],
    'Cache': ['degraded', 'Every request goes to the model, so answers are slower and cost more, but they still work.'], 'Model server': ['failed', 'There is nothing to compute the answer, so requests fail unless a fallback exists.'],
    'Vector store': ['degraded', 'The model answers without the documents it should have used, so answers may be wrong or vague.'], 'Logging': ['degraded', 'Users see no change, but nobody can see errors or costs, so problems go unnoticed.'] };

  // ---- two ways to score a language model ----
  O.ANSWERS = [['Paris', 'Paris'], ['The capital is Paris.', 'Paris'], ['paris, France', 'Paris'], ['Lyon', 'Paris']];
  O.norm = function (s) { return s.toLowerCase().replace(/\./g, ' ').replace(/,/g, ' ').split(/\s+/).filter(Boolean).join(' '); };
  O.score = function (kind, ans, gold) {
    var a = O.norm(ans), g = O.norm(gold);
    if (kind === 'exact') return ans === gold ? 1 : 0; if (kind === 'normalised') return a === g ? 1 : 0; if (kind === 'contains') return a.indexOf(g) >= 0 ? 1 : 0;
    var at = a.split(' '), gt = g.split(' '), seen = {}, ov = 0; gt.forEach(function (w) { if (!seen[w]) { seen[w] = 1; var ca = 0, cg = 0; at.forEach(function (x) { if (x === w) ca++; }); gt.forEach(function (x) { if (x === w) cg++; }); ov += Math.min(ca, cg); } });
    if (!ov) return 0; var p = ov / at.length, rc = ov / gt.length; return 2 * p * rc / (p + rc);
  };
  Q.logic.ops = O;
})();
