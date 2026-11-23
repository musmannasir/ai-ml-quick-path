/* Simulation: bag of words and TF-IDF weights on four tiny made-up reviews. Calculation: AIQPSim.logic.dl. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('txt', function (S) {
    var D = Q.logic.dl;
    var cD = S.select('doc', 'Review', D.DOCS.map(function (d, i) { return [String(i), (i + 1) + ': ' + d]; }), '0', function () { draw(); });
    var cT = S.toggle('idf', 'Weight words by how rare they are (TF-IDF)', false, function () { draw(); });
    var c1 = S.card('Word weights in this review (“the” and “it” are removed)', S.view), bars = S.el('ul', { class: 'sim-bars', 'aria-label': 'Word weights' }); c1.appendChild(bars);
    var c2 = S.card('How similar the other reviews are to this one (cosine of the weights)', S.view), sims = S.el('ul', { class: 'sim-bars', 'aria-label': 'Similarity to the reviews' }); c2.appendChild(sims);
    var rT = S.readout('t', 'Top word'), rM = S.readout('m', 'Most similar other review');
    function bar(ul, label, v, mx, text, pick) { var li = S.el('li', { class: 'sim-bar' + (pick ? ' pick' : '') }); li.appendChild(S.el('span', { class: 'sim-bar-l', text: label })); var tr = S.el('span', { class: 'sim-bar-track' }), fl = S.el('span', { class: 'sim-bar-fill' }); fl.style.width = (mx ? v / mx * 100 : 0).toFixed(0) + '%'; tr.appendChild(fl); li.appendChild(tr); li.appendChild(S.el('span', { class: 'sim-bar-v', text: text })); ul.appendChild(li); }
    function draw() {
      var i = Number(cD.get()), idf = cT.get(), V = D.tfVectors(idf), v = V[i], words = Object.keys(v).sort(function (a, b) { return v[b] - v[a] || (a < b ? -1 : 1); }), mx = v[words[0]];
      bars.innerHTML = ''; words.forEach(function (w, k) { bar(bars, w, v[w], mx, v[w].toFixed(2), k === 0); });
      sims.innerHTML = ''; var best = -1, bs = -1; V.forEach(function (d, k) { var c = D.cosine(v, d); if (k !== i && c > bs) { bs = c; best = k; } bar(sims, 'review ' + (k + 1), c, 1, c.toFixed(2), k === best && k !== i); });
      rT.set(words[0]); rM.set('review ' + (best + 1) + ' (' + bs.toFixed(2) + ')');
      S.narrate('Top word: “' + words[0] + '”', 'A bag of words counts each word and forgets the order. Plain counts favour words that repeat. TF-IDF multiplies each count by how rare the word is across the reviews, so a word found in only one review counts for more than a word found in most of them. The similarity of two reviews is the cosine of their weight lists: 1 means the same mix of words, 0 means no words in common.');
      if (i === 3 && idf && words[0] === 'ending') S.challenge('rare');
    }
    draw();
  });
})();
