/* 株式会社リクト計測（架空）- main.js / 依存ライブラリなし */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- スマホメニュー ---------- */
  var toggle = $('.nav-toggle');
  var nav = $('#global-nav');
  function setNav(open) {
    if (open) nav.style.top = $('.site-header').getBoundingClientRect().bottom + 'px';
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
  }
  toggle.addEventListener('click', function () { setNav(toggle.getAttribute('aria-expanded') !== 'true'); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setNav(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setNav(false); });

  /* ---------- 表示アニメーション・数値カウントアップ ---------- */
  var animateCount = function (el) {
    var target = Number(el.dataset.count);
    var decimals = Number(el.dataset.decimals || 0);
    var start = null;
    var step = function (ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / 1200, 1);
      var v = target * (1 - Math.pow(1 - p, 3));
      el.textContent = v.toLocaleString('ja-JP', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        if (en.target.dataset.count) animateCount(en.target);
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal, [data-count]').forEach(function (el) { io.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- ページ内ナビの現在地（solutions.html） ---------- */
  var anchorLinks = $$('.anchor-nav a');
  if (anchorLinks.length && 'IntersectionObserver' in window) {
    var secIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        anchorLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    anchorLinks.forEach(function (a) { var t = $(a.getAttribute('href')); if (t) secIo.observe(t); });
  }

  /* ---------- 絞り込みボタン（共通） ---------- */
  var setupFilter = function (buttons, items, attr, onChange) {
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.dataset.filter;
        buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        var shown = 0;
        items.forEach(function (it) {
          var hit = f === 'all' || it.dataset[attr] === f;
          it.hidden = !hit;
          if (hit) { shown++; it.classList.add('is-in'); }
        });
        if (onChange) onChange(shown);
      });
    });
  };

  /* ---------- 製品：絞り込み＋仕様比較（products.html） ---------- */
  var productGrid = $('#product-grid');
  if (productGrid) {
    setupFilter($$('.filter-btn:not(.case-filter)'), $$('.product-card'), 'cat');
    var checks = $$('.compare-check');
    var bar = $('#compare-bar');
    var out = $('#compare-output');
    var renderCompare = function () {
      var picked = checks.filter(function (c) { return c.checked; });
      checks.forEach(function (c) { c.disabled = !c.checked && picked.length >= 3; });
      $('#compare-count').textContent = picked.length;
      bar.classList.toggle('is-visible', picked.length > 0);
      if (!picked.length) { out.innerHTML = '<p class="empty-note">比較する製品が選ばれていません。</p>'; return; }
      var cards = picked.map(function (c) { return c.closest('.product-card'); });
      var rows = {};
      var order = [];
      cards.forEach(function (card, i) {
        $$('.product-specs div', card).forEach(function (d) {
          var k = $('dt', d).textContent;
          if (!rows[k]) { rows[k] = []; order.push(k); }
          rows[k][i] = $('dd', d).textContent;
        });
      });
      var esc = function (s) { var t = document.createElement('span'); t.textContent = s; return t.innerHTML; };
      var html = '<div class="table-scroll"><table class="spec-table"><thead><tr><th scope="col">項目</th>';
      cards.forEach(function (card) { html += '<th scope="col">' + esc(card.dataset.model) + '</th>'; });
      html += '</tr></thead><tbody><tr><th scope="row">カテゴリ</th>';
      cards.forEach(function (card) { html += '<td>' + esc($('.product-cat', card).textContent) + '</td>'; });
      html += '</tr>';
      order.forEach(function (k) {
        html += '<tr><th scope="row">' + esc(k) + '</th>';
        cards.forEach(function (_, i) { html += '<td>' + esc(rows[k][i] || '—') + '</td>'; });
        html += '</tr>';
      });
      out.innerHTML = html + '</tbody></table></div>';
    };
    checks.forEach(function (c) { c.addEventListener('change', renderCompare); });
    $('#compare-clear').addEventListener('click', function () { checks.forEach(function (c) { c.checked = false; }); renderCompare(); });
    renderCompare();
  }

  /* ---------- 導入事例：業種で絞り込み（cases.html） ---------- */
  var caseList = $('#case-list');
  if (caseList) {
    setupFilter($$('.case-filter'), $$('.case-detail'), 'ind', function (n) {
      $('#case-count').textContent = n + '件の事例を表示しています';
    });
  }

  /* ---------- お問い合わせフォーム（contact.html：デモ・送信しない） ---------- */
  var form = $('#contact-form');
  if (form) {
    var steps = $$('#steps li');
    var panes = { input: $('[data-step="input"]', form), confirm: $('[data-step="confirm"]', form), done: $('[data-step="done"]', form) };
    var go = function (name) {
      var idx = ['input', 'confirm', 'done'].indexOf(name);
      Object.keys(panes).forEach(function (k) { panes[k].hidden = k !== name; });
      steps.forEach(function (li, i) { li.classList.toggle('is-current', i === idx); li.classList.toggle('is-done', i < idx); });
      var offset = $('.site-header').getBoundingClientRect().height + 24;
      window.scrollTo({ top: $('#steps').getBoundingClientRect().top + window.scrollY - offset, behavior: reduceMotion ? 'auto' : 'smooth' });
    };
    // 資料請求ボタンから来た場合
    if (new URLSearchParams(location.search).get('type') === 'doc') $('#type-doc').checked = true;
    var msg = $('#c-message');
    var syncType = function () {
      // 資料請求のときは「お問い合わせ内容」を任意にする
      var isDoc = form.elements.type.value === '資料請求';
      msg.required = !isDoc;
      $('#msg-req').hidden = isDoc;
      if (isDoc) { var f = msg.closest('.f-field'); f.classList.remove('has-error'); $('.err', f).textContent = ''; }
    };
    $$('input[name="type"]', form).forEach(function (r) { r.addEventListener('change', syncType); });
    syncType();
    msg.addEventListener('input', function () { $('#msg-count').textContent = msg.value.length; });

    var validate = function (el) {
      var v = el.type === 'checkbox' ? el.checked : el.value.trim();
      var m = '';
      if (el.required && !v) m = el.type === 'checkbox' ? '個人情報の取り扱いへの同意が必要です。' : '入力してください。';
      else if (el.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) m = 'メールアドレスの形式が正しくありません。';
      else if (el.type === 'tel' && v && !/^[0-9\-+() ]{10,15}$/.test(v)) m = '電話番号は半角数字とハイフンで入力してください。';
      else if (el === msg && v.length > 1000) m = '1000文字以内で入力してください。';
      var wrap = el.closest('.f-field') || el.closest('.privacy');
      wrap.classList.toggle('has-error', !!m);
      var err = $('.err', wrap); if (err) err.textContent = m;
      el.setAttribute('aria-invalid', String(!!m));
      return !m;
    };
    var targets = $$('input[required], textarea, input[type="tel"], input[type="email"]', panes.input);
    targets.forEach(function (el) { el.addEventListener('blur', function () { validate(el); }); });

    form.addEventListener('submit', function (e) {
      e.preventDefault(); // デモのため送信しない
      var bad = null;
      targets.concat([$('#c-privacy')]).forEach(function (el) { if (!validate(el) && !bad) bad = el; });
      if (bad) { bad.focus(); return; }
      var fd = new FormData(form);
      var rows = [
        ['お問い合わせの種類', fd.get('type')], ['会社名', fd.get('company')], ['部署名', fd.get('dept') || '—'],
        ['お名前', fd.get('person')], ['メールアドレス', fd.get('email')], ['電話番号', fd.get('tel') || '—'],
        ['従業員規模', fd.get('size') || '—'], ['関心のある領域', fd.getAll('interest').join('、') || '—'],
        ['お問い合わせ内容', fd.get('message') || '—']
      ];
      var tb = $('#confirm-body');
      tb.innerHTML = '';
      rows.forEach(function (r) {
        var tr = document.createElement('tr');
        var th = document.createElement('th'); th.scope = 'row'; th.textContent = r[0];
        var td = document.createElement('td'); td.textContent = r[1];
        tr.appendChild(th); tr.appendChild(td); tb.appendChild(tr);
      });
      go('confirm');
    });
    $('#back-btn').addEventListener('click', function () { go('input'); });
    $('#send-btn').addEventListener('click', function () {
      go('done'); // 実際の送信処理は未実装（デモ）
      $('#done-box').focus({ preventScroll: true });
    });
  }
})();
