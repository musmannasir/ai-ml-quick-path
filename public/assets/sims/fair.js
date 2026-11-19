/* Simulation: one threshold or one per group, and what moves. Calculation: AIQPSim.logic.fnd. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('fair', function (S) {
    var F = Q.logic.fnd, G = F.groups(), same = true;
    var cS = S.toggle('same', 'Use one threshold for both groups', true, function (v) { same = v; cB.input.closest('.sim-ctl').hidden = v; draw(); });
    var cA = S.range('ta', 'Threshold for group A', { min: 0, max: 1, step: 0.05, value: 0.5, fmt: function (v) { return v.toFixed(2); }, onChange: function () { draw(); } });
    var cB = S.range('tb', 'Threshold for group B', { min: 0, max: 1, step: 0.05, value: 0.5, fmt: function (v) { return v.toFixed(2); }, onChange: function () { draw(); } });
    var cv = S.card('For each group (made-up scores, 200 people each): who is selected, how many of the people who qualify are found, and how often the decision is right', S.view), bars = S.el('ul', { class: 'sim-bars', 'aria-label': 'Selection, found and correct rates by group' }); cv.appendChild(bars);
    var rA = S.readout('a', 'Gap in qualified people found'), rB = S.readout('b', 'Gap in people selected');
    function bar(l, v) { var li = S.el('li', { class: 'sim-bar' }); li.appendChild(S.el('span', { class: 'sim-bar-l', text: l })); var tr = S.el('span', { class: 'sim-bar-track' }), fl = S.el('span', { class: 'sim-bar-fill' }); fl.style.width = (v * 100).toFixed(1) + '%'; tr.appendChild(fl); li.appendChild(tr); li.appendChild(S.el('span', { class: 'sim-bar-v', text: (v * 100).toFixed(0) + '%' })); bars.appendChild(li); }
    function draw() {
      var ta = cA.get(), tb = same ? ta : cB.get(), a = F.fairMetrics(G[0], ta), b = F.fairMetrics(G[1], tb); bars.innerHTML = '';
      bar('A selected', a.sel); bar('B selected', b.sel); bar('A found (of those who qualify)', a.tpr); bar('B found (of those who qualify)', b.tpr); bar('A decisions right', a.acc); bar('B decisions right', b.acc);
      var gap = Math.abs(a.tpr - b.tpr); rA.set((gap * 100).toFixed(0) + ' points'); rB.set((Math.abs(a.sel - b.sel) * 100).toFixed(0) + ' points');
      S.narrate(same ? 'One threshold: group A has ' + (a.tpr * 100).toFixed(0) + '% of qualified people found, group B ' + (b.tpr * 100).toFixed(0) + '%' : 'Separate thresholds: ' + (a.tpr * 100).toFixed(0) + '% and ' + (b.tpr * 100).toFixed(0) + '% of qualified people found', 'In this made-up data the score separates qualified people less well for group B, so one threshold finds fewer of them. Lowering group B’s threshold finds more qualified people in B, but also selects more people overall and changes how often decisions are right. There is no setting that makes every measure equal at once: choosing which gap to close is a decision for people, not a calculation.');
      if (!same && gap <= 0.03 && Math.abs(ta - tb) > 0.04) S.challenge('equal');
    }
    S.controls && cB.input.closest('.sim-ctl').setAttribute('hidden', ''); draw();
  });
})();
