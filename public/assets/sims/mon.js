/* Simulation: watching a stream for drift, with an alert threshold and false alarms. Calculation: AIQPSim.logic.ops. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('mon', function (S) {
    var O = Q.logic.ops;
    var cS = S.range('shift', 'How far the world shifts on day 60', { min: 0, max: 8, step: 0.5, value: 5, fmt: function (v) { return v.toFixed(1); }, onChange: function () { draw(); } });
    var cW = S.range('w', 'Days averaged before checking', { min: 1, max: 21, step: 1, value: 7, onChange: function () { draw(); } });
    var cT = S.range('thr', 'Alert when the average is this many standard errors away', { min: 1, max: 5, step: 0.5, value: 3, fmt: function (v) { return v.toFixed(1); }, onChange: function () { draw(); } });
    var cv = S.card('A daily number the model depends on (made up). Red marks are alert days; the shift is on day 60', S.view), svg = S.svgEl(380, 190, 'Line chart of a daily value with a shift on day 60 and alert days marked.', cv);
    var rF = S.readout('f', 'False alarms before day 60'), rD = S.readout('d', 'Days until the first real alert'), rA = S.readout('a', 'Alert days in total');
    function draw() {
      var v = O.drift(cS.get(), cW.get(), cT.get()), X = function (t) { return 24 + t * 3.5; }, Y = function (z) { return 95 - (z - 50) * 4.2; };
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(S.svg('line', { x1: 24, y1: Y(v.base), x2: 374, y2: Y(v.base), class: 'grid', 'stroke-dasharray': '4 3' })); svg.appendChild(S.svg('line', { x1: X(60), y1: 8, x2: X(60), y2: 170, class: 'axis', 'stroke-dasharray': '3 3' })); svg.appendChild(S.svg('text', { x: X(60) + 3, y: 16, 'font-size': 9, class: 't2', text: 'shift' })); svg.appendChild(S.svg('line', { x1: 24, y1: 170, x2: 374, y2: 170, class: 'axis' }));
      var d = ''; v.x.forEach(function (y, t) { d += (t ? 'L' : 'M') + X(t).toFixed(1) + ' ' + Math.max(8, Math.min(166, Y(y))).toFixed(1); }); svg.appendChild(S.svg('path', { d: d, class: 'edge sv-s0', fill: 'none', 'stroke-width': 1.5 }));
      v.alerts.forEach(function (t) { svg.appendChild(S.svg('rect', { x: X(t) - 1.4, y: 174, width: 3, height: 10, class: 'sv-f1' })); });
      rF.set(String(v.false)); rD.set(v.delay === null ? 'never' : v.delay + ' days'); rA.set(String(v.alerts.length));
      S.narrate(v.delay === null ? 'The shift was never noticed' : 'First real alert ' + v.delay + ' days after the shift, with ' + v.false + ' false alarm' + (v.false === 1 ? '' : 's'), 'The monitor compares a recent average with the average from the first 40 days. A low threshold or a short window reacts fast but also fires when nothing has changed (false alarms). A high threshold or a long window is calmer but slow. With no shift at all, any alert is a false alarm. Choosing the setting is choosing which mistake costs less.');
      if (cS.get() >= 5 && v.false === 0 && v.delay !== null && v.delay <= 5) S.challenge('fast');
    }
    draw();
  });
})();
