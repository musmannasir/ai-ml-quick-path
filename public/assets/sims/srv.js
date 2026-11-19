/* Simulation: serving a model: requests, a queue, batch size, latency, cost and autoscaling. Calculation: AIQPSim.logic.ops.
   Times and prices are made up. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('srv', function (S) {
    var O = Q.logic.ops;
    var cL = S.range('lam', 'Requests arriving each second', { min: 1, max: 14, step: 1, value: 6, onChange: function () { draw(); } });
    var cN = S.range('n', 'Servers to start with', { min: 1, max: 6, step: 1, value: 1, onChange: function () { draw(); } });
    var cB = S.range('b', 'Requests handled together (batch size)', { min: 1, max: 16, step: 1, value: 1, onChange: function () { draw(); } });
    var cA = S.toggle('auto', 'Autoscaling: add or remove servers by queue length', false, function () { draw(); });
    var cv = S.card('Requests waiting in the queue during 200 seconds (line), and servers running (steps)', S.view), svg = S.svgEl(380, 190, 'Chart of the queue length and the number of servers over 200 seconds.', cv);
    var rS = S.readout('s', 'Requests served'), rM = S.readout('m', 'Median wait + work'), rP = S.readout('p', 'Slowest 5% took over'), rQ = S.readout('q', 'Still waiting at the end'), rC = S.readout('c', 'Cost per hour (made-up price)');
    function draw() {
      var v = O.serve(cL.get(), cN.get(), cB.get(), cA.get()), top = Math.max(10, Math.max.apply(null, v.hist.map(function (h) { return h[1]; })));
      while (svg.firstChild) svg.removeChild(svg.firstChild); var X = function (t) { return 30 + t / 200 * 340; };
      svg.appendChild(S.svg('line', { x1: 30, y1: 160, x2: 370, y2: 160, class: 'axis' })); svg.appendChild(S.svg('text', { x: 2, y: 20, 'font-size': 9, class: 't2', text: String(top) })); svg.appendChild(S.svg('text', { x: 370, y: 176, 'text-anchor': 'end', 'font-size': 9, class: 't2', text: 'seconds' }));
      var d = '', ds = ''; v.hist.forEach(function (h, i) { d += (i ? 'L' : 'M') + X(h[0]).toFixed(1) + ' ' + (160 - h[1] / top * 140).toFixed(1); ds += (i ? 'L' : 'M') + X(h[0]).toFixed(1) + ' ' + (160 - h[2] * 16).toFixed(1); });
      svg.appendChild(S.svg('path', { d: ds, class: 'edge sv-s2', fill: 'none', 'stroke-width': 2, 'stroke-dasharray': '4 3' })); svg.appendChild(S.svg('path', { d: d, class: 'edge sv-s1', fill: 'none', 'stroke-width': 2.4 }));
      rS.set(String(v.served)); rM.set(v.p50.toFixed(2) + ' s'); rP.set(v.p95.toFixed(2) + ' s'); rQ.set(String(v.queue)); rC.set('$' + v.cost.toFixed(2));
      var cap = cN.get() * cB.get() / (0.2 + 0.05 * cB.get());
      S.narrate(v.queue > 20 ? 'The queue keeps growing: requests arrive faster than they can be served' : 'The system keeps up: median ' + v.p50.toFixed(1) + ' s', 'A server needs about 0.2 seconds plus 0.05 seconds per request in the batch (made-up figures). Batching handles more requests a second per server because the fixed 0.2 seconds is shared, but each request may wait for its batch. With these settings the servers can handle about ' + cap.toFixed(1) + ' requests a second. When arrivals exceed that, the queue grows without limit and latency explodes. More servers cost money; autoscaling adds them only when the queue builds.');
      if (cL.get() >= 8 && !cA.get() && cN.get() === 1 && v.queue < 10 && v.p95 < 3) S.challenge('batch');
      if (cL.get() >= 12 && cA.get() && v.p95 < 3) S.challenge('scale');
    }
    draw();
  });
})();
