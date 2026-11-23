/* Simulation: an autoencoder (squeeze and rebuild) and the noise side of diffusion. Calculation: AIQPSim.logic.dl. Needs attn.js for AIQPSim.ui. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('ae', function (S) {
    var D = Q.logic.dl, X = D.aeData(), comps = D.components(X, 4), eps = D.noise(5), g2 = D.noise(6);
    var cV = S.select('view', 'Idea', [['ae', 'Autoencoder: squeeze, then rebuild'], ['diff', 'Diffusion: add noise, then guess it back']], S.preset === 'diff' ? 'diff' : 'ae', function () { show(); draw(); });
    var cK = S.range('k', 'Numbers in the middle (the squeeze)', { min: 1, max: 4, step: 1, value: 1, onChange: function () { draw(); } });
    var cS = S.range('sample', 'Which data sample to show', { min: 1, max: 40, step: 1, value: 1, onChange: function () { draw(); } });
    var cT = S.range('t', 'Noise steps added', { min: 0, max: 20, step: 1, value: 0, onChange: function () { draw(); } });
    var cE = S.range('err', 'Mistake in the model’s noise guess', { min: 0, max: 0.6, step: 0.05, value: 0, fmt: function (v) { return v.toFixed(2); }, onChange: function () { draw(); } });
    var c1 = S.card('Picture', S.view), svg = S.svgEl(380, 120, 'Picture for the chosen idea.', c1), legend = Q.ui.legend(S, c1);
    var rA = S.readout('a', ''), rB = S.readout('b', ''), rC = S.readout('c', '');
    function show() { var d = cV.get() === 'diff'; [cK, cS].forEach(function (c) { c.input.closest('.sim-ctl').hidden = d; }); [cT, cE].forEach(function (c) { c.input.closest('.sim-ctl').hidden = !d; }); }
    function labels(a) { var dl = S.view.querySelectorAll('.sim-readouts dt'); a.forEach(function (t, i) { if (dl[i]) dl[i].textContent = t; }); }
    function draw() {
      if (cV.get() === 'ae') {
        var k = cK.get(), x = X[cS.get() - 1], rc = D.reconstruct(x, comps.slice(0, k)), err = D.aeError(X, comps.slice(0, k));
        c1.firstChild.textContent = 'One sample of 8 numbers, and what the network rebuilds from only ' + k + ' number' + (k > 1 ? 's' : '');
        Q.ui.vecRows(S, svg, [{ label: 'original', vec: x }, { label: 'rebuilt', vec: rc }, { label: 'difference', vec: x.map(function (v, i) { return v - rc[i]; }) }], 4);
        labels(['Share of the data lost', 'Numbers kept', 'Squeeze']); rA.set((err * 100).toFixed(1) + '%'); rB.set(k + ' of 8'); rC.set((8 / k).toFixed(1) + ' to 1');
        S.narrate(k + ' number' + (k > 1 ? 's' : '') + ' in the middle loses ' + (err * 100).toFixed(1) + '% of the data', 'The 8 numbers of each sample really come from two hidden causes plus a little noise. An autoencoder must pass everything through a narrow middle, so it learns the directions that matter most. With two numbers in the middle it rebuilds nearly everything; with one it cannot. This is the best a straight-line autoencoder can do (the same directions PCA finds).');
        if (k <= 2 && err < 0.1) S.challenge('ae');
      } else {
        var t = cT.get(), xt = D.noisy(t, eps), ab = D.alphaBar(t), e = cE.get(), x0 = xt.map(function (v, i) { return ab > 0 ? (v - Math.sqrt(1 - ab) * (eps[i] + e * g2[i])) / Math.sqrt(ab) : 0; });
        c1.firstChild.textContent = 'A signal (grey), the same signal after ' + t + ' noise steps (line 1), and the rebuild from a noise guess (line 2)';
        while (svg.firstChild) svg.removeChild(svg.firstChild); svg.setAttribute('viewBox', '0 0 380 120');
        var path = function (a, cls, wd) { var d = ''; a.forEach(function (v, i) { d += (i ? 'L' : 'M') + (10 + i * 11.4).toFixed(1) + ' ' + (60 - Math.max(-2, Math.min(2, v)) * 26).toFixed(1); }); svg.appendChild(S.svg('path', { d: d, class: cls, fill: 'none', 'stroke-width': wd })); };
        svg.appendChild(S.svg('line', { x1: 10, y1: 60, x2: 370, y2: 60, class: 'grid' })); path(D.SIGNAL, 'edge grid', 3); path(xt, 'edge sv-s0', 1.6); if (t > 0) path(x0, 'edge sv-s1', 2);
        var dist = D.rms(xt, D.SIGNAL), back = D.rms(x0, D.SIGNAL);
        labels(['Signal kept (alpha bar)', 'Noisy signal off by', 'Rebuild off by']); rA.set(ab.toFixed(3)); rB.set(dist.toFixed(2)); rC.set(t === 0 ? '-' : back.toFixed(2));
        S.narrate(t === 0 ? 'Step 0: the clean signal' : 'After ' + t + ' steps only ' + (ab * 100).toFixed(0) + '% of the signal strength is left', 'Diffusion adds a little noise at each step until the signal is gone. A generating model is trained to guess the noise that was added, so it can remove it step by step. Here the guess is the true noise plus the mistake you choose, so the rebuild shows how an error in the guess becomes an error in the picture. A real model must produce that guess itself.');
        if (t >= 20) S.challenge('diff');
      }
    }
    show(); draw();
  });
})();
