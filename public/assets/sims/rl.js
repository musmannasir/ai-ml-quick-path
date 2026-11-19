/* Simulation: reinforcement learning. A three-armed bandit with epsilon-greedy choices, and Q-learning in a small grid world.
   Calculation: AIQPSim.logic.dl. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  function lcg(seed) { var s = seed >>> 0; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  Q.register('rl', function (S) {
    var D = Q.logic.dl, st = {};
    var cV = S.select('view', 'Problem', [['grid', 'Grid world: find the goal, avoid the pit'], ['bandit', 'Slot machines: which arm pays best?']], S.preset === 'bandit' ? 'bandit' : 'grid', function () { show(); reset(); });
    var cE = S.range('eps', 'Epsilon: how often it tries something random', { min: 0, max: 1, step: 0.05, value: 0.2, fmt: function (v) { return v.toFixed(2); }, onChange: function () { if (cV.get() === 'bandit') reset(); } });
    var cA = S.range('alpha', 'Learning rate', { min: 0.1, max: 1, step: 0.1, value: 0.5, fmt: function (v) { return v.toFixed(1); }, onChange: function () { reset(); } });
    var cG = S.range('gamma', 'Discount: how much the future counts', { min: 0.5, max: 0.99, step: 0.01, value: 0.9, fmt: function (v) { return v.toFixed(2); }, onChange: function () { reset(); } });
    var btn = S.buttons([{ id: 'a', label: '', primary: true, onClick: function () { go(1); } }, { id: 'b', label: '', onClick: function () { go(10); } }, { id: 'c', label: '', onClick: function () { go(50); } }, { id: 'r', label: 'Start again', onClick: function () { reset(); } }]);
    var cv = S.card('Picture', S.view), svg = S.svgEl(380, 300, 'Picture of the learner.', cv);
    var rA = S.readout('a', ''), rB = S.readout('b', ''), rC = S.readout('c', '');
    function labels(a) { var dl = S.view.querySelectorAll('.sim-readouts dt'); a.forEach(function (t, i) { if (dl[i]) dl[i].textContent = t; }); }
    function show() { var g = cV.get() === 'grid'; cA.input.closest('.sim-ctl').hidden = !g; cG.input.closest('.sim-ctl').hidden = !g; var lab = g ? ['Train 1 episode', 'Train 10 episodes', 'Train 50 episodes'] : ['Pull 1', 'Pull 10', 'Pull 100']; ['a', 'b', 'c'].forEach(function (k, i) { btn[k].textContent = lab[i]; }); }
    function reset() { if (cV.get() === 'grid') { st.Q = D.newQ(); st.r = lcg(5); st.ep = 0; st.last = null; } else st.b = D.banditNew(3); draw(); }
    function go(n) { for (var i = 0; i < n; i++) { if (cV.get() === 'grid') { st.last = D.episode(st.Q, cE.get(), cA.get(), cG.get(), st.r); st.ep++; } else D.banditPull(st.b, cE.get()); } draw(); }
    function drawGrid() {
      var path = D.greedyPath(st.Q), onPath = {}; path.forEach(function (s) { onPath[s] = 1; }); var cs = 66, ox = 58, oy = 10;
      cv.firstChild.textContent = 'Grid world: arrows show the best move the learner has found so far (goal = star, pit = cross, start = S)';
      for (var s = 0; s < 16; s++) {
        var x = s % 4, y = 3 - Math.floor(s / 4), q = st.Q[s], b = D.best(q), mx = Math.max.apply(null, q), cls = s === D.GOAL ? 'sv-f0' : s === D.PIT ? 'sv-f1' : 'sv-f2';
        svg.appendChild(S.svg('rect', { x: ox + x * cs, y: oy + y * cs, width: cs - 2, height: cs - 2, rx: 4, class: cls, 'fill-opacity': (s === D.GOAL || s === D.PIT) ? 0.55 : (0.06 + 0.5 * Math.max(0, Math.min(1, mx))).toFixed(2) }));
        if (onPath[s]) svg.appendChild(S.svg('rect', { x: ox + x * cs + 1, y: oy + y * cs + 1, width: cs - 4, height: cs - 4, rx: 4, class: 'cellbox' }));
        var lab = s === D.GOAL ? '★' : s === D.PIT ? '✕' : (mx === 0 && q.every(function (v) { return v === 0; })) ? '' : D.ARROWS[b]; svg.appendChild(S.svg('text', { x: ox + x * cs + cs / 2 - 1, y: oy + y * cs + cs / 2 + 8, 'text-anchor': 'middle', 'font-size': 24, text: lab }));
        if (s === 0) svg.appendChild(S.svg('text', { x: ox + 6, y: oy + y * cs + 16, 'font-size': 11, 'font-weight': 700, text: 'S' }));
        if (s !== D.GOAL && s !== D.PIT && mx !== 0) svg.appendChild(S.svg('text', { x: ox + x * cs + cs - 8, y: oy + y * cs + 13, 'text-anchor': 'end', 'font-size': 9, class: 't2', text: mx.toFixed(2) }));
      }
      var reached = path[path.length - 1] === D.GOAL; labels(['Episodes', 'Steps in the last episode', 'Best path now']);
      rA.set(String(st.ep)); rB.set(st.last ? String(st.last.steps) : '-'); rC.set(reached ? (path.length - 1) + ' moves to the goal' : 'does not reach the goal');
      S.narrate(st.ep ? (reached ? 'The best path now reaches the goal in ' + (path.length - 1) + ' moves' : 'After ' + st.ep + ' episode' + (st.ep > 1 ? 's' : '') + ' the best path does not reach the goal yet') : 'The learner knows nothing yet', 'After each move the learner updates its estimate of how good that move was: the reward it got plus the best value it expects from the next square, discounted. At first, rewards only flow back from squares next to the goal and pit; after more episodes the values spread backwards along good paths. Epsilon sets how often it tries a random move instead of its best one.');
      if (reached && path.length - 1 === 6) S.challenge('path');
    }
    function drawBandit() {
      var b = st.b; cv.firstChild.textContent = 'Three slot machines. Outline = true chance of paying (hidden from the learner), bar = what it has learned';
      D.BANDIT_P.forEach(function (p, i) {
        var y = 20 + i * 90; svg.appendChild(S.svg('text', { x: 6, y: y + 14, 'font-weight': 700, text: 'Arm ' + (i + 1) }));
        svg.appendChild(S.svg('rect', { x: 60, y: y, width: 300, height: 26, rx: 4, class: 'grid' })); svg.appendChild(S.svg('rect', { x: 60, y: y, width: 300 * b.est[i], height: 26, rx: 4, class: 'sv-f0', 'fill-opacity': 0.85 }));
        svg.appendChild(S.svg('line', { x1: 60 + 300 * p, y1: y - 4, x2: 60 + 300 * p, y2: y + 30, class: 'cellbox', 'stroke-width': 3 }));
        svg.appendChild(S.svg('text', { x: 60, y: y + 46, 'font-size': 10, class: 't2', text: 'pulled ' + b.n[i] + ' times; it thinks ' + (b.est[i] * 100).toFixed(0) + '% (true: ' + (p * 100).toFixed(0) + '%)' }));
      });
      var regret = b.pulls * 0.7 - b.got; labels(['Pulls', 'Pulls of the best arm', 'Chances lost (regret)']);
      rA.set(String(b.pulls)); rB.set(b.pulls ? (b.n[2] / b.pulls * 100).toFixed(0) + '%' : '-'); rC.set(regret.toFixed(1));
      S.narrate(b.pulls ? 'After ' + b.pulls + ' pulls it has pulled the best arm ' + (b.n[2] / b.pulls * 100).toFixed(0) + '% of the time' : 'No pulls yet', 'The learner keeps an average payout for each arm. With epsilon 0 it always pulls the arm that looks best so far, so it can lock onto the first arm that paid and never find a better one. A small epsilon spends some pulls exploring. Regret counts how many chances to win were lost compared with always pulling the best arm.');
      if (cE.get() === 0 && b.pulls >= 100 && b.n[2] === 0) S.challenge('stuck');
      if (cE.get() > 0 && b.pulls >= 500 && regret < 20) S.challenge('explore');
    }
    function draw() { while (svg.firstChild) svg.removeChild(svg.firstChild); if (cV.get() === 'grid') drawGrid(); else drawBandit(); }
    show(); reset();
  });
})();
