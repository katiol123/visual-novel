/* ==========================================================================
   Диалоговое окно: табличка имени с «дешифровкой» букв, стили
   рассказчика / телефона / своих мыслей, индикатор «дальше» в виде кубика,
   журнал реплик, авто-режим и пропуск.
   ========================================================================== */
(function () {
  'use strict';
  const VN = window.VN;
  const { $, sleep } = VN.util;
  const GLYPHS = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ0123456789#%&@';

  const D = {
    box: null, nameEl: null, tagEl: null, textEl: null, current: null, lastSpeaker: undefined,

    init() {
      this.box = $('#textbox');
      this.nameEl = $('.np-name', this.box);
      this.tagEl = $('.np-tag', this.box);
      this.textEl = $('.tb-text', this.box);
    },

    show() { this.box.classList.add('open'); },
    hide() { this.box.classList.remove('open'); this.lastSpeaker = undefined; },

    decode(target, text) {
      clearInterval(this._dec);
      let f = 0;
      const total = text.length;
      this._dec = setInterval(() => {
        f++;
        const reveal = Math.floor(f / 1.6);
        target.textContent = text.split('').map((c, i) => (i < reveal || c === ' ' ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join('');
        if (reveal >= total) clearInterval(this._dec);
      }, 28);
    },

    setSpeaker(id, override) {
      const ch = VN.Characters[id] || VN.Characters.n;
      const name = override || ch.name;
      const key = id + '|' + (override || '');
      const style = ch.style || 'char';
      this.box.dataset.style = style;
      this.box.style.setProperty('--c', ch.color || '#e8e2d0');
      if (key === this.lastSpeaker) return;
      this.lastSpeaker = key;
      const plate = $('.nameplate', this.box);
      if (!name) { plate.classList.remove('on'); return; }
      plate.classList.remove('on', 'swap'); void plate.offsetWidth;
      plate.classList.add('on', 'swap');
      this.decode(this.nameEl, name);
      this.tagEl.textContent = override ? 'номер не определён' : (ch.tag || '');
    },

    async say(id, text, opts = {}) {
      this.show();
      this.setSpeaker(id, opts.as);
      VN.Stage.focus(id);
      VN.S.log.push({ id, name: opts.as || (VN.Characters[id] || {}).name, text: VN.Typewriter.strip(text) });
      if (VN.S.log.length > 200) VN.S.log.shift();

      this.box.classList.remove('ready');
      this.textEl.classList.remove('settled');
      const tw = (this.current = VN.Typewriter.type(this.textEl, text));
      const plain = VN.Typewriter.strip(text);

      // первый ввод во время печати — допечатать мгновенно
      let skipped = false;
      const early = VN.Input.wait().then((ok) => { if (ok && !tw.finished) { skipped = true; tw.finish(); } });
      await tw.done;
      this.box.classList.add('ready');
      this.textEl.classList.add('settled');

      if (VN.mode.skip) { await sleep(70); VN.Input.flush(); return; }
      if (!skipped) {
        // ожидание уже висит (early) — оно и станет «дальше»
        if (VN.mode.auto) {
          const t = sleep(1100 + plain.length * 38).then(() => VN.Input.advance());
          await Promise.race([early, t]);
        } else await early;
      } else {
        await this.waitNext(plain);
      }
      this.box.classList.remove('ready');
    },

    async waitNext(plain) {
      if (VN.mode.auto) {
        const p = VN.Input.wait();
        const t = setTimeout(() => VN.Input.advance(), 1100 + plain.length * 38);
        await p; clearTimeout(t);
      } else await VN.Input.wait();
    },
  };

  /* ---------------- журнал ---------------- */
  const Backlog = {
    open() {
      const m = VN.Modal.open('backlog', 'ЖУРНАЛ', 'Что было сказано этой ночью');
      const list = VN.util.el('div', 'log-list');
      VN.S.log.slice(-80).forEach((l) => {
        const ch = VN.Characters[l.id] || {};
        const row = VN.util.el('div', 'log-row' + (l.id === 'n' ? ' narr' : ''));
        row.style.setProperty('--c', ch.color || '#8a9488');
        row.innerHTML = (l.name ? `<b>${VN.util.esc(l.name)}</b>` : '') + `<p>${VN.util.esc(l.text)}</p>`;
        list.appendChild(row);
      });
      m.body.appendChild(list);
      requestAnimationFrame(() => { list.scrollTop = list.scrollHeight; });
    },
  };

  VN.Dialogue = D;
  VN.Backlog = Backlog;
})();
