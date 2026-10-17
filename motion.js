/* Vergers de la Garenne : menu mobile, ombre d'en-tête, bascule FR/EN, révélations, compteurs.
   Sans JavaScript, tout reste visible et utilisable (masquages conditionnés par html.js). */
window.vgMotion = true;
(function () {
  var doc = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu');
  function closeMenu() {
    if (!burger) { return; }
    burger.setAttribute('aria-expanded', 'false');
    doc.classList.remove('menu-open');
  }
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', open ? 'false' : 'true');
      doc.classList.toggle('menu-open', !open);
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a')) { closeMenu(); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMenu(); } });
  }

  var header = document.querySelector('.site-header');
  function onScroll() { if (header) { header.classList.toggle('is-scrolled', window.scrollY > 24); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  [].forEach.call(document.querySelectorAll('.lang-switch'), function (sw) {
    sw.addEventListener('click', function () {
      var cur = '';
      [].forEach.call(document.querySelectorAll('main section[id]'), function (s) {
        if (s.getBoundingClientRect().top < window.innerHeight / 3) { cur = s.id; }
      });
      if (cur) { sw.href = sw.href.split('#')[0] + '#' + cur; }
    });
  });

  // Calendrier : outils communs
  var cal = document.querySelector('.cal');
  var sep = doc.lang === 'fr' ? ' : ' : ': ';
  var labelOf = function (el) {
    var n = el && el.querySelector('.cal-label');
    return n && n.firstChild ? n.firstChild.nodeValue.trim() : '';
  };

  // Calendrier : « disponible ce mois-ci » (sans JavaScript, le filtre reste masqué)
  var filter = document.querySelector('.cal-filter');
  var avail = document.querySelector('.cal-avail');
  if (filter && cal && avail) {
    var chips = [].slice.call(filter.querySelectorAll('.cal-chip'));
    var heads = [].slice.call(document.querySelectorAll('.cal-months span'));
    var has = function (el, m) { return (' ' + el.getAttribute('data-months') + ' ').indexOf(' ' + m + ' ') !== -1; };
    var pick = function (m) {
      chips.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-month') === String(m) ? 'true' : 'false'); });
      heads.forEach(function (h, i) { h.classList.toggle('is-on', i === m - 5); });
      cal.classList.add('has-month');
      cal.style.setProperty('--m', String(m - 5));
      var list = document.createElement('ul');
      [].forEach.call(cal.querySelectorAll('.cal-fruit'), function (f) {
        f.classList.toggle('is-off', !has(f, m));
        var names = [];
        [].forEach.call(f.querySelectorAll('.cal-variety'), function (v) {
          var ok = has(v, m);
          v.classList.toggle('is-off', !ok);
          if (ok) { names.push(labelOf(v)); }
        });
        if (names.length) {
          var li = document.createElement('li');
          var fruit = document.createElement('span');
          fruit.className = 'cal-avail-fruit';
          fruit.textContent = labelOf(f.querySelector('summary')) + sep;
          li.appendChild(fruit);
          li.appendChild(document.createTextNode(names.join(', ')));
          list.appendChild(li);
        }
      });
      var chip = filter.querySelector('[data-month="' + m + '"]');
      var title = document.createElement('strong');
      title.textContent = filter.getAttribute('data-prefix') + ' ' + chip.getAttribute('data-name');
      avail.innerHTML = '';
      avail.appendChild(title);
      if (list.children.length) { avail.appendChild(list); }
      else { avail.appendChild(document.createTextNode(filter.getAttribute('data-none'))); }
    };
    chips.forEach(function (c) {
      c.addEventListener('click', function () { pick(parseInt(c.getAttribute('data-month'), 10)); });
    });
    // Les mois en tête du tableau sont aussi cliquables (raccourci souris / doigt ; au clavier : les boutons)
    heads.forEach(function (h) {
      h.addEventListener('click', function () { pick(parseInt(h.getAttribute('data-month'), 10)); });
    });
    var now = new Date().getMonth() + 1;
    pick(now >= 5 && now <= 10 ? now : 5);
  }

  // Bandeau « En ce moment » : récolte du jour, sinon prochaine récolte (calculé depuis le calendrier)
  var nowBar = document.getElementById('maintenant');
  var nowInner = nowBar && nowBar.querySelector('.now-inner');
  if (nowInner && cal) {
    var today = new Date();
    var key = (today.getMonth() + 1) * 100 + today.getDate();
    var current = [];
    var next = null;
    var first = null;
    [].forEach.call(cal.querySelectorAll('.cal-fruit'), function (f) {
      var fruitName = labelOf(f.querySelector('summary'));
      var names = [];
      [].forEach.call(f.querySelectorAll('.cal-variety'), function (v) {
        var a = parseInt(v.getAttribute('data-from'), 10);
        var b = parseInt(v.getAttribute('data-to'), 10);
        if (key >= a && key <= b) { names.push(labelOf(v)); }
        if (a > key && (!next || a < next.from)) { next = { from: a, fruit: fruitName }; }
        if (!first || a < first.from) { first = { from: a, fruit: fruitName }; }
      });
      if (names.length) { current.push({ fruit: fruitName, names: names }); }
    });
    var label;
    var text;
    if (current.length) {
      label = nowBar.getAttribute('data-label-now');
      text = current.length === 1 ? current[0].fruit + ' (' + current[0].names.join(', ') + ')'
        : current.map(function (c) { return c.fruit; }).join(', ');
    } else {
      var n = next || first;
      var monthChip = filter && filter.querySelector('[data-month="' + Math.floor(n.from / 100) + '"]');
      var fruitLabel = doc.lang === 'de' ? n.fruit : n.fruit.toLowerCase();
      label = nowBar.getAttribute('data-label-next');
      text = fruitLabel + ', ' + nowBar.getAttribute('data-label-from') + ' ' + (monthChip ? monthChip.getAttribute('data-name') : '');
    }
    var dot = document.createElement('span');
    dot.className = 'now-dot';
    dot.setAttribute('aria-hidden', 'true');
    var strong = document.createElement('strong');
    strong.textContent = label;
    var link = document.createElement('a');
    link.href = '#calendrier';
    link.textContent = nowBar.getAttribute('data-label-cta');
    var phrase = document.createElement('span');
    phrase.appendChild(strong);
    phrase.appendChild(document.createTextNode(sep + text));
    nowInner.appendChild(dot);
    nowInner.appendChild(phrase);
    nowInner.appendChild(link);
  }

  // Formulaire « Demander une offre » : ouvre un email pré-rempli
  var offer = document.querySelector('.offer-form');
  if (offer) {
    offer.addEventListener('submit', function (e) {
      e.preventDefault();
      var lines = [];
      [].forEach.call(offer.querySelectorAll('input, select, textarea'), function (el) {
        var v = (el.value || '').trim();
        if (!v) { return; }
        var lab = offer.querySelector('label[for="' + el.id + '"]');
        lines.push((lab ? lab.textContent : el.name) + sep + v);
      });
      var fruitSel = offer.querySelector('select');
      var subject = offer.getAttribute('data-subject') + sep + (fruitSel ? fruitSel.value : '');
      var mail = document.createElement('a');
      mail.href = 'mailto:' + offer.getAttribute('data-mail') + '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(lines.join('\n'));
      document.body.appendChild(mail);
      mail.click();
      mail.parentNode.removeChild(mail);
    });
  }

  // Vidéos (montage « de la fleur au fruit », ligne de calibrage) : image d'attente chargée à l'approche,
  // lecture quand la vidéo est visible, jamais si l'utilisateur préfère réduire les animations
  [].forEach.call(document.querySelectorAll('video[data-poster]'), function (vid) {
    var setPoster = function () { if (!vid.getAttribute('poster')) { vid.setAttribute('poster', vid.getAttribute('data-poster')); } };
    if (!('IntersectionObserver' in window)) { setPoster(); return; }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          setPoster();
          if (!reduce) { var pr = vid.play(); if (pr && pr.catch) { pr.catch(function () {}); } }
        } else if (!reduce) { vid.pause(); }
      });
    }, { rootMargin: '300px 0px' }).observe(vid);
  });

  // Salons : classement automatique à venir / passés selon la date, prochain salon et compte à rebours
  var fairs = document.querySelector('.fairs');
  if (fairs) {
    var fairList = fairs.querySelector('.fair-list');
    var parseDay = function (str) { var p = str.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
    var today0 = new Date();
    today0.setHours(0, 0, 0, 0);
    var upcoming = [];
    var past = [];
    [].forEach.call(fairs.querySelectorAll('.fair'), function (c) {
      (parseDay(c.getAttribute('data-end')) >= today0 ? upcoming : past).push(c);
    });
    upcoming.sort(function (a, b) { return parseDay(a.getAttribute('data-start')) - parseDay(b.getAttribute('data-start')); });
    past.sort(function (a, b) { return parseDay(b.getAttribute('data-start')) - parseDay(a.getAttribute('data-start')); });
    upcoming.concat(past).forEach(function (c) { fairList.appendChild(c); });
    past.forEach(function (c) {
      c.classList.add('is-past');
      [].forEach.call(c.querySelectorAll('.fair-rdv, .fair-flag'), function (el) { el.parentNode.removeChild(el); });
    });
    if (upcoming.length) {
      var nextFair = upcoming[0];
      var days = Math.round((parseDay(nextFair.getAttribute('data-start')) - today0) / 86400000);
      var when = days <= 0 ? fairs.getAttribute('data-label-today')
        : days === 1 ? fairs.getAttribute('data-label-tomorrow')
        : fairs.getAttribute('data-label-in').replace('{n}', days);
      nextFair.classList.add('is-next');
      nextFair.querySelector('.fair-countdown').textContent = fairs.getAttribute('data-label-next') + ' · ' + when;
    }
    var fairTabs = [].slice.call(fairs.querySelectorAll('.fair-tab'));
    var showFairs = function (which) {
      fairTabs.forEach(function (t) { t.setAttribute('aria-pressed', t.getAttribute('data-tab') === which ? 'true' : 'false'); });
      upcoming.forEach(function (c) { c.hidden = which !== 'up'; });
      past.forEach(function (c) { c.hidden = which !== 'past'; });
    };
    fairTabs.forEach(function (t) { t.addEventListener('click', function () { showFairs(t.getAttribute('data-tab')); }); });
    fairs.classList.add('has-tabs');
    showFairs(upcoming.length ? 'up' : 'past');
    [].forEach.call(fairs.querySelectorAll('.fair-rdv'), function (btn) {
      btn.addEventListener('click', function () {
        var msgField = document.getElementById('o-message');
        if (msgField) { msgField.value = fairs.getAttribute('data-msg').replace('{salon}', btn.getAttribute('data-fair')); }
      });
    });
  }

  // Ligne de calibrage : la pastille suit le fruit d'étape en étape au défilement
  var calibSteps = document.querySelector('.calib-steps');
  if (calibSteps && !reduce) {
    var stepItems = [].slice.call(calibSteps.querySelectorAll('.calib-step'));
    var ticking = false;
    var track = function () {
      ticking = false;
      var r = calibSteps.getBoundingClientRect();
      var mid = window.innerHeight * 0.55;
      calibSteps.style.setProperty('--p', Math.min(1, Math.max(0, (mid - r.top) / r.height)).toFixed(3));
      var active = -1;
      stepItems.forEach(function (it, i) { if (it.getBoundingClientRect().top < mid) { active = i; } });
      stepItems.forEach(function (it, i) { it.classList.toggle('is-active', i === active); it.classList.toggle('is-done', i < active); });
    };
    calibSteps.classList.add('is-tracking');
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(track); } }, { passive: true });
    track();
  }

  var els = [].slice.call(document.querySelectorAll('.rv, .rv-media'));
  var nums = [].slice.call(document.querySelectorAll('[data-count]'));
  if (reduce || !('IntersectionObserver' in window)) {
    els.forEach(function (e) { e.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  els.forEach(function (e) { io.observe(e); });

  var io2 = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) { return; }
      io2.unobserve(en.target);
      var el = en.target;
      var to = parseInt(el.getAttribute('data-count'), 10);
      var from = parseInt(el.getAttribute('data-from') || '0', 10);
      var t0 = null;
      function step(t) {
        if (t0 === null) { t0 = t; }
        var p = Math.min((t - t0) / 1400, 1);
        el.textContent = String(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))));
        if (p < 1) { requestAnimationFrame(step); }
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });
  nums.forEach(function (e) { io2.observe(e); });
})();
