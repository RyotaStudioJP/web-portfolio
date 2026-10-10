/* 薪窯パン工房 ルピナ（架空店舗）- main.js
   依存ライブラリなし（Vanilla JS） */
(function () {
  'use strict';

  /* ---------- スマホ用ハンバーガーメニュー ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('global-nav');
  function setNav(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    // メニューはヘッダーの真下から表示（上部の告知帯の分も考慮）
    if (open) nav.style.top = document.querySelector('.site-header').getBoundingClientRect().bottom + 'px';
    nav.classList.toggle('is-open', open);
  }
  toggle.addEventListener('click', function () {
    setNav(toggle.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setNav(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setNav(false);
  });

  /* ---------- メニューの絞り込みタブ ---------- */
  var tabs = document.querySelectorAll('.menu-tabs [role="tab"]');
  var items = document.querySelectorAll('.menu-item');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var filter = tab.dataset.filter;
      tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t === tab)); });
      items.forEach(function (item) {
        item.classList.toggle('is-hidden', filter !== 'all' && item.dataset.cat !== filter);
      });
    });
  });

  /* ---------- 現在の営業状況（端末の時刻で判定） ---------- */
  // 営業日：水〜日 8:00〜17:00（月・火定休）
  var statusEl = document.getElementById('open-status');
  function updateStatus() {
    var now = new Date();
    var day = now.getDay(); // 0=日, 1=月, 2=火
    var minutes = now.getHours() * 60 + now.getMinutes();
    var text, open = false;
    if (day === 1 || day === 2) {
      text = '本日は定休日です（月・火曜定休）';
    } else if (minutes < 8 * 60) {
      text = '本日は 8:00 から営業します';
    } else if (minutes < 17 * 60) {
      open = true;
      text = 'ただいま営業中（17:00まで）';
    } else {
      text = '本日の営業は終了しました';
    }
    statusEl.classList.toggle('is-open', open);
    statusEl.classList.toggle('is-closed', !open);
    statusEl.querySelector('.status-text').textContent = text;
  }
  updateStatus();
  setInterval(updateStatus, 60 * 1000);

  /* ---------- スクロール連動（ページ上部ボタン・スマホ固定CTA） ---------- */
  var toTop = document.querySelector('.to-top');
  var spCta = document.querySelector('.sp-cta');
  var reserve = document.getElementById('reserve');
  function onScroll() {
    var y = window.scrollY;
    toTop.classList.toggle('is-visible', y > 600);
    var reserveTop = reserve.getBoundingClientRect().top;
    spCta.classList.toggle('is-visible', y > 500 && reserveTop > window.innerHeight * 0.6);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 表示アニメーション ---------- */
  var targets = document.querySelectorAll('.feature, .menu-item, .timeline li, .news-list li, .map-card');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (el) { el.classList.add('reveal'); io.observe(el); });
  }

  /* ---------- 取り置き予約フォーム（デモ：送信しない） ---------- */
  var form = document.getElementById('reserve-form');
  var result = document.getElementById('form-result');
  var dateInput = form.querySelector('input[type="date"]');
  // 受け取り日は翌日以降のみ選択可能
  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  dateInput.min = tomorrow.toISOString().slice(0, 10);

  var messages = {
    name: 'お名前を入力してください。',
    tel: '電話番号を入力してください（数字とハイフンのみ）。',
    date: '受け取り日を選択してください（翌日以降）。',
    items: 'ご希望のパンと個数を入力してください。'
  };
  function validateField(el) {
    var field = el.closest('.field');
    var error = field.querySelector('.error');
    var ok = el.value.trim() !== '';
    if (ok && el.name === 'tel') ok = /^[0-9０-９\-－]{10,13}$/.test(el.value.trim());
    if (ok && el.name === 'date') ok = el.value >= el.min;
    field.classList.toggle('has-error', !ok);
    if (error) error.textContent = ok ? '' : messages[el.name];
    el.setAttribute('aria-invalid', String(!ok));
    return ok;
  }
  form.querySelectorAll('[required]').forEach(function (el) {
    el.addEventListener('blur', function () { validateField(el); });
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault(); // デモのため送信しない
    var allOk = true;
    var firstInvalid = null;
    form.querySelectorAll('[required]').forEach(function (el) {
      if (!validateField(el)) {
        allOk = false;
        if (!firstInvalid) firstInvalid = el;
      }
    });
    if (!allOk) {
      result.hidden = true;
      firstInvalid.focus();
      return;
    }
    result.hidden = false;
    result.focus();
  });
})();
