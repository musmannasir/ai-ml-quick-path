/* Simulation: a filter sliding over an image (convolution), with stride, padding and pooling. Calculation: AIQPSim.logic.dl. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  var f2 = function (v) { return Math.abs(v) < 0.005 ? '0' : (Math.round(v) === v ? String(v) : v.toFixed(2)); };
  Q.register('cnn', function (S) {
    var D = Q.logic.dl, st = { pos: 0 };
    var cI = S.select('img', 'Image (8 × 8 pixels, made up)', [['square', 'A bright square'], ['bar', 'A vertical bar'], ['diagonal', 'A diagonal line']], 'square', function () { st.pos = 0; draw(); });
    var cF = S.select('ker', 'Filter (3 × 3)', [['blur', 'Blur (average)'], ['vertical edge', 'Vertical edge'], ['horizontal edge', 'Horizontal edge']], 'blur', function () { draw(); });
    var cS = S.select('stride', 'Stride (steps between windows)', [['1', '1'], ['2', '2']], '1', function () { st.pos = 0; draw(); });
    var cP = S.select('pad', 'Padding (border of zeros)', [['0', 'None'], ['1', '1 pixel']], '0', function () { st.pos = 0; draw(); });
    var cM = S.toggle('pool', 'Then max-pool 2 × 2', false, function () { draw(); });
    var cW = S.range('win', 'Window position', { min: 0, max: 35, step: 1, value: 0, fmt: function (v) { return String(v + 1); }, onChange: function (v) { st.pos = v; draw(); } });
    var row = S.row(), c1 = S.card('Input image (box = current window)', row), s1 = S.svgEl(170, 170, 'Grid of pixel values of the input image with the current filter window boxed.', c1);
    var c2 = S.card('Feature map (one number per window)', row), s2 = S.svgEl(170, 170, 'Grid of filter responses, one per window position.', c2);
    var c3 = S.card('The arithmetic for the current window', S.view), p3 = S.el('p', { class: 'sim-narr-x' }); c3.appendChild(p3);
    var rS = S.readout('s', 'Map size'), rV = S.readout('v', 'This window gives'), rM = S.readout('m', 'Strongest response'), rP = S.readout('p', 'After pooling');
    function cells(svg, m, scale, sel, cs, boxes) {
      while (svg.firstChild) svg.removeChild(svg.firstChild); var n = m.length, size = Math.min(cs, 160 / n);
      m.forEach(function (r, i) { r.forEach(function (v, j) { svg.appendChild(S.svg('rect', { x: 4 + j * size, y: 4 + i * size, width: size - 1, height: size - 1, rx: 2, class: v >= 0 ? 'sv-f0' : 'sv-f1', 'fill-opacity': (0.06 + 0.9 * Math.min(1, Math.abs(v) / scale)).toFixed(2) })); if (size >= 16) svg.appendChild(S.svg('text', { x: 4 + j * size + (size - 1) / 2, y: 4 + i * size + size / 2 + 3.5, 'text-anchor': 'middle', 'font-size': 9, class: Math.abs(v) / scale > 0.6 ? 'inv' : '', text: f2(v) })); }); });
      if (sel) svg.appendChild(S.svg('rect', { x: 3 + sel[1] * size, y: 3 + sel[0] * size, width: sel[3] * size + 1, height: sel[2] * size + 1, rx: 3, class: 'cellbox' }));
    }
    function draw() {
      var img = D.IMAGES[cI.get()], ker = D.KERNELS[cF.get()], stride = Number(cS.get()), pad = Number(cP.get()), map = D.conv2d(img, ker, stride, pad), n = map.length;
      cW.input.max = n * n - 1; if (st.pos > n * n - 1) st.pos = 0; cW.input.value = st.pos;
      var pr = Math.floor(st.pos / n), pc = st.pos % n, pad8 = pad, k = 3, strongest = 0; map.forEach(function (r) { r.forEach(function (v) { strongest = Math.max(strongest, Math.abs(v)); }); });
      cells(s1, img, 1, [pr * stride - pad8, pc * stride - pad8, k, k], 20);
      var shown = cM.get() ? D.maxpool2(map) : map; cells(s2, shown, strongest || 1, cM.get() ? null : [pr, pc, 1, 1], 28);
      var parts = [], total = 0; for (var a = 0; a < k; a++) for (var b = 0; b < k; b++) { var y = pr * stride + a - pad, x = pc * stride + b - pad, px = (y >= 0 && y < 8 && x >= 0 && x < 8) ? img[y][x] : 0, w = ker[a][b]; total += px * w; if (px !== 0 && w !== 0) parts.push(f2(px) + ' × ' + f2(w)); }
      p3.textContent = (parts.length ? parts.join(' + ') : 'every pixel under the window is 0') + ' = ' + f2(total) + '. Pixels outside the image count as 0 when padding is on.';
      rS.set(n + ' × ' + n); rV.set(f2(total)); rM.set(f2(strongest)); rP.set(cM.get() ? shown.length + ' × ' + shown.length : 'off');
      S.narrate('Window ' + (st.pos + 1) + ' of ' + n * n + ' gives ' + f2(total), 'The filter multiplies each pixel under the window by its own weight and adds them up. Edge filters give a large number where the brightness changes in their direction and zero on flat areas. A stride of 2 skips every other window, so the map shrinks; padding adds a border of zeros so the map can keep its size; max-pooling keeps only the strongest response in each 2 × 2 block.');
      if (cI.get() === 'bar' && cF.get() === 'vertical edge' && strongest >= 3) S.challenge('edge');
      if (n === 3 && !cM.get()) S.challenge('shrink');
    }
    draw();
  });
})();
