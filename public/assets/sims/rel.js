/* Simulation: a canary release with an automatic rollback gate. Calculation: AIQPSim.logic.ops. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('rel', function (S) {
    var O = Q.logic.ops;
    var cS = S.select('sc', 'The new model is really', [['same', 'As good as the old one (5% wrong)'], ['slight', 'Slightly worse (8% wrong)'], ['bad', 'Clearly worse (15% wrong)']], 'same', function () { draw(); });
    var cC = S.range('share', 'Share of traffic sent to the new model (canary)', { min: 1, max: 50, step: 1, value: 5, fmt: function (v) { return v + '%'; }, onChange: function () { draw(); } });
    var cT = S.range('thr', 'Roll back if the new model is worse by more than', { min: 1, max: 10, step: 1, value: 3, fmt: function (v) { return v + ' points'; }, onChange: function () { draw(); } });
    var cv = S.card('Wrong answers seen, as a share of requests (2,000 requests in total)', S.view), bars = S.el('ul', { class: 'sim-bars', 'aria-label': 'Share of wrong answers' }); cv.appendChild(bars);
    var rN = S.readout('n', 'Requests the new model saw'), rW = S.readout('w', 'Wrong answers it gave'), rD = S.readout('d', 'The gate decides');
    function bar(l, v) { var li = S.el('li', { class: 'sim-bar' }); li.appendChild(S.el('span', { class: 'sim-bar-l', text: l })); var tr = S.el('span', { class: 'sim-bar-track' }), fl = S.el('span', { class: 'sim-bar-fill' }); fl.style.width = Math.min(100, v * 400).toFixed(1) + '%'; tr.appendChild(fl); li.appendChild(tr); li.appendChild(S.el('span', { class: 'sim-bar-v', text: (v * 100).toFixed(1) + '%' })); bars.appendChild(li); }
    function draw() {
      var share = cC.get() / 100, v = O.release(cS.get(), share, cT.get()); bars.innerHTML = ''; bar('Old model', v.rk); bar('New model (canary)', v.rc);
      rN.set(String(v.cn)); rW.set(String(v.ce)); rD.set(v.decision);
      S.narrate(v.decision === 'wait' ? 'Too few requests to decide yet' : 'The gate says: ' + v.decision, 'A canary sends a small share of traffic to the new model and compares it with the old one. If it is clearly worse, the system rolls back automatically, and only the canary’s users were affected. With too little traffic the comparison is noise, so the gate waits. A very strict gate rolls back harmless changes; a loose one lets harm through.');
      if (cS.get() === 'bad' && v.decision === 'roll back' && cC.get() <= 10) S.challenge('catch');
      if (v.decision === 'wait') S.challenge('wait');
    }
    draw();
  });
})();
