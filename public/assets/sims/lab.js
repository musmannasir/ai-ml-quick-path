/* Simulation: label noise and annotator agreement. Calculation: AIQPSim.logic.fnd and sup. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('lab', function (S) {
    var F = Q.logic.fnd, curve = [];
    for (var n = 0; n <= 0.45001; n += 0.05) curve.push([n, F.noisyAccuracy(n)]);
    var cN = S.range('noise', 'Share of training labels that are wrong', { min: 0, max: 0.45, step: 0.05, value: 0, fmt: function (v) { return (v * 100).toFixed(0) + '%'; }, onChange: function () { draw(); } });
    var cv = S.card('Accuracy on clean test points, for every amount of label noise', S.view), svg = S.svgEl(380, 170, 'Line chart of test accuracy against the share of wrong training labels.', cv);
    var rA = S.readout('a', 'Test accuracy'), rB = S.readout('b', 'Two annotators agree');
    function draw() {
      var p = Math.round(cN.get() * 100) / 100, acc = F.noisyAccuracy(p), ag = F.agreement(p, 11);
      while (svg.firstChild) svg.removeChild(svg.firstChild); var X = function (v) { return 34 + v / 0.45 * 330; }, Y = function (v) { return 150 - (v - 0.4) / 0.6 * 130; };
      svg.appendChild(S.svg('line', { x1: 34, y1: 150, x2: 370, y2: 150, class: 'axis' })); svg.appendChild(S.svg('line', { x1: 34, y1: 12, x2: 34, y2: 150, class: 'axis' }));
      [0.5, 0.75, 1].forEach(function (g) { svg.appendChild(S.svg('text', { x: 2, y: Y(g) + 3, 'font-size': 9, class: 't2', text: (g * 100) + '%' })); });
      var d = ''; curve.forEach(function (c, i) { d += (i ? 'L' : 'M') + X(c[0]).toFixed(1) + ' ' + Y(c[1]).toFixed(1); }); svg.appendChild(S.svg('path', { d: d, class: 'edge sv-s0', fill: 'none', 'stroke-width': 2.2 })); svg.appendChild(S.svg('circle', { cx: X(p), cy: Y(acc), r: 6, class: 'sv-f1' })); svg.appendChild(S.svg('text', { x: 370, y: 166, 'text-anchor': 'end', class: 't2', text: 'share of wrong labels' }));
      rA.set((acc * 100).toFixed(0) + '%'); rB.set((ag * 100).toFixed(0) + '%');
      S.narrate((p * 100).toFixed(0) + '% wrong labels: test accuracy ' + (acc * 100).toFixed(0) + '%', 'A model copies its training labels, including the mistakes. A nearest-neighbour model copies them closely, so it suffers most. When two people label the same items and each is wrong sometimes, how often they agree falls quickly, so low agreement is a warning that the labels are noisy. Checking a sample of labels is cheap compared with training on bad ones.');
      if (p >= 0.3 && acc <= 0.65) S.challenge('drop');
    }
    draw();
  });
})();
