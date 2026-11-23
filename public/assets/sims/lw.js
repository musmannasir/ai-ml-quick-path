/* Simulation: a tiny count model learning to write as it reads more text. Calculation: AIQPSim.logic.llm and gen. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('lw', function (S) {
    var L = Q.logic.llm, G = Q.logic.gen, toks = G.split(G.CORPUS), N = L.trainLen(), pts = [10, 20, 40, 60, 80, 100, 120, 140, N];
    var cN = S.range('n', 'Words of text read so far', { min: 10, max: N, step: 1, value: 10, onChange: function () { draw(); } });
    var cS = S.range('seed', 'Random seed for the sample', { min: 1, max: 20, step: 1, value: 7, onChange: function () { draw(); } });
    var cC = S.card('Loss on text the model has never read (lower is better)', S.view), svg = S.svgEl(380, 150, 'Line chart of loss on unseen text against words of training text.', cC);
    var cT = S.card('A sample of what it writes (starts with “the cat”)', S.view), chips = S.el('p', { class: 'sim-narr-x', 'aria-live': 'off' }); cT.appendChild(chips);
    var rN = S.readout('n', 'Words read'), rL = S.readout('l', 'Loss on unseen text'), rG = S.readout('g', 'Loss if it guessed evenly');
    var curve = pts.map(function (n) { return [n, L.holdoutLoss(n)]; }), vocab = {}; toks.forEach(function (t) { vocab[t] = 1; });
    function draw() {
      var n = cN.get(), loss = L.holdoutLoss(n), model = G.train(L.trainTokens().slice(0, n).join(' ')), words = G.generate(model, 'the cat', 22, 1, 0, 1, 'sample', cS.get());
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var X = function (v) { return 34 + (Math.log(v) - Math.log(10)) / (Math.log(N) - Math.log(10)) * 330; }, Y = function (v) { return 130 - v / 3.4 * 115; };
      svg.appendChild(S.svg('line', { x1: 34, y1: 130, x2: 370, y2: 130, class: 'axis' })); svg.appendChild(S.svg('line', { x1: 34, y1: 12, x2: 34, y2: 130, class: 'axis' }));
      var d = ''; curve.forEach(function (c, i) { d += (i ? 'L' : 'M') + X(c[0]).toFixed(1) + ' ' + Y(c[1]).toFixed(1); }); svg.appendChild(S.svg('path', { d: d, class: 'edge sv-s0', fill: 'none', 'stroke-width': 2.2 }));
      svg.appendChild(S.svg('circle', { cx: X(n), cy: Y(loss), r: 6, class: 'sv-f1' })); svg.appendChild(S.svg('text', { x: 370, y: 146, 'text-anchor': 'end', class: 't2', text: 'words read (log scale)' })); svg.appendChild(S.svg('text', { x: 4, y: 20, class: 't2', text: 'loss' }));
      chips.textContent = 'the cat ' + words.join(' ');
      rN.set(String(n)); rL.set(loss.toFixed(2)); rG.set(Math.log(Object.keys(vocab).length).toFixed(2));
      S.narrate(loss > 2.6 ? 'It has read little: its text is close to random words' : loss > 2.15 ? 'It is picking up common word pairs' : 'It now writes sentences that look like its training text', 'This is a count model, not a neural network: it stores which word followed which. The loss is measured on every fourth sentence of the text, which it never reads. More text to read lowers the loss, and the samples begin to look like the text.');
      if (loss < 2.05) S.challenge('good');
    }
    draw();
  });
})();
