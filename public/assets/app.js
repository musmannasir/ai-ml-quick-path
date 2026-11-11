/* AI Engineering Academy client script. No dependencies. Works without storage. */
(function () {
  'use strict';
  var doc = document, html = doc.documentElement;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var ROOT = ($('meta[name="aiea-root"]') || {}).content || '';

  // ---------- Versioned local storage (fails gracefully) ----------
  var KEY = 'aimlqp.v1';
  var store = {
    ok: true,
    data: { version: 1, prefs: {}, progress: {} },
    load: function () {
      try {
        var raw = localStorage.getItem(KEY);
        if (raw) {
          var d = JSON.parse(raw);
          if (d && d.version === 1) this.data = { version: 1, prefs: d.prefs || {}, progress: d.progress || {} };
        }
      } catch (e) { this.ok = false; }
    },
    save: function () {
      try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { this.ok = false; }
      var w = $('#storage-warning'); if (w) w.hidden = this.ok;
    },
    pref: function (k, v) { if (arguments.length === 1) return this.data.prefs[k]; this.data.prefs[k] = v; this.save(); },
    isDone: function (id) { return !!(this.data.progress[id] && this.data.progress[id].done); },
    setDone: function (id, done) {
      if (done) this.data.progress[id] = { done: true, at: new Date().toISOString().slice(0, 10) };
      else delete this.data.progress[id];
      this.save();
    }
  };
  store.load();
  var probe = function () { try { localStorage.setItem('aimlqp.probe', '1'); localStorage.removeItem('aimlqp.probe'); } catch (e) { store.ok = false; } };
  probe();

  // ---------- Theme ----------
  var themeSelect = $('#theme-select');
  function applyTheme(t) {
    if (t === 'light' || t === 'dark') html.setAttribute('data-theme', t); else html.removeAttribute('data-theme');
  }
  if (themeSelect) {
    themeSelect.value = store.pref('theme') || 'system';
    themeSelect.addEventListener('change', function () { store.pref('theme', themeSelect.value); applyTheme(themeSelect.value); });
  }

  // ---------- Sidebar: expanded / hidden (desktop) and drawer (narrow) ----------
  var sidebar = $('#sidebar'), toggle = $('#sidebar-toggle'), scrim = $('.scrim'), main = $('#main');
  var narrow = window.matchMedia('(max-width: 1023.98px)');
  function setToggleLabel(open) {
    if (!toggle) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', (open ? 'Hide' : 'Show') + ' course navigation');
  }
  var edgeL = $('#sidebar-edge');
  function syncEdgeL(open) {
    if (!edgeL) return;
    edgeL.setAttribute('aria-expanded', String(open));
    edgeL.setAttribute('aria-label', (open ? 'Hide' : 'Show') + ' course navigation');
  }
  function syncSidebar() {
    syncEdgeL(html.getAttribute('data-sidebar') !== 'hidden' && html.getAttribute('data-focus') !== 'on');
    if (narrow.matches) setToggleLabel(doc.body.classList.contains('drawer-open'));
    else setToggleLabel(html.getAttribute('data-sidebar') !== 'hidden' && html.getAttribute('data-focus') !== 'on');
  }
  function openDrawer() {
    doc.body.classList.add('drawer-open'); if (scrim) scrim.hidden = false;
    if (main) main.setAttribute('inert', '');
    syncSidebar();
    var target = $('[aria-current="page"]', sidebar) || $('input', sidebar);
    if (target) target.focus();
  }
  function closeDrawer(returnFocus) {
    if (!doc.body.classList.contains('drawer-open')) return;
    doc.body.classList.remove('drawer-open'); if (scrim) scrim.hidden = true;
    if (main) main.removeAttribute('inert');
    syncSidebar(); if (returnFocus && toggle) toggle.focus();
  }
  if (toggle) toggle.addEventListener('click', function () {
    if (narrow.matches) { doc.body.classList.contains('drawer-open') ? closeDrawer(true) : openDrawer(); return; }
    if (html.getAttribute('data-focus') === 'on') setFocusMode(false);
    var hidden = html.getAttribute('data-sidebar') === 'hidden';
    if (hidden) html.removeAttribute('data-sidebar'); else html.setAttribute('data-sidebar', 'hidden');
    store.pref('sidebar', hidden ? 'shown' : 'hidden');
    syncSidebar();
  });
  if (edgeL && toggle) edgeL.addEventListener('click', function () { toggle.click(); });
  if (scrim) scrim.addEventListener('click', function () { closeDrawer(true); });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (doc.body.classList.contains('drawer-open')) closeDrawer(true);
      closeSearch(false);
    }
  });
  var onMedia = function () { closeDrawer(false); syncSidebar(); };
  if (narrow.addEventListener) narrow.addEventListener('change', onMedia); else if (narrow.addListener) narrow.addListener(onMedia);
  if (sidebar) sidebar.addEventListener('click', function (e) { if (e.target.closest('a') && narrow.matches) closeDrawer(false); });
  syncSidebar();

  // Collapsible nav groups
  function setGroup(btn, open) {
    btn.setAttribute('aria-expanded', String(open));
    var list = doc.getElementById(btn.getAttribute('aria-controls')); if (list) list.hidden = !open;
  }
  $$('.nav-toggle').forEach(function (b) { b.addEventListener('click', function () { setGroup(b, b.getAttribute('aria-expanded') !== 'true'); }); });
  $$('[data-nav-expand]').forEach(function (b) {
    b.addEventListener('click', function () { var open = b.getAttribute('data-nav-expand') === 'all'; $$('.nav-toggle').forEach(function (t) { setGroup(t, open); }); });
  });
  var navFilter = $('#nav-filter');
  if (navFilter) navFilter.addEventListener('input', function () {
    var q = navFilter.value.trim().toLowerCase(), shown = 0;
    $$('.nav-group').forEach(function (g) {
      var any = false;
      $$('li', g).forEach(function (li) {
        var hit = !q || li.textContent.toLowerCase().indexOf(q) !== -1;
        li.classList.toggle('filtered-out', !hit); if (hit) { any = true; shown++; }
      });
      g.classList.toggle('filtered-out', !any);
      if (q && any) setGroup($('.nav-toggle', g), true);
    });
    var st = $('#nav-filter-status'); if (st) st.textContent = q ? shown + ' matching items' : '';
  });

  // ---------- Focus mode ----------
  var focusBtn = $('#focus-toggle');
  function setFocusMode(on) {
    if (on) html.setAttribute('data-focus', 'on'); else html.removeAttribute('data-focus');
    if (focusBtn) { focusBtn.setAttribute('aria-pressed', String(on)); var l = $('.btn-label', focusBtn); if (l) l.textContent = on ? 'Exit focus' : 'Focus'; }
    store.pref('focus', on ? 'on' : 'off'); syncSidebar();
  }
  if (focusBtn) {
    if (html.getAttribute('data-focus') === 'on') { focusBtn.setAttribute('aria-pressed', 'true'); $('.btn-label', focusBtn).textContent = 'Exit focus'; }
    focusBtn.addEventListener('click', function () { setFocusMode(html.getAttribute('data-focus') !== 'on'); });
  }

  // ---------- Lesson side panel: hide / show (remembered in this browser) ----------
  var railBtn = $('#rail-toggle');
  if (railBtn) {
    var edgeR = $('#rail-edge');
    var syncRail = function () {
      var hidden = html.getAttribute('data-rail') === 'hidden';
      railBtn.setAttribute('aria-expanded', String(!hidden));
      railBtn.textContent = hidden ? 'Show side panel' : 'Hide side panel';
      if (edgeR) { edgeR.setAttribute('aria-expanded', String(!hidden)); edgeR.setAttribute('aria-label', (hidden ? 'Show' : 'Hide') + ' lesson side panel'); }
    };
    if (edgeR) edgeR.addEventListener('click', function () { railBtn.click(); });
    syncRail();
    railBtn.addEventListener('click', function () {
      var hidden = html.getAttribute('data-rail') === 'hidden';
      if (hidden) html.removeAttribute('data-rail'); else html.setAttribute('data-rail', 'hidden');
      store.pref('rail', hidden ? 'shown' : 'hidden');
      syncRail();
    });
  }

  // ---------- Progress marks ----------
  function renderProgress() {
    $$('[data-progress-id]').forEach(function (a) { a.setAttribute('data-done', String(store.isDone(a.getAttribute('data-progress-id')))); });
    $$('[data-progress-checkbox]').forEach(function (c) { c.checked = store.isDone(c.getAttribute('data-progress-checkbox')); });
    $$('[data-progress-ids]').forEach(function (el) {
      var ids = el.getAttribute('data-progress-ids').split(' '), n = ids.filter(function (i) { return store.isDone(i); }).length;
      el.textContent = n + '/' + ids.length; el.setAttribute('aria-label', n + ' of ' + ids.length + ' lessons completed');
    });
    $$('[data-module-progress]').forEach(function (el) {
      el.textContent = el.getAttribute('data-module-progress').split(' ').filter(function (i) { return store.isDone(i); }).length;
    });
    if (window.renderDashboard) window.renderDashboard();
  }
  $$('[data-progress-checkbox]').forEach(function (c) {
    c.addEventListener('change', function () { store.setDone(c.getAttribute('data-progress-checkbox'), c.checked); renderProgress(); });
  });
  renderProgress();

  // ---------- Generic details expand/collapse ----------
  $$('[data-expand-all],[data-collapse-all]').forEach(function (b) {
    b.addEventListener('click', function () {
      var open = b.hasAttribute('data-expand-all'), scope = $(b.getAttribute(open ? 'data-expand-all' : 'data-collapse-all'));
      if (scope) $$('details', scope).forEach(function (d) { d.open = open; });
    });
  });

  // ---------- Copy buttons for code ----------
  $$('figure.code').forEach(function (fig) {
    var cap = $('figcaption', fig), code = $('code', fig); if (!cap || !code) return;
    var b = doc.createElement('button'); b.type = 'button'; b.className = 'copy-btn'; b.textContent = 'Copy';
    b.setAttribute('aria-label', 'Copy code: ' + cap.textContent);
    b.addEventListener('click', function () {
      var done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1500); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(code.textContent).then(done, function () { b.textContent = 'Select and copy manually'; });
      else { var r = doc.createRange(); r.selectNodeContents(code); var s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Selected: press Ctrl+C'; }
    });
    cap.appendChild(b);
  });

  // ---------- Print ----------
  var printed = [];
  window.addEventListener('beforeprint', function () { printed = $$('details:not([open])'); printed.forEach(function (d) { d.open = true; }); });
  window.addEventListener('afterprint', function () { printed.forEach(function (d) { d.open = false; }); printed = []; });
  $$('[data-print]').forEach(function (b) { b.addEventListener('click', function () { window.print(); }); });

  // ---------- Search ----------
  var sInput = $('#site-search'), sBox = $('#search-results');
  function closeSearch(focusInput) { if (!sBox || sBox.hidden) return; sBox.hidden = true; sInput.setAttribute('aria-expanded', 'false'); if (focusInput) sInput.focus(); }
  function runSearch() {
    var q = sInput.value.trim().toLowerCase(); var list = $('ul', sBox), status = $('.search-status', sBox);
    if (q.length < 2) { closeSearch(false); return; }
    var terms = q.split(/\s+/), idx = window.SEARCH_INDEX || [];
    var hits = idx.map(function (e) {
      var t = e.t.toLowerCase(), all = t + ' ' + (e.k || '').toLowerCase() + ' ' + (e.s || '').toLowerCase(), score = 0;
      for (var i = 0; i < terms.length; i++) { if (all.indexOf(terms[i]) === -1) return null; score += t.indexOf(terms[i]) !== -1 ? 5 : 1; }
      if (t.indexOf(q) === 0) score += 5;
      return { e: e, score: score };
    }).filter(Boolean).sort(function (a, b) { return b.score - a.score; }).slice(0, 10);
    list.innerHTML = '';
    hits.forEach(function (h) {
      var li = doc.createElement('li'), a = doc.createElement('a'), sec = doc.createElement('span');
      a.href = ROOT + h.e.u; a.textContent = h.e.t; sec.className = 'res-section'; sec.textContent = h.e.s || 'Page';
      a.appendChild(sec); li.appendChild(a); list.appendChild(li);
    });
    status.textContent = hits.length ? hits.length + (hits.length === 10 ? '+' : '') + ' results' : 'No results. Try a shorter or different word.';
    sBox.hidden = false; sInput.setAttribute('aria-expanded', 'true');
  }
  if (sInput && sBox) {
    sInput.addEventListener('input', runSearch);
    sInput.addEventListener('keydown', function (e) {
      var links = $$('a', sBox);
      if (e.key === 'ArrowDown' && links.length) { e.preventDefault(); links[0].focus(); }
      if (e.key === 'Enter' && links.length) { e.preventDefault(); location.href = links[0].href; }
    });
    sBox.addEventListener('keydown', function (e) {
      var links = $$('a', sBox), i = links.indexOf(doc.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); if (links[i + 1]) links[i + 1].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); if (i > 0) links[i - 1].focus(); else sInput.focus(); }
      if (e.key === 'Escape') closeSearch(true);
    });
    doc.addEventListener('click', function (e) { if (!e.target.closest('.search')) closeSearch(false); });
  }

  // ---------- Filters (cards with data-* attributes) ----------
  $$('.filters[data-filter-target]').forEach(function (bar) {
    var list = $(bar.getAttribute('data-filter-target')); if (!list) return;
    var items = Array.prototype.slice.call(list.children);
    var empty = list.nextElementSibling && list.nextElementSibling.classList.contains('empty-state') ? list.nextElementSibling : null;
    var selects = $$('select[data-filter]', bar), text = $('[data-filter-text]', bar), status = $('.filter-status', bar);
    function apply() {
      var q = text ? text.value.trim().toLowerCase() : '', shown = 0;
      items.forEach(function (it) {
        var ok = selects.every(function (s) {
          if (!s.value) return true;
          var v = (it.getAttribute('data-' + s.getAttribute('data-filter')) || '').split(' ');
          return v.indexOf(s.value) !== -1;
        });
        if (ok && q) ok = q.split(/\s+/).every(function (t) { return (it.getAttribute('data-text') || it.textContent.toLowerCase()).indexOf(t) !== -1; });
        it.hidden = !ok; if (ok) shown++;
      });
      if (status) status.textContent = 'Showing ' + shown + ' of ' + items.length + '.';
      if (empty) empty.hidden = shown !== 0;
    }
    function reset() { selects.forEach(function (s) { s.value = ''; }); if (text) text.value = ''; apply(); if (text) text.focus(); }
    selects.forEach(function (s) { s.addEventListener('change', apply); });
    if (text) text.addEventListener('input', apply);
    $$('[data-filter-reset]', bar).forEach(function (b) { b.addEventListener('click', reset); });
    if (empty) $$('[data-filter-reset]', empty).forEach(function (b) { b.addEventListener('click', reset); });
    apply();
  });

  // ---------- Roadmaps: tabs, steps, deep links ----------
  var tabs = $$('[role="tab"]');
  if (tabs.length) {
    var panels = tabs.map(function (t) { return doc.getElementById(t.getAttribute('aria-controls')); });
    function selectTab(id, focusTab) {
      tabs.forEach(function (t, i) {
        var on = t.getAttribute('aria-controls') === id;
        t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; panels[i].hidden = !on;
        if (on && focusTab) t.focus();
      });
    }
    function setNode(btn, open) {
      btn.setAttribute('aria-expanded', String(open));
      var p = doc.getElementById(btn.getAttribute('aria-controls')); if (p) p.hidden = !open;
    }
    $$('.node-toggle').forEach(function (b) {
      setNode(b, false);
      b.addEventListener('click', function () { setNode(b, b.getAttribute('aria-expanded') !== 'true'); });
    });
    var activePanel = function () { return panels.filter(function (p) { return !p.hidden; })[0]; };
    $$('[data-roadmap-expand],[data-roadmap-collapse]').forEach(function (b) {
      b.addEventListener('click', function () { var open = b.hasAttribute('data-roadmap-expand'); $$('.node-toggle', activePanel()).forEach(function (t) { setNode(t, open); }); });
    });
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { selectTab(t.getAttribute('aria-controls')); history.pushState(null, '', '#' + t.getAttribute('aria-controls')); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = null;
        if (k === 'ArrowRight') n = (i + 1) % tabs.length; else if (k === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        else if (k === 'Home') n = 0; else if (k === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); selectTab(tabs[n].getAttribute('aria-controls'), true); history.replaceState(null, '', '#' + tabs[n].getAttribute('aria-controls')); }
      });
    });
    function fromHash() {
      var h = decodeURIComponent(location.hash.slice(1));
      var panel = panels.filter(function (p) { return p.id === h; })[0];
      if (panel) { selectTab(h); return; }
      var node = h && doc.getElementById(h);
      if (node && node.classList.contains('node')) {
        var owner = node.closest('[role="tabpanel"]'); selectTab(owner.id);
        var b = $('.node-toggle', node); if (b) setNode(b, true);
        node.scrollIntoView(); var t = $('.node-title', node); if (t) { t.tabIndex = -1; t.focus({ preventScroll: true }); }
        return;
      }
      if (!h) selectTab(panels[0].id);
    }
    window.addEventListener('hashchange', fromHash);
    window.addEventListener('popstate', fromHash);
    fromHash();
  }

  // ---------- Assessment ----------
  $$('[data-check-answer]').forEach(function (b) {
    b.addEventListener('click', function () {
      var fs = b.closest('.mcq'), fb = $('.mcq-feedback', fs), chosen = $('input:checked', fs);
      fb.classList.remove('ok', 'bad');
      if (!chosen) { fb.textContent = 'Choose an answer first.'; return; }
      var right = chosen.value === fs.getAttribute('data-answer');
      fb.textContent = right ? 'Correct.' : 'Not quite. Read the explanation below.'; fb.classList.add(right ? 'ok' : 'bad');
      var d = $('details', fs); if (d && !right) d.open = true;
    });
  });

  // ---------- Progress page: dashboard, export/import/reset, calendar ----------
  var dataEl = $('#curriculum-data');
  if (dataEl) {
    var C = JSON.parse(dataEl.textContent);
    var dash = $('#progress-dashboard'), ioStatus = $('#io-status');
    if (!store.ok) $('#storage-warning').hidden = false;
    window.renderDashboard = function () {
      var blocks = C.modules.map(function (m) { return { title: m.title, ids: m.lessons.map(function (l) { return 'lesson:' + l.id; }), href: null }; });
      blocks.push({ title: 'Portfolio projects', ids: C.projects.map(function (p) { return 'project:' + p.id; }) });
      dash.innerHTML = '';
      blocks.forEach(function (b) {
        var n = b.ids.filter(function (i) { return store.isDone(i); }).length, pct = Math.round(100 * n / b.ids.length);
        var d = doc.createElement('div'); d.className = 'dash-item';
        var h = doc.createElement('h3'); h.textContent = b.title;
        var p = doc.createElement('p'); p.className = 'small'; p.textContent = n + ' of ' + b.ids.length + ' completed (' + pct + '%)';
        var bar = doc.createElement('div'); bar.className = 'bar'; bar.setAttribute('role', 'img'); bar.setAttribute('aria-label', pct + ' percent complete');
        var fill = doc.createElement('span'); fill.style.width = pct + '%'; bar.appendChild(fill);
        d.appendChild(h); d.appendChild(p); d.appendChild(bar); dash.appendChild(d);
      });
    };
    window.renderDashboard();
    $('#export-progress').addEventListener('click', function () {
      var payload = { schema: 'aimlqp-progress', version: 1, exportedAt: new Date().toISOString(), progress: store.data.progress };
      var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      var a = doc.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ai-ml-quick-path-progress-' + payload.exportedAt.slice(0, 10) + '.json';
      doc.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
      ioStatus.textContent = 'Exported ' + Object.keys(store.data.progress).length + ' completion marks.';
    });
    $('#import-progress').addEventListener('change', function (e) {
      var file = e.target.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var d = JSON.parse(reader.result);
          if (!d || d.schema !== 'aimlqp-progress' || d.version !== 1 || typeof d.progress !== 'object') throw new Error('format');
          var clean = {};
          Object.keys(d.progress).forEach(function (k) { if (/^(lesson|project|skill):[a-z0-9-]+$/.test(k) && d.progress[k] && d.progress[k].done === true) clean[k] = { done: true, at: String(d.progress[k].at || '').slice(0, 10) }; });
          store.data.progress = clean; store.save(); renderProgress();
          ioStatus.textContent = 'Imported ' + Object.keys(clean).length + ' completion marks.';
        } catch (err) { ioStatus.textContent = 'Import failed: the file is not an AI & ML Quick Path progress export (schema aimlqp-progress, version 1). Nothing was changed.'; }
        e.target.value = '';
      };
      reader.readAsText(file);
    });
    $('#reset-progress').addEventListener('click', function () {
      if (!window.confirm('Reset learning progress? This removes all lesson, project and skill completion marks saved in this browser. Theme and layout settings are kept.')) return;
      store.data.progress = {}; store.save(); renderProgress(); ioStatus.textContent = 'Learning progress was reset.';
    });
    var calR = $('#cal-roadmap'), calH = $('#cal-hours'), out = $('#calendar-output'), err = $('#cal-error');
    function renderCalendar() {
      var h = Number(calH.value);
      if (!(h >= 2 && h <= 40)) { err.hidden = false; err.textContent = 'Enter a whole number of hours between 2 and 40.'; calH.setAttribute('aria-invalid', 'true'); out.innerHTML = ''; return; }
      err.hidden = true; calH.removeAttribute('aria-invalid');
      var r = C.roadmaps.filter(function (x) { return x.id === calR.value; })[0], lo = 0, hi = 0;
      var rows = r.nodes.map(function (n) {
        var m = n.effort.match(/(\d+)\D+(\d+)/), a = +m[1], b = +m[2];
        var start = [lo / h, hi / h]; lo += a; hi += b;
        return [n.n + '. ' + n.title, n.effort, 'Week ' + (Math.floor(start[0]) + 1) + '–' + Math.max(1, Math.ceil(lo / h)) + ' (fast) / ' + (Math.floor(start[1]) + 1) + '–' + Math.max(1, Math.ceil(hi / h)) + ' (slower)'];
      });
      var t = '<div class="table-wrap" tabindex="0" role="region" aria-label="Estimated schedule"><table><thead><tr><th scope="col">Step</th><th scope="col">Effort</th><th scope="col">Estimated weeks at ' + h + ' h/week</th></tr></thead><tbody>';
      rows.forEach(function (row) { t += '<tr><td>' + row.map(function (c) { return String(c).replace(/[&<>]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]; }); }).join('</td><td>') + '</td></tr>'; });
      t += '</tbody></table></div><p class="small muted">Total: about ' + Math.ceil(lo / h) + '–' + Math.ceil(hi / h) + ' weeks. Study estimate only; it does not include learning prerequisites you may still need.</p>';
      out.innerHTML = t;
    }
    calR.addEventListener('change', renderCalendar); calH.addEventListener('input', renderCalendar); renderCalendar();
  }

  // ---------- Advertising slots (present only in an AdSense build with ads switched on) ----------
  try { document.querySelectorAll('ins.adsbygoogle').forEach(function () { (window.adsbygoogle = window.adsbygoogle || []).push({}); }); } catch (e) {}

  // ---------- TOC highlight and back to top ----------
  var toTop = $('.to-top');
  if (toTop) {
    toTop.addEventListener('click', function () { window.scrollTo(0, 0); var m = $('#main'); if (m) m.focus({ preventScroll: true }); });
    window.addEventListener('scroll', function () { toTop.hidden = window.scrollY < 900; }, { passive: true });
  }
})();
