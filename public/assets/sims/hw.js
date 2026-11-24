/* Simulation: does a model fit in GPU memory, and how fast could it write? Calculation: AIQPSim.logic.llm (fitCheck, speedLimit). */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  var SIZES = { 3: [3, 28], 8: [8, 32], 14: [14, 40], 32: [32, 64], 70: [70, 80] };   // billions of parameters, assumed layer counts
  var gb = function (v) { return v >= 100 ? v.toFixed(0) + ' GB' : v.toFixed(2) + ' GB'; };
  Q.register('hw', function (S) {
    var L = Q.logic.llm;
    var cM = S.select('model', 'Model size', [['3', '3 billion parameters'], ['8', '8 billion parameters'], ['14', '14 billion parameters'], ['32', '32 billion parameters'], ['70', '70 billion parameters']], '8', function () { draw(); });
    var cB = S.select('bits', 'Bits per weight', [['16', '16 bits (2 bytes)'], ['8', '8 bits (1 byte)'], ['4', '4 bits (half a byte)']], '16', function () { draw(); });
    var cC = S.select('ctx', 'Conversation length (tokens)', [['2048', '2,048'], ['8192', '8,192'], ['32768', '32,768'], ['131072', '131,072']], '8192', function () { draw(); });
    var cG = S.select('vram', 'GPU memory (VRAM)', [['8', '8 GB'], ['12', '12 GB'], ['16', '16 GB'], ['24', '24 GB'], ['48', '48 GB'], ['80', '80 GB']], '24', function () { draw(); });
    var cW = S.select('bw', 'Memory speed (illustrative)', [['100', '100 GB per second'], ['300', '300 GB per second'], ['500', '500 GB per second'], ['1000', '1,000 GB per second'], ['2000', '2,000 GB per second']], '300', function () { draw(); });
    var card = S.card('Memory needed, split into weights, cache and working space (the line is the GPU memory)', S.view), svg = S.svgEl(420, 110, 'A bar showing weights, cache and working space against the memory of the GPU.', card);
    var rW = S.readout('w', 'Weights'), rK = S.readout('k', 'Cache for the conversation'), rT = S.readout('t', 'Total needed (with 1 GB working space)'), rV = S.readout('v', 'Does it fit?'), rS = S.readout('s', 'Speed limit from memory');
    function draw() {
      var size = SIZES[cM.get()], bits = Number(cB.get()), ctx = Number(cC.get()), vram = Number(cG.get()), bw = Number(cW.get());
      var r = L.fitCheck(size[0], bits, size[1], ctx, vram), top = Math.max(vram, r.total) * 1.08, x0 = 10, wd = 400;
      var sc = function (v) { return wd * v / top; };
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var parts = [['weights', r.weights, 'sv-f0'], ['cache', r.cache, 'sv-f1'], ['working', r.working, 'sv-f2']], x = x0;
      parts.forEach(function (p) { var w = Math.max(p[1] > 0 ? 1.5 : 0, sc(p[1])); svg.appendChild(S.svg('rect', { x: x, y: 30, width: w, height: 36, rx: 2, class: p[2] })); x += w; });
      var lx = x0 + sc(vram);
      svg.appendChild(S.svg('line', { x1: lx, y1: 18, x2: lx, y2: 78, class: 'axis', 'stroke-width': 3 }));
      svg.appendChild(S.svg('text', { x: Math.min(lx, 360), y: 96, class: 'sv-t', 'font-size': 11 })).textContent = 'GPU memory ' + vram + ' GB';
      svg.appendChild(S.svg('text', { x: x0, y: 14, class: 'sv-t', 'font-size': 11 })).textContent = 'weights ' + gb(r.weights) + ', cache ' + gb(r.cache) + ', working ' + gb(r.working);
      var limit = L.speedLimit(r.weights, bw);
      rW.set(gb(r.weights)); rK.set(gb(r.cache)); rT.set(gb(r.total));
      rV.set(r.fits ? 'Yes, ' + gb(r.spare) + ' to spare' : 'No, ' + gb(-r.spare) + ' short');
      rS.set((limit >= 10 ? limit.toFixed(0) : limit.toFixed(1)) + ' tokens per second at most');
      S.narrate((r.fits ? 'Fits: ' : 'Does not fit: ') + gb(r.total) + ' needed, ' + vram + ' GB available',
        'The weights are the parameters times the bytes per weight. The cache grows with the length of the conversation. If the total is more than the GPU memory, the model has to be made smaller, the context shortened, or some layers moved to slower memory. The speed limit is the memory speed divided by the size of the weights, because every new token reads all the weights once. Real speeds are lower.');
      if (size[0] === 70 && vram === 48 && r.fits) S.challenge('fit70');
      if (size[0] === 8 && limit >= 100) S.challenge('fast');
    }
    draw();
  });
})();
