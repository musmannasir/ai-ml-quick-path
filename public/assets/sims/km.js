/* Simulation: clustering with k-means (assign, then move) and DBSCAN, plus an elbow chart. Calculation: AIQPSim.logic.core. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('km', function (S) {
    var C = Q.logic.core, SU = Q.logic.sup, P = Q.plot, W = 380, H = 270, pad = 14, xr = [-1, 1], yr = [-1, 1], m = P.map(W, H, pad, xr, yr);
    var st = { i: 0, hist: [] };
    var cData = S.select('data', 'Pattern in the data', [['blobs', 'Three round groups'], ['moons', 'Two curved groups']], 'blobs', function () { reset(); });
    var cMeth = S.select('meth', 'Method', [['km', 'k-means'], ['db', 'DBSCAN']], S.preset === 'dbscan' ? 'db' : 'km', function () { reset(); });
    var cK = S.range('k', 'k: number of clusters', { min: 1, max: 8, step: 1, value: 3, onChange: function () { reset(); } });
    var cS = S.range('seed', 'Starting positions (seed)', { min: 1, max: 9, step: 1, value: 1, onChange: function () { reset(); } });
    var cE = S.range('eps', 'DBSCAN: neighbour distance', { min: 0.05, max: 0.4, step: 0.01, value: 0.2, fmt: function (v) { return v.toFixed(2); }, onChange: function () { draw(); } });
    var cP = S.range('min', 'DBSCAN: points to be a core', { min: 2, max: 10, step: 1, value: 4, onChange: function () { draw(); } });
    S.buttons([{ id: 'step', label: 'Next step (assign, then move)', primary: true, onClick: function () { st.i = Math.min(st.hist.length - 1, st.i + 1); draw(); } }, { id: 'run', label: 'Run to the end', onClick: function () { st.i = st.hist.length - 1; draw(); } }, { id: 'again', label: 'Start again', onClick: function () { st.i = 0; draw(); } }]);
    var c1 = S.card('The points, coloured by cluster (grey rings = noise; squares are the cluster centres)', S.view), svg = S.svgEl(W, H, 'Scatter plot of points coloured by cluster.', c1);
    var c2 = S.card('Elbow chart: total squared distance to the nearest centre for k = 1 to 8', S.view), sv2 = S.svgEl(W, 130, 'Line chart of k-means inertia against k.', c2);
    var rI = S.readout('it', 'Step'), rJ = S.readout('in', 'Total squared distance'), rC = S.readout('c', 'Clusters found'), rN = S.readout('n', 'Noise points');
    function pts() { return cData.get() === 'blobs' ? C.blobs3(60, 5) : SU.makeData('moons', 200, 3).X; }
    function setVis() { var db = cMeth.get() === 'db'; [cK, cS].forEach(function (c) { c.input.closest('.sim-ctl').hidden = db; }); [cE, cP].forEach(function (c) { c.input.closest('.sim-ctl').hidden = !db; }); }
    function reset() { setVis(); st.hist = cMeth.get() === 'km' ? C.kmeans(pts(), cK.get(), cS.get(), 30) : []; st.i = 0; draw(); }
    function colour(l) { return 'sv-f' + (l % 4); }
    function draw() {
      var X = pts(), db = cMeth.get() === 'db', lab, cen = null, inertia = null, nClusters, noise = 0;
      if (db) { lab = C.dbscan(X, cE.get(), cP.get()); nClusters = Math.max(-1, Math.max.apply(null, lab.filter(function (l) { return l !== null; }).concat([-1]))) + 1; noise = lab.filter(function (l) { return l === null; }).length; }
      else { var h = st.hist[st.i]; lab = h.lab; cen = h.C; inertia = h.inertia; nClusters = cK.get(); }
      P.clear(svg); P.frame(S, svg, m, W, H, pad, xr, yr);
      X.forEach(function (q, i) { if (lab[i] === null) svg.appendChild(S.svg('circle', { cx: m.X(q[0]), cy: m.Y(q[1]), r: 5, class: 'grid', 'stroke-width': 2 })); else svg.appendChild(S.svg('circle', { cx: m.X(q[0]), cy: m.Y(q[1]), r: 4, class: colour(lab[i]), 'fill-opacity': 0.85 })); });
      if (cen) cen.forEach(function (c, i) { svg.appendChild(S.svg('rect', { x: m.X(c[0]) - 6, y: m.Y(c[1]) - 6, width: 12, height: 12, class: colour(i), stroke: 'currentColor', 'stroke-width': 1.5 })); });
      P.clear(sv2); var vals = [], k; if (!db) { for (k = 1; k <= 8; k++) { var hh = C.kmeans(X, k, cS.get(), 30); vals.push(hh[hh.length - 1].inertia); } }
      if (!db) { var top = Math.max.apply(null, vals), EX = function (kk) { return 30 + (kk - 1) / 7 * 330; }, EY = function (v) { return 105 - v / top * 90; }, dd = ''; sv2.appendChild(S.svg('line', { x1: 30, y1: 105, x2: 366, y2: 105, class: 'axis' })); vals.forEach(function (v, i) { dd += (i ? 'L' : 'M') + EX(i + 1).toFixed(1) + ' ' + EY(v).toFixed(1); sv2.appendChild(S.svg('text', { x: EX(i + 1), y: 120, 'text-anchor': 'middle', class: 't2', text: String(i + 1) })); }); sv2.appendChild(S.svg('path', { d: dd, class: 'edge sv-s0', fill: 'none', 'stroke-width': 2.2 })); sv2.appendChild(S.svg('circle', { cx: EX(cK.get()), cy: EY(vals[cK.get() - 1]), r: 6, class: 'sv-f1' })); }
      else sv2.appendChild(S.svg('text', { x: 190, y: 65, 'text-anchor': 'middle', class: 't2', text: 'The elbow chart is for k-means. DBSCAN finds the number of clusters itself.' }));
      rI.set(db ? '-' : (st.i + 1) + ' of ' + st.hist.length + (st.hist[st.i].phase === 'assign' ? ' (assign)' : ' (move)')); rJ.set(inertia === null ? '-' : inertia.toFixed(2)); rC.set(String(nClusters)); rN.set(db ? String(noise) : '-');
      S.narrate(db ? 'DBSCAN found ' + nClusters + ' cluster' + (nClusters === 1 ? '' : 's') + ' and ' + noise + ' noise point' + (noise === 1 ? '' : 's') : (st.hist[st.i].phase === 'assign' ? 'Assign: every point joins its nearest centre' : 'Move: every centre moves to the middle of its points'),
        db ? 'DBSCAN grows a cluster from any point that has enough neighbours within the distance you set, so it can follow curved shapes and leaves isolated points as noise.' : 'k-means repeats two steps: assign each point to the nearest centre, then move each centre to the mean of its points. It stops when nothing changes. It needs k in advance, and it looks for round groups.');
      if (db && cData.get() === 'moons' && nClusters === 2) S.challenge('moons');
      if (!db && cData.get() === 'blobs' && cK.get() === 3 && st.i === st.hist.length - 1) S.challenge('three');
    }
    reset();
  });
})();
