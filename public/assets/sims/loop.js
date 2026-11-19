/* Simulation: the project loop. Inject a fault and see which stages must be repeated. Calculation: AIQPSim.logic.fnd. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  var WHY = ['People who labelled the data made mistakes, so the model learned the mistakes. It shows up when you evaluate on carefully checked labels. The fix is back at the data.',
    'The model was good at something nobody needed. It shows only when it is used for real, and the fix goes back to the very first stage: what does success mean?',
    'Information from the test set slipped into training, so the test score was too good. It is found when real results are worse. The fix is in how the data was prepared.',
    'The world changed after launch, so the old data no longer matches. Monitoring shows it. The fix is new data.',
    'A column was used in training that does not exist at the moment of prediction. It shows on deployment, and the fix is in how features are prepared.'];
  Q.register('loop', function (S) {
    var F = Q.logic.fnd;
    var cF = S.select('fault', 'Inject this fault', F.FAULTS.map(function (x, i) { return [String(i), x[0]]; }), '0', function () { draw(); });
    var cv = S.card('The loop: red = where the fault is noticed, blue = where it must be fixed, shaded = work that is repeated', S.view), svg = S.svgEl(380, 120, 'Seven stages of a machine learning project with the fault marked.', cv);
    var rN = S.readout('n', 'Noticed at'), rF = S.readout('f', 'Fixed at'), rC = S.readout('c', 'Stages repeated');
    function draw() {
      var fa = F.FAULTS[Number(cF.get())], det = fa[1], fix = fa[2], w = 52;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      F.STAGES.forEach(function (n, i) { var x = 8 + i * (w + 1.5), redo = i >= fix && i <= det; svg.appendChild(S.svg('rect', { x: x, y: 30, width: w, height: 40, rx: 5, class: redo ? 'sv-f2' : 'node', 'fill-opacity': redo ? 0.45 : 1 })); svg.appendChild(S.svg('text', { x: x + w / 2, y: 54, 'text-anchor': 'middle', 'font-size': 10, text: n })); if (i === det) { svg.appendChild(S.svg('circle', { cx: x + w / 2, cy: 20, r: 6, class: 'sv-f1' })); } if (i === fix) { svg.appendChild(S.svg('circle', { cx: x + w / 2, cy: 84, r: 6, class: 'sv-f0' })); } });
      svg.appendChild(S.svg('text', { x: 8, y: 108, 'font-size': 10, class: 't2', text: 'Red dot: noticed. Blue dot: fixed.' }));
      rN.set(F.STAGES[det]); rF.set(F.STAGES[fix]); rC.set(String(det - fix + 1));
      S.narrate(fa[0] + ': ' + (det - fix + 1) + ' stages repeated', WHY[Number(cF.get())] + ' The later a fault is noticed, and the earlier its cause, the more work is repeated.');
      if (det - fix + 1 === 7) S.challenge('worst');
    }
    draw();
  });
})();
