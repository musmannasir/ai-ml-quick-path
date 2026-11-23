/* Simulation: a recommender that predicts a missing rating from similar users, with the cold-start problem. Calculation: AIQPSim.logic.ai. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('rec', function (S) {
    var A = Q.logic.ai, st = { last: null };
    var cU = S.select('user', 'Who gets the recommendation', [0, 1, 2, 3, 4, 5].map(function (u) { return [String(u), 'User ' + (u + 1)]; }), '0', function () { fill(); draw(); });
    var cI = S.select('item', 'Film to predict', [], '2', function () { draw(); });
    var cK = S.range('k', 'How many similar users to listen to (k)', { min: 1, max: 5, step: 1, value: 2, onChange: function () { draw(); } });
    var cC = S.toggle('cold', 'This is a brand-new user with no ratings (cold start)', false, function () { draw(); });
    var c1 = S.card('Ratings 1 to 5 (made up). A dash means the film has not been rated', S.view), tbl = S.el('table', { class: 'sim-table' }); c1.appendChild(tbl);
    var c2 = S.card('Who is most like this user (similarity on films both have rated)', S.view), bars = S.el('ul', { class: 'sim-bars', 'aria-label': 'Similarity to other users' }); c2.appendChild(bars);
    var rP = S.readout('p', 'Predicted rating'), rB = S.readout('b', 'Best film to suggest');
    function fill() { var u = Number(cU.get()), sel = cI.input; sel.innerHTML = ''; A.ITEMS.forEach(function (n, i) { if (!A.RATINGS[u][i]) sel.appendChild(S.el('option', { value: String(i), text: n })); }); if (!sel.options.length) sel.appendChild(S.el('option', { value: '', text: 'No unrated films' })); }
    function best(u, k) { var o = []; A.ITEMS.forEach(function (n, i) { if (!A.RATINGS[u][i]) { var p = cC.get() ? A.itemAverage(i) : A.predict(u, i, k).value; if (p !== null) o.push([p, i]); } }); o.sort(function (a, b) { return b[0] - a[0] || a[1] - b[1]; }); return o; }
    function draw() {
      var u = Number(cU.get()), it = cI.get() === '' ? -1 : Number(cI.get()), k = cK.get(), cold = cC.get();
      tbl.innerHTML = '<thead><tr><th></th>' + A.ITEMS.map(function (n) { return '<th>' + n.replace('Film ', '') + '</th>'; }).join('') + '</tr></thead>';
      var tb = S.el('tbody'); A.RATINGS.forEach(function (row, r) { var tr = S.el('tr'); tr.appendChild(S.el('th', { text: 'User ' + (r + 1) + (r === u ? ' (you)' : '') })); row.forEach(function (v, c) { var td = S.el('td', { text: (cold && r === u) ? '–' : v ? String(v) : '–' }); if (r === u && c === it) td.className = 'sim-last'; tr.appendChild(td); }); tb.appendChild(tr); }); tbl.appendChild(tb);
      bars.innerHTML = ''; var res = it >= 0 && !cold ? A.predict(u, it, k) : { value: it >= 0 ? A.itemAverage(it) : null, used: [] }, usedIds = {}; res.used.forEach(function (c) { usedIds[c[1]] = 1; });
      if (cold) bars.appendChild(S.el('li', { class: 'sim-none', text: 'No ratings, so there is nobody to compare with. The system falls back to the average rating of each film.' }));
      else for (var o = 0; o < 6; o++) { if (o === u) continue; var sim = A.userSimilarity(u, o), li = S.el('li', { class: 'sim-bar' + (usedIds[o] ? ' pick' : '') }); li.appendChild(S.el('span', { class: 'sim-bar-l', text: 'User ' + (o + 1) })); var tr = S.el('span', { class: 'sim-bar-track' }), fl = S.el('span', { class: 'sim-bar-fill' }); fl.style.width = (sim * 100).toFixed(0) + '%'; tr.appendChild(fl); li.appendChild(tr); li.appendChild(S.el('span', { class: 'sim-bar-v', text: sim.toFixed(2) + (it >= 0 && A.RATINGS[o][it] ? ' · gave ' + A.RATINGS[o][it] : '') })); bars.appendChild(li); }
      var b = best(u, k); rP.set(res.value === null ? '-' : res.value.toFixed(2)); rB.set(b.length ? A.ITEMS[b[0][1]] + ' (' + b[0][0].toFixed(1) + ')' : '-');
      S.narrate(res.value === null ? 'Nothing to predict' : (cold ? 'No history: the guess is the film’s average, ' : 'Predicted rating ') + res.value.toFixed(2) + (it >= 0 ? ' for ' + A.ITEMS[it] : ''), cold ? 'A new user has no ratings, so similar users cannot be found. Common fixes are to suggest what is popular, or to ask a few questions first.' : 'The prediction is the average of the ratings that the k most similar users gave to this film, weighted by how similar they are. The boxed bars are the users listened to. Listening to more users gives a steadier but less personal guess.');
      if (cold) S.challenge('cold');
      if (!cold && it >= 0) { var key = u + ':' + it; if (st.last && st.last.key === key && Math.abs(st.last.v - res.value) >= 0.5) S.challenge('k'); st.last = { key: key, v: res.value }; }
    }
    fill(); draw();
  });
})();
