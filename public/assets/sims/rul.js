/* Simulation: hand-written rules against learning from examples (a spam filter on 24 made-up messages). Calculation: AIQPSim.logic.fnd. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('rul', function (S) {
    var F = Q.logic.fnd, sel = { free: true }, learned = false, model = F.nbModel(), toggles = {};
    F.KEYWORDS.forEach(function (w) { toggles[w] = S.toggle('kw-' + w, 'Rule: spam if it contains “' + w + '”', !!sel[w], function (v) { sel[w] = v; draw(); }); });
    var cL = S.toggle('learn', 'Use the learned word weights instead of my rules', false, function (v) { learned = v; draw(); });
    var c1 = S.card('Messages the filter was built from (training)', S.view), t1 = S.el('table', { class: 'sim-table' }); c1.appendChild(t1);
    var c2 = S.card('New messages it has never seen (some are tricky)', S.view), t2 = S.el('table', { class: 'sim-table' }); c2.appendChild(t2);
    var rA = S.readout('a', 'Right on training messages'), rB = S.readout('b', 'Right on new messages');
    function chosen() { return F.KEYWORDS.filter(function (w) { return sel[w]; }); }
    function isSpam(m) { return learned ? F.nbIsSpam(model, m) : F.ruleSpam(chosen(), m); }
    function fill(tbl, spam, ham) { tbl.innerHTML = '<thead><tr><th>Message</th><th>Really</th><th>Filter says</th></tr></thead>'; var tb = S.el('tbody'); spam.map(function (m) { return [m, true]; }).concat(ham.map(function (m) { return [m, false]; })).forEach(function (e) { var p = isSpam(e[0]), tr = S.el('tr', { class: p === e[1] ? '' : 'sim-last' }); tr.appendChild(S.el('th', { text: e[0] })); tr.appendChild(S.el('td', { text: e[1] ? 'spam' : 'fine' })); tr.appendChild(S.el('td', { text: (p ? 'spam' : 'fine') + (p === e[1] ? '' : '  ✗') })); tb.appendChild(tr); }); tbl.appendChild(tb); }
    function draw() {
      cL.input.closest('.sim-ctl').hidden = false; F.KEYWORDS.forEach(function (w) { toggles[w].input.closest('.sim-ctl').hidden = learned; });
      var acc = function (a, b) { var hit = 0; a.forEach(function (m) { if (isSpam(m)) hit++; }); b.forEach(function (m) { if (!isSpam(m)) hit++; }); return hit / (a.length + b.length); };
      var tr = acc(F.SPAM_TRAIN, F.HAM_TRAIN), te = acc(F.SPAM_TEST, F.HAM_TEST); fill(t1, F.SPAM_TRAIN, F.HAM_TRAIN); fill(t2, F.SPAM_TEST, F.HAM_TEST);
      rA.set((tr * 100).toFixed(0) + '%'); rB.set((te * 100).toFixed(0) + '%');
      S.narrate(learned ? 'Learned weights: ' + (tr * 100).toFixed(0) + '% on training, ' + (te * 100).toFixed(0) + '% on new messages' : 'Your rules: ' + (tr * 100).toFixed(0) + '% on training, ' + (te * 100).toFixed(0) + '% on new messages', 'Rules fit the messages they were written for. New messages can spell words differently (“fr33”), say the same thing in other words, or use a spammy word in an innocent message (“free for lunch”). A model that learns word weights from many examples copes better, but it can still be wrong, and it needs examples that look like the future.');
      if (!learned && tr === 1 && te <= 0.4) S.challenge('gap');
      if (learned && te >= 0.85) S.challenge('learn');
    }
    draw();
  });
})();
