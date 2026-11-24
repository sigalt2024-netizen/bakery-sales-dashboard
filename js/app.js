/* The Bakery Shop — Sales Dashboard (v1). Plain JavaScript, no build step. */
(function () {
  'use strict';

  var D = window.BakeryData;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var ic = function (name, cls) { return '<svg class="icon ' + (cls || '') + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>'; };

  /* ---------- formatting ---------- */
  var locale = 'en-US';   // UI text is English, so dates and currency match it (USD for now)
  function money(n, digits) {
    digits = digits == null ? 2 : digits;
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
  }
  var money0 = function (n) { return money(n, 0); };
  var int = function (n) { return new Intl.NumberFormat(locale).format(Math.round(n)); };
  function compact(n) { return n >= 1000 ? '$' + (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.0', '') + 'k' : '$' + Math.round(n); }
  function h12(h) { var x = h % 12; return x === 0 ? 12 : x; }
  function ampm(h) { return h % 24 >= 12 ? 'PM' : 'AM'; }
  function hourRange(h) {
    return ampm(h) === ampm(h + 1) ? h12(h) + '–' + h12(h + 1) + ' ' + ampm(h + 1)
                                   : h12(h) + ' ' + ampm(h) + '–' + h12(h + 1) + ' ' + ampm(h + 1);
  }
  var hShort = function (h) { return h12(h) + (h >= 12 ? 'p' : 'a'); };
  var longDate = function (d) { return d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' }); };
  var weekday = function (d) { return d.toLocaleDateString(locale, { weekday: 'short' }); };

  /* ---------- state ---------- */
  var PERIODS = {
    today: { label: 'Today',        chart: 'Sales by hour', from: 0, to: 0,  pFrom: 1, pTo: 1,  cmp: 'yesterday' },
    week:  { label: 'Last 7 days',  chart: 'Sales by day',  from: 0, to: 6,  pFrom: 7, pTo: 13, cmp: 'previous 7 days' },
    month: { label: 'Last 30 days', chart: 'Sales by day',  from: 0, to: 29, pFrom: 30, pTo: 59, cmp: 'previous 30 days' }
  };
  var METRIC_NAMES = { revenue: 'Revenue', orders: 'Orders', items: 'Items sold' };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('bakery.' + k); return v == null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('bakery.' + k, v); } catch (e) {} }
  };
  var savedPeriod = store.get('period', 'today');
  var state = {
    period: PERIODS[savedPeriod] ? savedPeriod : 'today',
    view: 'home', cat: null, metric: 'revenue', search: '',
    sel: {}, tables: {}, updated: new Date()
  };
  var cur, prev, all;

  function compute() {
    var p = PERIODS[state.period], h = D.LAST_HOUR;
    cur  = D.query({ cat: state.cat, from: p.from,  to: p.to,  cutoffDay: p.from,  cutoffHour: h });
    prev = D.query({ cat: state.cat, from: p.pFrom, to: p.pTo, cutoffDay: p.pFrom, cutoffHour: h });
    all  = D.query({ from: p.from, to: p.to, cutoffDay: p.from, cutoffHour: h });
  }

  function delta(c, p) { return p > 0 ? (c - p) / p * 100 : null; }
  function deltaHTML(d, compactMode) {
    if (d === null) return '<span class="delta flat">—</span>';
    var up = d >= 0;
    return '<span class="delta ' + (up ? 'pos' : 'neg') + '">' + ic(up ? 'up' : 'down') +
      '<span class="sr">' + (up ? 'Up ' : 'Down ') + '</span><span>' + (up ? '+' : '−') + Math.abs(d).toFixed(1) + '%' +
      (compactMode ? '' : ' vs ' + PERIODS[state.period].cmp) + '</span></span>';
  }
  function catById(id) { return D.CATEGORIES.filter(function (c) { return c.id === id; })[0]; }

  /* ---------- header + filter bar ---------- */
  function renderHeader() {
    $('#dateLabel').textContent = new Date().toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' }) + ' · Sample data';
    $('#updated').textContent = 'Updated ' + state.updated.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
    $$('[data-period]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.period === state.period)); });
    $$('[data-metric]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.metric === state.metric)); });
    var bar = $('#filterBar');
    if (state.cat) {
      var c = catById(state.cat);
      bar.innerHTML = '<button class="filter-pill" data-cat="">Showing: ' + c.emoji + ' ' + c.name +
        '<span class="x">' + ic('close', 'i28') + ' Clear</span></button>';
    } else { bar.innerHTML = ''; }
  }

  /* ---------- home: hero + KPIs ---------- */
  function renderHero() {
    var p = PERIODS[state.period];
    $('#hero').innerHTML =
      '<div class="hero-top"><div class="hero-ico">' + ic('coin', 'i40') + '</div>' +
      '<div><div class="hero-label">Total sales · ' + p.label + '</div></div></div>' +
      '<div class="hero-value">' + money(cur.revenue) + '</div>' +
      deltaHTML(delta(cur.revenue, prev.revenue));
  }
  function renderKpis() {
    var peak = 0; cur.byHour.forEach(function (h, i) { if (h.revenue > cur.byHour[peak].revenue) peak = i; });
    var peakText = cur.revenue > 0 ? hourRange(cur.byHour[peak].hour) : '—';
    var avg = cur.orders ? cur.revenue / cur.orders : 0, pavg = prev.orders ? prev.revenue / prev.orders : 0;
    var cards = [
      { i: 'receipt', l: 'Orders', v: int(cur.orders), d: deltaHTML(delta(cur.orders, prev.orders), true) },
      { i: 'basket',  l: 'Items sold', v: int(cur.items), d: deltaHTML(delta(cur.items, prev.items), true) },
      { i: 'wallet',  l: 'Average order', v: money(avg), d: deltaHTML(delta(avg, pavg), true) },
      { i: 'clock',   l: 'Peak hour', v: peakText, d: '' }
    ];
    $('#kpis').innerHTML = cards.map(function (c) {
      return '<div class="kpi"><div class="kpi-ico">' + ic(c.i, 'i40') + '</div><div class="kpi-label">' + c.l +
        '</div><div class="kpi-val">' + c.v + '</div>' + c.d + '</div>';
    }).join('');
  }

  /* ---------- chart ---------- */
  function niceMax(v) {
    var p = Math.pow(10, Math.floor(Math.log10(v))), m = v / p;
    var n = m <= 1 ? 1 : m <= 2 ? 2 : m <= 4 ? 4 : m <= 6 ? 6 : m <= 8 ? 8 : 10;
    return n * p;
  }
  function series(metric) {
    var per = state.period, s = {};
    s.fmtTip = metric === 'revenue' ? money : int;
    s.axis = metric === 'revenue' ? compact : function (v) { return String(Math.round(v * 10) / 10); };
    if (per === 'today') {
      s.values = cur.byHour.map(function (h) { return h[metric]; });
      s.labels = D.HOURS.map(hShort);
      s.tips = D.HOURS.map(hourRange);
      s.show = function (i) { return i % 2 === 0; };
      s.name = METRIC_NAMES[metric] + ' by hour';
    } else {
      var n = cur.byDay.length;
      s.values = cur.byDay.map(function (d) { return d[metric]; });
      s.labels = cur.byDay.map(function (d) { return per === 'week' ? weekday(d.date) : String(d.date.getDate()); });
      s.tips = cur.byDay.map(function (d) { return longDate(d.date); });
      s.show = per === 'week' ? function () { return true; } : function (i) { return (n - 1 - i) % 5 === 0; };
      s.name = METRIC_NAMES[metric] + ' by day';
    }
    return s;
  }

  function renderChart(host, id, metric) {
    var s = series(metric), n = s.values.length;
    var max = Math.max.apply(null, s.values.concat([1])), top = niceMax(max);
    var peak = 0; s.values.forEach(function (v, i) { if (v > s.values[peak]) peak = i; });
    var key = id + ':' + state.period + ':' + metric;
    if (state.sel[key] == null || state.sel[key] >= n) state.sel[key] = peak;
    var showTable = !!state.tables[id];
    var empty = max <= 1 && metric === 'revenue' && cur.revenue === 0;

    var grid = [1, 0.5, 0].map(function (f) {
      return '<div class="gl" style="bottom:' + (f * 100) + '%"><span>' + s.axis(top * f) + '</span></div>';
    }).join('');
    var cols = s.values.map(function (v, i) {
      return '<div class="col" data-i="' + i + '"><div class="bar" style="height:' + (v / top * 100) + '%"></div></div>';
    }).join('');
    var xl = s.labels.map(function (l, i) { return '<span>' + (s.show(i) ? l : '') + '</span>'; }).join('');
    var rows = s.labels.map(function (l, i) { return '<tr><td>' + s.tips[i] + '</td><td>' + s.fmtTip(s.values[i]) + '</td></tr>'; }).join('');

    host.innerHTML =
      (empty ? '<div class="empty"><img src="assets/logo.jpg" alt=""><p>No sales yet — the ovens are warming up! 🥐</p></div>' : '') +
      '<div class="readout" aria-live="polite"' + (showTable ? ' hidden' : '') + '></div>' +
      '<div class="chart-wrap"' + (showTable ? ' hidden' : '') + '>' +
        '<div class="plot">' + grid +
          '<div class="cols" role="group" tabindex="0" aria-label="' + s.name + '. Use the left and right arrow keys to read each bar.">' + cols + '</div>' +
        '</div><div class="xl">' + xl + '</div></div>' +
      '<div class="table-wrap"' + (showTable ? '' : ' hidden') + '><table><caption class="sr">' + s.name + '</caption>' +
        '<thead><tr><th>' + (state.period === 'today' ? 'Hour' : 'Day') + '</th><th>' + METRIC_NAMES[metric] + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<button class="link-btn" data-action="table" data-id="' + id + '">' + (showTable ? 'View as chart' : 'View as table') + '</button>';

    var colsEl = $('.cols', host), readout = $('.readout', host);
    function select(i) {
      state.sel[key] = i;
      $$('.col', colsEl).forEach(function (c, k) { c.classList.toggle('sel', k === i); });
      readout.innerHTML = '<span>' + s.tips[i] + (i === peak && s.values[i] > 0 ? '<span class="badge-peak">Peak</span>' : '') +
        '</span><span class="ro-val">' + s.fmtTip(s.values[i]) + '</span>';
    }
    function fromX(e) {
      var r = colsEl.getBoundingClientRect();
      return Math.max(0, Math.min(n - 1, Math.floor((e.clientX - r.left) / r.width * n)));
    }
    colsEl.addEventListener('pointerdown', function (e) { select(fromX(e)); });
    colsEl.addEventListener('pointermove', function (e) { select(fromX(e)); });
    colsEl.addEventListener('keydown', function (e) {
      var i = state.sel[key], k = e.key;
      if (k === 'ArrowRight') i = Math.min(n - 1, i + 1);
      else if (k === 'ArrowLeft') i = Math.max(0, i - 1);
      else if (k === 'Home') i = 0;
      else if (k === 'End') i = n - 1;
      else return;
      e.preventDefault(); select(i);
    });
    select(state.sel[key]);
  }

  /* ---------- home: best sellers + donut ---------- */
  function renderBest() {
    var rows = D.PRODUCTS.map(function (p) { return { p: p, u: cur.byProduct[p.id].units, r: cur.byProduct[p.id].revenue }; })
      .filter(function (r) { return r.u > 0; }).sort(function (a, b) { return b.u - a.u; }).slice(0, 5);
    $('#best').innerHTML = rows.length ? '<div class="rows">' + rows.map(function (r, i) {
      return '<button class="row" data-item="' + r.p.name + '"><span class="rank">' + (i + 1) + '</span><span class="emoji">' + r.p.emoji +
        '</span><span class="row-main"><span class="row-name">' + r.p.name + '</span></span><span class="row-end">' + int(r.u) + ' sold<small>' + money0(r.r) + '</small></span></button>';
    }).join('') + '</div>' : '<p class="muted">No sales yet.</p>';
  }

  function renderDonut() {
    var tot = all.revenue || 1, cum = 0, gap = 0.6;
    var slices = D.CATEGORIES.map(function (c) {
      var pct = all.byCategory[c.id].revenue / tot * 100, len = Math.max(pct - gap, 0);
      var out = '<circle class="slice" cx="21" cy="21" r="15.9155" fill="none" stroke="var(--cat-' + c.id + ')" stroke-width="6" ' +
        'stroke-dasharray="' + len + ' ' + (100 - len) + '" stroke-dashoffset="' + (-cum) + '" style="opacity:' + (state.cat && state.cat !== c.id ? 0.25 : 1) + '"/>';
      cum += pct; return out;
    }).join('');
    var center;
    if (state.cat) {
      var c = catById(state.cat), v = all.byCategory[state.cat].revenue;
      center = '<b>' + money0(v) + '</b><span>' + c.name + ' · ' + Math.round(v / tot * 100) + '%</span>';
    } else { center = '<b>' + money0(all.revenue) + '</b><span>All categories</span>'; }
    var legend = D.CATEGORIES.map(function (c) {
      var v = all.byCategory[c.id].revenue;
      return '<button class="cat-btn" data-cat="' + c.id + '" aria-pressed="' + (state.cat === c.id) + '">' +
        '<span class="dot" style="background:var(--cat-' + c.id + ')"></span><span class="cat-name">' + c.emoji + ' ' + c.name + '</span>' +
        '<span class="cat-val"><b>' + Math.round(v / tot * 100) + '%</b><small>' + money0(v) + '</small></span></button>';
    }).join('');
    $('#donut').innerHTML = '<div class="donut-wrap"><div class="donut"><svg viewBox="0 0 42 42" role="img" aria-label="Sales split by category">' +
      '<circle cx="21" cy="21" r="15.9155" fill="none" stroke="var(--bg)" stroke-width="6"/>' + '<g transform="rotate(-90 21 21)">' + slices + '</g></svg>' +
      '<div class="donut-c">' + center + '</div></div><div class="cat-list">' + legend + '</div></div>';
  }

  /* ---------- sales view ---------- */
  function renderPay() {
    var rows = [['card', 'Card', 'card'], ['cash', 'Cash', 'cash'], ['mobile', 'Mobile pay', 'phone']];
    var tot = cur.pay.card + cur.pay.cash + cur.pay.mobile || 1;
    $('#pay').innerHTML = rows.map(function (r) {
      var v = cur.pay[r[0]], pct = Math.round(v / tot * 100);
      return '<div class="pay-row"><div class="pay-ico">' + ic(r[2], 'i28') + '</div><div class="pay-name">' + r[1] +
        '</div><div class="pay-val">' + pct + '% · ' + money0(v) + '</div><div class="pay-bar"><i style="width:' + pct + '%"></i></div></div>';
    }).join('');
  }
  function renderDays() {
    var p = PERIODS[state.period], to = Math.max(p.to, 6);
    var list = D.query({ cat: state.cat, from: 0, to: to + 1, cutoffDay: 0, cutoffHour: D.LAST_HOUR }).byDay; // oldest -> newest
    var html = '';
    for (var i = list.length - 1; i >= 1; i--) {      // newest first, skip the extra oldest day
      var d = list[i], prevDay = list[i - 1];
      var dl = d.idx === 0 ? '<span class="delta flat">so far today</span>' : deltaHTML(delta(d.revenue, prevDay.revenue), true);
      html += '<div class="day-card"><div><div class="d">' + longDate(d.date) + '</div><div class="row-sub">' + int(d.orders) + ' orders · ' + int(d.items) + ' items</div></div>' +
        '<div class="row-end">' + money(d.revenue) + '<small>' + dl + '</small></div></div>';
    }
    $('#days').innerHTML = html;
  }

  /* ---------- items view ---------- */
  function renderChips() {
    var chips = [{ id: '', label: 'All' }].concat(D.CATEGORIES.map(function (c) { return { id: c.id, label: c.emoji + ' ' + c.name }; }));
    $('#chips').innerHTML = chips.map(function (c) {
      return '<button class="chip" data-cat="' + c.id + '" aria-pressed="' + ((state.cat || '') === c.id) + '">' + c.label + '</button>';
    }).join('');
  }
  function renderItems() {
    var q = state.search.trim().toLowerCase();
    var rows = D.PRODUCTS.filter(function (p) { return (!state.cat || p.cat === state.cat) && (!q || p.name.toLowerCase().indexOf(q) > -1); })
      .map(function (p) { return { p: p, u: cur.byProduct[p.id].units, r: cur.byProduct[p.id].revenue, s: D.stockLeft(p) }; })
      .sort(function (a, b) { return b.u - a.u; });
    $('#itemList').innerHTML = rows.length ? rows.map(function (r) {
      var low = r.s <= 5;
      var badge = '<span class="stock ' + (low ? 'low' : 'ok') + '">' + (low ? ic('alert') : '') + (r.s === 0 ? 'Sold out' : (low ? 'Low stock: ' : 'Stock left: ') + r.s) + '</span>';
      return '<div class="item-card"><span class="emoji">' + r.p.emoji + '</span><div class="row-main"><div class="row-name">' + r.p.name +
        '</div><div class="row-sub">' + catById(r.p.cat).name + ' · ' + money(r.p.price) + '</div>' + badge + '</div>' +
        '<div class="row-end">' + int(r.u) + ' sold<small>' + money0(r.r) + '</small></div></div>';
    }).join('') : '<div class="empty"><img src="assets/logo.jpg" alt=""><p>No items match your search.</p></div>';
  }

  /* ---------- render everything ---------- */
  function renderAll() {
    compute();
    renderHeader(); renderHero(); renderKpis();
    $('#homeChartTitle').textContent = PERIODS[state.period].chart;
    $('#salesChartTitle').textContent = METRIC_NAMES[state.metric] + ' · ' + PERIODS[state.period].label;
    renderChart($('#homeChart'), 'home', 'revenue');
    renderChart($('#salesChart'), 'sales', state.metric);
    renderBest(); renderDonut(); renderPay(); renderDays(); renderChips(); renderItems();
  }

  /* ---------- navigation ---------- */
  function go(view) {
    state.view = view;
    ['home', 'sales', 'items', 'more'].forEach(function (v) { $('#view-' + v).hidden = v !== view; });
    $$('.bottom-nav button').forEach(function (b) { b.setAttribute('aria-current', b.dataset.nav === view ? 'page' : 'false'); });
    $('#controls').hidden = view === 'more';
    try { history.replaceState(null, '', '#' + view); } catch (e) {}
    window.scrollTo(0, 0);
  }

  /* ---------- actions ---------- */
  var toastTimer;
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
  }
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    store.set('theme', theme);
    $('#themeLabel').textContent = 'Dark mode: ' + (theme === 'dark' ? 'on' : 'off');
    $('[data-action="theme"]').setAttribute('aria-pressed', String(theme === 'dark'));
  }
  function exportCSV() {
    var lines, p = state.period;
    if (p === 'today') {
      lines = ['Hour,Revenue,Orders,Items'].concat(cur.byHour.map(function (h) { return [hourRange(h.hour), h.revenue.toFixed(2), h.orders, h.items].join(','); }));
    } else {
      lines = ['Date,Revenue,Orders,Items'].concat(cur.byDay.map(function (d) { return [d.date.toISOString().slice(0, 10), d.revenue.toFixed(2), d.orders, d.items].join(','); }));
    }
    var blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bakery-sales-' + p + '-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    toast('CSV downloaded');
  }
  function share() {
    var t = D.query({ from: 0, to: 0, cutoffDay: 0, cutoffHour: D.LAST_HOUR });
    var text = 'The Bakery Shop — Today: ' + money(t.revenue) + ' from ' + int(t.orders) + ' orders (' + int(t.items) + ' items).';
    if (navigator.share) { navigator.share({ title: 'The Bakery Shop — Today', text: text }).catch(function () {}); }
    else if (navigator.clipboard) { navigator.clipboard.writeText(text).then(function () { toast('Summary copied'); }, function () { toast(text); }); }
    else { toast(text); }
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-nav],[data-period],[data-metric],[data-cat],[data-action],[data-item]');
    if (!el) return;
    if (el.dataset.nav) { e.preventDefault(); go(el.dataset.nav); return; }
    if (el.dataset.period) { state.period = el.dataset.period; store.set('period', state.period); state.sel = {}; renderAll(); return; }
    if (el.dataset.metric) { state.metric = el.dataset.metric; state.sel = {}; renderAll(); return; }
    if (el.dataset.item) { state.search = el.dataset.item; $('#search').value = state.search; renderItems(); go('items'); return; }
    if (el.hasAttribute('data-cat')) {
      var c = el.dataset.cat;
      state.cat = (c === '' || state.cat === c) ? null : c;
      renderAll(); return;
    }
    switch (el.dataset.action) {
      case 'table': state.tables[el.dataset.id] = !state.tables[el.dataset.id]; renderAll(); break;
      case 'refresh':
        state.updated = new Date(); renderAll();
        el.classList.add('spin'); setTimeout(function () { el.classList.remove('spin'); }, 700);
        toast('Up to date'); break;
      case 'export': exportCSV(); break;
      case 'share': share(); break;
      case 'theme': setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); break;
    }
  });
  $('#search').addEventListener('input', function (e) { state.search = e.target.value; renderItems(); });

  /* ---------- start ---------- */
  var savedTheme = store.get('theme', null);
  setTheme(savedTheme || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  renderAll();
  var start = (location.hash || '#home').slice(1);
  go(['home', 'sales', 'items', 'more'].indexOf(start) > -1 ? start : 'home');
})();
