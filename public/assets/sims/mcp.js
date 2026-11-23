/* Simulation: the messages between an assistant app, a tool server and an outside service, step by step.
   A simplified, made-up exchange (field names shortened). No calculation. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  var LANES = ['Assistant app', 'Tool server', 'Weather service'];
  var STEPS = [
    [0, 1, 'initialize', 'Hello. These are the features I support.'],
    [1, 0, 'initialize result', 'Hello. I offer tools.'],
    [0, 1, 'tools/list', 'What tools do you have?'],
    [1, 0, 'tools/list result', 'One tool: get_weather(city), “current weather for a city”.'],
    [0, 0, 'the model decides', 'The model, shown the tool list, asks to call get_weather with city = “Paris”.'],
    [0, 1, 'tools/call', 'Call get_weather with { "city": "Paris" }.'],
    [1, 2, 'a web request', 'The server asks the weather service for Paris.'],
    [2, 1, 'the reply', 'The service returns 18 degrees and clear sky (made up).'],
    [1, 0, 'tools/call result', 'Here is the result as text for the model to read.']];
  Q.register('mcp', function (S) {
    var st = { step: 0 };
    var cS = S.range('step', 'Messages shown', { min: 0, max: STEPS.length, step: 1, value: 0, onChange: function (v) { st.step = v; draw(); } });
    var cA = S.toggle('ask', 'The app asks the person before the tool is called', false, function () { draw(); });
    S.buttons([{ id: 'next', label: 'Next message', primary: true, onClick: function () { st.step = Math.min(STEPS.length, st.step + 1); cS.set(st.step); draw(); } }, { id: 'reset', label: 'Start again', onClick: function () { st.step = 0; cS.set(0); draw(); } }]);
    var cv = S.card('Who sends what to whom', S.view), svg = S.svgEl(380, 330, 'Three lanes (assistant app, tool server, outside service) with arrows for each message shown so far.', cv);
    var rA = S.readout('a', 'Messages'), rB = S.readout('b', 'Person asked');
    function draw() {
      while (svg.firstChild) svg.removeChild(svg.firstChild); var x = [60, 190, 320], y0 = 50, dy = 30;
      LANES.forEach(function (n, i) { svg.appendChild(S.svg('text', { x: x[i], y: 18, 'text-anchor': 'middle', 'font-weight': 700, 'font-size': 11, text: n })); svg.appendChild(S.svg('line', { x1: x[i], y1: 28, x2: x[i], y2: 320, class: 'grid', 'stroke-dasharray': '3 3' })); });
      var asked = false;
      STEPS.slice(0, st.step).forEach(function (s, i) {
        var y = y0 + i * dy; if (s[0] === s[1]) { svg.appendChild(S.svg('rect', { x: x[s[0]] - 50, y: y - 12, width: 100, height: 18, rx: 4, class: 'node' })); svg.appendChild(S.svg('text', { x: x[s[0]], y: y, 'text-anchor': 'middle', 'font-size': 9, text: s[2] })); return; }
        var dir = s[1] > s[0] ? 1 : -1; svg.appendChild(S.svg('line', { x1: x[s[0]], y1: y, x2: x[s[1]] - dir * 6, y2: y, class: 'edge sv-s0', 'stroke-width': 2 })); svg.appendChild(S.svg('path', { d: 'M' + (x[s[1]] - dir * 12) + ' ' + (y - 4) + 'L' + x[s[1]] + ' ' + y + 'L' + (x[s[1]] - dir * 12) + ' ' + (y + 4), class: 'edge sv-s0', fill: 'none', 'stroke-width': 2 })); svg.appendChild(S.svg('text', { x: (x[s[0]] + x[s[1]]) / 2, y: y - 6, 'text-anchor': 'middle', 'font-size': 9, text: s[2] }));
        if (s[2] === 'tools/call' && cA.get()) asked = true;
      });
      var last = st.step ? STEPS[st.step - 1] : null; rA.set(st.step + ' of ' + STEPS.length); rB.set(cA.get() ? (st.step >= 6 ? 'yes, once' : 'not yet') : 'no');
      S.narrate(last ? 'Message ' + st.step + ': ' + last[2] : 'No messages yet', (last ? last[3] + ' ' : '') + 'A tool standard lets an assistant app discover what a server can do and call it in a common way, so each tool does not need its own custom connection. Because a tool can act in the real world, many apps ask the person before it is called' + (cA.get() ? ': here the app pauses before “tools/call”.' : '.'));
      if (st.step === STEPS.length && cA.get()) S.challenge('ask');
    }
    draw();
  });
})();
