/* Simulation: messages passing round a small graph, round by round. Calculation: AIQPSim.logic.dl. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('gnn', function (S) {
    var D = Q.logic.dl, NAMES = ['A', 'B', 'C', 'D', 'E', 'F'], W = 380, H = 230;
    var cR = S.range('round', 'Rounds of messages', { min: 0, max: 12, step: 1, value: 0, onChange: function () { draw(); } });
    var cW = S.range('self', 'How much a node keeps of its own value', { min: 0, max: 0.9, step: 0.1, value: 0.4, fmt: function (v) { return v.toFixed(1); }, onChange: function () { draw(); } });
    var cN = S.select('start', 'Node that starts with the value 1', NAMES.map(function (n, i) { return [String(i), 'Node ' + n]; }), '0', function () { draw(); });
    var cv = S.card('Each circle is a node. Its number is the value it holds; darker means a larger value', S.view), svg = S.svgEl(W, H, 'A small graph of six nodes with the value each node holds after the chosen number of rounds.', cv);
    var rR = S.readout('r', 'Nodes holding something'), rS = S.readout('s', 'Largest minus smallest value'), rT = S.readout('t', 'Total');
    function draw() {
      var h = [0, 0, 0, 0, 0, 0]; h[Number(cN.get())] = 1; for (var r = 0; r < cR.get(); r++) h = D.messageRound(h, cW.get());
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      D.EDGES.forEach(function (e) { var a = D.NODES[e[0]], b = D.NODES[e[1]]; svg.appendChild(S.svg('line', { x1: a[0] * W, y1: a[1] * H, x2: b[0] * W, y2: b[1] * H, class: 'axis', 'stroke-width': 2 })); });
      var mx = Math.max.apply(null, h) || 1, holding = 0, tot = 0;
      h.forEach(function (v, i) {
        var p = D.NODES[i]; if (v > 1e-9) holding++; tot += v;
        svg.appendChild(S.svg('circle', { cx: p[0] * W, cy: p[1] * H, r: 22, class: 'node' })); svg.appendChild(S.svg('circle', { cx: p[0] * W, cy: p[1] * H, r: 22, class: 'sv-f0', 'fill-opacity': (0.05 + 0.9 * v / mx).toFixed(2) }));
        svg.appendChild(S.svg('text', { x: p[0] * W, y: p[1] * H - 28, 'text-anchor': 'middle', 'font-weight': 700, text: NAMES[i] })); svg.appendChild(S.svg('text', { x: p[0] * W, y: p[1] * H + 4, 'text-anchor': 'middle', 'font-size': 11, class: v / mx > 0.6 ? 'inv' : '', text: v.toFixed(2) }));
      });
      var spread = Math.max.apply(null, h) - Math.min.apply(null, h);
      rR.set(holding + ' of 6'); rS.set(spread.toFixed(2)); rT.set(tot.toFixed(2));
      S.narrate(cR.get() === 0 ? 'Only node ' + NAMES[Number(cN.get())] + ' holds anything' : 'After ' + cR.get() + ' round' + (cR.get() > 1 ? 's' : '') + ', ' + holding + ' node' + (holding > 1 ? 's hold' : ' holds') + ' something', 'In each round every node keeps part of its own value and takes the average of its neighbours’ values. Information travels one step along the edges per round, so after two rounds it has reached everything within two steps. After many rounds all nodes drift to the same value, which is why very deep graph networks blur the differences between nodes.');
      if (spread < 0.03 && cR.get() > 0) S.challenge('smooth');
    }
    draw();
  });
})();
