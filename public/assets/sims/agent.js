/* Simulation: the chance that an agent finishes a chain of steps, and what checks do. Calculation: AIQPSim.logic.fnd. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('agent', function (S) {
    var F = Q.logic.fnd;
    var cP = S.range('p', 'Chance each step works', { min: 0.5, max: 0.99, step: 0.01, value: 0.9, fmt: function (v) { return (v * 100).toFixed(0) + '%'; }, onChange: function () { draw(); } });
    var cN = S.range('n', 'Steps in the task', { min: 1, max: 12, step: 1, value: 5, onChange: function () { draw(); } });
    var cC = S.range('check', 'Chance a check catches a failed step and retries it', { min: 0, max: 1, step: 0.1, value: 0, fmt: function (v) { return (v * 100).toFixed(0) + '%'; }, onChange: function () { draw(); } });
    var cv = S.card('Chance of finishing the whole task, for 1 to 12 steps (line 1: no checks, line 2: with your checks)', S.view), svg = S.svgEl(380, 190, 'Line chart of the chance of finishing against the number of steps.', cv);
    var u = S.el('ul', { class: 'sim-legend' }); [['l0', 'No checks'], ['l1', 'With your checks']].forEach(function (x) { u.appendChild(S.el('li', { class: x[0] }, [S.el('i'), document.createTextNode(x[1])])); }); cv.appendChild(u);
    var rA = S.readout('a', 'Finishes (500 simulated runs)'), rB = S.readout('b', 'By arithmetic (no checks)');
    function draw() {
      var p = cP.get(), n = cN.get(), c = cC.get(); while (svg.firstChild) svg.removeChild(svg.firstChild);
      var X = function (k) { return 30 + (k - 1) / 11 * 330; }, Y = function (v) { return 165 - v * 150; }, d0 = '', d1 = '';
      svg.appendChild(S.svg('line', { x1: 30, y1: 165, x2: 366, y2: 165, class: 'axis' })); [0, 0.5, 1].forEach(function (g) { svg.appendChild(S.svg('text', { x: 2, y: Y(g) + 3, 'font-size': 9, class: 't2', text: (g * 100) + '%' })); });
      for (var k = 1; k <= 12; k++) { d0 += (k > 1 ? 'L' : 'M') + X(k).toFixed(1) + ' ' + Y(Math.pow(p, k)).toFixed(1); d1 += (k > 1 ? 'L' : 'M') + X(k).toFixed(1) + ' ' + Y(F.agentSuccess(p, k, c)).toFixed(1); }
      svg.appendChild(S.svg('path', { d: d0, class: 'edge sv-s0', fill: 'none', 'stroke-width': 2.2 })); svg.appendChild(S.svg('path', { d: d1, class: 'edge sv-s1', fill: 'none', 'stroke-width': 2.2 })); svg.appendChild(S.svg('line', { x1: X(n), y1: 10, x2: X(n), y2: 165, class: 'grid' }));
      var sim = F.agentSuccess(p, n, c); rA.set((sim * 100).toFixed(0) + '%'); rB.set((Math.pow(p, n) * 100).toFixed(0) + '%');
      S.narrate('A ' + n + '-step task finishes about ' + (sim * 100).toFixed(0) + '% of the time', 'Every step must work, so the chances multiply: 0.9 five times is 0.59, ten times is 0.35. Even a good step becomes an unreliable task when the chain is long. Checks that catch a failed step and retry it, and a person approving the risky steps, raise the odds at the cost of time. Shorter chains help as much as better steps.');
      if (n >= 10 && p <= 0.9 && sim >= 0.7) S.challenge('long');
    }
    draw();
  });
})();
