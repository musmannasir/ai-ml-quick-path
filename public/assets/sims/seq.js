/* Simulation: a running state (the idea behind a recurrent network) read word by word. Calculation: AIQPSim.logic.dl. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('seq', function (S) {
    var D = Q.logic.dl, st = { s: 0 };
    S.select('sent', 'Sentence', [['0', 'great opening, but dull and slow ending'], ['1', 'awful start, but improves and gets great']], '0', function (v) { st.s = Number(v); draw(); });
    var cA = S.range('a', 'Memory: how much of the old state is kept', { min: 0, max: 1.5, step: 0.05, value: 0.9, fmt: function (v) { return v.toFixed(2); }, onChange: function () { draw(); } });
    var cB = S.range('b', 'How strongly each new word counts', { min: 0.2, max: 2, step: 0.1, value: 1, fmt: function (v) { return v.toFixed(1); }, onChange: function () { draw(); } });
    var cv = S.card('The running state after each word (above zero = positive feeling, below = negative)', S.view), svg = S.svgEl(380, 220, 'Bar chart of the running state after each word of the sentence.', cv);
    var rF = S.readout('f', 'Final state'), rV = S.readout('v', 'Verdict');
    function draw() {
      var sent = D.SENTENCES[st.s], hs = D.runState(sent, cA.get(), cB.get()), W = 380, n = sent.length, bw = (W - 40) / n;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(S.svg('line', { x1: 20, y1: 100, x2: W - 20, y2: 100, class: 'axis' }));
      sent.forEach(function (w, i) {
        var h = hs[i], x = 20 + i * bw, hh = Math.abs(h) * 85;
        svg.appendChild(S.svg('rect', { x: x + 6, y: h >= 0 ? 100 - hh : 100, width: bw - 12, height: Math.max(1, hh), rx: 3, class: h >= 0 ? 'sv-f0' : 'sv-f1', 'fill-opacity': 0.9 }));
        svg.appendChild(S.svg('text', { x: x + bw / 2, y: 200, 'text-anchor': 'middle', 'font-size': 10, text: w[0] })); svg.appendChild(S.svg('text', { x: x + bw / 2, y: 214, 'text-anchor': 'middle', 'font-size': 9, class: 't2', text: 'input ' + (w[1] > 0 ? '+1' : w[1] < 0 ? '−1' : '0') }));
        svg.appendChild(S.svg('text', { x: x + bw / 2, y: h >= 0 ? 100 - hh - 4 : 100 + hh + 12, 'text-anchor': 'middle', 'font-size': 10, text: h.toFixed(2) }));
      });
      var fin = hs[hs.length - 1], verdict = fin > 0.05 ? 'positive' : fin < -0.05 ? 'negative' : 'unsure';
      rF.set(fin.toFixed(2)); rV.set(verdict);
      S.narrate('After the last word the state is ' + fin.toFixed(2) + ': ' + verdict, 'Each step mixes the old state with the new word: state = tanh(memory × old state + strength × word). A strong memory lets early words still count at the end. With little memory only the most recent words matter, and with none the last word decides alone. Real recurrent networks learn these weights from data; here they are set by hand.');
      if (st.s === 0 && Math.abs(fin) < 0.05) S.challenge('forget');
    }
    draw();
  });
})();
