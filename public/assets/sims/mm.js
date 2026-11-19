/* Simulation: an image cut into patches that become tokens. Calculation: AIQPSim.logic.fnd. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('mm', function (S) {
    var F = Q.logic.fnd;
    var cP = S.select('size', 'Patch size (pixels along one side)', [['8', '8'], ['4', '4'], ['2', '2'], ['1', '1']], '4', function () { draw(); });
    var c1 = S.card('An 8 × 8 picture of a bright square, cut into patches. Each patch becomes one token', S.view), svg = S.svgEl(300, 300, 'Eight by eight pixel picture cut into patches.', c1);
    var rT = S.readout('t', 'Tokens'), rA = S.readout('a', 'Pairs attention compares'), rV = S.readout('v', 'First token’s brightness');
    function draw() {
      var s = Number(cP.get()), n = 8 / s, tok = n * n, pr = F.patches(s), cs = 34;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) svg.appendChild(S.svg('rect', { x: 14 + c * cs, y: 14 + r * cs, width: cs - 2, height: cs - 2, class: 'sv-f0', 'fill-opacity': F.SQUARE[r][c] ? 0.9 : 0.07 }));
      for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) { svg.appendChild(S.svg('rect', { x: 13 + j * s * cs, y: 13 + i * s * cs, width: s * cs - 0, height: s * cs - 0, rx: 2, class: 'cellbox', 'stroke-width': 2 })); if (s > 1) svg.appendChild(S.svg('text', { x: 13 + j * s * cs + s * cs / 2, y: 13 + i * s * cs + s * cs / 2 + 4, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, class: pr[i][j] > 0.5 ? 'inv' : '', text: pr[i][j].toFixed(2) })); }
      rT.set(String(tok)); rA.set(String(tok * tok)); rV.set(pr[0][0].toFixed(2));
      S.narrate(tok + ' token' + (tok > 1 ? 's' : '') + ' from this picture; attention compares ' + tok * tok + ' pairs', 'A model that reads pictures with a Transformer cuts the image into patches and turns each patch into a token, like a word. The number printed in a patch is its average brightness, a stand-in for the numbers a real model computes. Small patches keep detail but give many tokens, and attention compares every token with every other, so the cost grows with the square of the token count.');
      if (s === 1) S.challenge('cost');
    }
    draw();
  });
})();
