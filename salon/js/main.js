/* からだ調律室 ナギ（架空）- main.js / 依存ライブラリなし */
(function () {
  'use strict';
  var yen = function (n) { return '¥' + n.toLocaleString('ja-JP'); };

  /* ---------- スマホメニュー ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('global-nav');
  function setNav(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.nav-toggle-label').textContent = open ? 'CLOSE' : 'MENU';
    // メニューはヘッダーの真下から表示（上部の告知帯の分も考慮）
    if (open) nav.style.top = document.querySelector('.site-header').getBoundingClientRect().bottom + 'px';
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
  }
  toggle.addEventListener('click', function () { setNav(toggle.getAttribute('aria-expanded') !== 'true'); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setNav(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setNav(false); });

  /* ---------- 料金シミュレーター（menu.html） ---------- */
  var sim = document.getElementById('sim-form');
  if (sim) {
    var calc = function () {
      var course = sim.querySelector('input[name="course"]:checked');
      var opts = Array.prototype.slice.call(sim.querySelectorAll('input[name="opt"]:checked'));
      var rows = [course].concat(opts);
      var total = 0, min = 0, html = '';
      rows.forEach(function (el) {
        var v = Number(el.value);
        total += v; min += Number(el.dataset.min);
        html += '<div><dt>' + el.dataset.label + '</dt><dd>' + (el === course ? '' : '+') + yen(v) + '</dd></div>';
      });
      document.getElementById('sim-breakdown').innerHTML = html;
      document.getElementById('sim-total').textContent = yen(total);
      document.getElementById('sim-time').textContent = '施術時間の目安：約' + min + '分';
      document.getElementById('sim-link').href = 'about.html?course=' + encodeURIComponent(course.dataset.label) + '#reserve';
    };
    sim.addEventListener('change', calc);
    sim.addEventListener('submit', function (e) { e.preventDefault(); });
    calc();
  }

  /* ---------- 営業カレンダー（about.html） ---------- */
  // ルール：水曜定休・第3木曜定休、土日は短縮営業（祝日データは未実装）
  var grid = document.getElementById('cal-grid');
  if (grid) {
    var today = new Date();
    var base = new Date(today.getFullYear(), today.getMonth(), 1);
    var offset = 0;
    var prev = document.getElementById('cal-prev');
    var next = document.getElementById('cal-next');
    var dows = ['日', '月', '火', '水', '木', '金', '土'];
    var render = function () {
      var y = base.getFullYear(), m = base.getMonth() + offset;
      var first = new Date(y, m, 1);
      var year = first.getFullYear(), month = first.getMonth();
      var days = new Date(year, month + 1, 0).getDate();
      document.getElementById('cal-title').textContent = year + '年' + (month + 1) + '月の営業日';
      var html = dows.map(function (d, i) {
        return '<span class="dow' + (i === 0 ? ' sun' : i === 6 ? ' sat' : '') + '">' + d + '</span>';
      }).join('');
      for (var i = 0; i < first.getDay(); i++) html += '<span aria-hidden="true"></span>';
      var thuCount = 0;
      for (var d = 1; d <= days; d++) {
        var dow = new Date(year, month, d).getDay();
        if (dow === 4) thuCount++;
        var cls = 'open', label = '営業';
        if (dow === 3 || (dow === 4 && thuCount === 3)) { cls = 'closed'; label = '休'; }
        else if (dow === 0 || dow === 6) { cls = 'short'; label = '〜18時'; }
        var isToday = year === today.getFullYear() && month === today.getMonth() && d === today.getDate();
        html += '<span class="cal-day ' + cls + (isToday ? ' today' : '') + '" aria-label="' + (month + 1) + '月' + d + '日 ' + (cls === 'closed' ? '定休日' : cls === 'short' ? '短縮営業' : '営業') + (isToday ? '（今日）' : '') + '">' + d + '<small>' + label + '</small></span>';
      }
      grid.innerHTML = html;
      prev.disabled = offset <= 0;
      next.disabled = offset >= 2;
    };
    prev.addEventListener('click', function () { if (offset > 0) { offset--; render(); } });
    next.addEventListener('click', function () { if (offset < 2) { offset++; render(); } });
    render();
  }

  /* ---------- 予約フォーム（デモ：送信しない） ---------- */
  var form = document.getElementById('reserve-form');
  if (form) {
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    var minDate = tomorrow.getFullYear() + '-' + String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' + String(tomorrow.getDate()).padStart(2, '0');
    form.querySelectorAll('input[type="date"]').forEach(function (el) { el.min = minDate; });

    // 料金シミュレーターから来た場合はコースを選択済みにする
    var params = new URLSearchParams(location.search);
    var pre = params.get('course');
    if (pre) {
      Array.prototype.forEach.call(form.course.options, function (o) { if (o.text.indexOf(pre) === 0) o.selected = true; });
    }

    var isClosed = function (value) {
      var dt = new Date(value + 'T00:00:00');
      var dow = dt.getDay();
      return dow === 3 || (dow === 4 && Math.ceil(dt.getDate() / 7) === 3);
    };
    var check = function (el) {
      var msg = '';
      var v = el.type === 'checkbox' ? el.checked : el.value.trim();
      if (el.required && !v) {
        msg = el.type === 'checkbox' ? 'キャンセルポリシーへの同意が必要です。' : el.tagName === 'SELECT' ? 'コースを選択してください。' : 'この項目を入力してください。';
      } else if (el.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        msg = 'メールアドレスの形式を確認してください（例：sample@example.com）。';
      } else if (el.type === 'date' && v) {
        if (v < el.min) msg = '翌日以降の日付を選んでください。';
        else if (isClosed(v)) msg = 'その日は定休日です（水曜・第3木曜）。別の日を選んでください。';
      }
      var wrap = el.closest('.form-control') || el.closest('.agree');
      var err = wrap.querySelector('.field-error');
      if (err) err.textContent = msg;
      wrap.classList.toggle('has-error', !!msg);
      el.setAttribute('aria-invalid', String(!!msg));
      return !msg;
    };
    var fields = form.querySelectorAll('input[required], select[required], input[type="date"]');
    fields.forEach(function (el) { el.addEventListener('change', function () { check(el); }); });
    form.addEventListener('submit', function (e) {
      e.preventDefault(); // デモのため送信しない
      var firstBad = null;
      fields.forEach(function (el) { if (!check(el) && !firstBad) firstBad = el; });
      var done = document.getElementById('form-done');
      if (firstBad) { done.hidden = true; firstBad.focus(); return; }
      var data = [
        ['お名前', form.elements['name'].value], ['メール', form.email.value],
        ['ご来院', form.querySelector('input[name="visit"]:checked').value],
        ['コース', form.course.value], ['第1希望日', form.date1.value], ['第2希望日', form.date2.value || '—']
      ];
      var dl = document.getElementById('form-summary');
      dl.innerHTML = '';
      data.forEach(function (row) {
        var dt = document.createElement('dt'); dt.textContent = row[0];
        var dd = document.createElement('dd'); dd.textContent = row[1];
        dl.appendChild(dt); dl.appendChild(dd);
      });
      done.hidden = false;
      done.focus();
    });
  }
})();
