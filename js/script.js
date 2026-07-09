/* ==========================================================
   Барбершоп «ТОПОР» — интерактив
   Чистый JS, без библиотек: бургер, reveal, тултипы, форма записи.
   ========================================================== */

(function () {
  'use strict';

  /* ---- Мобильное меню ---- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  if (burger && nav) {
    var toggleMenu = function (open) {
      var isOpen = open === undefined ? !nav.classList.contains('open') : open;
      nav.classList.toggle('open', isOpen);
      burger.classList.toggle('open', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    };
    burger.addEventListener('click', function () { toggleMenu(); });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { toggleMenu(false); });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggleMenu(false); });
  }

  /* ---- Появление при скролле ---- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); obs.unobserve(en.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -60px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---- Год в подвале ---- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Демо-тултипы (соцсети, телефон, Telegram) ---- */
  var demoLinks = document.querySelectorAll('[data-demo]');
  if (demoLinks.length) {
    var toast = null, hideTimer = null, outsideBound = false;
    var infoIco = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';

    function hideToast() {
      if (toast) toast.classList.remove('show');
    }
    function onOutside(e) {
      if (toast && toast.classList.contains('show') && !toast.contains(e.target) && !e.target.closest('[data-demo]')) hideToast();
    }
    function onEsc(e) { if (e.key === 'Escape') hideToast(); }

    function showToast(msg) {
      if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        document.body.appendChild(toast);
      }
      toast.innerHTML = '<span class="toast__ico">' + infoIco + '</span><span>' + msg + '</span>';
      void toast.offsetWidth;
      toast.classList.add('show');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(hideToast, 4600);
      if (!outsideBound) {
        // навешиваем один раз; таймаут — чтобы текущий клик не закрыл сразу
        setTimeout(function () {
          document.addEventListener('click', onOutside);
          document.addEventListener('keydown', onEsc);
        }, 0);
        outsideBound = true;
      }
    }

    demoLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var href = link.getAttribute('href') || '';
        var name = link.getAttribute('data-demo') || 'Ссылка';
        var msg = href.indexOf('tel:') === 0
          ? 'Это <b>демо-сайт</b> для портфолио — телефон вымышленный. В реальном проекте здесь будет живая ссылка ✂'
          : 'Это <b>демо-сайт</b> для портфолио — «' + name + '» здесь условный. В реальном проекте тут будет живая ссылка ✂';
        showToast(msg);
      });
    });
  }

  /* ---- Форма записи ---- */
  var form = document.getElementById('bookForm');
  var success = document.getElementById('bookSuccess');
  if (form && success) {
    var nameI = form.elements['name'];
    var phoneI = form.elements['phone'];
    var dateI = form.elements['date'];

    var MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

    // Границы даты: сегодня .. сегодня + 2 месяца (актуальны на момент загрузки)
    var now = new Date();
    var minDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var maxDate = new Date(now.getFullYear(), now.getMonth() + 2, now.getDate());
    dateI.min = ymd(minDate);
    dateI.max = ymd(maxDate);

    function setError(input, show, msg) {
      if (!input) return;
      input.classList.toggle('invalid', show);
      var err = form.querySelector('[data-error="' + input.name + '"]');
      if (err) {
        if (show && msg) err.textContent = msg;
        err.classList.toggle('show', show);
      }
    }
    [nameI, phoneI, dateI].forEach(function (inp) {
      var clear = function () { if (inp.classList.contains('invalid')) setError(inp, false); };
      inp.addEventListener('input', clear);
      inp.addEventListener('change', clear);
    });

    // Разбор даты с проверкой корректности (ловит мусор вроде 0055 года)
    function parseDate(v) {
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
      if (!m) return null;
      var y = +m[1], mo = +m[2] - 1, day = +m[3];
      var d = new Date(y, mo, day);
      if (d.getFullYear() !== y || d.getMonth() !== mo || d.getDate() !== day) return null;
      return d;
    }
    function formatRu(v) {
      var d = parseDate(v);
      return d ? d.getDate() + ' ' + MONTHS[d.getMonth()] : v;
    }
    function hasLetter(s) { return /[a-zа-яё]/i.test(s); }
    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;

      var nm = nameI.value.trim();
      if (nm.length < 2 || !hasLetter(nm)) { setError(nameI, true, 'Введите имя — минимум 2 буквы'); ok = false; }

      if ((phoneI.value.match(/\d/g) || []).length < 10) { setError(phoneI, true, 'Проверьте номер'); ok = false; }

      var picked = parseDate(dateI.value);
      if (!picked) {
        setError(dateI, true, 'Выберите дату');
        ok = false;
      } else if (picked < minDate || picked > maxDate) {
        setError(dateI, true, 'Дата — в пределах ближайших 2 месяцев');
        ok = false;
      }

      if (!ok) { var bad = form.querySelector('.invalid'); if (bad) bad.focus(); return; }

      document.getElementById('bookSuccessMsg').innerHTML =
        'Готово, <b>' + escapeHtml(nm) + '</b>! Ждём вас <b>' + escapeHtml(formatRu(dateI.value)) +
        '</b> в <b>' + escapeHtml(form.elements['time'].value) + '</b>.';
      form.hidden = true;
      success.hidden = false;
      success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    var again = document.getElementById('bookAgain');
    if (again) again.addEventListener('click', function () {
      form.reset();
      setError(nameI, false); setError(phoneI, false); setError(dateI, false);
      success.hidden = true;
      form.hidden = false;
    });
  }
})();
