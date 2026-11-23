/* Simulation: random split against time-ordered split, and a leaked column. Calculation: AIQPSim.logic.fnd. */
(function () {
  'use strict';
  var Q = (window.AIQPSim = window.AIQPSim || { logic: {}, register: function () {} });
  if (typeof document === 'undefined') return;
  Q.register('spl', function (S) {
    var F = Q.logic.fnd, d = F.splitData();
    var cM = S.select('mode', 'How to split the 60 days', [['random', 'At random (25% for testing)'], ['time', 'By time (the last 15 days for testing)']], 'random', function () { draw(); });
    var cF = S.select('feat', 'What the model may look at', [['day', 'The day number'], ['leak', 'A column that was worked out from the answer']], 'day', function () { draw(); });
    var cv = S.card('Daily sales (made up). Blue dots are used for fitting, rings are held out for testing', S.view), svg = S.svgEl(380, 220, 'Daily values with training points and held-out test points.', cv);
    var rA = S.readout('a', 'Test error (this setting)'), rB = S.readout('b', 'Random split, day number'), rC = S.readout('c', 'Time split, day number');
    function draw() {
      var mode = cM.get(), feat = cF.get(), test = mode === 'random' ? F.shuffled(60, 5).slice(0, 15) : [45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59], isTest = {}; test.forEach(function (t) { isTest[t] = 1; });
      while (svg.firstChild) svg.removeChild(svg.firstChild); var X = function (t) { return 24 + t * 5.9; }, Y = function (v) { return 205 - (v - 10) * 3.2; };
      svg.appendChild(S.svg('line', { x1: 24, y1: 205, x2: 376, y2: 205, class: 'axis' }));
      d.y.forEach(function (v, t) { svg.appendChild(S.svg('circle', { cx: X(t), cy: Y(v), r: isTest[t] ? 5 : 3.2, class: isTest[t] ? 'cellbox' : 'sv-f0' })); });
      var err = F.splitMae(mode, feat); rA.set(err.toFixed(2)); rB.set(F.splitMae('random', 'day').toFixed(2)); rC.set(F.splitMae('time', 'day').toFixed(2));
      S.narrate('Average miss on the held-out days: ' + err.toFixed(2), feat === 'leak' ? 'The extra column was computed from the answer itself, so the model can look the answer up almost exactly. The score looks wonderful and means nothing, because that column would not exist when predicting the future.' : mode === 'random' ? 'With a random split, each held-out day has neighbours on both sides in the training data, so the model only fills in gaps. That is easier than real use, where you predict days that have not happened.' : 'A time split matches real use: the model sees the past and predicts the future. The error is higher, and it is the honest number.');
      if (mode === 'random' && feat === 'leak' && err < 1) S.challenge('leak');
      if (mode === 'time' && feat === 'day') S.challenge('time');
    }
    draw();
  });
})();
