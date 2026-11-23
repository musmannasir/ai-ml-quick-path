/* Simulation: adapting a model cheaply: LoRA (two thin matrices) and quantisation (fewer bits per weight). Calculation: AIQPSim.logic.llm. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('lora', function (S) {
    var L = Q.logic.llm, M = L.loraTarget(), W = L.quantWeights();
    var cV = S.select('view', 'Idea', [['lora', 'LoRA: change a big matrix with two thin ones'], ['quant', 'Quantisation: store weights in fewer bits']], S.preset === 'quant' ? 'quant' : 'lora', function () { show(); draw(); });
    var cR = S.range('rank', 'LoRA rank', { min: 1, max: 4, step: 1, value: 1, onChange: function () { draw(); } });
    var cB = S.range('bits', 'Bits per weight', { min: 2, max: 8, step: 1, value: 8, onChange: function () { draw(); } });
    var row = S.row(), c1 = S.card('Change', row), s1 = S.svgEl(150, 150, 'Grid of the numbers of the change the model needs.', c1), c2 = S.card('Change', row), s2 = S.svgEl(150, 150, 'Grid of the numbers of the cheap approximation.', c2);
    var rA = S.readout('a', ''), rB = S.readout('b', ''), rC = S.readout('c', ''), titles = [c1.firstChild, c2.firstChild];
    var rows = [rA, rB, rC];
    function show() { var q = cV.get() === 'quant'; cR.input.closest('.sim-ctl').hidden = q; cB.input.closest('.sim-ctl').hidden = !q; }
    function grid(svg, mat, scale) { while (svg.firstChild) svg.removeChild(svg.firstChild); mat.forEach(function (r, i) { r.forEach(function (v, j) { svg.appendChild(S.svg('rect', { x: 4 + j * 18, y: 4 + i * 18, width: 17, height: 17, rx: 2, class: v >= 0 ? 'sv-f0' : 'sv-f1', 'fill-opacity': (0.08 + 0.9 * Math.min(1, Math.abs(v) / scale)).toFixed(2) })); }); }); }
    function line(svg, a, b) {
      while (svg.firstChild) svg.removeChild(svg.firstChild); svg.setAttribute('viewBox', '0 0 150 150');
      var pa = '', pb = '', n = 40, mx = 0.15; for (var i = 0; i < n; i++) { var x = 6 + i * 3.6; pa += (i ? 'L' : 'M') + x + ' ' + (75 - a[i] / mx * 65).toFixed(1); pb += (i ? 'L' : 'M') + x + ' ' + (75 - b[i] / mx * 65).toFixed(1); }
      svg.appendChild(S.svg('line', { x1: 4, y1: 75, x2: 148, y2: 75, class: 'grid' })); svg.appendChild(S.svg('path', { d: pa, class: 'edge sv-s0', fill: 'none', 'stroke-width': 1.6 })); svg.appendChild(S.svg('path', { d: pb, class: 'edge sv-s1', fill: 'none', 'stroke-width': 1.6 }));
    }
    function draw() {
      var q = cV.get() === 'quant';
      if (!q) {
        var r = cR.get(), res = L.lowRank(M, r), approx = M.map(function (row, i) { return row.map(function (v, j) { return v - res.rest[i][j]; }); });
        titles[0].textContent = 'The change the model needs (8 × 8 = 64 numbers)'; titles[1].textContent = 'Two thin matrices of rank ' + r + ' (' + (16 * r) + ' numbers) multiplied';
        grid(s1, M, 1.2); grid(s2, approx, 1.2);
        var lab = ['Error left', 'Numbers to train (of 64)', 'At 4096 × 4096, rank ' + r]; rows.forEach(function (x, i) { x.set(''); });
        setLabels(lab); rA.set((res.err * 100).toFixed(0) + '%'); rB.set(String(16 * r)); rC.set((2 * 4096 * r).toLocaleString('en') + ' of ' + (4096 * 4096).toLocaleString('en') + ' (' + (100 * 2 * 4096 * r / (4096 * 4096)).toFixed(2) + '%)');
        S.narrate('Rank ' + r + ' leaves ' + (res.err * 100).toFixed(0) + '% of the change unexplained', 'LoRA writes the change to a big weight matrix as the product of two thin matrices, so only the thin ones are trained. The change here was built from two simple patterns plus a little noise, so rank 2 captures nearly all of it. In a real model the saving is large: at 4096 × 4096, rank 8 trains under half a percent of the numbers.');
        if (r === 2 && res.err <= 0.15) S.challenge('rank');
      } else {
        var bits = cB.get(), qz = L.quantise(W, bits), rm = L.quantRmse(W, bits);
        titles[0].textContent = 'First 40 weights: original (line 1) against stored at ' + bits + ' bits (line 2)'; titles[1].textContent = 'The same, magnified: the gap is the rounding error';
        line(s1, W.slice(0, 40), qz.slice(0, 40)); line(s2, W.slice(0, 40).map(function (w, i) { return (w - qz[i]) * 8; }), W.slice(0, 40).map(function () { return 0; }));
        setLabels(['Rounding error (RMSE)', 'Size against 16 bits', 'Distinct values']); rA.set(rm.toFixed(5)); rB.set((bits / 16 * 100).toFixed(0) + '%'); rC.set(String(Math.pow(2, bits) - 1));
        S.narrate(bits + ' bits: ' + (bits / 16 * 100).toFixed(0) + '% of the size, error ' + rm.toFixed(4), 'Quantisation rounds every weight to the nearest of a few evenly spaced values. Fewer bits mean a smaller file and faster loading, but a larger rounding error. Each bit removed roughly doubles the error.');
        if (rm <= 0.002 && bits <= 6) S.challenge('bits');
      }
    }
    function setLabels(a) { var dts = rows.map(function (x, i) { return x; }); var dl = S.view.querySelectorAll('.sim-readouts dt'); a.forEach(function (t, i) { if (dl[i]) dl[i].textContent = t; }); }
    show(); draw();
  });
})();
