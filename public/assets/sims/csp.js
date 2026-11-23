/* Simulation: solving a map-colouring puzzle by backtracking, with two ways to choose the next region. Calculation: AIQPSim.logic.ai. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  var COLS = ['R', 'G', 'B'], CLS = ['sv-f0', 'sv-f1', 'sv-f2'];
  Q.register('csp', function (S) {
    var A = Q.logic.ai, st = { step: 0, res: null };
    var cO = S.select('order', 'Which region to colour next', [['fixed', 'In fixed order (1, 2, 3 …)'], ['smart', 'The most constrained first']], 'fixed', function () { st.step = 0; solve(); draw(); });
    var cS = S.range('step', 'Attempts shown', { min: 0, max: 100, step: 1, value: 0, onChange: function (v) { st.step = v; draw(); } });
    S.buttons([{ id: 'run', label: 'Run to the end', primary: true, onClick: function () { st.step = st.res.trace.length; cS.set(st.step); draw(); } }, { id: 'reset', label: 'Start again', onClick: function () { st.step = 0; cS.set(0); draw(); } }]);
    var cv = S.card('Seven regions. Neighbouring regions must have different colours (R, G or B)', S.view), svg = S.svgEl(380, 260, 'A graph of seven regions being coloured with three colours.', cv);
    var rT = S.readout('t', 'Colours tried'), rB = S.readout('b', 'Backtracks'), rD = S.readout('d', 'Result');
    var pos = []; for (var i = 0; i < 7; i++) { var a = -Math.PI / 2 + i * 2 * Math.PI / 7; pos.push([190 + 100 * Math.cos(a), 130 + 100 * Math.sin(a)]); }
    function solve() { st.res = A.colourMap(cO.get() === 'smart'); cS.input.max = st.res.trace.length; }
    function draw() {
      var col = [null, null, null, null, null, null, null], tries = 0, back = 0, flash = -1, t;
      for (t = 0; t < st.step; t++) { var e = st.res.trace[t]; if (e.undo) { col[e.r] = null; back++; flash = -1; } else { tries++; if (e.ok) { col[e.r] = e.c; flash = -1; } else flash = e.r; } }
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      A.BORDERS.forEach(function (b) { svg.appendChild(S.svg('line', { x1: pos[b[0]][0], y1: pos[b[0]][1], x2: pos[b[1]][0], y2: pos[b[1]][1], class: 'axis', 'stroke-width': 2 })); });
      pos.forEach(function (p, r) { svg.appendChild(S.svg('circle', { cx: p[0], cy: p[1], r: 22, class: col[r] === null ? 'node' : CLS[col[r]], 'fill-opacity': col[r] === null ? 1 : 0.85 })); if (flash === r) svg.appendChild(S.svg('circle', { cx: p[0], cy: p[1], r: 27, class: 'cellbox' })); svg.appendChild(S.svg('text', { x: p[0], y: p[1] + 4, 'text-anchor': 'middle', 'font-weight': 700, 'font-size': 13, class: col[r] === null ? '' : 'inv', text: col[r] === null ? String(r + 1) : COLS[col[r]] })); svg.appendChild(S.svg('text', { x: p[0], y: p[1] - 28, 'text-anchor': 'middle', 'font-size': 9, class: 't2', text: 'region ' + (r + 1) })); });
      var done = st.step >= st.res.trace.length; rT.set(String(tries)); rB.set(String(back)); rD.set(done ? (st.res.ok ? 'solved' : 'no solution') : 'working');
      var last = st.step ? st.res.trace[st.step - 1] : null;
      S.narrate(done ? 'Solved with ' + st.res.tries + ' colours tried and ' + st.res.back + ' backtracks' : last ? (last.undo ? 'Dead end at region ' + (last.r + 1) + ': undo and try something else' : 'Region ' + (last.r + 1) + ' tried with ' + COLS[last.c] + (last.ok ? ': allowed' : ': a neighbour already has it')) : 'Ready: no region is coloured yet', 'Backtracking tries a colour, moves on, and when a region has no allowed colour left it undoes the last choice and tries the next. Choosing the most constrained region first (the one with the fewest allowed colours) finds dead ends early, so far less work is wasted. Both orders find a correct colouring.');
      if (done && cO.get() === 'smart' && st.res.back === 0) S.challenge('smart');
    }
    solve(); draw();
  });
})();
