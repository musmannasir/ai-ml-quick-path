/* Simulation: a treatment that wins in every group can lose overall (Simpson's paradox). Calculation: AIQPSim.logic.ai. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('cau', function (S) {
    var A = Q.logic.ai;
    var cV = S.select('view', 'Look at', [['all', 'Everyone together'], ['split', 'Split by how hard the case is']], 'all', function () { draw(); });
    var cA = S.range('ha', 'Share of hard cases given treatment A', { min: 0, max: 1, step: 0.05, value: 0.8, fmt: function (v) { return (v * 100).toFixed(0) + '%'; }, onChange: function () { draw(); } });
    var cB = S.range('hb', 'Share of hard cases given treatment B', { min: 0, max: 1, step: 0.05, value: 0.1, fmt: function (v) { return (v * 100).toFixed(0) + '%'; }, onChange: function () { draw(); } });
    S.buttons([{ id: 'same', label: 'Give both treatments the same mix', primary: true, onClick: function () { cA.set(0.5); cB.set(0.5); draw(); } }]);
    var cv = S.card('Share of patients who recovered', S.view), bars = S.el('ul', { class: 'sim-bars', 'aria-label': 'Recovery rates' }); cv.appendChild(bars);
    var rA = S.readout('a', 'Treatment A overall'), rB = S.readout('b', 'Treatment B overall'), rW = S.readout('w', 'Looks better overall');
    function bar(l, v, pick) { var li = S.el('li', { class: 'sim-bar' + (pick ? ' pick' : '') }); li.appendChild(S.el('span', { class: 'sim-bar-l', text: l })); var tr = S.el('span', { class: 'sim-bar-track' }), fl = S.el('span', { class: 'sim-bar-fill' }); fl.style.width = (v * 100).toFixed(1) + '%'; tr.appendChild(fl); li.appendChild(tr); li.appendChild(S.el('span', { class: 'sim-bar-v', text: (v * 100).toFixed(0) + '%' })); bars.appendChild(li); }
    function draw() {
      var ha = cA.get(), hb = cB.get(), oa = A.overall('A', ha), ob = A.overall('B', hb); bars.innerHTML = '';
      if (cV.get() === 'split') { bar('A, easy cases', A.RATES.A[0], A.RATES.A[0] > A.RATES.B[0]); bar('B, easy cases', A.RATES.B[0], false); bar('A, hard cases', A.RATES.A[1], true); bar('B, hard cases', A.RATES.B[1], false); }
      else { bar('A overall', oa, oa > ob); bar('B overall', ob, ob > oa); }
      rA.set((oa * 100).toFixed(0) + '%'); rB.set((ob * 100).toFixed(0) + '%'); rW.set(Math.abs(oa - ob) < 0.005 ? 'tie' : oa > ob ? 'A' : 'B');
      S.narrate(cV.get() === 'split' ? 'Inside each kind of case, treatment A does better' : (oa > ob ? 'Overall, A looks better' : 'Overall, B looks better, although A is better in each group'), 'Treatment A does better on easy cases (90% against 84%) and on hard cases (70% against 50%). But in this data A is given mostly hard cases and B mostly easy ones, so the overall figures mislead. The difficulty of the case is a hidden cause that affects both who gets which treatment and who recovers. Giving both treatments the same mix of cases, as a randomised trial does, removes that effect.');
      if (Math.abs(ha - hb) <= 0.05 && oa > ob) S.challenge('flip');
    }
    draw();
  });
})();
