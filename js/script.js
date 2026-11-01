/* ==========================================================
   Барбершоп «ТОПОР» — интерактив
   Чистый JS, без библиотек: бургер, reveal, тултипы, форма записи.
   ========================================================== */

(function () {
  'use strict';

  /* ---- Мобильное меню (оверлей на весь экран) ---- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  if (burger && nav) {
    var root = document.documentElement;
    var toggleMenu = function (open) {
      var isOpen = open === undefined ? !nav.classList.contains('open') : open;
      nav.classList.toggle('open', isOpen);
      burger.classList.toggle('open', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
      burger.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
      root.classList.toggle('menu-open', isOpen); // блокирует прокрутку страницы
    };
    burger.addEventListener('click', function () { toggleMenu(); });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { toggleMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { toggleMenu(false); burger.focus(); }
    });
    // при расширении окна до десктопа меню сбрасывается
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900 && nav.classList.contains('open')) toggleMenu(false);
    });
  }

  /* ---- Появление при скролле ---- */
  var reveals = document.querySelectorAll('.reveal');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && reveals.length && !reduceMotion) {
    var pending = Array.prototype.slice.call(reveals);
    var show = function (el) {
      el.classList.add('is-visible');
      io.unobserve(el);
      var k = pending.indexOf(el);
      if (k !== -1) pending.splice(k, 1);
    };
    // срабатывает заранее: нижняя граница области наблюдения сдвинута на 15% вниз
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) show(en.target); });
    }, { threshold: 0, rootMargin: '0px 0px 15% 0px' });
    reveals.forEach(function (el) { io.observe(el); });

    // страховка при быстрой прокрутке: всё, что выше нижнего края экрана, показываем сразу
    var ticking = false;
    var sweep = function () {
      ticking = false;
      var edge = window.innerHeight;
      pending.slice().forEach(function (el) {
        if (el.getBoundingClientRect().top < edge) show(el);
      });
    };
    var onScroll = function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(sweep); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    sweep();
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
          : 'Это <b>демо-сайт</b> для портфолио — ссылка на «' + name + '» здесь условная. В реальном проекте она будет рабочей ✂';
        showToast(msg);
      });
    });
  }

  /* ---- Маска телефона ---- */
  // Формат +7 (999) 123-45-67; «национальные» цифры — 10 штук после +7
  var PHONE_PREFIX = "+7 (";
  var PHONE_LENGTH = 10;

  // Цифры без кода страны (ввод с 8, 7, +7). Ведущая 7/8 — код страны, только если строка
  // начинается с «+7» или «7 (» / «8 (», номер набран целиком (11 цифр) или это первая цифра
  function extractPhoneDigits(raw) {
    var text = String(raw);
    var digits = text.replace(/\D/g, "");
    var startsWithCode = /^\s*(\+\s*7|[78]\s*\()/.test(text);
    var looksLikeCode = digits.length > 0 && (digits.charAt(0) === "7" || digits.charAt(0) === "8") &&
      (digits.length === 1 || digits.length > PHONE_LENGTH);
    var hasCountryCode = startsWithCode || looksLikeCode;
    if (hasCountryCode) {
      digits = digits.slice(1);
    }
    return { digits: digits.slice(0, PHONE_LENGTH), hasCountryCode: hasCountryCode };
  }

  // Разделители появляются только перед следующей цифрой — в конце не висит «) » или «-»
  function formatPhone(digits) {
    if (digits.length === 0) {
      return "";
    }
    var result = PHONE_PREFIX + digits.slice(0, 3);
    if (digits.length > 3) {
      result += ") " + digits.slice(3, 6);
    }
    if (digits.length > 6) {
      result += "-" + digits.slice(6, 8);
    }
    if (digits.length > 8) {
      result += "-" + digits.slice(8, 10);
    }
    return result;
  }

  // Позиция курсора сразу после N-й национальной цифры
  function caretAfterDigit(formatted, digitCount) {
    if (digitCount <= 0) {
      return formatted.length === 0 ? 0 : PHONE_PREFIX.length;
    }
    var seen = 0;
    for (var i = PHONE_PREFIX.length; i < formatted.length; i++) {
      if (/\d/.test(formatted.charAt(i))) {
        seen++;
        if (seen === digitCount) {
          return i + 1;
        }
      }
    }
    return formatted.length;
  }

  // Сколько национальных цифр стоит левее позиции
  function nationalDigitsBefore(formatted, position) {
    var count = 0;
    var end = Math.min(position, formatted.length);
    for (var i = PHONE_PREFIX.length; i < end; i++) {
      if (/\d/.test(formatted.charAt(i))) {
        count++;
      }
    }
    return count;
  }

  // Обычный ввод: сырое значение + позиция курсора → маска + новый курсор
  function maskPhoneInput(raw, caret) {
    raw = String(raw);
    // Набрали перед «+7 (» — переносим набранное за префикс
    var prefixIndex = raw.indexOf(PHONE_PREFIX);
    if (prefixIndex > 0) {
      var typed = raw.slice(0, prefixIndex);
      raw = PHONE_PREFIX + typed + raw.slice(prefixIndex + PHONE_PREFIX.length);
      caret = PHONE_PREFIX.length + typed.length;
    }
    var parsed = extractPhoneDigits(raw);
    // Поле уже начинается с «+7 (», а человек набирает 8 или 7 — это код страны, не цифра номера
    if (parsed.hasCountryCode && (parsed.digits === "7" || parsed.digits === "8")) {
      parsed.digits = "";
    }
    var value = parsed.digits.length === 0 && parsed.hasCountryCode ? PHONE_PREFIX : formatPhone(parsed.digits);
    var digitsBeforeCaret = raw.slice(0, caret).replace(/\D/g, "").length;
    if (parsed.hasCountryCode) {
      digitsBeforeCaret--;
    }
    digitsBeforeCaret = Math.max(0, Math.min(digitsBeforeCaret, parsed.digits.length));
    return { value: value, caret: caretAfterDigit(value, digitsBeforeCaret) };
  }

  // Вставка: целый номер заменяет поле, кусок цифр вставляется в позицию курсора
  function maskPhonePaste(current, selectionStart, selectionEnd, pasted) {
    var pastedDigits = String(pasted).replace(/\D/g, "");
    if (pastedDigits.length >= PHONE_LENGTH) {
      var value = formatPhone(extractPhoneDigits(pasted).digits);
      return { value: value, caret: value.length };
    }
    var raw = String(current).slice(0, selectionStart) + pastedDigits + String(current).slice(selectionEnd);
    return maskPhoneInput(raw, selectionStart + pastedDigits.length);
  }

  // Backspace: стирает ближайшую цифру слева, даже если слева «) », «-» или пробел
  function deleteDigitBefore(formatted, caret) {
    var digits = extractPhoneDigits(formatted).digits;
    var before = nationalDigitsBefore(formatted, caret);
    if (before === 0) {
      return digits.length === 0 ? { value: "", caret: 0 } : { value: formatted, caret: PHONE_PREFIX.length };
    }
    var value = formatPhone(digits.slice(0, before - 1) + digits.slice(before));
    return { value: value, caret: caretAfterDigit(value, before - 1) };
  }

  // Delete: стирает ближайшую цифру справа
  function deleteDigitAfter(formatted, caret) {
    var digits = extractPhoneDigits(formatted).digits;
    var before = nationalDigitsBefore(formatted, caret);
    if (before >= digits.length) {
      return { value: formatted, caret: caret };
    }
    var value = formatPhone(digits.slice(0, before) + digits.slice(before + 1));
    return { value: value, caret: caretAfterDigit(value, before) };
  }

  // Текст ошибки или "": ровно 10 цифр после +7, первая — 9
  function validatePhone(value) {
    var digits = extractPhoneDigits(value).digits;
    if (digits.length === 0) {
      return "Введите телефон";
    }
    if (digits.length !== PHONE_LENGTH) {
      return "Номер неполный — нужно 10 цифр после +7";
    }
    if (digits.charAt(0) !== "9") {
      return "Мобильный номер начинается с 9";
    }
    return "";
  }

  // DOM-обвязка: после каждого изменения значения поле получает событие «phonemask»
  function attachPhoneMask(input) {
    var valueBefore = "";
    var caretBefore = 0;

    function apply(result) {
      input.value = result.value;
      if (document.activeElement === input) {
        input.setSelectionRange(result.caret, result.caret);
      }
      input.dispatchEvent(new CustomEvent("phonemask"));
    }

    // Курсор не пускаем внутрь «+7 (» — иначе цифра встанет перед кодом страны
    function keepCaretAfterPrefix() {
      if (input.value.indexOf(PHONE_PREFIX) === 0 && input.selectionStart < PHONE_PREFIX.length &&
          input.selectionStart === input.selectionEnd) {
        input.setSelectionRange(PHONE_PREFIX.length, PHONE_PREFIX.length);
      }
    }

    // Удаление перехватываем до браузера: иначе Backspace по «) » или «-» стирает разделитель,
    // маска возвращает его — и курсор «застревает»
    input.addEventListener("beforeinput", function (event) {
      valueBefore = input.value;
      caretBefore = input.selectionStart;
      var isBackward = event.inputType === "deleteContentBackward";
      var isForward = event.inputType === "deleteContentForward";
      if (!isBackward && !isForward) {
        return;
      }
      if (!event.cancelable || input.selectionStart !== input.selectionEnd) {
        return;
      }
      event.preventDefault();
      apply(isBackward ? deleteDigitBefore(input.value, caretBefore) : deleteDigitAfter(input.value, caretBefore));
    });

    input.addEventListener("paste", function (event) {
      var text = event.clipboardData ? event.clipboardData.getData("text") : "";
      if (!text) {
        return;
      }
      event.preventDefault();
      apply(maskPhonePaste(input.value, input.selectionStart, input.selectionEnd, text));
    });

    input.addEventListener("input", function (event) {
      // Страховка для клавиатур, где beforeinput не отменяется (часть Android IME):
      // браузер стёр только разделитель — стираем цифру сами
      var deletedBackward = event.inputType === "deleteContentBackward";
      if (deletedBackward && valueBefore && extractPhoneDigits(input.value).digits === extractPhoneDigits(valueBefore).digits) {
        apply(deleteDigitBefore(valueBefore, caretBefore));
        return;
      }
      apply(maskPhoneInput(input.value, input.selectionStart));
    });

    input.addEventListener("focus", function () {
      if (input.value === "") {
        input.value = PHONE_PREFIX;
      }
      requestAnimationFrame(function () {
        if (input.value === PHONE_PREFIX) {
          input.setSelectionRange(PHONE_PREFIX.length, PHONE_PREFIX.length);
        }
        keepCaretAfterPrefix();
      });
    });
    input.addEventListener("click", keepCaretAfterPrefix);
    input.addEventListener("keyup", keepCaretAfterPrefix);

    input.addEventListener("blur", function () {
      if (input.value === PHONE_PREFIX) {
        input.value = "";
      }
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
      input.setAttribute('aria-invalid', show ? 'true' : 'false');
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
      inp.addEventListener('phonemask', clear);
    });
    attachPhoneMask(phoneI);

    /* ---- Время записи «сегодня» ---- */
    // Ближайший слот сегодня — не раньше чем через час от текущего времени
    var LEAD_MINUTES = 60;
    var timeI = form.elements['time'];
    var NO_SLOTS_MSG = "На сегодня свободного времени нет — выберите другой день";

    // Слот в минутах от полуночи: "14:00" → 840
    function slotMinutes(t) {
      var p = String(t).split(":");
      return (+p[0]) * 60 + (+p[1]);
    }
    function isTodayDate(d) {
      return !!d && ymd(d) === ymd(new Date());
    }
    function slotPassed(d, t) {
      if (!isTodayDate(d)) {
        return false;
      }
      var n = new Date();
      return slotMinutes(t) < n.getHours() * 60 + n.getMinutes() + LEAD_MINUTES;
    }
    // Отключает прошедшие слоты; возвращает false, если на выбранный сегодняшний день слотов не осталось
    function updateSlots() {
      var picked = parseDate(dateI.value);
      var firstFree = null;
      Array.prototype.forEach.call(timeI.options, function (opt) {
        opt.disabled = slotPassed(picked, opt.value);
        if (!opt.disabled && !firstFree) {
          firstFree = opt;
        }
      });
      var current = timeI.options[timeI.selectedIndex];
      if (!current || current.disabled) {
        if (firstFree) {
          timeI.value = firstFree.value;
        }
      }
      return !!firstFree;
    }
    function onDateChange() {
      if (!updateSlots()) {
        setError(dateI, true, NO_SLOTS_MSG);
      }
    }
    dateI.addEventListener('input', onDateChange);
    dateI.addEventListener('change', onDateChange);
    updateSlots();

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

      var phoneError = validatePhone(phoneI.value);
      if (phoneError) { setError(phoneI, true, phoneError); ok = false; }

      var picked = parseDate(dateI.value);
      if (!picked) {
        setError(dateI, true, 'Выберите дату');
        ok = false;
      } else if (picked < minDate || picked > maxDate) {
        setError(dateI, true, 'Дата — в пределах ближайших 2 месяцев');
        ok = false;
      } else if (!updateSlots()) {
        setError(dateI, true, NO_SLOTS_MSG);
        ok = false;
      } else if (slotPassed(picked, timeI.value)) {
        setError(dateI, true, 'Это время уже прошло — выберите другое');
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
      updateSlots();
      setError(nameI, false); setError(phoneI, false); setError(dateI, false);
      success.hidden = true;
      form.hidden = false;
    });
  }
})();
