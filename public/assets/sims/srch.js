/* Simulation: search in a maze (breadth-first, depth-first, A*) and a game tree with minimax and pruning. Calculation: AIQPSim.logic.ai. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  var NAMES = { bfs: 'Breadth-first', dfs: 'Depth-first', astar: 'A* (guided by distance to the goal)' };
  Q.register('srch', function (S) {
    var A = Q.logic.ai, st = { step: 0, res: null };
    var cV = S.select('view', 'Problem', [['maze', 'Find a path through a maze'], ['tree', 'Choose a move in a two-player game']], S.preset === 'tree' ? 'tree' : 'maze', function () { show(); draw(); });
    var cA = S.select('algo', 'Method', Object.keys(NAMES).map(function (k) { return [k, NAMES[k]]; }), 'bfs', function () { st.step = 0; solve(); draw(); });
    var cS = S.range('step', 'Cells examined so far', { min: 0, max: 40, step: 1, value: 0, onChange: function (v) { st.step = v; draw(); } });
    var cP = S.toggle('prune', 'Prune with alpha-beta (skip moves that cannot matter)', false, function () { draw(); });
    S.buttons([{ id: 'run', label: 'Run to the end', primary: true, onClick: function () { if (cV.get() === 'maze') { st.step = st.res.order.length; cS.set(st.step); draw(); } } }, { id: 'reset', label: 'Start again', onClick: function () { st.step = 0; cS.set(0); draw(); } }]);
    var cv = S.card('Picture', S.view), svg = S.svgEl(380, 300, 'Picture of the search.', cv);
    var rA = S.readout('a', ''), rB = S.readout('b', ''), rC = S.readout('c', '');
    function labels(a) { var dl = S.view.querySelectorAll('.sim-readouts dt'); a.forEach(function (t, i) { if (dl[i]) dl[i].textContent = t; }); }
    function show() { var m = cV.get() === 'maze'; cA.input.closest('.sim-ctl').hidden = !m; cS.input.closest('.sim-ctl').hidden = !m; cP.input.closest('.sim-ctl').hidden = m; S.controls.querySelectorAll('.sim-btns')[0].hidden = !m; }
    function solve() { st.res = A.solve(cA.get()); cS.input.max = st.res.order.length; }
    function drawMaze() {
      var r = st.res, cs = 36, ox = 46, oy = 6, shown = r.order.slice(0, st.step), num = {}; shown.forEach(function (p, i) { num[p[0] + ',' + p[1]] = i + 1; });
      cv.firstChild.textContent = NAMES[cA.get()] + ': each number is the order in which a cell was examined';
      for (var y = 0; y < 8; y++) for (var x = 0; x < 8; x++) {
        var ch = A.MAZE[y].charAt(x), n = num[x + ',' + y];
        svg.appendChild(S.svg('rect', { x: ox + x * cs, y: oy + y * cs, width: cs - 2, height: cs - 2, rx: 4, class: ch === '#' ? 'sv-f3' : n ? 'sv-f2' : 'grid', 'fill-opacity': ch === '#' ? 0.7 : 0.45 }));
        if (n) svg.appendChild(S.svg('text', { x: ox + x * cs + cs / 2 - 1, y: oy + y * cs + cs / 2 + 3, 'text-anchor': 'middle', 'font-size': 10, text: String(n) }));
        if (ch === 'S' || ch === 'G') svg.appendChild(S.svg('text', { x: ox + x * cs + 4, y: oy + y * cs + 13, 'font-size': 11, 'font-weight': 700, text: ch }));
      }
      var done = st.step >= r.order.length;
      if (done) { var d = ''; r.path.forEach(function (p, i) { d += (i ? 'L' : 'M') + (ox + p[0] * cs + cs / 2 - 1) + ' ' + (oy + p[1] * cs + cs / 2 - 1); }); svg.appendChild(S.svg('path', { d: d, class: 'edge sv-s1', fill: 'none', 'stroke-width': 4 })); }
      labels(['Cells examined', 'Path found', 'Method']); rA.set(String(shown.length)); rB.set(done ? r.length + ' steps' : '-'); rC.set(cA.get() === 'astar' ? 'A*' : cA.get() === 'bfs' ? 'Breadth-first' : 'Depth-first');
      S.narrate(done ? NAMES[cA.get()] + ' found a path of ' + r.length + ' steps after examining ' + r.order.length + ' cells' : 'Examined ' + shown.length + ' cell' + (shown.length === 1 ? '' : 's'), 'Breadth-first search spreads out evenly, so the first path it finds is the shortest, but it examines many cells. Depth-first search goes as far as it can before turning back, so it may find a long path. A* uses the straight-line distance to the goal to look in the promising direction first, so it examines far fewer cells and here still finds the shortest path.');
      if (done && cA.get() === 'astar' && r.order.length < A.solve('bfs').order.length && r.length === 13) S.challenge('guided');
    }
    function drawTree() {
      var pr = cP.get(), m = A.minimax(pr), W = 380; cv.firstChild.textContent = 'You pick a move (top). Then the opponent picks a reply. Numbers at the bottom are how good each result is for you';
      var mins = [3, 2, 2]; svg.appendChild(S.svg('rect', { x: W / 2 - 40, y: 10, width: 80, height: 30, rx: 6, class: 'node sel' })); svg.appendChild(S.svg('text', { x: W / 2, y: 30, 'text-anchor': 'middle', 'font-weight': 700, text: 'You: best = ' + m.best }));
      for (var i = 0; i < 3; i++) {
        var cx = 70 + i * 120, children = A.LEAVES.slice(i * 3, i * 3 + 3), val = Math.min.apply(null, children), seenAny = m.looked.slice(i * 3, i * 3 + 3).filter(Boolean).length;
        svg.appendChild(S.svg('line', { x1: W / 2, y1: 40, x2: cx, y2: 110, class: 'axis' }));
        svg.appendChild(S.svg('rect', { x: cx - 40, y: 110, width: 80, height: 30, rx: 6, class: 'node' })); svg.appendChild(S.svg('text', { x: cx, y: 130, 'text-anchor': 'middle', text: 'Opponent' + (seenAny < 3 ? ' ≤ ' : ' = ') + Math.min.apply(null, children.filter(function (v, k) { return m.looked[i * 3 + k]; })) }));
        children.forEach(function (v, k) { var lx = cx - 32 + k * 32, looked = m.looked[i * 3 + k]; svg.appendChild(S.svg('line', { x1: cx, y1: 140, x2: lx, y2: 200, class: looked ? 'axis' : 'grid', 'stroke-dasharray': looked ? '' : '3 3' })); svg.appendChild(S.svg('rect', { x: lx - 14, y: 200, width: 28, height: 28, rx: 4, class: looked ? 'sv-f0' : 'grid', 'fill-opacity': looked ? 0.8 : 0.3 })); svg.appendChild(S.svg('text', { x: lx, y: 219, 'text-anchor': 'middle', class: looked ? 'inv' : 't2', text: String(v) })); });
      }
      svg.appendChild(S.svg('text', { x: 10, y: 262, 'font-size': 10, class: 't2', text: 'Dashed leaves were never looked at.' }));
      labels(['Best value for you', 'Positions looked at', 'Skipped']); rA.set(String(m.best)); rB.set(m.seen + ' of 9'); rC.set(String(9 - m.seen));
      S.narrate(pr ? 'Pruning skipped ' + (9 - m.seen) + ' position' + (9 - m.seen === 1 ? '' : 's') + ' and still found the same best value' : 'Every position was looked at; the best value is ' + m.best, 'Minimax assumes the opponent always picks the reply that is worst for you, so you choose the move whose worst case is best. Alpha-beta pruning stops looking at a move as soon as it is certain to be worse than a move already found. In the second branch, the opponent can already hold you to 2, which is worse than the 3 you have, so the other replies there need not be looked at.');
      if (pr && m.seen < 9) S.challenge('prune');
    }
    function draw() { while (svg.firstChild) svg.removeChild(svg.firstChild); if (cV.get() === 'maze') drawMaze(); else drawTree(); }
    show(); solve(); draw();
  });
})();
