/* Simulation: embeddings and vector search on a made-up 2-D map. Calculation: AIQPSim.logic.llm. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('vs', function (S) {
    var L = Q.logic.llm, P = Q.plot, W = 380, H = 300, pad = 14, xr = [-1.1, 1.1], yr = [-1.1, 1.1], m = P.map(W, H, pad, xr, yr), pts = L.vsPoints();
    var cW = S.select('word', 'Jump the query to a word', [['', 'Choose…']].concat(pts.map(function (p, i) { return [String(i), p.w]; })), '', function (v) { if (v !== '') { cX.set(pts[v].x.toFixed(2)); cY.set(pts[v].y.toFixed(2)); draw(); } });
    var cX = S.range('x', 'Query position, across', { min: -1, max: 1, step: 0.01, value: 0.5, fmt: function (v) { return v.toFixed(2); }, onChange: function () { cW.set(''); draw(); } });
    var cY = S.range('y', 'Query position, up', { min: -1, max: 1, step: 0.01, value: 0.45, fmt: function (v) { return v.toFixed(2); }, onChange: function () { cW.set(''); draw(); } });
    var cK = S.range('k', 'How many neighbours to fetch (k)', { min: 1, max: 12, step: 1, value: 5, onChange: function () { draw(); } });
    var cM = S.select('metric', 'Closeness measured by', [['euclid', 'Straight-line distance'], ['cos', 'Angle (cosine similarity)']], 'euclid', function () { draw(); });
    var cv = S.card('Made-up map of 24 words. The cross is your query; rings mark what is fetched', S.view), svg = S.svgEl(W, H, 'Map of words by topic with a query point and its nearest neighbours ringed.', cv);
    var cR = S.card('Results, best first', S.view), ol = S.el('ol', { class: 'sim-merges' }); cR.appendChild(ol);
    var rT = S.readout('t', 'Topics in the results'), rF = S.readout('f', 'Top result');
    var names = L.TOPICS.map(function (t) { return t[0]; });
    function draw() {
      var q = [cX.get(), cY.get()], res = L.vsSearch(pts, q, cK.get(), cM.get()), top = {};
      P.clear(svg); P.frame(S, svg, m, W, H, pad, xr, yr);
      var inRes = {}; res.forEach(function (r) { inRes[r.i] = 1; top[pts[r.i].t] = 1; });
      pts.forEach(function (p, i) { svg.appendChild(S.svg('circle', { cx: m.X(p.x), cy: m.Y(p.y), r: 4.5, class: 'sv-f' + p.t })); svg.appendChild(S.svg('text', { x: m.X(p.x) + 6, y: m.Y(p.y) + 3, 'font-size': 9, class: 't2', text: p.w })); if (inRes[i]) svg.appendChild(S.svg('circle', { cx: m.X(p.x), cy: m.Y(p.y), r: 9, class: 'cellbox' })); });
      svg.appendChild(S.svg('path', { d: 'M' + (m.X(q[0]) - 8) + ' ' + m.Y(q[1]) + 'h16M' + m.X(q[0]) + ' ' + (m.Y(q[1]) - 8) + 'v16', class: 'axis', 'stroke-width': 3 }));
      ol.innerHTML = ''; res.forEach(function (r) { ol.appendChild(S.el('li', { text: r.w + ' (' + names[pts[r.i].t] + ', score ' + r.s.toFixed(2) + ')' })); });
      var topics = Object.keys(top).map(function (t) { return names[t]; }); rT.set(String(topics.length)); rF.set(res[0].w);
      S.narrate('The ' + res.length + ' nearest: ' + res.map(function (r) { return r.w; }).join(', '), 'Search turns the query into a point and returns the closest stored points. Fetching more neighbours (a larger k) soon reaches points from other topics. Cosine similarity compares directions only, so it ignores how far a point is from the middle, while straight-line distance does not. Real embeddings have hundreds of dimensions; this map has two.');
      if (topics.length >= 2 && cK.get() <= 6) S.challenge('mix');
    }
    draw();
  });
})();
