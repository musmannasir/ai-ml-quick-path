/* Simulation: training word embeddings so related words move together. Calculation: AIQPSim.logic.llm. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('emb', function (S) {
    var L = Q.logic.llm, P = Q.plot, W = 380, H = 280, pad = 16, xr = [-1.2, 1.2], yr = [-1.2, 1.2], m = P.map(W, H, pad, xr, yr), st = { pos: L.embInit(), step: 0, loss: null };
    var cT = S.range('tau', 'Temperature', { min: -1, max: 0.3, step: 0.05, value: Math.log10(0.5), log: true, fmt: function (v) { return v.toFixed(2); }, onChange: function () { reset(); } });
    S.buttons([{ id: 'one', label: 'One step', onClick: function () { go(1); } }, { id: 'ten', label: 'Run 10 steps', primary: true, onClick: function () { go(10); } }, { id: 'reset', label: 'Start again', onClick: function () { reset(); } }]);
    var cv = S.card('Each dot is a word placed on a 2-D map. Same colour = same topic', S.view), svg = S.svgEl(W, H, 'Map of twelve words in three topics, moving closer to their topic as training runs.', cv);
    var rS = S.readout('s', 'Steps'), rL = S.readout('l', 'Loss'), rA = S.readout('a', 'Nearest word is in the same topic');
    function reset() { st.pos = L.embInit(); st.step = 0; st.loss = L.embStep(st.pos.map(function (p) { return p.slice(); }), cT.get(), 0); draw(); }
    function go(n) { for (var i = 0; i < n; i++) { st.loss = L.embStep(st.pos, cT.get(), 0.3); st.step++; } draw(); }
    function draw() {
      P.clear(svg); P.frame(S, svg, m, W, H, pad, xr, yr);
      st.pos.forEach(function (p, i) { var g = Math.floor(i / 4); svg.appendChild(S.svg('circle', { cx: m.X(p[0]), cy: m.Y(p[1]), r: 6, class: 'sv-f' + g })); svg.appendChild(S.svg('text', { x: m.X(p[0]) + 8, y: m.Y(p[1]) + 4, 'font-size': 10, text: L.WORDS[i] })); });
      var acc = L.embAccuracy(st.pos); rS.set(String(st.step)); rL.set(st.loss.toFixed(2)); rA.set((acc * 100).toFixed(0) + '%');
      S.narrate(st.step ? 'After ' + st.step + ' steps, ' + (acc * 100).toFixed(0) + '% of words have a same-topic nearest neighbour' : 'Random starting positions: neighbours mean nothing yet', 'Each word is pulled toward one partner from its topic and pushed away from words of other topics. The temperature sets how sharply the loss focuses on the closest wrong word: low means it mostly cares about the nearest wrong neighbour, high means it spreads its attention over all of them.');
      if (acc === 1 && st.step > 0) S.challenge('all');
    }
    reset();
  });
})();
