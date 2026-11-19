/* Simulation: filling in missing values and the effect of one extreme value. Calculation: AIQPSim.logic.fnd. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('cln', function (S) {
    var F = Q.logic.fnd, st = { base: null };
    var cM = S.select('method', 'Missing values are', [['drop', 'Dropped'], ['mean', 'Filled with the mean'], ['median', 'Filled with the middle value (median)'], ['zero', 'Filled with zero']], 'drop', function () { draw(); });
    var cO = S.toggle('outlier', 'Keep the extreme value (120)', true, function () { draw(); });
    var cv = S.card('Monthly incomes in thousands (made up). Hollow dots were missing and have been filled', S.view), svg = S.svgEl(380, 120, 'Dot strip of twenty values, with missing ones filled in.', cv);
    var rN = S.readout('n', 'Values used'), rA = S.readout('a', 'Mean'), rM = S.readout('m', 'Median'), rS = S.readout('s', 'Spread (std)');
    function draw() {
      var m = cM.get(), vals = F.cleanValues(m).slice(), mask = m === 'drop' ? F.INCOME.filter(function (v) { return v !== null; }).map(function () { return false; }) : F.INCOME.map(function (v) { return v === null; });
      if (!cO.get()) { var keep = []; vals.forEach(function (v, i) { if (v !== 120) keep.push(i); }); vals = keep.map(function (i) { return vals[i]; }); mask = keep.map(function (i) { return mask[i]; }); }
      var n = vals.length, mean = vals.reduce(function (a, b) { return a + b; }, 0) / n, s = vals.slice().sort(function (a, b) { return a - b; }), med = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2, sd = Math.sqrt(vals.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / n);
      while (svg.firstChild) svg.removeChild(svg.firstChild); var X = function (v) { return 20 + v * 2.8; }; svg.appendChild(S.svg('line', { x1: 20, y1: 80, x2: 366, y2: 80, class: 'axis' }));
      [0, 40, 80, 120].forEach(function (t) { svg.appendChild(S.svg('text', { x: X(t), y: 98, 'text-anchor': 'middle', 'font-size': 9, class: 't2', text: String(t) })); });
      vals.forEach(function (v, i) { svg.appendChild(S.svg('circle', { cx: X(v), cy: 74 - (i % 4) * 11, r: 4.5, class: mask[i] ? 'cellbox' : 'sv-f0' })); });
      svg.appendChild(S.svg('line', { x1: X(mean), y1: 20, x2: X(mean), y2: 80, class: 'edge sv-s1', 'stroke-width': 2.5 })); svg.appendChild(S.svg('line', { x1: X(med), y1: 20, x2: X(med), y2: 80, class: 'edge sv-s2', 'stroke-width': 2.5, 'stroke-dasharray': '4 3' })); svg.appendChild(S.svg('text', { x: 20, y: 14, 'font-size': 10, text: 'solid line = mean, dashed = median' }));
      rN.set(String(n)); rA.set(mean.toFixed(2)); rM.set(med.toFixed(2)); rS.set(sd.toFixed(2));
      if (cO.get()) st.base = { mean: mean };
      S.narrate('Mean ' + mean.toFixed(1) + ', median ' + med.toFixed(1), 'The median barely notices the extreme value, but the mean is pulled toward it. Filling gaps with zero drags both toward a value that nobody actually has. Filling with the mean or median keeps the centre where it was, but it makes the data look more alike than it is. Whatever you choose, record it.');
      if (m === 'drop' && !cO.get() && mean < 36) S.challenge('outlier');
      if (m === 'zero') S.challenge('zero');
    }
    draw();
  });
})();
