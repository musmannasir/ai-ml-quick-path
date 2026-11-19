/* Simulation: finding anomalies with a distance score and a flag rate. Calculation: AIQPSim.logic.core. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('anom', function (S) {
    var C = Q.logic.core, P = Q.plot, W = 380, H = 270, pad = 14, xr = [-1.05, 1.05], yr = [-1.05, 1.05], m = P.map(W, H, pad, xr, yr);
    var X = C.anomalyData(6, 80), sc = C.knnScores(X, 5);
    var cC = S.range('cont', 'Share of points to flag', { min: 1, max: 20, step: 1, value: 2, fmt: function (v) { return v + '%'; }, onChange: function () { draw(); } });
    var cR = S.toggle('reveal', 'Reveal the 4 real anomalies (diamonds)', false, function () { draw(); });
    var c1 = S.card('Each point’s score is its distance to its 5th nearest neighbour; flagged points are drawn large', S.view), svg = S.svgEl(W, H, 'Scatter plot of points; flagged points are larger.', c1);
    var rF = S.readout('f', 'Flagged'), rK = S.readout('k', 'Real anomalies caught'), rA = S.readout('a', 'False alarms');
    function draw() {
      var fl = C.flag(sc, cC.get() / 100), n = Object.keys(fl).length, caught = 0, i;
      P.clear(svg); P.frame(S, svg, m, W, H, pad, xr, yr);
      X.forEach(function (q, k) {
        var on = !!fl[k], odd = k >= 80; if (on && odd) caught++;
        svg.appendChild(S.svg('circle', { cx: m.X(q[0]), cy: m.Y(q[1]), r: on ? 7 : 3.6, class: on ? 'sv-f1' : 'sv-f0', 'fill-opacity': on ? 0.9 : 0.6 }));
        if (cR.get() && odd) svg.appendChild(S.svg('path', { d: 'M' + m.X(q[0]) + ' ' + (m.Y(q[1]) - 10) + 'l8 10l-8 10l-8 -10z', class: 'cellbox', fill: 'none' }));
      });
      rF.set(String(n)); rK.set(caught + ' of 4'); rA.set(String(n - caught));
      S.narrate(n + ' points flagged: ' + caught + ' of 4 real anomalies caught, ' + (n - caught) + ' false alarm' + (n - caught === 1 ? '' : 's'), 'A point far from its neighbours gets a high score. Flagging more points catches more real anomalies but also raises more false alarms. In real work the true anomalies are not known, so the flag rate is a business choice about the cost of a miss against the cost of a false alarm.');
      if (caught === 4 && n - caught <= 2) S.challenge('all');
    }
    draw();
  });
})();
