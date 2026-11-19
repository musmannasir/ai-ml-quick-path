/* Simulation: how big a test set must be before a score can be trusted. Calculation: AIQPSim.logic.fnd. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('evl', function (S) {
    var F = Q.logic.fnd;
    var cN = S.range('n', 'Test cases', { min: 1, max: 3.5, step: 0.05, value: 1.3, log: true, fmt: function (v) { return Math.round(v).toLocaleString('en'); }, onChange: function () { draw(); } });
    var cv = S.card('Ten different test sets of the same size, all from an app that truly passes 80% of the time', S.view), svg = S.svgEl(380, 170, 'Dots showing the pass rate measured on ten test sets, with the margin of error band.', cv);
    var rM = S.readout('m', 'Margin of error'), rR = S.readout('r', 'Range of the ten scores'), rT = S.readout('t', 'Can 82% and 78% be told apart?');
    function draw() {
      var n = Math.round(cN.get()), m = F.margin(0.8, n), rates = F.sampleRates(n), mn = Math.min.apply(null, rates), mx = Math.max.apply(null, rates), tell;
      tell = (0.82 - F.margin(0.82, n)) > (0.78 + F.margin(0.78, n));
      while (svg.firstChild) svg.removeChild(svg.firstChild); var Y = function (v) { return 150 - (v - 0.4) / 0.6 * 130; };
      svg.appendChild(S.svg('rect', { x: 34, y: Y(0.8 + m), width: 330, height: Math.max(1, Y(0.8 - m) - Y(0.8 + m)), class: 'sv-f0', 'fill-opacity': 0.18 })); svg.appendChild(S.svg('line', { x1: 34, y1: Y(0.8), x2: 364, y2: Y(0.8), class: 'grid', 'stroke-dasharray': '4 3' }));
      svg.appendChild(S.svg('line', { x1: 34, y1: 150, x2: 364, y2: 150, class: 'axis' })); [0.5, 0.8, 1].forEach(function (g) { svg.appendChild(S.svg('text', { x: 2, y: Y(g) + 3, 'font-size': 9, class: 't2', text: (g * 100) + '%' })); });
      rates.forEach(function (v, i) { svg.appendChild(S.svg('circle', { cx: 58 + i * 33, cy: Y(Math.min(1, v)), r: 5, class: 'sv-f1' })); });
      rM.set('± ' + (m * 100).toFixed(1) + ' points'); rR.set((mn * 100).toFixed(0) + '% to ' + (mx * 100).toFixed(0) + '%'); rT.set(tell ? 'yes' : 'no');
      S.narrate(n + ' test cases give a margin of about ± ' + (m * 100).toFixed(1) + ' points', 'The true pass rate is the same every time, but each test set gives a slightly different score, because it holds different cases. The band is the usual 95% margin of error, which shrinks with the square root of the number of cases: four times as many cases halves it. A difference smaller than the margins is not evidence that one app is better.');
      if (tell) S.challenge('tell');
    }
    draw();
  });
})();
