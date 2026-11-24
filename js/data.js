/* Sample data for The Bakery Shop dashboard.
   Generated in the browser with a seeded random generator, so the numbers are
   stable for a given calendar day. Replace with a real data source later. */
(function () {
  'use strict';

  var CATEGORIES = [
    { id: 'bread',  name: 'Breads',   emoji: '🍞' },
    { id: 'pastry', name: 'Pastries', emoji: '🥐' },
    { id: 'cake',   name: 'Cakes',    emoji: '🍰' },
    { id: 'cookie', name: 'Cookies',  emoji: '🍪' },
    { id: 'drink',  name: 'Drinks',   emoji: '☕' }
  ];

  // daily = typical full-day units at a normal weekday (before SCALE)
  var PRODUCTS = [
    { id: 'sourdough', name: 'Sourdough loaf',    cat: 'bread',  emoji: '🍞', price: 7.00, daily: 45 },
    { id: 'baguette',  name: 'Baguette',          cat: 'bread',  emoji: '🥖', price: 3.25, daily: 40 },
    { id: 'wheat',     name: 'Whole wheat loaf',  cat: 'bread',  emoji: '🍞', price: 6.00, daily: 25 },
    { id: 'croissant', name: 'Butter croissant',  cat: 'pastry', emoji: '🥐', price: 3.50, daily: 90 },
    { id: 'painchoc',  name: 'Pain au chocolat',  cat: 'pastry', emoji: '🥐', price: 4.00, daily: 50 },
    { id: 'cinnamon',  name: 'Cinnamon roll',     cat: 'pastry', emoji: '🌀', price: 4.00, daily: 40 },
    { id: 'muffin',    name: 'Blueberry muffin',  cat: 'pastry', emoji: '🫐', price: 3.75, daily: 35 },
    { id: 'cupcake',   name: 'Chocolate cupcake', cat: 'cake',   emoji: '🧁', price: 3.00, daily: 40 },
    { id: 'slice',     name: 'Birthday cake slice', cat: 'cake', emoji: '🍰', price: 5.50, daily: 30 },
    { id: 'cheese',    name: 'Cheesecake slice',  cat: 'cake',   emoji: '🍰', price: 5.75, daily: 25 },
    { id: 'oat',       name: 'Oat cookie',        cat: 'cookie', emoji: '🍪', price: 2.00, daily: 35 },
    { id: 'chip',      name: 'Choc chip cookie',  cat: 'cookie', emoji: '🍪', price: 2.25, daily: 40 },
    { id: 'latte',     name: 'Latte',             cat: 'drink',  emoji: '☕', price: 4.50, daily: 70 },
    { id: 'hotchoc',   name: 'Hot chocolate',     cat: 'drink',  emoji: '🍫', price: 4.25, daily: 30 },
    { id: 'oj',        name: 'Orange juice',      cat: 'drink',  emoji: '🍊', price: 3.75, daily: 25 }
  ];

  var FIRST_HOUR = 6;                       // shop opens 6 AM
  var HOURS = [];
  for (var h = 0; h < 12; h++) HOURS.push(FIRST_HOUR + h);   // 6 AM .. 5 PM slots
  var HOUR_WEIGHT = [0.6, 1.6, 1.4, 0.9, 0.7, 1.0, 1.4, 1.0, 0.7, 0.7, 0.8, 0.5];
  var WSUM = HOUR_WEIGHT.reduce(function (a, b) { return a + b; }, 0);
  var DAY_FACTOR = [1.25, 0.85, 0.95, 1.0, 1.0, 1.1, 1.3];  // Sun..Sat
  var SCALE = 0.6;
  var NUM_DAYS = 60;

  var now = new Date();
  // So the demo always has something to show, "now" is kept between 9 AM and 5 PM.
  var LAST_HOUR = Math.min(17, Math.max(9, now.getHours()));

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var DAYS = [];                            // DAYS[0] = today, DAYS[1] = yesterday, ...
  for (var i = 0; i < NUM_DAYS; i++) {
    var date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    var rnd = mulberry32(date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate());
    var dayF = DAY_FACTOR[date.getDay()] * (0.92 + rnd() * 0.16) * (1 - i * 0.0015);
    var hours = [];
    for (var hi = 0; hi < HOURS.length; hi++) {
      var units = {};
      for (var pi = 0; pi < PRODUCTS.length; pi++) {
        var p = PRODUCTS[pi];
        var u = Math.max(0, Math.round(p.daily * SCALE * HOUR_WEIGHT[hi] / WSUM * dayF * (0.8 + rnd() * 0.4)));
        if (i === 0 && HOURS[hi] > LAST_HOUR) u = 0;   // hours that have not happened yet today
        units[p.id] = u;
      }
      hours.push({ units: units, ratio: 2.3 + rnd() * 0.6 });
    }
    var card = 0.5 + rnd() * 0.1, cash = 0.2 + rnd() * 0.1;
    DAYS.push({ idx: i, date: date, hours: hours, pay: { card: card, cash: cash, mobile: 1 - card - cash } });
  }

  /* query({from,to,cat,cutoffDay,cutoffHour})
     Totals for days from..to (0 = today). On day `cutoffDay`, hours after
     `cutoffHour` are ignored, so "today so far" is compared fairly with a full
     earlier day. Days come back oldest -> newest. */
  function query(opts) {
    opts = opts || {};
    var from = opts.from || 0, to = Math.min(opts.to || 0, NUM_DAYS - 1);
    var cat = opts.cat || null;
    var cutoffDay = opts.cutoffDay == null ? -1 : opts.cutoffDay;
    var cutoffHour = opts.cutoffHour == null ? LAST_HOUR : opts.cutoffHour;

    var out = {
      revenue: 0, orders: 0, items: 0,
      byProduct: {}, byCategory: {}, byDay: [], pay: { card: 0, cash: 0, mobile: 0 },
      byHour: HOURS.map(function (hr) { return { hour: hr, revenue: 0, orders: 0, items: 0 }; })
    };
    PRODUCTS.forEach(function (p) { out.byProduct[p.id] = { units: 0, revenue: 0 }; });
    CATEGORIES.forEach(function (c) { out.byCategory[c.id] = { units: 0, revenue: 0 }; });

    for (var d = to; d >= from; d--) {
      var day = DAYS[d];
      var tot = { idx: d, date: day.date, revenue: 0, orders: 0, items: 0 };
      for (var hi = 0; hi < HOURS.length; hi++) {
        if (d === cutoffDay && HOURS[hi] > cutoffHour) continue;
        var hr = day.hours[hi], units = 0, rev = 0;
        for (var pi = 0; pi < PRODUCTS.length; pi++) {
          var p = PRODUCTS[pi];
          if (cat && p.cat !== cat) continue;
          var u = hr.units[p.id];
          if (!u) continue;
          units += u; rev += u * p.price;
          out.byProduct[p.id].units += u; out.byProduct[p.id].revenue += u * p.price;
          out.byCategory[p.cat].units += u; out.byCategory[p.cat].revenue += u * p.price;
        }
        var orders = units > 0 ? Math.max(1, Math.round(units / hr.ratio)) : 0;
        out.byHour[hi].revenue += rev; out.byHour[hi].orders += orders; out.byHour[hi].items += units;
        tot.revenue += rev; tot.orders += orders; tot.items += units;
      }
      out.pay.card += tot.revenue * day.pay.card;
      out.pay.cash += tot.revenue * day.pay.cash;
      out.pay.mobile += tot.revenue * day.pay.mobile;
      out.revenue += tot.revenue; out.orders += tot.orders; out.items += tot.items;
      out.byDay.push(tot);
    }
    return out;
  }

  function startStock(p) { return Math.round(p.daily * SCALE * 1.1); }
  function stockLeft(p) {
    var sold = 0;
    DAYS[0].hours.forEach(function (hr) { sold += hr.units[p.id]; });
    return Math.max(0, startStock(p) - sold);
  }

  window.BakeryData = {
    CATEGORIES: CATEGORIES, PRODUCTS: PRODUCTS, HOURS: HOURS, LAST_HOUR: LAST_HOUR,
    NUM_DAYS: NUM_DAYS, DAYS: DAYS, query: query, stockLeft: stockLeft
  };
})();
