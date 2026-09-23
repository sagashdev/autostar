/* AutoStar — интерактив без фреймворков. Всё содержимое страницы лежит в разметке,
   этот файл добавляет только поведение: появление блоков, счётчик, меню, модалку, формы. */
(function () {
  'use strict';

  var cfg = window.AS || {};
  var root = document.documentElement;
  var body = document.body;
  var DASH = '—';

  /* --- появление блоков при прокрутке ---
     Класс rv включает стартовое состояние (opacity:0). Его ставит только скрипт,
     поэтому без JS — у робота, в старом Safari — контент виден сразу. */
  var motionOk = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  if (motionOk && 'IntersectionObserver' in window) {
    root.classList.add('rv');

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.setAttribute('data-in', '1');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    var sweep = function () {
      var els = document.querySelectorAll('[data-rv]:not([data-in])');
      for (var i = 0; i < els.length; i++) {
        if (els[i].getBoundingClientRect().top < window.innerHeight * 0.98) {
          els[i].setAttribute('data-in', '1');
        } else {
          io.observe(els[i]);
        }
      }
    };
    sweep();
    window.addEventListener('scroll', sweep, { passive: true });
    window.addEventListener('resize', sweep);
  }

  /* --- счётчик цифр в верхнем блоке --- */
  var stats = document.getElementById('js-stats');
  if (stats && motionOk && 'IntersectionObserver' in window) {
    var counted = false;
    var countUp = function () {
      if (counted) return;
      counted = true;
      var nodes = stats.querySelectorAll('.js-stat');
      var done = false;

      var paint = function (k) {
        for (var i = 0; i < nodes.length; i++) {
          var n = parseInt(nodes[i].getAttribute('data-num'), 10) || 0;
          nodes[i].textContent = Math.round(n * k) + (nodes[i].getAttribute('data-suffix') || '');
        }
      };
      // Цифры — фактические данные о сервисе. Анимация не имеет права оставить
      // их недосчитанными, поэтому финал ставится по таймеру независимо от rAF:
      // во вкладке на фоне и при троттлинге кадры могут не прийти вовсе.
      var finish = function () { if (done) return; done = true; paint(1); };

      var start = performance.now();
      var tick = function (now) {
        if (done) return;
        var p = Math.min(1, (now - start) / 900);
        paint(1 - Math.pow(1 - p, 3));
        if (p < 1) requestAnimationFrame(tick); else done = true;
      };
      requestAnimationFrame(tick);
      setTimeout(finish, 1200);
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') finish();
      });
    };
    var sio = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { countUp(); sio.disconnect(); }
    }, { threshold: 0.2 });
    sio.observe(stats);
  }

  /* --- общие показ/скрытие для наложений --- */
  function show(el) { if (el) { el.removeAttribute('hidden'); body.style.overflow = 'hidden'; } }
  function hide(el) { if (el) { el.setAttribute('hidden', ''); body.style.overflow = ''; } }

  var menu = document.getElementById('js-menu');
  var modal = document.getElementById('js-callback');

  /* --- мобильное меню --- */
  var burger = document.getElementById('js-burger');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      if (menu.hasAttribute('hidden')) show(menu); else hide(menu);
    });
    var closeBtn = document.getElementById('js-menu-close');
    if (closeBtn) closeBtn.addEventListener('click', function () { hide(menu); });
    // клик по ссылке меню — переходим к разделу и закрываем
    var links = menu.querySelectorAll('.js-menu-link');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function () { hide(menu); });
    }
    // клик по затемнению, но не по самой панели
    menu.addEventListener('click', function (e) { if (e.target === menu) hide(menu); });
  }

  /* --- модалка обратного звонка --- */
  if (modal) {
    var openers = document.querySelectorAll('.js-callback-open');
    for (var j = 0; j < openers.length; j++) {
      openers[j].addEventListener('click', function () { hide(menu); show(modal); });
    }
    var cbClose = document.getElementById('js-callback-close');
    if (cbClose) cbClose.addEventListener('click', function () { hide(modal); });
    modal.addEventListener('click', function (e) { if (e.target === modal) hide(modal); });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    hide(modal);
    hide(menu);
  });

  /* --- отправка заявок: собираем текст и открываем WhatsApp --- */
  function openWhatsApp(lines) {
    window.open('https://wa.me/' + cfg.wa + '?text=' + encodeURIComponent(lines.join('\n')),
      '_blank', 'noopener');
  }

  function markSent() {
    var sent = document.getElementById('js-form-sent');
    if (sent) sent.removeAttribute('hidden');
  }

  var form = document.getElementById('js-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target.elements;
      openWhatsApp([
        cfg.intro,
        cfg.name + ': ' + (f.name.value || DASH),
        cfg.phone + ': ' + (f.phone.value || DASH),
        cfg.car + ': ' + (f.car.value || DASH),
        cfg.task + ': ' + (f.task.value || DASH)
      ]);
      markSent();
    });
  }

  var cbForm = document.getElementById('js-callback-form');
  if (cbForm) {
    cbForm.addEventListener('submit', function (e) {
      e.preventDefault();
      openWhatsApp([cfg.intro, cfg.cb, cfg.phone + ': ' + (e.target.elements.cbphone.value || DASH)]);
      hide(modal);
      markSent();
    });
  }
})();
