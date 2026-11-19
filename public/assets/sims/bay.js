/* Simulation: how likely is illness after a positive test? (Bayes' rule with natural frequencies.) Calculation: AIQPSim.logic.ai. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('bay', function (S) {
    var A = Q.logic.ai;
    var cP = S.range('prior', 'How common the illness is', { min: -3, max: -0.3, step: 0.05, value: -1, log: true, fmt: function (v) { return (v * 100).toFixed(v < 0.01 ? 2 : 1) + '%'; }, onChange: function () { draw(); } });
    var cS = S.range('sens', 'Test catches the illness (sensitivity)', { min: 0.5, max: 0.99, step: 0.01, value: 0.95, fmt: function (v) { return (v * 100).toFixed(0) + '%'; }, onChange: function () { draw(); } });
    var cT = S.range('spec', 'Test clears the healthy (specificity)', { min: 0.5, max: 0.99, step: 0.01, value: 0.9, fmt: function (v) { return (v * 100).toFixed(0) + '%'; }, onChange: function () { draw(); } });
    var cN = S.toggle('two', 'A second, independent test is also positive', false, function () { draw(); });
    var cv = S.card('Out of 10,000 people', S.view), svg = S.svgEl(380, 150, 'Two bars: the share of people who are ill, and among those with a positive test the share who are really ill.', cv);
    var rA = S.readout('a', 'Positive tests'), rB = S.readout('b', 'Really ill among them'), rC = S.readout('c', 'Chance of illness');
    function seg(x, w, y, cls, label, op) { if (w < 0.5) return x; svg.appendChild(S.svg('rect', { x: x, y: y, width: w, height: 34, class: cls, 'fill-opacity': op })); if (w > 54) svg.appendChild(S.svg('text', { x: x + w / 2, y: y + 21, 'text-anchor': 'middle', 'font-size': 11, class: 'inv', text: label })); return x + w; }
    function draw() {
      var p = cP.get(), se = cS.get(), sp = cT.get(), n = A.counts(p, se, sp), pos = n.tp + n.fp, one = pos ? n.tp / pos : 0, post = A.posterior(p, se, sp, cN.get() ? 2 : 1);
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var W = 360, ill = n.tp + n.fn; svg.appendChild(S.svg('text', { x: 10, y: 14, 'font-size': 11, class: 't2', text: 'Everyone: ' + ill + ' ill, ' + (10000 - ill) + ' healthy' }));
      var x = seg(10, Math.max(2, ill / 10000 * W), 20, 'sv-f1', ill + ' ill', 0.9); seg(x, W + 10 - x, 20, 'sv-f2', (10000 - ill) + ' healthy', 0.7);
      svg.appendChild(S.svg('text', { x: 10, y: 80, 'font-size': 11, class: 't2', text: 'Only the ' + pos + ' with a positive test:' }));
      var x2 = seg(10, pos ? n.tp / pos * W : 0, 86, 'sv-f1', n.tp + ' really ill', 0.9); seg(x2, W + 10 - x2, 86, 'sv-f2', n.fp + ' false alarms', 0.7);
      svg.appendChild(S.svg('text', { x: 10, y: 140, 'font-size': 11, text: 'Share really ill after the first positive: ' + (one * 100).toFixed(0) + '%' }));
      rA.set(String(pos)); rB.set(n.tp + ' of ' + pos); rC.set((post * 100).toFixed(1) + '%');
      S.narrate('After ' + (cN.get() ? 'two positive tests' : 'a positive test') + ' the chance of illness is ' + (post * 100).toFixed(1) + '%', 'Most people are healthy, so even a small false-alarm rate produces many false alarms, and they can outnumber the true cases. The chance of illness after a positive result depends on how common the illness is, not only on how good the test is. A second independent positive result multiplies the odds again.');
      if (p <= 0.0105 && post < 0.2 && !cN.get()) S.challenge('rare');
      if (cN.get() && p >= 0.05 && post >= 0.9) S.challenge('twice');
    }
    draw();
  });
})();
