/* Simulation engine. Loaded only on lesson pages that contain a ```sim block.
   Each module (assets/sims/<id>.js) calls AIQPSim.register(id, function (S) { ... }) and builds its controls and
   pictures with the helpers below. Pure calculation lives in AIQPSim.logic[id] so Node can run it (scripts/check-sims.mjs).
   No inline styles are written in markup; colours come from CSS variables (theme tokens) and are re-read on theme change. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var mods = {};
  var reduceMq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var KEY = 'aimlqp.sim.v1';
  var themeHooks = [];
  window.AIQPSim = { register: function (id, fn) { mods[id] = fn; }, logic: (window.AIQPSim && window.AIQPSim.logic) || {} };
  var seq = 0;

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k]; else if (k === 'class') e.className = attrs[k]; else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }
  function sv(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { if (k === 'text') e.textContent = attrs[k]; else if (k === 'class') e.setAttribute('class', attrs[k]); else e.setAttribute(k, attrs[k]); });
    return e;
  }
  function store(read, write) {
    try { var o = JSON.parse(localStorage.getItem(KEY) || '{}'); if (write) { write(o); localStorage.setItem(KEY, JSON.stringify(o)); } return o; } catch (e) { return {}; }
  }
  function colours() {
    var cs = getComputedStyle(document.documentElement);
    var g = function (n) { return cs.getPropertyValue(n).trim(); };
    return { bg: g('--sim-bg'), grid: g('--sim-grid'), ink: g('--ink'), ink2: g('--ink-2'), line: g('--line-strong'), surface: g('--surface'),
      c: [g('--sim-c0'), g('--sim-c1'), g('--sim-c2'), g('--sim-c3')], accent: g('--accent') };
  }
  function themeChanged() { themeHooks.slice().forEach(function (f) { try { f(); } catch (e) { /* keep going */ } }); }
  if (window.MutationObserver) new MutationObserver(themeChanged).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if (window.matchMedia) { var dm = window.matchMedia('(prefers-color-scheme: dark)'); if (dm.addEventListener) dm.addEventListener('change', themeChanged); }

  function build(fig) {
    var id = fig.getAttribute('data-sim'), fn = mods[id];
    if (!fn) return;
    var lessonMeta = document.querySelector('meta[name="aimlqp-lesson"]');
    var lessonId = lessonMeta ? lessonMeta.getAttribute('content') : 'page';
    var stage = fig.querySelector('.sim-stage');
    var controls = el('div', { class: 'sim-controls', role: 'group', 'aria-label': 'Simulation controls' });
    var view = el('div', { class: 'sim-view' });
    var narrT = el('p', { class: 'sim-narr-t', text: 'Ready' }), narrX = el('p', { class: 'sim-narr-x', text: '' });
    var narr = el('div', { class: 'sim-narr', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' }, [narrT, narrX]);
    var readouts = el('dl', { class: 'sim-readouts' });
    view.appendChild(narr);
    stage.appendChild(controls); stage.appendChild(view);
    stage.classList.add('split');
    var themeFns = [];
    var S = {
      fig: fig, stage: stage, view: view, controls: controls, preset: fig.getAttribute('data-preset') || '',
      reduced: reduceMq.matches, el: el, svg: sv,
      colours: colours,
      onTheme: function (f) { themeFns.push(f); themeHooks.push(f); },
      narrate: function (t, x) { narrT.textContent = t; narrX.textContent = x || ''; },
      range: function (name, label, o) {
        var wrap = el('div', { class: 'sim-ctl' });
        var lid = 'sc' + (++seq);
        var out = el('output', { for: lid });
        var input = el('input', { type: 'range', id: lid, min: o.min, max: o.max, step: o.step || 1, value: o.value });
        var fmt = o.fmt || function (v) { return String(v); };
        // A log scale lets one slider cover 0.01 to 1: the input holds an exponent and get() converts.
        var get = function () { return o.log ? Math.pow(10, Number(input.value)) : Number(input.value); };
        var sync = function () { out.textContent = fmt(get()); };
        wrap.appendChild(el('label', { for: lid }, [el('span', { text: label }), out]));
        wrap.appendChild(input); controls.appendChild(wrap); sync();
        input.addEventListener('input', function () { sync(); if (o.onChange) o.onChange(get()); });
        return { get: get, set: function (v) { input.value = o.log ? Math.log10(v) : v; sync(); }, input: input };
      },
      select: function (name, label, options, value, onChange) {
        var wrap = el('div', { class: 'sim-ctl' });
        var lid = 'sc' + (++seq);
        var sel = el('select', { id: lid });
        options.forEach(function (op) { var e = el('option', { value: op[0], text: op[1] }); if (op[0] === value) e.selected = true; sel.appendChild(e); });
        wrap.appendChild(el('label', { for: lid }, [el('span', { text: label })])); wrap.appendChild(sel); controls.appendChild(wrap);
        sel.addEventListener('change', function () { if (onChange) onChange(sel.value); });
        return { get: function () { return sel.value; }, set: function (v) { sel.value = v; }, input: sel };
      },
      toggle: function (name, label, value, onChange) {
        var wrap = el('div', { class: 'sim-ctl check' });
        var cb = el('input', { type: 'checkbox' }); cb.checked = !!value;
        wrap.appendChild(el('label', null, [cb, el('span', { text: label })])); controls.appendChild(wrap);
        cb.addEventListener('change', function () { if (onChange) onChange(cb.checked); });
        return { get: function () { return cb.checked; }, set: function (v) { cb.checked = !!v; }, input: cb };
      },
      text: function (name, label, value, onChange, maxlen) {
        var wrap = el('div', { class: 'sim-ctl' });
        var lid = 'sc' + (++seq);
        var inp = el('input', { type: 'text', id: lid, value: value, maxlength: maxlen || 60, autocomplete: 'off', spellcheck: 'false' });
        wrap.appendChild(el('label', { for: lid }, [el('span', { text: label })])); wrap.appendChild(inp); controls.appendChild(wrap);
        inp.addEventListener('input', function () { if (onChange) onChange(inp.value); });
        return { get: function () { return inp.value; }, set: function (v) { inp.value = v; }, input: inp };
      },
      buttons: function (list) {
        var row = el('div', { class: 'sim-btns' }), made = {};
        list.forEach(function (b) {
          var btn = el('button', { type: 'button', class: 'btn btn-small' + (b.primary ? ' btn-primary' : ''), text: b.label });
          btn.addEventListener('click', b.onClick); row.appendChild(btn); made[b.id] = btn;
        });
        controls.appendChild(row); return made;
      },
      readout: function (name, label) {
        var dd = el('dd', { text: '-' });
        readouts.appendChild(el('div', null, [el('dt', { text: label }), dd]));
        if (!readouts.parentNode) view.appendChild(readouts);
        return { set: function (t) { dd.textContent = t; } };
      },
      card: function (title, parent) {
        var c = el('div', { class: 'sim-card' }, [title ? el('p', { class: 'sim-card-t', text: title }) : null]);
        (parent || view).appendChild(c); return c;
      },
      row: function () { var r = el('div', { class: 'sim-row' }); view.appendChild(r); return r; },
      canvas: function (w, h, label, parent) {
        var c = el('canvas', { class: 'sim-canvas', width: w, height: h, role: 'img', 'aria-label': label });
        (parent || view).appendChild(c); return c;
      },
      svgEl: function (vw, vh, label, parent) {
        var s = sv('svg', { class: 'sim-svg', viewBox: '0 0 ' + vw + ' ' + vh, role: 'img', 'aria-label': label });
        (parent || view).appendChild(s); return s;
      },
      // A repeating job that stops itself: fn(frame) returns false to stop. Respects hidden tabs.
      loop: function (fn, perSecond) {
        var timer = null, running = false, last = 0, gap = 1000 / (perSecond || 30);
        var tick = function (t) {
          if (!running) return;
          if (t - last >= gap) { last = t; if (fn() === false) { api.stop(); return; } }
          timer = requestAnimationFrame(tick);
        };
        var api = {
          start: function () { if (running) return; running = true; last = 0; timer = requestAnimationFrame(tick); if (api.onState) api.onState(true); },
          stop: function () { running = false; if (timer) cancelAnimationFrame(timer); if (api.onState) api.onState(false); },
          running: function () { return running; }
        };
        return api;
      },
      challenge: function (tid) {
        var li = fig.querySelector('[data-try="' + tid + '"]');
        if (!li || li.classList.contains('done')) return;
        li.classList.add('done'); var w = li.querySelector('.sim-tick-word'); if (w) w.textContent = 'Done';
        store(null, function (o) { o[lessonId + ':' + id + ':' + tid] = 1; });
      }
    };
    // Restore ticks from earlier visits.
    var saved = store(); Object.keys(saved).forEach(function (k) {
      var p = k.split(':'); if (p[0] === lessonId && p[1] === id) { var li = fig.querySelector('[data-try="' + p[2] + '"]'); if (li) { li.classList.add('done'); var w = li.querySelector('.sim-tick-word'); if (w) w.textContent = 'Done'; } }
    });
    stage.hidden = false; fig.classList.add('sim-live');
    try { fn(S); } catch (e) { console.error(e); S.narrate('Something went wrong in this simulation', String(e && e.message || e)); }
  }

  function predict(fig) {
    var fs = fig.querySelector('.sim-predict'); if (!fs) return;
    fs.hidden = false;
    var btn = fs.querySelector('[data-sim-check]'), out = fs.querySelector('.sim-reveal'), right = fs.getAttribute('data-answer');
    btn.addEventListener('click', function () {
      var pick = fs.querySelector('input:checked');
      if (!pick) { out.className = 'sim-reveal no'; out.textContent = 'Pick an option first.'; return; }
      var ok = pick.value === right;
      out.className = 'sim-reveal ' + (ok ? 'ok' : 'no');
      out.textContent = (ok ? 'Right. ' : 'Not quite. ') + out.getAttribute('data-reveal') + ' Now try it below.';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('figure.sim'), function (fig) { predict(fig); build(fig); });
  });
})();
