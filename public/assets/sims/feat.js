/* Simulation: the same nearest-neighbour question before and after scaling, and number codes against one-hot codes. Calculation: AIQPSim.logic.fnd. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('feat', function (S) {
    var F = Q.logic.fnd;
    var cA = S.range('age', 'Age of the person we compare', { min: 20, max: 60, step: 1, value: 48, onChange: function () { draw(); } });
    var cI = S.range('inc', 'Income of the person we compare', { min: 20000, max: 100000, step: 1000, value: 60000, fmt: function (v) { return v.toLocaleString('en'); }, onChange: function () { draw(); } });
    var cS = S.toggle('scale', 'Put age and income on the same scale first', false, function () { draw(); });
    var c1 = S.card('Distance to each of 8 known people (the closest is boxed)', S.view), tbl = S.el('table', { class: 'sim-table' }); c1.appendChild(tbl);
    var c2 = S.card('A colour stored as a number (1, 2, 3) against one-hot (a column per colour)', S.view), t2 = S.el('table', { class: 'sim-table' }); c2.appendChild(t2);
    var rN = S.readout('n', 'Closest person'), rU = S.readout('u', 'Closest without scaling'), rV = S.readout('v', 'Closest with scaling');
    t2.innerHTML = '<thead><tr><th>Pair of colours</th><th>As numbers 1, 2, 3</th><th>One-hot</th></tr></thead><tbody><tr><th>red – green</th><td>1</td><td>1.41</td></tr><tr><th>red – blue</th><td>2</td><td>1.41</td></tr><tr><th>green – blue</th><td>1</td><td>1.41</td></tr></tbody>';
    function draw() {
      var t = [cA.get(), cI.get()], sc = cS.get(), u = F.nearestPerson(t, false), v = F.nearestPerson(t, true), cur = sc ? v : u;
      tbl.innerHTML = '<thead><tr><th>Person</th><th>Age</th><th>Income</th><th>Distance' + (sc ? ' (scaled)' : '') + '</th></tr></thead>'; var tb = S.el('tbody');
      F.PEOPLE.forEach(function (p, i) { var tr = S.el('tr', { class: i === cur.i ? 'sim-last' : '' }); tr.appendChild(S.el('th', { text: String(i + 1) })); tr.appendChild(S.el('td', { text: String(p[0]) })); tr.appendChild(S.el('td', { text: p[1].toLocaleString('en') })); tr.appendChild(S.el('td', { text: cur.all[i].toFixed(sc ? 2 : 0) })); tb.appendChild(tr); }); tbl.appendChild(tb);
      rN.set('Person ' + (cur.i + 1)); rU.set('Person ' + (u.i + 1)); rV.set('Person ' + (v.i + 1));
      S.narrate(sc ? 'With scaling, person ' + (v.i + 1) + ' is closest' : 'Without scaling, person ' + (u.i + 1) + ' is closest', 'Distance adds up differences in every column. An income difference of 1,000 is a bigger number than an age difference of 20, so without scaling the income decides almost everything and age is ignored. Scaling puts each column on a comparable footing, and the answer can change. A colour coded 1, 2, 3 tells a model that red is nearer to green than to blue; one-hot columns treat every colour as equally different.');
      if (sc && u.i !== v.i) S.challenge('flip');
    }
    draw();
  });
})();
