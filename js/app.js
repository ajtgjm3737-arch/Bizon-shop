/* BIZON POWER — Telegram Mini App. Без сборки и зависимостей. */
(function () {
  'use strict';

  var tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  var CFG = window.BIZON_CONFIG;
  var PRODUCTS = window.BIZON_PRODUCTS;
  var CATS = window.BIZON_CATEGORIES;
  var BRANDS = window.BIZON_BRANDS;
  var GOALS = window.BIZON_CONFIG.GOALS || [];
  function fitsGoal(p) {
    if (ui.goal === 'all') return true;
    if (p.goals) return p.goals.indexOf(ui.goal) >= 0;
    var g = GOALS.filter(function (x) { return x.id === ui.goal; })[0];
    return !!g && g.cats.indexOf(p.cat) >= 0;
  }
  var KB = window.BIZON_KB;
  var KB_GROUPS = window.BIZON_KB_GROUPS;

  var byId = {}; PRODUCTS.forEach(function (p) { byId[p.id] = p; });
  var kbById = {}; KB.forEach(function (a) { kbById[a.id] = a; });
  var catById = {}; CATS.forEach(function (c) { catById[c.id] = c; });

  var $ = function (id) { return document.getElementById(id); };
  var elBar = $('bar'), elView = $('view'), elNav = $('nav'), elSheet = $('sheet'), elToast = $('toast'), elTop = $('totop');

  /* ---------- Состояние ---------- */
  var STORE_KEY = 'bizon:v1';
  var state = {
    cart: {}, fav: [], orders: [], stack: [], log: {}, promo: '',
    form: { name: '', phone: '', delivery: CFG.DELIVERY[0].id, city: '', address: '', point: '', comment: '' }
  };
  try {
    var saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      Object.keys(state).forEach(function (k) { if (saved[k] != null) state[k] = saved[k]; });
      state.form = Object.assign({ name: '', phone: '', delivery: CFG.DELIVERY[0].id, city: '', address: '', point: '', comment: '' }, saved.form || {});
    }
  } catch (e) { /* хранилище недоступно — работаем без сохранения */ }
  Object.keys(state.cart).forEach(function (id) { if (!byId[id] || byId[id].stock === false || !byId[id].price) delete state.cart[id]; });
  if (!CFG.PROMO_CODES[state.promo]) state.promo = '';

  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }

  var ui = { tab: 'catalog', sub: null, goal: 'all', kbGroup: 'all', day: dayKey(new Date()), sheet: null, scroll: {}, errors: {}, promoInput: '', promoErr: '', sending: false };

  /* ---------- Утилиты ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function rub(n) { return Math.round(n).toLocaleString('ru-RU') + ' ₽'; }
  function plural(n, f) {
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return f[2];
    if (b > 1 && b < 5) return f[1];
    if (b === 1) return f[0];
    return f[2];
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function dayKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function fromKey(k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
  function addDays(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function haptic(kind) {
    try {
      if (!tg || !tg.HapticFeedback) return;
      if (kind === 'ok') tg.HapticFeedback.notificationOccurred('success');
      else if (kind === 'bad') tg.HapticFeedback.notificationOccurred('error');
      else tg.HapticFeedback.impactOccurred('light');
    } catch (e) { /* старая версия Telegram */ }
  }
  var toastTimer;
  function toast(text) {
    elToast.textContent = text;
    elToast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { elToast.classList.remove('is-on'); }, 1900);
  }
  function openLink(url) {
    try { if (tg && tg.initData && tg.openLink) { tg.openLink(url); return; } } catch (e) { /* fallthrough */ }
    window.open(url, '_blank', 'noopener');
  }
  function openTg(url) {
    try { if (tg && tg.initData && tg.openTelegramLink) { tg.openTelegramLink(url); return; } } catch (e) { /* fallthrough */ }
    window.open(url, '_blank', 'noopener');
  }

  /* ---------- Иконки ---------- */
  function ic(d, extra) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (extra || '') + '>' + d + '</svg>';
  }
  var I = {
    grid: ic('<rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/>'),
    bag: ic('<path d="M5 8h14l-1 11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>'),
    pulse: ic('<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M7 12.5h2.2l1.8-4 2.2 7 1.6-3H17"/>'),
    book: ic('<path d="M12 6.5c-1.6-1.3-3.8-2-6.5-2H3.5v13h2c2.7 0 4.9.7 6.5 2 1.6-1.3 3.8-2 6.5-2h2v-13h-2c-2.7 0-4.9.7-6.5 2z"/><path d="M12 6.5v13"/>'),
    user: ic('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="10" r="3"/><path d="M6.5 18.3c1.2-2 3.2-3.1 5.5-3.1s4.3 1.1 5.5 3.1"/>'),
    search: ic('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>'),
    menu: ic('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    plus: ic('<path d="M12 5v14M5 12h14"/>', ' stroke-width="2.2"'),
    minus: ic('<path d="M5 12h14"/>', ' stroke-width="2.2"'),
    x: ic('<path d="M6 6l12 12M18 6L6 18"/>'),
    check: ic('<path d="M5 12.5l4.5 4.5L19 7.5"/>', ' stroke-width="2.6"'),
    right: ic('<path d="M9 5l7 7-7 7"/>'),
    left: ic('<path d="M15 5l-7 7 7 7"/>'),
    up: ic('<path d="M5 15l7-7 7 7"/>'),
    heart: ic('<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z"/>'),
    flame: ic('<path d="M12 21c3.9 0 6.5-2.6 6.5-6.2 0-3-1.8-4.800-3-6.300-.3 1.7-1.100 2.600-2 3 .2-3.200-1-6.100-3.500-8 .2 3.200-1.300 5.100-2.600 6.900C6.300 12 5.500 13.300 5.500 14.800 5.500 18.400 8.100 21 12 21z"/>'),
    box: ic('<path d="M12 3l8 4.500v9L12 21l-8-4.500v-9z"/><path d="M4 7.500l8 4.500 8-4.500M12 12v9"/>'),
    layers: ic('<path d="M12 4l8.500 4.500L12 13 3.500 8.500z"/><path d="M3.500 12.500L12 17l8.500-4.500M3.500 16.500L12 21l8.500-4.500"/>'),
    chat: ic('<path d="M20 12a8 8 0 0 1-11.800 7L4 20l1.100-4A8 8 0 1 1 20 12z"/>'),
    info: ic('<circle cx="12" cy="12" r="8.500"/><path d="M12 11v5.500M12 7.800v.2"/>'),
    trash: ic('<path d="M5 7h14M10 7V5h4v2M7 7l.800 12h8.400L17 7"/>'),
    ext: ic('<path d="M10 5H5v14h14v-5M14 4h6v6M20 4l-9 9"/>')
  };

  /* ---------- Рисунок упаковки ---------- */
  function pack(p) {
    if (p.img) return '<img src="' + esc(p.img) + '" alt="" loading="lazy">';
    var body = '#0c0a09', edge = 'rgba(237,230,208,.16)', lid = '#241e1a';
    var s, bx, bw, top;
    if (p.pack === 'tub') {
      bx = 29; bw = 62; top = 30;
      s = '<rect x="33" y="17" width="54" height="13" rx="4" fill="' + lid + '" stroke="' + edge + '"/><rect x="29" y="30" width="62" height="74" rx="9" fill="' + body + '" stroke="' + edge + '"/>';
    } else if (p.pack === 'bag') {
      bx = 27; bw = 66; top = 24;
      s = '<path d="M29 22h62l3 78a6 6 0 0 1-6 6H32a6 6 0 0 1-6-6z" fill="' + body + '" stroke="' + edge + '"/><rect x="29" y="15" width="62" height="9" rx="2.500" fill="' + lid + '" stroke="' + edge + '"/>';
    } else if (p.pack === 'bottle') {
      bx = 43; bw = 34; top = 40;
      s = '<rect x="51" y="11" width="18" height="11" rx="3" fill="' + lid + '" stroke="' + edge + '"/><path d="M53 22h14v5c0 5 10 6 10 15v56a7 7 0 0 1-7 7H50a7 7 0 0 1-7-7V42c0-9 10-10 10-15z" fill="' + body + '" stroke="' + edge + '"/>';
    } else {
      bx = 37; bw = 46; top = 30;
      s = '<rect x="43" y="17" width="34" height="13" rx="3.500" fill="' + lid + '" stroke="' + edge + '"/><rect x="37" y="30" width="46" height="74" rx="10" fill="' + body + '" stroke="' + edge + '"/>';
    }
    var tag = { on: 'OPTIMUM', sc: 'SCITEC', now: 'NOW' }[p.brand] || '';
    var lines = p.label && p.label.length ? p.label : [p.name.split(' ')[0].toUpperCase()];
    var fs = p.pack === 'tub' || p.pack === 'bag' ? 12 : 10.500;
    var maxW = bw - 10;
    var y0 = top + (lines.length > 1 ? 44 : 50);
    var t = '<rect x="' + (bx + 0.500) + '" y="' + (top + 16) + '" width="' + (bw - 1) + '" height="2.400" fill="#d8c39a"/>' +
      '<text x="60" y="' + (top + 30) + '" text-anchor="middle" font-size="5.200" letter-spacing="1.300" fill="#8f8676">' + tag + '</text>';
    lines.forEach(function (ln, i) {
      var est = ln.length * fs * 0.540;
      t += '<text x="60" y="' + (y0 + i * (fs + 2)) + '" text-anchor="middle" font-size="' + fs + '" font-weight="600" fill="#ede6d0"' +
        (est > maxW ? ' textLength="' + maxW + '" lengthAdjust="spacingAndGlyphs"' : ' letter-spacing=".400"') + '>' + esc(ln) + '</text>';
    });
    return '<svg class="pack" viewBox="0 0 120 120" role="img" aria-label="' + esc(p.name) + '">' + s + t + '</svg>';
  }

  /* ---------- Корзина: расчёты ---------- */
  function cartLines() {
    return Object.keys(state.cart).map(function (id) { return { p: byId[id], qty: state.cart[id] }; })
      .filter(function (l) { return l.p && l.qty > 0; });
  }
  function totals() {
    var lines = cartLines(), subtotal = 0, count = 0;
    lines.forEach(function (l) { subtotal += l.p.price * l.qty; count += l.qty; });
    var pct = CFG.PROMO_CODES[state.promo] || 0;
    var discount = Math.round(subtotal * pct / 100);
    return { lines: lines, subtotal: subtotal, count: count, pct: pct, discount: discount, total: subtotal - discount };
  }
  function setQty(id, qty) {
    if (qty <= 0) delete state.cart[id]; else state.cart[id] = Math.min(qty, 99);
    save();
  }

  /* ---------- Общие куски разметки ---------- */
  function askUrl(p) { return 'https://t.me/' + CFG.MANAGER_USERNAME + '?text=' + encodeURIComponent('Здравствуйте! Сколько стоит ' + p.name + ' (' + BRANDS[p.brand] + ', ' + p.size + ')?'); }
  function waitUrl(p) { return 'https://t.me/' + CFG.MANAGER_USERNAME + '?text=' + encodeURIComponent('Здравствуйте! Напишите, когда появится ' + p.name + ' (' + BRANDS[p.brand] + ', ' + p.size + ').'); }
  function price(p) { return p.price ? rub(p.price) : '<small class="price__ask">Цена у менеджера</small>'; }
  function buyCtl(p, dark) {
    if (p.stock === false) return '';
    if (!p.price) return '<button class="plus" data-act="link" data-id="' + esc(askUrl(p)) + '" aria-label="Узнать цену">?</button>';
    var q = state.cart[p.id] || 0;
    if (!q) return '<button class="plus" data-act="add" data-id="' + p.id + '" aria-label="Добавить в корзину">' + I.plus + '</button>';
    return '<span class="step' + (dark ? ' step--dark' : '') + '">' +
      '<button data-act="dec" data-id="' + p.id + '" aria-label="Убрать одну">' + I.minus + '</button><b>' + q + '</b>' +
      '<button data-act="inc" data-id="' + p.id + '" aria-label="Добавить ещё">' + I.plus + '</button></span>';
  }
  function card(p) {
    var fav = state.fav.indexOf(p.id) >= 0;
    return '<article class="card' + (p.stock === false ? ' is-out' : '') + '" data-act="product" data-id="' + p.id + '">' +
      '<div class="card__img">' + pack(p) +
        (p.stock === false ? '<span class="out">Нет в наличии</span>' : '') +
        '<button class="heart' + (fav ? ' is-on' : '') + '" data-act="fav" data-id="' + p.id + '" aria-label="' + (fav ? 'Убрать из избранного' : 'В избранное') + '">' + I.heart + '</button>' +
      '</div>' +
      '<h3 class="card__name">' + esc(p.name) + '</h3>' +
      '<p class="card__brand">' + esc(BRANDS[p.brand]) + '</p>' +
      '<p class="card__size">' + esc(p.size) + '</p>' +
      '<div class="card__foot"><span class="price">' + price(p) + '</span>' + buyCtl(p) + '</div>' +
    '</article>';
  }
  function evBars(ev) { return '<span class="ev ev--' + ev + '" aria-hidden="true"><i></i><i></i><i></i></span>'; }
  var EV = {
    A: { name: 'высокая', text: 'эффект подтверждён метаанализами' },
    B: { name: 'средняя', text: 'эффект есть, но скромный или зависит от условий' },
    C: { name: 'слабая', text: 'данные слабые или противоречивые' }
  };
  function empty(icon, text, btnText, act, id) {
    return '<div class="empty">' + icon + '<p>' + text + '</p>' +
      (btnText ? '<button class="btn" data-act="' + act + '"' + (id ? ' data-id="' + id + '"' : '') + '>' + btnText + '</button>' : '') + '</div>';
  }
  function backBtn(text) { return '<button class="back" data-act="back">' + I.left + esc(text) + '</button>'; }

  /* ---------- Экран: каталог ---------- */
  function viewCatalog() {
    var h = '<section class="hero"><div class="hero__text">' +
      '<h1 class="hero__h">Только оригинальный товар</h1>' +
      '<p class="hero__p">Проверяем каждую партию и расскажем про каждую добавку — по исследованиям.</p>' +
      '</div></section>';
    h += '<div class="chips">' + chip('goal', 'all', 'Все', ui.goal);
    GOALS.forEach(function (g) { h += chip('goal', g.id, g.title, ui.goal); });
    h += '</div>';
    CATS.forEach(function (c) {
      var list = PRODUCTS.filter(function (p) { return p.cat === c.id && fitsGoal(p); });
      if (!list.length) return;
      h += '<section class="cat" id="cat-' + c.id + '"><h2 class="cat__h">' + esc(c.title) + '</h2><p class="cat__p">' + esc(c.text) + '</p>' +
        '<div class="grid">' + list.map(card).join('') + '</div></section>';
    });
    return h;
  }
  function chip(act, id, text, cur) {
    return '<button class="chip' + (cur === id ? ' is-on' : '') + '" data-act="' + act + '" data-id="' + id + '">' + esc(text) + '</button>';
  }

  /* ---------- Экран: корзина ---------- */
  function curDelivery() { return CFG.DELIVERY.filter(function (d) { return d.id === state.form.delivery; })[0] || CFG.DELIVERY[0]; }
  function isLocal() { return !!curDelivery().local; }
  function field(key, label, attrs, value) {
    var err = ui.errors[key];
    return '<div class="field' + (err ? ' is-bad' : '') + '" id="f-' + key + '"><label for="i-' + key + '">' + label + '</label>' +
      '<input class="input" id="i-' + key + '" data-f="' + key + '" value="' + esc(value) + '" ' + attrs + '>' +
      (err ? '<p class="field__err">' + err + '</p>' : '') + '</div>';
  }
  function viewCart() {
    if (ui.sub && ui.sub.type === 'done') return viewDone(ui.sub);
    var t = totals();
    var h = '<h1 class="title">Корзина</h1>';
    if (!t.lines.length) {
      return h + empty(I.bag, 'В корзине пусто. Добавьте первую банку из каталога, и здесь появится оформление заказа.', 'Перейти в каталог', 'tab', 'catalog');
    }
    h += '<p class="title-note">' + t.count + ' ' + plural(t.count, ['товар', 'товара', 'товаров']) + ' на ' + rub(t.subtotal) + '</p>';
    h += '<div class="lines">' + t.lines.map(function (l) {
      return '<div class="line"><div class="line__main" data-act="product" data-id="' + l.p.id + '">' +
        '<p class="line__name">' + esc(l.p.name) + '</p>' +
        '<p class="line__meta">' + esc(BRANDS[l.p.brand]) + ', ' + esc(l.p.size) + '. ' + rub(l.p.price) + ' × ' + l.qty + ' = ' + rub(l.p.price * l.qty) + '</p>' +
        '</div>' + buyCtl(l.p, true) + '</div>';
    }).join('') + '</div>';

    var free = CFG.FREE_DELIVERY_FROM;
    var pickup = curDelivery().id === 'pickup';
    if (free > 0 && !pickup) {
      var left = free - t.total;
      h += '<div class="progress"><div class="progress__track"><div class="progress__fill" style="width:' + Math.min(100, Math.round(t.total / free * 100)) + '%"></div></div>' +
        '<p class="progress__note">' + (left > 0 ? 'До бесплатной доставки осталось <b>' + rub(left) + '</b>' : '<b>Доставка бесплатная</b>') + '</p></div>';
    }

    var f = state.form;
    h += '<div class="form">' +
      (isLocal() ? field('name', 'Имя', 'placeholder="Как к вам обращаться" autocomplete="given-name" enterkeyhint="next"', f.name)
        : field('name', 'Фамилия и имя получателя', 'placeholder="Иванов Иван" autocomplete="name" enterkeyhint="next"', f.name)) +
      field('phone', 'Телефон', 'placeholder="+7 (___) ___-__-__" inputmode="tel" autocomplete="tel" enterkeyhint="next"', f.phone) +
      '<div class="field"><span class="field__label">Способ доставки</span><div class="seg">' +
        CFG.DELIVERY.map(function (d) { return '<button class="' + (f.delivery === d.id ? 'is-on' : '') + '" data-act="delivery" data-id="' + d.id + '">' + esc(d.title) + '</button>'; }).join('') +
      '</div></div>' +
      (curDelivery().id === 'pickup' ? '<p class="field__note">' + esc(curDelivery().note || '') + '</p>'
        : curDelivery().id === 'courier' ? '<p class="field__note">' + esc(curDelivery().note || '') + '</p>' + field('address', 'Адрес доставки', 'placeholder="Каспийск или Махачкала, улица, дом" autocomplete="street-address" enterkeyhint="next"', f.address)
        : field('city', 'Город', 'placeholder="Например: Махачкала" autocomplete="address-level2" enterkeyhint="next"', f.city) +
          (curDelivery().id === 'post'
            ? field('point', 'Адрес и индекс', 'placeholder="Улица, дом, квартира, индекс" autocomplete="street-address" enterkeyhint="next"', f.point || '')
            : field('point', 'Пункт выдачи СДЭК', 'placeholder="Адрес пункта или «ближайший»" enterkeyhint="next"', f.point || ''))) +
      '<div class="field"><label for="i-comment">Комментарий</label><textarea class="input" id="i-comment" data-f="comment" rows="2" placeholder="Вкус протеина, время для звонка">' + esc(f.comment) + '</textarea></div>';
    if (Object.keys(CFG.PROMO_CODES).length) {
      h += '<div class="field' + (ui.promoErr ? ' is-bad' : '') + '"><label for="promo">Промокод</label><div class="promo">' +
        '<input class="input" id="promo" value="' + esc(state.promo || ui.promoInput) + '" placeholder="Если есть" autocapitalize="characters" autocomplete="off">' +
        '<button data-act="promo">' + (state.promo ? 'Убрать' : 'Применить') + '</button></div>' +
        (ui.promoErr ? '<p class="field__err">' + ui.promoErr + '</p>' : '') + '</div>';
    }
    h += '</div>';

    h += '<div class="sum">' +
      '<div class="sum__row"><span>Товары, ' + t.count + ' шт.</span><b>' + rub(t.subtotal) + '</b></div>' +
      (t.discount ? '<div class="sum__row"><span>Скидка ' + t.pct + '% по промокоду</span><b>−' + rub(t.discount) + '</b></div>' : '') +
      '<div class="sum__row"><span>Доставка</span><b>' + (pickup ? 'Не нужна' : free > 0 && t.total >= free ? 'Бесплатно' : 'Рассчитает менеджер') + '</b></div>' +
      '<div class="sum__row sum__row--total"><span>Итого</span><b>' + rub(t.total) + '</b></div></div>' +
      '<p class="fine">Оплата не списывается. После оформления менеджер напишет вам, подтвердит наличие и итоговую сумму.</p>' +
      '<button class="btn btn--amber" data-act="order"' + (ui.sending ? ' disabled' : '') + '>' + (ui.sending ? 'Отправляем заказ' : 'Оформить заказ') + '</button>';
    return h;
  }
  function viewDone(d) {
    var h = '<div class="done">' + ic('<circle cx="12" cy="12" r="9"/><path d="M8 12.300l2.800 2.800L16 9.600"/>', ' class="done__ic"') +
      '<h1 class="done__h">Заказ оформлен</h1><p class="done__id">' + esc(d.id) + '</p>';
    if (d.mode === 'api') h += '<p>Мы получили заказ. Менеджер напишет вам в Telegram, чтобы подтвердить наличие, доставку и оплату.</p>';
    else if (d.mode === 'manager') h += '<p>Остался один шаг: отправьте менеджеру сообщение с заказом. Чат с готовым текстом уже открылся — нажмите в нём «Отправить».</p>' +
      '<button class="btn btn--amber" data-act="resend" data-id="' + esc(d.id) + '">Открыть чат с менеджером</button>';
    else h += '<p>Заказ сохранён в разделе «Мои заказы».</p><div class="note">Демо-режим: сервер бота не подключён, поэтому заказ сохранён только на этом устройстве и никому не отправлен.</div>';
    h += '<button class="btn' + (d.mode === 'manager' ? ' btn--ghost' : '') + '" data-act="tab" data-id="catalog">Вернуться в каталог</button>' +
      '<button class="btn btn--ghost" data-act="sub" data-id="orders">Мои заказы</button></div>';
    return h;
  }

  /* ---------- Экран: трекер ---------- */
  function takenOn(k) {
    var ids = state.stack.map(function (s) { return s.id; });
    return (state.log[k] || []).filter(function (id) { return ids.indexOf(id) >= 0; });
  }
  function streaks() {
    var has = function (k) { return (state.log[k] || []).length > 0; };
    var keys = Object.keys(state.log).filter(has).sort();
    var best = 0, run = 0, prev = null, total = 0;
    keys.forEach(function (k) {
      total += state.log[k].length;
      run = prev && dayKey(addDays(fromKey(prev), 1)) === k ? run + 1 : 1;
      if (run > best) best = run;
      prev = k;
    });
    var d = new Date(), cur = 0;
    if (!has(dayKey(d))) d = addDays(d, -1);
    while (has(dayKey(d))) { cur++; d = addDays(d, -1); }
    return { cur: cur, best: best, total: total };
  }
  function viewTracker() {
    var sel = fromKey(ui.day), today = dayKey(new Date());
    var monday = addDays(sel, -((sel.getDay() + 6) % 7));
    var names = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    var st = streaks();
    var h = '<h1 class="title">Трекер</h1><p class="title-note">' + cap(sel.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })) + '</p>';
    h += '<div class="week"><button class="week__nav" data-act="week" data-id="-7" aria-label="Предыдущая неделя">' + I.left + '</button>';
    for (var i = 0; i < 7; i++) {
      var d = addDays(monday, i), k = dayKey(d);
      var cls = 'day' + (k === ui.day ? ' is-on' : '') + (k === today ? ' is-today' : '') + (k > today ? ' is-future' : '') + (takenOn(k).length ? ' has' : '');
      h += '<button class="' + cls + '" data-act="day" data-id="' + k + '"' + (k > today ? ' disabled' : '') + '><small>' + names[i] + '</small><b>' + d.getDate() + '</b><i></i></button>';
    }
    h += '<button class="week__nav" data-act="week" data-id="7" aria-label="Следующая неделя"' + (dayKey(addDays(monday, 7)) > today ? ' disabled style="opacity:.3"' : '') + '>' + I.right + '</button></div>';
    h += '<div class="streak">' + I.flame + '<div><div class="streak__n">' + st.cur + '</div><div class="streak__l">' + plural(st.cur, ['день', 'дня', 'дней']) + ' подряд</div></div>' +
      '<div class="streak__side">Лучшая серия: <b>' + st.best + '</b><br>Всего приёмов: <b>' + st.total + '</b></div></div>';
    if (!state.stack.length) {
      return h + empty(I.layers, 'Добавьте добавки, которые принимаете. Отмечайте приёмы каждый день, чтобы не сбивать курс.', 'Добавить добавку', 'stack-new');
    }
    var done = state.log[ui.day] || [];
    h += '<div class="takes">' + state.stack.map(function (s) {
      var on = done.indexOf(s.id) >= 0;
      var meta = [s.dose, s.time].filter(Boolean).join(', ');
      return '<div class="take' + (on ? ' is-done' : '') + '" data-act="take" data-id="' + s.id + '" role="checkbox" aria-checked="' + on + '" tabindex="0">' +
        '<span class="take__check">' + I.check + '</span><span class="take__main"><span class="take__name">' + esc(s.name) + '</span>' +
        (meta ? '<br><span class="take__meta">' + esc(meta) + '</span>' : '') + '</span>' +
        '<button class="take__del" data-act="stack-del" data-id="' + s.id + '" aria-label="Удалить из трекера">' + I.trash + '</button></div>';
    }).join('') + '</div>';
    h += '<button class="fab" data-act="stack-new" aria-label="Добавить добавку">' + I.plus + '</button>';
    return h;
  }

  /* ---------- Экран: база знаний ---------- */
  function viewKb() {
    if (ui.sub && ui.sub.type === 'article') return viewArticle(kbById[ui.sub.id]);
    var h = '<h1 class="title">База знаний</h1><p class="title-note">Для чего нужна каждая добавка и что о ней говорят исследования.</p>';
    h += '<div class="chips">' + chip('kbg', 'all', 'Все', ui.kbGroup) + KB_GROUPS.map(function (g) { return chip('kbg', g.id, g.title, ui.kbGroup); }).join('') + '</div>';
    h += '<div class="kb-list">';
    KB_GROUPS.forEach(function (g) {
      if (ui.kbGroup !== 'all' && ui.kbGroup !== g.id) return;
      var list = KB.filter(function (a) { return a.group === g.id; }).sort(function (a, b) { return a.title.localeCompare(b.title, 'ru'); });
      if (ui.kbGroup === 'all') h += '<div class="kb-group">' + esc(g.title) + '</div>';
      h += list.map(kbRow).join('');
    });
    h += '</div><p class="disclaimer">Три столбика у названия — уровень доказательности: три зелёных — эффект подтверждён метаанализами, два янтарных — эффект скромный, один — данные слабые.</p>';
    return h;
  }
  function kbRow(a) {
    return '<button class="kb-row" data-act="article" data-id="' + a.id + '">' + evBars(a.ev) +
      '<span class="kb-row__main"><span class="kb-row__t">' + esc(a.title) + '</span><br><span class="kb-row__s">' + esc(a.short) + '</span></span>' + I.right + '</button>';
  }
  function viewArticle(a) {
    if (!a) return '';
    var rel = PRODUCTS.filter(function (p) { return p.kb === a.id; });
    var h = '<article class="art">' + backBtn('База знаний') +
      '<h1 class="art__h">' + esc(a.title) + '</h1>' +
      '<div class="art__ev">' + evBars(a.ev) + '<span>Доказательность <b>' + EV[a.ev].name + '</b>: ' + EV[a.ev].text + '</span></div>' +
      '<p class="art__lead">' + esc(a.short) + '</p>' +
      '<h2>Для чего</h2><ul class="bul">' + a.forWhat.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '<h2>Как работает</h2><p class="art__p">' + esc(a.how) + '</p>' +
      '<h2>Как принимать</h2><dl class="facts"><div class="fact"><dt>Сколько</dt><dd>' + esc(a.dose) + '</dd></div><div class="fact"><dt>Когда</dt><dd>' + esc(a.when) + '</dd></div></dl>' +
      '<h2>Важно знать</h2><div class="note">' + esc(a.caution) + '</div>' +
      '<h2>' + (a.studies.length > 1 ? 'Исследования' : 'Исследование') + '</h2>' +
      a.studies.map(function (s) {
        return '<div class="study"><p class="study__f">' + esc(s.finding) + '</p><p class="study__r">' + esc(s.ref) + '</p>' +
          '<button class="link" data-act="link" data-id="https://doi.org/' + esc(s.doi) + '">Открыть публикацию ' + I.ext + '</button></div>';
      }).join('');
    if (rel.length) h += '<h2>В каталоге</h2><div class="shelf">' + rel.map(card).join('') + '</div>';
    h += '<button class="btn btn--ghost" data-act="stack-new" data-id="' + a.id + '">Добавить в трекер</button>' +
      '<p class="disclaimer">Материал носит справочный характер и не заменяет консультацию врача. Биологически активные добавки не являются лекарствами. При хронических заболеваниях, беременности и приёме лекарств посоветуйтесь с врачом до начала приёма.</p></article>';
    return h;
  }

  /* ---------- Экран: профиль ---------- */
  function tgUser() { return (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) || null; }
  function viewProfile() {
    if (ui.sub && ui.sub.type === 'fav') return viewFav();
    if (ui.sub && ui.sub.type === 'orders') return viewOrders();
    if (ui.sub && ui.sub.type === 'about') return viewAbout();
    var u = tgUser();
    var name = u ? [u.first_name, u.last_name].filter(Boolean).join(' ') : 'Гость';
    var st = streaks();
    var row = function (act, id, icon, text, em) {
      return '<button data-act="' + act + '"' + (id ? ' data-id="' + id + '"' : '') + '>' + icon + '<span>' + text + '</span>' + (em ? '<em>' + em + '</em>' : '') + I.right + '</button>';
    };
    return '<div class="me"><img class="me__ava" src="' + esc((u && u.photo_url) || 'img/bizon-avatar.jpg') + '" alt="" onerror="this.onerror=null;this.src=\'img/bizon-avatar.jpg\'">' +
      '<h1 class="me__name">' + esc(name) + '</h1>' +
      '<p class="me__user">' + (u && u.username ? '@' + esc(u.username) : (u ? 'Покупатель BIZON' : 'Откройте магазин в Telegram, чтобы войти')) + '</p></div>' +
      '<div class="stats"><div class="stat"><b>' + state.orders.length + '</b><span>' + plural(state.orders.length, ['заказ', 'заказа', 'заказов']) + '</span></div>' +
      '<div class="stat"><b>' + state.fav.length + '</b><span>в избранном</span></div>' +
      '<div class="stat"><b>' + st.cur + '</b><span>' + plural(st.cur, ['день', 'дня', 'дней']) + ' подряд</span></div></div>' +
      '<div class="menu">' +
        row('sub', 'orders', I.box, 'Мои заказы', state.orders.length || '') +
        row('sub', 'fav', I.heart, 'Избранное', state.fav.length || '') +
        row('tab', 'tracker', I.layers, 'Мой стек добавок', state.stack.length || '') +
        row('support', '', I.chat, 'Поддержка') +
        row('sub', 'about', I.info, 'О магазине') +
      '</div>';
  }
  function viewFav() {
    var list = state.fav.map(function (id) { return byId[id]; }).filter(Boolean);
    var h = backBtn('Профиль') + '<h1 class="title" style="padding-top:8px">Избранное</h1>';
    if (!list.length) return h + empty(I.heart, 'Нажмите на сердечко на карточке товара, чтобы сохранить его здесь.', 'Перейти в каталог', 'tab', 'catalog');
    return h + '<div class="grid">' + list.map(card).join('') + '</div>';
  }
  function viewOrders() {
    var h = backBtn('Профиль') + '<h1 class="title" style="padding-top:8px">Мои заказы</h1>';
    if (!state.orders.length) return h + empty(I.box, 'Заказов пока нет. Оформленные заказы будут храниться здесь.', 'Перейти в каталог', 'tab', 'catalog');
    return h + state.orders.map(function (o) {
      return '<div class="order"><div class="order__top"><span class="order__id">' + esc(o.id) + '</span><span class="order__date">' +
        new Date(o.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) + '</span></div>' +
        '<p class="order__items">' + o.items.map(function (i) { return esc(i.name) + ', ' + esc(i.size) + ' × ' + i.qty; }).join('<br>') + '</p>' +
        '<p class="order__sum">' + rub(o.total) + '</p>' +
        (CFG.ORDERS_VIA === 'manager' && CFG.MANAGER_USERNAME ? '<button class="link" data-act="resend" data-id="' + esc(o.id) + '">Отправить менеджеру ещё раз ' + I.right + '</button>' : '') + '</div>';
    }).join('');
  }
  function viewAbout() {
    return backBtn('Профиль') + '<h1 class="title" style="padding-top:8px">О магазине</h1><div class="about">' +
      CFG.ABOUT.map(function (b) { return '<div><h2>' + esc(b.title) + '</h2><p>' + esc(b.text) + '</p></div>'; }).join('') + '</div>';
  }

  /* ---------- Шторки ---------- */
  function sheetHead(title) {
    return '<div class="sheet__grab"></div><div class="sheet__head"><h2 class="sheet__h">' + title + '</h2>' +
      '<button class="sheet__x" data-act="close" aria-label="Закрыть">' + I.x + '</button></div>';
  }
  function sheetProduct(p) {
    var a = kbById[p.kb], q = state.cart[p.id] || 0;
    var h = '<div class="sheet"><div class="sheet__grab"></div><div class="sheet__head"><span></span><button class="sheet__x" data-act="close" aria-label="Закрыть">' + I.x + '</button></div>' +
      '<div class="pd__img">' + pack(p) + '</div>' +
      '<h2 class="pd__name">' + esc(p.name) + '</h2>' +
      '<p class="pd__meta"><b>' + esc(BRANDS[p.brand]) + '</b>, ' + esc(p.size) + '</p>' +
      '<p class="pd__desc">' + esc(p.desc) + '</p>';
    if (a) {
      h += '<div class="pd__why"><div class="pd__why-top">' + evBars(a.ev) + '<span>' + esc(a.title) + ': доказательность ' + EV[a.ev].name + '</span></div>' +
        '<p>' + esc(a.short) + '</p><button class="link" data-act="article" data-id="' + a.id + '">Разбор в базе знаний ' + I.right + '</button></div>';
    }
    h += '<div class="pd__buy"><span class="price">' + price(p) + '</span>';
    if (p.stock === false) h += '<button class="btn" data-act="link" data-id="' + esc(waitUrl(p)) + '">Сообщить о поступлении</button>';
    else if (!p.price) h += '<button class="btn btn--amber" data-act="link" data-id="' + esc(askUrl(p)) + '">Узнать цену</button>';
    else if (q) h += buyCtl(p);
    else h += '<button class="btn btn--amber" data-act="add" data-id="' + p.id + '">В корзину</button>';
    return h + '</div></div>';
  }
  function sheetCats() {
    return '<div class="sheet">' + sheetHead('Разделы') + '<div class="cats">' + CATS.map(function (c) {
      var n = PRODUCTS.filter(function (p) { return p.cat === c.id && (ui.brand === 'all' || p.brand === ui.brand); }).length;
      return n ? '<button data-act="goto" data-id="' + c.id + '"><b>' + esc(c.title) + '</b><span>' + n + '</span></button>' : '';
    }).join('') + '</div></div>';
  }
  // Поиск прощает раскладку и опечатки: всё переводится в латиницу (витамин д = vitamin d, креатин = kreatin),
  // ё = е, й = и, а слово от 5 букв может отличаться от названия на одну букву (креатинн, геинер).
  var TRANSLIT = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
  function normSearch(s) {
    return String(s).toLowerCase().replace(/[а-яё]/g, function (ch) { return TRANSLIT[ch]; })
      .replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function within1(a, b) {
    if (Math.abs(a.length - b.length) > 1) return false;
    var i = 0, j = 0, diff = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++diff > 1) return false;
      if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
    }
    return diff + (a.length - i) + (b.length - j) <= 1;
  }
  function tokenHit(tok, words, hay) {
    if (tok.length === 1) return words.some(function (w) { return w.charAt(0) === tok; });
    if (hay.indexOf(tok) >= 0) return true;
    return tok.length >= 5 && words.some(function (w) {
      return w.charAt(0) === tok.charAt(0) && w.length >= 4 && (within1(tok, w) || within1(tok, w.slice(0, tok.length)));
    });
  }
  // exact: точное совпадение строки запроса; иначе — по словам с допуском опечатки (запасной вариант)
  function searchMatch(q, text, exact) {
    var hay = normSearch(text);
    if (exact) return hay.indexOf(q) >= 0;
    var words = hay.split(' ');
    return q.split(' ').every(function (t) { return tokenHit(t, words, hay); });
  }
  function searchResults(raw) {
    var q = normSearch(raw);
    if (raw.trim().length < 2 || !q) return '<p class="res-h">Введите название товара или добавки: креатин, омега, whey.</p>';
    function find(exact) {
      return {
        prods: PRODUCTS.filter(function (p) {
          var a = kbById[p.kb];
          return searchMatch(q, p.name + ' ' + BRANDS[p.brand] + ' ' + catById[p.cat].title + ' ' + (a ? a.title : ''), exact);
        }),
        arts: KB.filter(function (a) { return searchMatch(q, a.title + ' ' + a.short, exact); })
      };
    }
    var r = find(true);
    if (!r.prods.length && !r.arts.length) r = find(false);
    var prods = r.prods, arts = r.arts;
    if (!prods.length && !arts.length) return '<p class="res-h">Ничего не нашлось. Попробуйте другое название.</p>';
    var h = '';
    if (arts.length) h += '<p class="res-h">База знаний</p>' + arts.map(function (a) {
      return '<div class="res" data-act="article" data-id="' + a.id + '">' + evBars(a.ev) + '<div class="res__main"><p class="res__t">' + esc(a.title) + '</p></div></div>';
    }).join('');
    if (prods.length) h += '<p class="res-h">Товары</p>' + prods.map(function (p) {
      return '<div class="res" data-act="product" data-id="' + p.id + '"><div class="res__main"><p class="res__t">' + esc(p.name) + '</p>' +
        '<p class="res__s">' + esc(BRANDS[p.brand]) + ', ' + esc(p.size) + '</p></div><span class="price">' + price(p) + '</span>' + buyCtl(p) + '</div>';
    }).join('');
    return h;
  }
  function sheetSearch(s) {
    return '<div class="sheet sheet--full"><div class="sheet__grab"></div><div class="search">' +
      '<input class="input" id="q" type="search" value="' + esc(s.q) + '" placeholder="Поиск по каталогу и базе знаний" autocomplete="off" enterkeyhint="search">' +
      '<button class="sheet__x" data-act="close" aria-label="Закрыть" style="width:52px;height:52px">' + I.x + '</button></div>' +
      '<div id="q-res">' + searchResults(s.q) + '</div></div>';
  }
  var TIMES = ['Утром', 'Днём', 'Вечером', 'До тренировки', 'После тренировки', 'Перед сном'];
  function sheetStack(s) {
    return '<div class="sheet">' + sheetHead('Новая добавка') +
      '<div class="pick">' + KB.map(function (a) { return '<button class="chip' + (s.name === a.title ? ' is-on' : '') + '" data-act="pick-name" data-id="' + a.id + '">' + esc(a.title) + '</button>'; }).join('') + '</div>' +
      '<div class="form">' +
        '<div class="field' + (s.err ? ' is-bad' : '') + '"><label for="s-name">Название</label><input class="input" id="s-name" data-s="name" value="' + esc(s.name) + '" placeholder="Выберите выше или впишите своё">' + (s.err ? '<p class="field__err">Впишите название добавки</p>' : '') + '</div>' +
        '<div class="field"><label for="s-dose">Дозировка</label><input class="input" id="s-dose" data-s="dose" value="' + esc(s.dose) + '" placeholder="Например: 5 г или 2 капсулы"></div>' +
        '<div class="field"><span class="field__label">Когда принимаете</span><div class="pick">' + TIMES.map(function (t) { return '<button class="chip' + (s.time === t ? ' is-on' : '') + '" data-act="pick-time" data-id="' + t + '">' + t + '</button>'; }).join('') + '</div></div>' +
      '</div><button class="btn btn--amber" data-act="stack-save">Добавить в трекер</button></div>';
  }
  function renderSheet() {
    var s = ui.sheet;
    if (!s) { elSheet.hidden = true; elSheet.innerHTML = ''; document.body.style.overflow = ''; return; }
    var keep = elSheet.firstElementChild ? elSheet.firstElementChild.scrollTop : 0;
    var h = '';
    if (s.type === 'product') h = sheetProduct(byId[s.id]);
    else if (s.type === 'cats') h = sheetCats();
    else if (s.type === 'search') h = sheetSearch(s);
    else if (s.type === 'stack') h = sheetStack(s);
    var again = !elSheet.hidden && elSheet.dataset.type === s.type;
    elSheet.innerHTML = h;
    elSheet.hidden = false;
    elSheet.dataset.type = s.type;
    document.body.style.overflow = 'hidden';
    if (again && elSheet.firstElementChild) {
      elSheet.firstElementChild.style.animation = 'none';
      elSheet.style.animation = 'none';
      elSheet.firstElementChild.scrollTop = keep;
    } else {
      elSheet.style.animation = '';
    }
  }
  function openSheet(s) {
    ui.sheet = s; renderSheet(); syncBack();
    if (s.type === 'search') { var q = $('q'); if (q) q.focus(); }
  }
  function closeSheet() { ui.sheet = null; renderSheet(); syncBack(); }

  /* ---------- Отрисовка ---------- */
  var TABS = [
    { id: 'catalog', icon: I.grid, label: 'Каталог' },
    { id: 'cart', icon: I.bag, label: 'Корзина' },
    { id: 'tracker', icon: I.pulse, label: 'Трекер' },
    { id: 'kb', icon: I.book, label: 'База знаний' },
    { id: 'profile', icon: I.user, label: 'Профиль' }
  ];
  function renderChrome() {
    var tools = !ui.sub && (ui.tab === 'catalog' || ui.tab === 'kb');
    elBar.innerHTML =
      (tools ? '<button class="bar__btn" data-act="search" aria-label="Поиск">' + I.search + '</button>' : '<span></span>') +
      '<div class="logo" aria-label="BIZON POWER"><span class="logo__name">BIZON</span><span class="logo__sub">POWER</span></div>' +
      (tools && ui.tab === 'catalog' ? '<button class="bar__btn" data-act="cats" aria-label="Разделы каталога">' + I.menu + '</button>' : '<span></span>');
    var count = totals().count;
    elNav.innerHTML = TABS.map(function (t) {
      return '<button class="' + (ui.tab === t.id ? 'is-on' : '') + '" data-act="tab" data-id="' + t.id + '" aria-label="' + t.label + '"' + (ui.tab === t.id ? ' aria-current="page"' : '') + '>' + t.icon +
        (t.id === 'cart' && count ? '<span class="nav__badge">' + count + '</span>' : '') + '</button>';
    }).join('');
  }
  function renderView() {
    var h = '';
    if (ui.tab === 'catalog') h = viewCatalog();
    else if (ui.tab === 'cart') h = viewCart();
    else if (ui.tab === 'tracker') h = viewTracker();
    else if (ui.tab === 'kb') h = viewKb();
    else h = viewProfile();
    elView.innerHTML = h;
  }
  function render() { renderChrome(); renderView(); if (ui.sheet) renderSheet(); syncBack(); syncTop(); }
  function syncBack() {
    try {
      if (!tg || !tg.BackButton) return;
      if (ui.sheet || ui.sub) tg.BackButton.show(); else tg.BackButton.hide();
    } catch (e) { /* ignore */ }
  }
  function syncTop() {
    elTop.hidden = !(window.scrollY > 700 && !ui.sheet && (ui.tab === 'catalog' || ui.tab === 'kb'));
  }
  elTop.innerHTML = I.up;

  /* ---------- Навигация ---------- */
  function scrollKey() { return ui.tab + (ui.sub ? ':' + ui.sub.type : ''); }
  function go(tab, sub) {
    ui.scroll[scrollKey()] = window.scrollY;
    var same = ui.tab === tab && !ui.sub && !sub;
    ui.tab = tab; ui.sub = sub || null; ui.sheet = null; ui.errors = {};
    renderSheet(); render();
    window.scrollTo(0, same || sub ? 0 : (ui.scroll[scrollKey()] || 0));
  }
  function back() {
    if (ui.sheet) { closeSheet(); return; }
    if (ui.sub) {
      var done = ui.sub.type === 'done';
      ui.sub = null; render();
      window.scrollTo(0, done ? 0 : (ui.scroll[scrollKey()] || 0));
    }
  }

  /* ---------- Заказ ---------- */
  function fmtPhone(v) {
    var d = v.replace(/\D/g, '');
    if (d.charAt(0) === '7' || d.charAt(0) === '8') d = d.slice(1);
    d = d.slice(0, 10);
    if (!d) return '';
    var o = '+7 (' + d.slice(0, 3);
    if (d.length > 3) o += ') ' + d.slice(3, 6);
    if (d.length > 6) o += '-' + d.slice(6, 8);
    if (d.length > 8) o += '-' + d.slice(8);
    return o;
  }
  function validate() {
    var f = state.form, e = {};
    if (isLocal()) { if (f.name.trim().length < 2) e.name = 'Напишите, как к вам обращаться'; }
    else if (f.name.trim().split(/\s+/).filter(function (w) { return w.length > 1; }).length < 2) e.name = 'Укажите фамилию и имя как в паспорте: по ним выдают посылку';
    if (f.phone.replace(/\D/g, '').length !== 11) e.phone = 'Введите номер полностью, 10 цифр после +7';
    var d = curDelivery();
    if (d.id === 'courier') { if (f.address.trim().length < 5) e.address = 'Укажите город (Каспийск или Махачкала), улицу и дом'; }
    else if (!d.local) {
      if (f.city.trim().length < 2) e.city = 'Укажите город, куда отправить заказ';
      if (d.id === 'post' && !/(^|\D)\d{6}(\D|$)/.test(f.point || '')) e.point = 'Укажите улицу, дом, квартиру и индекс (6 цифр)';
      else if (d.id === 'post' && (f.point || '').replace(/\d{6}/, '').trim().length < 5) e.point = 'Укажите улицу, дом и квартиру';
    }
    return e;
  }
  function orderText(o) {
    var dl = CFG.DELIVERY.filter(function (d) { return d.id === o.delivery; })[0];
    return 'Заказ ' + o.id + '\n\n' +
      o.items.map(function (i, n) { return (n + 1) + '. ' + i.name + ' (' + i.brand + '), ' + i.size + ' × ' + i.qty + ' = ' + (i.price * i.qty) + ' ₽'; }).join('\n') +
      '\n\n' + (o.discount ? 'Скидка по промокоду ' + o.promo + ': −' + o.discount + ' ₽\n' : '') + 'Итого: ' + o.total + ' ₽\n\n' +
      'Получатель: ' + o.name + '\nТелефон: ' + o.phone + '\nДоставка: ' + (dl ? dl.title : o.delivery) + (o.delivery === 'courier' ? ', ' + o.address : o.delivery === 'pickup' ? '' : ', ' + o.city + (o.point ? ', ' + o.point : '')) +
      (o.comment ? '\nКомментарий: ' + o.comment : '');
  }
  function submitOrder() {
    if (ui.sending) return;
    var t = totals();
    if (!t.lines.length) return;
    ui.errors = validate();
    if (Object.keys(ui.errors).length) {
      haptic('bad'); render();
      var first = $('f-' + Object.keys(ui.errors)[0]);
      if (first) first.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    var f = state.form, u = tgUser();
    var order = {
      id: 'BZ-' + Date.now().toString(36).toUpperCase().slice(-6),
      date: new Date().toISOString(),
      items: t.lines.map(function (l) { return { id: l.p.id, name: l.p.name, brand: BRANDS[l.p.brand], size: l.p.size, price: l.p.price, qty: l.qty }; }),
      subtotal: t.subtotal, promo: state.promo, discount: t.discount, total: t.total,
      name: f.name.trim(), phone: f.phone, delivery: f.delivery, city: f.city.trim(), address: (f.address || '').trim(), point: f.delivery === 'cdek' || f.delivery === 'post' ? (f.point || '').trim() : '', comment: f.comment.trim(),
      tg: u ? { id: u.id, username: u.username || '' } : null
    };
    ui.sending = true; render();
    send(order).then(function (mode) {
      ui.sending = false;
      state.orders.unshift(order);
      state.cart = {}; state.promo = ''; ui.promoInput = '';
      save(); haptic('ok');
      ui.sub = { type: 'done', id: order.id, mode: mode };
      render(); window.scrollTo(0, 0);
    });
  }
  function managerLink(order) {
    return 'https://t.me/' + encodeURIComponent(CFG.MANAGER_USERNAME) + '?text=' + encodeURIComponent(orderText(order));
  }
  function toManager(order) {
    if (!CFG.MANAGER_USERNAME) return 'local';
    openTg(managerLink(order));
    return 'manager';
  }
  function send(order) {
    if (CFG.ORDERS_VIA === 'manager') return Promise.resolve(toManager(order));
    var api = (CFG.API_URL || '').replace(/\/$/, '') + '/api/order';
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 12000);
    return fetch(api, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: tg ? tg.initData || '' : '', order: order }),
      signal: ctl ? ctl.signal : undefined
    }).then(function (r) { return r.ok ? r.json() : { ok: false }; })
      .then(function (j) {
        clearTimeout(timer);
        if (!j || !j.ok) throw new Error('no api');
        if (j.id) order.id = j.id; // номер заказа — тот же, что увидит менеджер
        return j.delivered ? 'api' : 'local';
      })
      .catch(function () { clearTimeout(timer); return toManager(order); });
  }

  /* ---------- Обработчики ---------- */
  function refreshAfterCart() {
    if (ui.sheet && ui.sheet.type === 'search') {
      renderChrome(); renderView();
      var box = $('q-res'); if (box) box.innerHTML = searchResults(ui.sheet.q);
    } else render();
  }
  var actions = {
    tab: function (id) { go(id); },
    sub: function (id) { go('profile', { type: id }); },
    back: back,
    close: closeSheet,
    top: function () { window.scrollTo({ top: 0, behavior: 'smooth' }); },
    goal: function (id) { ui.goal = id; render(); },
    kbg: function (id) { ui.kbGroup = id; render(); },
    search: function () { openSheet({ type: 'search', q: '' }); },
    cats: function () { openSheet({ type: 'cats' }); },
    goto: function (id) {
      closeSheet();
      var el = $('cat-' + id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    product: function (id) { openSheet({ type: 'product', id: id }); },
    article: function (id) { go('kb', { type: 'article', id: id }); },
    link: function (url) { if (url.indexOf('https://t.me/') === 0) openTg(url); else openLink(url); },
    add: function (id) { setQty(id, 1); haptic(); toast('Добавлено в корзину'); refreshAfterCart(); },
    inc: function (id) { setQty(id, (state.cart[id] || 0) + 1); haptic(); refreshAfterCart(); },
    dec: function (id) { setQty(id, (state.cart[id] || 0) - 1); haptic(); refreshAfterCart(); },
    fav: function (id) {
      var i = state.fav.indexOf(id);
      if (i >= 0) state.fav.splice(i, 1); else state.fav.unshift(id);
      save(); haptic(); render();
    },
    delivery: function (id) { state.form.delivery = id; save(); render(); },
    promo: function () {
      if (state.promo) { state.promo = ''; ui.promoInput = ''; ui.promoErr = ''; save(); render(); return; }
      var code = (ui.promoInput || '').trim().toUpperCase();
      if (CFG.PROMO_CODES[code]) { state.promo = code; ui.promoErr = ''; save(); toast('Скидка ' + CFG.PROMO_CODES[code] + '% применена'); }
      else ui.promoErr = code ? 'Такого промокода нет. Проверьте написание' : 'Введите промокод';
      render();
    },
    order: submitOrder,
    resend: function (id) {
      var o = state.orders.filter(function (x) { return x.id === id; })[0];
      if (o && CFG.MANAGER_USERNAME) openTg(managerLink(o));
    },
    support: function () {
      if (CFG.MANAGER_USERNAME) openTg('https://t.me/' + encodeURIComponent(CFG.MANAGER_USERNAME));
      else toast('Контакт поддержки пока не указан');
    },
    day: function (k) { ui.day = k; render(); },
    week: function (n) {
      var today = dayKey(new Date()), k = dayKey(addDays(fromKey(ui.day), +n));
      ui.day = k > today ? today : k; render();
    },
    take: function (id) {
      if (ui.day > dayKey(new Date())) return;
      var list = state.log[ui.day] || (state.log[ui.day] = []);
      var i = list.indexOf(id);
      if (i >= 0) list.splice(i, 1); else { list.push(id); haptic('ok'); }
      if (!list.length) delete state.log[ui.day];
      save(); render();
    },
    'stack-new': function (id) {
      var a = id && kbById[id];
      openSheet({ type: 'stack', name: a ? a.title : '', dose: '', time: '', err: false });
    },
    'pick-name': function (id) { ui.sheet.name = kbById[id].title; ui.sheet.err = false; renderSheet(); },
    'pick-time': function (t) { ui.sheet.time = ui.sheet.time === t ? '' : t; renderSheet(); },
    'stack-save': function () {
      var s = ui.sheet, name = (s.name || '').trim();
      if (!name) { s.err = true; renderSheet(); return; }
      state.stack.push({ id: 's' + Date.now().toString(36), name: name.slice(0, 60), dose: (s.dose || '').trim().slice(0, 40), time: s.time });
      save(); haptic('ok'); closeSheet(); toast('Добавлено в трекер'); render();
    },
    'stack-del': function (id) {
      var item = state.stack.filter(function (s) { return s.id === id; })[0];
      if (!item) return;
      var drop = function () {
        state.stack = state.stack.filter(function (s) { return s.id !== id; });
        Object.keys(state.log).forEach(function (k) {
          state.log[k] = state.log[k].filter(function (x) { return x !== id; });
          if (!state.log[k].length) delete state.log[k];
        });
        save(); render();
      };
      var msg = 'Удалить «' + item.name + '» из трекера вместе с отметками о приёме?';
      try { if (tg && tg.initData && tg.showConfirm) { tg.showConfirm(msg, function (ok) { if (ok) drop(); }); return; } } catch (e) { /* fallthrough */ }
      if (window.confirm(msg)) drop();
    }
  };

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el) { if (e.target === elSheet) closeSheet(); return; }
    if (el.disabled) return;
    var fn = actions[el.dataset.act];
    if (fn) fn(el.dataset.id);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && (ui.sheet || ui.sub)) { back(); return; }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.take')) { e.preventDefault(); e.target.click(); }
  });
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.dataset.f) {
      if (t.dataset.f === 'phone') t.value = fmtPhone(t.value);
      state.form[t.dataset.f] = t.value; save();
      if (ui.errors[t.dataset.f]) {
        delete ui.errors[t.dataset.f];
        var box = $('f-' + t.dataset.f);
        if (box) { box.classList.remove('is-bad'); var er = box.querySelector('.field__err'); if (er) er.remove(); }
      }
    } else if (t.id === 'q' && ui.sheet) {
      ui.sheet.q = t.value; $('q-res').innerHTML = searchResults(t.value);
    } else if (t.dataset.s && ui.sheet) {
      ui.sheet[t.dataset.s] = t.value;
      if (t.dataset.s === 'name') {
        ui.sheet.err = false;
        Array.prototype.forEach.call(elSheet.querySelectorAll('[data-act="pick-name"]'), function (c) { c.classList.toggle('is-on', c.textContent === t.value); });
      }
    } else if (t.id === 'promo') {
      ui.promoInput = t.value; ui.promoErr = '';
    }
  });
  window.addEventListener('scroll', syncTop, { passive: true });

  /* ---------- Telegram ---------- */
  if (tg) {
    try { tg.ready(); tg.expand(); } catch (e) { /* ignore */ }
    try { tg.setHeaderColor('#1a1c14'); tg.setBackgroundColor('#1a1c14'); } catch (e) { /* ignore */ }
    try { if (tg.setBottomBarColor) tg.setBottomBarColor('#1a1c14'); } catch (e) { /* ignore */ }
    try { if (tg.disableVerticalSwipes) tg.disableVerticalSwipes(); } catch (e) { /* ignore */ }
    try { tg.BackButton.onClick(back); } catch (e) { /* ignore */ }
  }

  render();
})();
