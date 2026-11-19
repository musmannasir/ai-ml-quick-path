/* Simulation: forecasting a monthly series with a time-ordered split. Calculation: AIQPSim.logic.ai. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  var NAMES = { naive: 'Repeat the last value', seasonal: 'Repeat the same month last year', trend: 'Trend plus yearly pattern' };
  Q.register('ts', function (S) {
    var A = Q.logic.ai, y = A.series(), fit = A.fitTrendSeason(y, 36);
    var cM = S.select('model', 'Forecast method', Object.keys(NAMES).map(function (k) { return [k, NAMES[k]]; }), 'naive', function () { draw(); });
    var cH = S.range('h', 'Months ahead to forecast', { min: 1, max: 12, step: 1, value: 3, onChange: function () { draw(); } });
    var cW = S.range('w', 'Smoothing window (moving average, 1 = off)', { min: 1, max: 12, step: 1, value: 1, onChange: function () { draw(); } });
    var cv = S.card('Four years of monthly values (made up). The first three years are for fitting, the last year is held back for testing', S.view), svg = S.svgEl(380, 220, 'Line chart of a monthly series with a forecast over the held-back year.', cv);
    var u = S.el('ul', { class: 'sim-legend' }); [['l0', 'Real values'], ['l1', 'Forecast'], ['l2', 'Smoothed']].forEach(function (x) { u.appendChild(S.el('li', { class: x[0] }, [S.el('i'), document.createTextNode(x[1])])); }); cv.appendChild(u);
    var rE = S.readout('e', 'Average miss (MAE)'), rN = S.readout('n', 'Repeat last value'), rS = S.readout('s', 'Repeat last year'), rT = S.readout('t', 'Trend plus pattern');
    function draw() {
      var m = cM.get(), h = cH.get(), w = cW.get(), f = A.forecast(m, y, h), X = function (t) { return 28 + t * 7.2; }, Y = function (v) { return 200 - (v - 40) * 2.2; };
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(S.svg('line', { x1: 28, y1: 200, x2: 376, y2: 200, class: 'axis' })); svg.appendChild(S.svg('line', { x1: X(35.5), y1: 8, x2: X(35.5), y2: 200, class: 'grid', 'stroke-dasharray': '4 3' })); svg.appendChild(S.svg('text', { x: X(36), y: 16, 'font-size': 10, class: 't2', text: 'held-back year' }));
      var d = ''; y.forEach(function (v, t) { d += (t ? 'L' : 'M') + X(t).toFixed(1) + ' ' + Y(v).toFixed(1); }); svg.appendChild(S.svg('path', { d: d, class: 'edge sv-s0', fill: 'none', 'stroke-width': 1.8 }));
      if (w > 1) { var ds = ''; y.forEach(function (v, t) { var a = Math.max(0, t - w + 1), s = 0; for (var q = a; q <= t; q++) s += y[q]; ds += (t ? 'L' : 'M') + X(t).toFixed(1) + ' ' + Y(s / (t - a + 1)).toFixed(1); }); svg.appendChild(S.svg('path', { d: ds, class: 'edge sv-s2', fill: 'none', 'stroke-width': 2.4 })); }
      var df = 'M' + X(35).toFixed(1) + ' ' + Y(y[35]).toFixed(1); f.forEach(function (v, k) { df += 'L' + X(36 + k).toFixed(1) + ' ' + Y(v).toFixed(1); }); svg.appendChild(S.svg('path', { d: df, class: 'edge sv-s1', fill: 'none', 'stroke-width': 2.6 }));
      f.forEach(function (v, k) { svg.appendChild(S.svg('circle', { cx: X(36 + k), cy: Y(y[36 + k]), r: 3.4, class: 'sv-f0' })); });
      var mine = A.mae(m, y, h), nv = A.mae('naive', y, h), sv = A.mae('seasonal', y, h), tv = A.mae('trend', y, h);
      rE.set(mine.toFixed(2)); rN.set(nv.toFixed(2)); rS.set(sv.toFixed(2)); rT.set(tv.toFixed(2));
      S.narrate(NAMES[m] + ' misses by ' + mine.toFixed(1) + ' on average over the next ' + h + ' month' + (h > 1 ? 's' : ''), 'The model never sees the held-back year when it is fitted: the split follows time, not chance, because in real use you forecast forward. This series has a steady upward trend of about ' + fit.b.toFixed(2) + ' a month and a yearly pattern. Repeating the last value ignores both, repeating last year ignores the trend, and the fitted trend plus pattern follows both. Smoothing with a moving average only helps you see the trend; it is not a forecast.');
      if (m === 'trend' && h === 12 && mine < 3) S.challenge('trend');
      if (m === 'seasonal' && sv > nv) S.challenge('worse');
    }
    draw();
  });
})();
