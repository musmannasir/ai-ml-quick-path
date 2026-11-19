/* Simulation: model builder (parameters, memory, cache, training work from layers and width). Calculation: AIQPSim.logic.llm. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  var num = function (v) { return v >= 1e12 ? (v / 1e12).toFixed(2) + ' trillion' : v >= 1e9 ? (v / 1e9).toFixed(2) + ' billion' : v >= 1e6 ? (v / 1e6).toFixed(1) + ' million' : v >= 1e3 ? (v / 1e3).toFixed(1) + ' thousand' : String(Math.round(v)); };
  var bytes = function (v) { return v >= 1e12 ? (v / 1e12).toFixed(2) + ' TB' : v >= 1e9 ? (v / 1e9).toFixed(2) + ' GB' : v >= 1e6 ? (v / 1e6).toFixed(1) + ' MB' : v >= 1e3 ? (v / 1e3).toFixed(1) + ' KB' : Math.round(v) + ' bytes'; };
  var PRESETS = { toy: [1, 8, 21, 'This guide’s toy (1 layer, 8 numbers per word)'], small: [12, 768, 50257, 'A small model shape (12 layers, 768 wide)'], b7: [32, 4096, 32000, 'A 7-billion-class shape (32 layers, 4096 wide)'], b70: [80, 8192, 32000, 'A 70-billion-class shape (80 layers, 8192 wide)'] };
  Q.register('mb', function (S) {
    var L = Q.logic.llm, st = {};
    var cP = S.select('preset', 'Start from', Object.keys(PRESETS).map(function (k) { return [k, PRESETS[k][3]]; }).concat([['custom', 'My own shape']]), S.preset === 'scale' ? 'b7' : 'toy', function (v) { if (PRESETS[v]) { var p = PRESETS[v]; cL.set(p[0]); cD.set(String(p[1])); cV.set(String(p[2])); } draw(); });
    var cL = S.range('layers', 'Layers (blocks)', { min: 1, max: 96, step: 1, value: 1, onChange: function () { cP.set('custom'); draw(); } });
    var cD = S.select('d', 'Numbers per word (width)', [8, 64, 256, 768, 1024, 2048, 4096, 8192, 12288].map(function (v) { return [String(v), String(v)]; }), '8', function () { cP.set('custom'); draw(); });
    var cV = S.select('v', 'Vocabulary (distinct tokens)', [21, 32000, 50257, 100000].map(function (v) { return [String(v), String(v)]; }), '21', function () { cP.set('custom'); draw(); });
    var cB = S.select('bits', 'Bits per weight when stored', [['16', '16 bits (half precision)'], ['8', '8 bits'], ['4', '4 bits']], '16', function () { draw(); });
    var cT = S.range('ctx', 'Text kept in the cache (tokens)', { min: 2, max: 5.1, step: 0.1, value: 3.3, log: true, fmt: function (v) { return Math.round(v).toLocaleString('en'); }, onChange: function () { draw(); } });
    var cM = S.card('Where the parameters are', S.view), bars = S.el('ul', { class: 'sim-bars', 'aria-label': 'Share of parameters' }); cM.appendChild(bars);
    var rP = S.readout('p', 'Parameters'), rW = S.readout('w', 'Weights in memory'), rK = S.readout('k', 'Cache for this text'), rTr = S.readout('t', 'Training memory (about)'), rF = S.readout('f', 'Training work (operations)');
    function draw() {
      var l = cL.get(), d = Number(cD.get()), v = Number(cV.get()), bits = Number(cB.get()), n = L.params(l, d, v), ctx = Math.round(cT.get());
      var parts = [['word table', v * d], ['attention', 4 * l * d * d], ['feed-forward', 8 * l * d * d]];
      bars.innerHTML = ''; parts.forEach(function (p) { var li = S.el('li', { class: 'sim-bar' }); li.appendChild(S.el('span', { class: 'sim-bar-l', text: p[0] })); var tr = S.el('span', { class: 'sim-bar-track' }), fl = S.el('span', { class: 'sim-bar-fill' }); fl.style.width = (p[1] / n * 100).toFixed(1) + '%'; tr.appendChild(fl); li.appendChild(tr); li.appendChild(S.el('span', { class: 'sim-bar-v', text: (p[1] / n * 100).toFixed(0) + '%' })); bars.appendChild(li); });
      var w = L.weightBytes(n, bits), kv = L.kvBytesPerToken(l, d, 16) * ctx, tokens = 20 * n;
      rP.set(num(n)); rW.set(bytes(w)); rK.set(bytes(kv)); rTr.set(bytes(16 * n)); rF.set(L.trainFlops(n, tokens).toExponential(1));
      S.narrate(num(n) + ' parameters need ' + bytes(w) + ' just to hold the weights', 'Each layer adds about 12 × width² parameters (attention 4, feed-forward 8), and the word table adds vocabulary × width. Doubling the width roughly quadruples the layer parameters. The cache keeps one key and one value per layer for every token of text kept, so long text costs memory on top of the weights. Training memory uses a common rule of thumb of 16 bytes per parameter, and training work uses 6 × parameters × tokens with 20 tokens per parameter.');
      if (n >= 1e9 && w <= 8e9) S.challenge('fit');
      if (n >= 1e9 && l <= 12) S.challenge('wide');
    }
    draw();
  });
})();
