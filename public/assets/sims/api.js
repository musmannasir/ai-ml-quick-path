/* Simulation: a call to a language-model service: request, streamed answer, retries after errors, and token cost.
   Nothing is sent anywhere. The prices and speeds are made up. Calculation: AIQPSim.logic.fnd. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('api', function (S) {
    var F = Q.logic.fnd;
    var cF = S.range('fail', 'How often a call fails (a temporary error)', { min: 0, max: 0.8, step: 0.05, value: 0.3, fmt: function (v) { return (v * 100).toFixed(0) + '%'; }, onChange: function () { draw(); } });
    var cR = S.range('retries', 'Retries allowed after a failure', { min: 0, max: 6, step: 1, value: 3, onChange: function () { draw(); } });
    var cT = S.range('tps', 'Answer speed (tokens a second, made up)', { min: 10, max: 100, step: 5, value: 40, onChange: function () { draw(); } });
    var c1 = S.card('The request (JSON, shortened). The model name and prices here are placeholders', S.view), pre = S.el('pre', { class: 'sim-merges', text: '{ "model": "example-model",\n  "messages": [ { "role": "user", "content": "Summarise this policy in two lines." } ],\n  "max_tokens": 300,\n  "stream": true }' }); c1.appendChild(pre);
    var c2 = S.card('What happened across 20 calls', S.view), tbl = S.el('table', { class: 'sim-table' }); c2.appendChild(tbl);
    var rA = S.readout('a', 'Calls that succeeded'), rB = S.readout('b', 'Total attempts'), rC = S.readout('c', 'Seconds spent waiting'), rD = S.readout('d', 'Cost of those calls'), rE = S.readout('e', 'First words after'), rG = S.readout('g', 'Full answer after');
    function draw() {
      var f = cF.get(), re = cR.get(), a = F.apiCalls(f, re), tps = cT.get(), hist = {}; a.log.forEach(function (e) { var k = e.ok ? e.attempts : 'gave up'; hist[k] = (hist[k] || 0) + 1; });
      tbl.innerHTML = '<thead><tr><th>Outcome</th><th>Calls</th></tr></thead>'; var tb = S.el('tbody'); Object.keys(hist).sort().forEach(function (k) { var tr = S.el('tr'); tr.appendChild(S.el('th', { text: k === 'gave up' ? 'Still failing after all retries' : 'Worked on attempt ' + k })); tr.appendChild(S.el('td', { text: String(hist[k]) })); tb.appendChild(tr); }); tbl.appendChild(tb);
      rA.set(a.ok + ' of 20'); rB.set(String(a.attempts)); rC.set(String(a.wait)); rD.set('$' + a.cost.toFixed(4)); rE.set((1 / tps + 0.3).toFixed(2) + ' s'); rG.set((300 / tps + 0.3).toFixed(1) + ' s');
      S.narrate(a.ok + ' of 20 calls succeeded using ' + a.attempts + ' attempts', 'Services fail now and then, so a client retries, waiting longer each time (1, 2, 4 … seconds, called exponential backoff). More retries rescue more calls but cost waiting time. Streaming sends the answer token by token, so the first words appear long before the full answer is finished. The cost counts tokens in and out: here 500 in and 300 out per successful call at made-up prices of $3 and $15 per million tokens.');
      if (f >= 0.6 && a.ok === 20) S.challenge('rescue');
    }
    draw();
  });
})();
