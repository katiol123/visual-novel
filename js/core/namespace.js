/* ==========================================================================
   VN namespace, утилиты, шина событий и ввод.
   Все модули регистрируются в window.VN — игра запускается прямо из файла
   (file://) без сборки и без локального сервера.
   ========================================================================== */
(function () {
  'use strict';
  const VN = (window.VN = window.VN || {});

  /* ---------- утилиты ---------- */
  VN.util = {
    $(sel, root = document) { return root.querySelector(sel); },
    $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); },
    el(tag, cls, html) {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (html != null) e.innerHTML = html;
      return e;
    },
    sleep(ms) { return new Promise((r) => setTimeout(r, ms)); },
    frame() { return new Promise((r) => requestAnimationFrame(() => r())); },
    rand(a, b) { return a + Math.random() * (b - a); },
    randInt(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); },
    pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    clamp(v, a, b) { return Math.max(a, Math.min(b, v)); },
    clone(o) { return JSON.parse(JSON.stringify(o)); },
    esc(s) {
      return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    },
    /** Детерминированный ГПСЧ — фоны рисуются одинаково при каждом заходе. */
    seeded(seed) {
      let a = seed >>> 0;
      return function () {
        a |= 0; a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },
    /** Ждёт animationend/transitionend, но не дольше fallback мс. */
    settle(el, fallback = 800) {
      return new Promise((resolve) => {
        let done = false;
        const fin = () => { if (!done) { done = true; resolve(); } };
        el.addEventListener('animationend', fin, { once: true });
        el.addEventListener('transitionend', fin, { once: true });
        setTimeout(fin, fallback);
      });
    },
  };

  /* ---------- шина событий ---------- */
  const handlers = {};
  VN.bus = {
    on(ev, fn) { (handlers[ev] = handlers[ev] || []).push(fn); return () => this.off(ev, fn); },
    off(ev, fn) { handlers[ev] = (handlers[ev] || []).filter((h) => h !== fn); },
    emit(ev, data) { (handlers[ev] || []).slice().forEach((h) => h(data)); },
  };

  /* ---------- режимы чтения ---------- */
  VN.mode = { auto: false, skip: false, uiHidden: false, textSpeed: 1 };

  /* ---------- ввод «дальше» ----------
     Диалог, карточки досье и т.п. ждут VN.Input.wait(). Клик по сцене,
     Пробел или Enter разрешают ожидание. Модальные окна блокируют ввод. */
  const waiters = [];
  VN.Input = {
    modal: 0,
    wait() { return new Promise((r) => waiters.push(r)); },
    advance() {
      if (this.modal > 0) return false;
      const w = waiters.splice(0);
      w.forEach((r) => r(true));
      return w.length > 0;
    },
    /** Сбросить все ожидания (при загрузке/рестарте). */
    flush() { waiters.splice(0).forEach((r) => r(false)); },
  };

  /* ---------- масштаб сцены 1920×1080 ---------- */
  VN.W = 1920;
  VN.H = 1080;
  VN.scale = 1;
  VN.fit = function () {
    const vw = window.innerWidth, vh = window.innerHeight;
    VN.scale = Math.min(vw / VN.W, vh / VN.H);
    const g = document.getElementById('game');
    if (!g) return;
    g.style.transform = `translate(-50%, -50%) scale(${VN.scale})`;
  };
})();
