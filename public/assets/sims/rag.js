/* Simulation: a retrieval pipeline over a made-up document: split, score, retrieve, and what the model would see. Calculation: AIQPSim.logic.llm. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('rag', function (S) {
    var L = Q.logic.llm;
    var cQ = S.select('q', 'Question from the user', L.QUESTIONS.map(function (x, i) { return [String(i), x[0]]; }), '0', function () { draw(); });
    var cS = S.range('size', 'Chunk size (words)', { min: 5, max: 90, step: 5, value: 40, onChange: function () { draw(); } });
    var cO = S.range('ov', 'Overlap between chunks (words)', { min: 0, max: 45, step: 5, value: 0, onChange: function () { draw(); } });
    var cK = S.range('k', 'Chunks fetched (top k)', { min: 1, max: 4, step: 1, value: 1, onChange: function () { draw(); } });
    var c1 = S.card('1. The user asks', S.view), pq = S.el('p', { class: 'sim-narr-t' }); c1.appendChild(pq);
    var c2 = S.card('2. The retriever scores every chunk (keyword weights, cosine similarity)', S.view), ul = S.el('ul', { class: 'sim-bars', 'aria-label': 'Chunks and their scores' }); c2.appendChild(ul);
    var c3 = S.card('3. What the model would be given', S.view), pm = S.el('p', { class: 'sim-narr-x' }); c3.appendChild(pm);
    var c4 = S.card('Is the answer found, for each chunk size? (this question, with your overlap and k)', S.view), svg = S.svgEl(380, 50, 'Row of cells, one per chunk size, showing whether the answer was found.', c4);
    var rC = S.readout('c', 'Chunks'), rH = S.readout('h', 'Answer in what the model sees'), rW = S.readout('w', 'Words sent');
    function draw() {
      var qi = Number(cQ.get()), size = cS.get(), ov = Math.min(cO.get(), size - 5), k = cK.get(), ch = L.chunk(size, ov), r = L.rank(ch, L.QUESTIONS[qi][0]), ans = L.QUESTIONS[qi][1], got = r.order.slice(0, k), top = r.scores[r.order[0]] || 1, words = 0;
      pq.textContent = L.QUESTIONS[qi][0];
      ul.innerHTML = ''; ch.forEach(function (c, i) {
        var pick = got.indexOf(i) >= 0, li = S.el('li', { class: 'sim-bar' + (pick ? ' pick' : '') }); li.appendChild(S.el('span', { class: 'sim-bar-l', text: 'chunk ' + (i + 1) })); var tr = S.el('span', { class: 'sim-bar-track' }), fl = S.el('span', { class: 'sim-bar-fill' }); fl.style.width = (r.scores[i] / top * 100).toFixed(0) + '%'; tr.appendChild(fl); li.appendChild(tr); li.appendChild(S.el('span', { class: 'sim-bar-v', text: r.scores[i].toFixed(2) })); ul.appendChild(li);
      });
      var text = got.map(function (i) { words += ch[i].length; return ch[i].join(' '); }); var hit = text.join(' ').indexOf(ans) >= 0;
      pm.textContent = 'Question: ' + L.QUESTIONS[qi][0] + '  Context: “' + text.join(' … ') + '”  → ' + (hit ? 'The fact “' + ans + '” is in the context, so a model can answer from it.' : 'The fact “' + ans + '” is NOT in the context, so a model would have to guess or say it does not know.');
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      for (var s = 5; s <= 90; s += 5) { var o2 = Math.min(ov, s - 5), c2x = L.chunk(s, o2), rr = L.rank(c2x, L.QUESTIONS[qi][0]), t2 = rr.order.slice(0, k).map(function (i) { return c2x[i].join(' '); }).join(' '), ok = t2.indexOf(ans) >= 0, x = 6 + (s / 5 - 1) * 20.5;
        svg.appendChild(S.svg('rect', { x: x, y: 6, width: 18, height: 22, rx: 3, class: ok ? 'sv-f0' : 'sv-f1', 'fill-opacity': ok ? 0.85 : 0.5 })); svg.appendChild(S.svg('text', { x: x + 9, y: 44, 'text-anchor': 'middle', 'font-size': 8, class: 't2', text: String(s) })); if (s === size) svg.appendChild(S.svg('rect', { x: x - 2, y: 4, width: 22, height: 26, rx: 4, class: 'cellbox' })); }
      rC.set(String(ch.length)); rH.set(hit ? 'yes' : 'no'); rW.set(String(words));
      S.narrate(hit ? 'The retriever found the answer' : 'The answer was lost before the model saw anything', 'Retrieval works on chunks. A chunk that is too small can cut the answer in two, so neither half scores well. A chunk that is too large carries other topics, which dilutes its score and sends more words to the model. Overlap and a larger k are two ways to recover a lost answer, and both cost more words.');
      var all = true, q2; for (q2 = 0; q2 < 4; q2++) if (!L.ragHit(size, ov, k, q2)) all = false;
      if (all && size * k <= 40) S.challenge('all');
      if (!hit) S.challenge('lost');
    }
    draw();
  });
})();
