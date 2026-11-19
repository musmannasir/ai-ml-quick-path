/* Simulation: data checks on incoming rows, and a schema change that breaks a pipeline. Calculation: AIQPSim.logic.ops. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  var LAB = { schema: 'Check that the columns are the ones expected', age_present: 'Check that age is present', age_range: 'Check that age is between 0 and 120', email: 'Check that the email contains @', country: 'Check that the country is one of UK, US, DE, FR' };
  Q.register('val', function (S) {
    var O = Q.logic.ops, on = { email: true, country: true }, tg = {};
    O.CHECKS.forEach(function (c) { tg[c] = S.toggle(c, LAB[c], !!on[c], function (v) { on[c] = v; draw(); }); });
    var cR = S.toggle('rename', 'The data supplier renamed the column “age” to “years”', false, function () { draw(); });
    var c1 = S.card('Ten incoming rows (made up). A ✗ shows which check a row failed', S.view), tbl = S.el('table', { class: 'sim-table' }); c1.appendChild(tbl);
    var rP = S.readout('p', 'Rows that pass'), rW = S.readout('w', 'What the checks said');
    function draw() {
      var en = O.CHECKS.filter(function (c) { return on[c]; }), ren = cR.get(), v = O.validate(en, ren);
      tbl.innerHTML = '<thead><tr><th>Row</th><th>' + (ren ? 'years' : 'age') + '</th><th>email</th><th>country</th><th>Result</th></tr></thead>'; var tb = S.el('tbody');
      O.ROWS.forEach(function (r, i) { var why = v.bad[i], tr = S.el('tr', { class: why.length ? 'sim-last' : '' }); tr.appendChild(S.el('th', { text: String(i + 1) })); tr.appendChild(S.el('td', { text: ren ? String(r[0]) : r[0] === null ? '(missing)' : String(r[0]) })); tr.appendChild(S.el('td', { text: r[1] || '(empty)' })); tr.appendChild(S.el('td', { text: r[2] })); tr.appendChild(S.el('td', { text: why.length ? '✗ ' + why.join(', ') : 'ok' })); tb.appendChild(tr); }); tbl.appendChild(tb);
      var silent = ren && !on.schema && !on.age_present && !on.age_range;
      rP.set(v.pass + ' of 10'); rW.set(v.stopped ? 'stopped: a column is missing' : silent ? 'nothing noticed' : Object.keys(v.fails).length ? 'problems found' : 'no checks on');
      S.narrate(v.stopped ? 'The pipeline stopped before bad data reached the model' : silent ? 'Nothing was noticed: the model silently loses its age column' : v.pass + ' of 10 rows pass the checks you turned on', v.stopped ? 'A schema check looks at the shape of the data first. Because the column is gone, it stops the pipeline and says why, which is far better than feeding the model a column of blanks.' : silent ? 'The renamed column is seen as empty. With only email and country checked, every row still passes, so the model would quietly receive no age at all. Without a check on the columns, a change like this is found only when results get worse.' : 'Each check is a small rule that a row must meet. Checks catch bad rows early, when they are cheap to fix. They cannot catch what nobody thought to check.');
      if (v.stopped) S.challenge('stop'); if (silent) S.challenge('silent');
    }
    draw();
  });
})();
