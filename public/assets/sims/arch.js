/* Simulation: follow a request through the parts of a production system, and break one part. Calculation: AIQPSim.logic.ops. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  var ROLE = ['The app or website the person uses', 'The front door: routes and limits requests', 'Checks who is asking', 'Remembers recent answers so repeats are quick and cheap', 'Runs the model and produces the answer', 'Finds the documents the model should use', 'Records what happened, for people to read later'];
  Q.register('arch', function (S) {
    var O = Q.logic.ops, st = { step: 7 };
    var cB = S.select('broken', 'Break this part', [['', 'Nothing is broken']].concat(O.PARTS.map(function (p) { return [p, p]; })), '', function () { draw(); });
    var cS = S.range('step', 'Follow the request: parts reached', { min: 1, max: 7, step: 1, value: 7, onChange: function (v) { st.step = v; draw(); } });
    var cv = S.card('One request travelling left to right. Each box is one part', S.view), svg = S.svgEl(380, 230, 'Seven parts of a production system in a row, with the broken part marked.', cv);
    var rO = S.readout('o', 'What the person experiences'), rK = S.readout('k', 'Parts reached');
    function draw() {
      var br = cB.get(), eff = br ? O.EFFECT[br] : null, w = 52; while (svg.firstChild) svg.removeChild(svg.firstChild);
      var stop = br && eff[0] === 'failed' ? O.PARTS.indexOf(br) : 99;
      O.PARTS.forEach(function (p, i) {
        var x = 6 + i * (w + 1.5), reached = i < st.step && i <= stop, isB = p === br, cls = isB ? 'sv-f1' : reached ? 'sv-f0' : 'node';
        svg.appendChild(S.svg('rect', { x: x, y: 40, width: w, height: 56, rx: 6, class: cls, 'fill-opacity': reached || isB ? 0.5 : 1 })); svg.appendChild(S.svg('text', { x: x + w / 2, y: 64, 'text-anchor': 'middle', 'font-size': 9, 'font-weight': 700, text: p.split(' ')[0] })); svg.appendChild(S.svg('text', { x: x + w / 2, y: 78, 'text-anchor': 'middle', 'font-size': 9, text: p.split(' ').slice(1).join(' ') }));
        if (isB) svg.appendChild(S.svg('text', { x: x + w / 2, y: 112, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, text: '✕' }));
        if (i < 6) svg.appendChild(S.svg('line', { x1: x + w, y1: 68, x2: x + w + 1.5, y2: 68, class: 'axis', 'stroke-width': 2 }));
      });
      var idx = Math.min(st.step, 7) - 1; svg.appendChild(S.svg('text', { x: 8, y: 150, 'font-size': 10, 'font-weight': 700, text: O.PARTS[idx] + ':' })); svg.appendChild(S.svg('text', { x: 8, y: 166, 'font-size': 10, class: 't2', text: ROLE[idx] }));
      var out = !br ? 'works' : eff[0] === 'failed' ? 'fails' : 'works, but worse'; rO.set(out); rK.set(Math.min(st.step, stop + 1, 7) + ' of 7');
      S.narrate(br ? 'Without the ' + br.toLowerCase() + ': ' + (eff[0] === 'failed' ? 'the request fails' : 'the request works, but with a problem') : 'All parts work and the request succeeds', br ? eff[1] + ' A system is designed so that the parts that matter most to the person fail safely, and the parts that only help the team (like logging) are still watched, because silent failures are the hardest to find.' : 'The request passes through each part in turn. Break one part to see what the person would experience. Some parts cause a failure, and others only make the system slower, costlier or blind.');
      if (br === 'Logging') S.challenge('blind'); if (br === 'Sign-in check') S.challenge('safe');
    }
    draw();
  });
})();
