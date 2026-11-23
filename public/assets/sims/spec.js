/* Simulation: from a sound wave to a spectrogram, with a window-size trade-off. A real (plain) Fourier transform runs in the page.
   Calculation: AIQPSim.logic.dl. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('spec', function (S) {
    var D = Q.logic.dl, sig = D.signal(), cache = {};
    var cN = S.select('n', 'Window size (samples = milliseconds)', [['16', '16'], ['32', '32'], ['64', '64'], ['128', '128']], '64', function () { draw(); });
    var c1 = S.card('The sound: 100 Hz for the first half, 250 Hz for the second half, and one short click', S.view), wave = S.svgEl(380, 90, 'Waveform of the made-up sound.', c1);
    var c2 = S.card('Spectrogram: time goes right, pitch goes up, brightness is strength', S.view), svg = S.svgEl(380, 230, 'Spectrogram: brightness shows how strong each frequency is at each moment.', c2);
    var rF = S.readout('f', 'Pitch steps of'), rT = S.readout('t', 'Window lasts'), rP = S.readout('p', 'Pitch read, first and last frame');
    function spec(N) { return cache[N] || (cache[N] = D.spectrogram(sig, N)); }
    (function () { var d = ''; sig.forEach(function (v, i) { d += (i ? 'L' : 'M') + (4 + i * 372 / 511).toFixed(1) + ' ' + (45 - Math.max(-2, Math.min(2, v)) * 18).toFixed(1); }); wave.appendChild(S.svg('line', { x1: 4, y1: 45, x2: 376, y2: 45, class: 'grid' })); wave.appendChild(S.svg('path', { d: d, class: 'edge sv-s0', fill: 'none', 'stroke-width': 1.2 })); })();
    function draw() {
      var N = Number(cN.get()), sp = spec(N), frames = sp.length, bins = sp[0].length, mx = 0; sp.forEach(function (r) { r.forEach(function (v) { mx = Math.max(mx, v); }); });
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var L = 36, W = 340, H = 200, cw = W / frames, ch = H / (bins - 1);
      sp.forEach(function (row, f) { row.forEach(function (v, b) { svg.appendChild(S.svg('rect', { x: L + f * cw, y: 4 + H - (b + 0.5) * ch, width: cw + 0.4, height: ch + 0.4, class: 'sv-f0', 'fill-opacity': (Math.pow(v / mx, 0.5) * 0.95).toFixed(2) })); }); });
      [0, 250, 500].forEach(function (hz) { svg.appendChild(S.svg('text', { x: 2, y: 4 + H - hz / 500 * H + 4, 'font-size': 9, class: 't2', text: hz + ' Hz' })); });
      svg.appendChild(S.svg('text', { x: L, y: 222, class: 't2', 'font-size': 9, text: '0 ms' })); svg.appendChild(S.svg('text', { x: L + W, y: 222, 'text-anchor': 'end', class: 't2', 'font-size': 9, text: '512 ms' }));
      var p1 = D.peak(sp[0], N), p2 = D.peak(sp[frames - 1], N);
      rF.set((1000 / N).toFixed(1) + ' Hz'); rT.set(N + ' ms'); rP.set(p1.toFixed(0) + ' and ' + p2.toFixed(0) + ' Hz');
      S.narrate('Window of ' + N + ' ms: pitch steps of ' + (1000 / N).toFixed(1) + ' Hz, ' + frames + ' time slices', 'A spectrogram cuts the sound into short windows and measures how much of each pitch is in each window. A long window separates pitches finely but blurs when things happen; a short window shows when the click happens but cannot tell nearby pitches apart. The true pitches are 100 Hz and 250 Hz.');
      if (N <= 32) S.challenge('click'); if (Math.abs(p1 - 100) < 2) S.challenge('pitch');
    }
    draw();
  });
})();
