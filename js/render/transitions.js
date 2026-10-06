/* ==========================================================================
   Переходы между сценами и экранные эффекты.
   Переход = «закрыть» экран → поменять фон → «открыть».
     blinds  — нуарные жалюзи
     ink     — диафрагма объектива
     flash   — вспышка фотокамеры
     glitch  — цифровой разрыв
     fade    — затемнение
   Плюс: карточка главы (полицейская лента) и штамп локации.
   ========================================================================== */
(function () {
  'use strict';
  const VN = window.VN;
  const { el, sleep } = VN.util;

  const layer = () => document.getElementById('transition');

  const Trans = {
    async run(type, mid) {
      if (VN.mode.skip && type !== 'none') type = 'fade';
      const L = layer();
      if (type === 'none' || !type) { await mid(); return; }
      const box = el('div', 'tr tr-' + type);
      if (type === 'blinds') for (let i = 0; i < 14; i++) box.appendChild(el('i', '', '')).style.setProperty('--i', i);
      if (type === 'glitch') for (let i = 0; i < 10; i++) box.appendChild(el('i', '', '')).style.setProperty('--i', i);
      L.appendChild(box);
      VN.Audio.sfx(type === 'flash' ? 'flash' : type === 'glitch' ? 'glitch' : 'whoosh');
      await VN.util.frame();
      box.classList.add('cover');
      await sleep(type === 'flash' ? 220 : 700);
      await mid();
      await sleep(type === 'flash' ? 120 : 220);
      box.classList.add('reveal');
      await sleep(type === 'flash' ? 700 : 750);
      box.remove();
    },

    async chapter(kicker, title) {
      const L = layer();
      const c = el('div', 'chapter');
      c.innerHTML = `
        <div class="tape tape-a"><span>${'НЕ ПЕРЕСЕКАТЬ · ПОЛИЦИЯ · '.repeat(8)}</span></div>
        <div class="tape tape-b"><span>${'МЕСТО ПРЕСТУПЛЕНИЯ · '.repeat(8)}</span></div>
        <div class="chapter-kicker">${kicker}</div>
        <div class="chapter-title">${title}</div>`;
      L.appendChild(c);
      VN.Audio.sample('braam');
      await VN.util.frame();
      c.classList.add('in');
      await sleep(VN.mode.skip ? 400 : 2600);
      c.classList.add('out');
      await sleep(700);
      c.remove();
    },

    place(name) {
      const old = document.querySelector('.placecard');
      if (old) old.remove();
      const p = el('div', 'placecard');
      p.innerHTML = `<div class="pc-dot"></div><div class="pc-text"><b></b><span>${VN.State.clock()} · 31.12</span></div>`;
      document.getElementById('game').appendChild(p);
      const b = p.querySelector('b');
      let i = 0;
      const type = () => { if (i <= name.length) { b.textContent = name.slice(0, i++); VN.Audio.tick(); setTimeout(type, 34); } };
      requestAnimationFrame(() => { p.classList.add('in'); type(); });
      setTimeout(() => p.classList.add('out'), 4200);
      setTimeout(() => p.remove(), 5200);
    },
  };

  /* ---------------- экранные эффекты ---------------- */
  const Fx = {
    shake(power = 10, ms = 450) {
      const g = document.getElementById('shaker');
      g.style.setProperty('--p', power + 'px');
      g.classList.remove('shaking'); void g.offsetWidth;
      g.classList.add('shaking');
      clearTimeout(this._sh);
      this._sh = setTimeout(() => g.classList.remove('shaking'), ms);
    },
    flash(color = '#fff', ms = 300) {
      const f = el('div', 'fx-flash');
      f.style.background = color; f.style.animationDuration = ms + 'ms';
      document.getElementById('fx').appendChild(f);
      setTimeout(() => f.remove(), ms + 50);
    },
    glitch(ms = 600) {
      const g = document.getElementById('game');
      g.classList.add('glitching');
      VN.Audio.sfx('glitch');
      setTimeout(() => g.classList.remove('glitching'), ms);
    },
    laser(on) {
      const fx = document.getElementById('fx');
      let l = fx.querySelector('.laser');
      if (!on) { if (l) l.remove(); return; }
      if (l) return;
      l = el('div', 'laser', '<i class="laser-beam"></i><i class="laser-dot"></i>');
      fx.appendChild(l);
    },
    run(name) {
      switch (name) {
        case 'shake': this.shake(12); break;
        case 'bigshake': this.shake(28, 700); break;
        case 'flash': this.flash('#fff', 300); break;
        case 'redflash': this.flash('rgba(255,20,50,0.6)', 400); break;
        case 'glitch': this.glitch(); break;
        case 'fireworks': VN.Backdrop.fireworks(12000); break;
        case 'laser': this.laser(true); break;
        case 'nolaser': this.laser(false); break;
        case 'shot': VN.Audio.sfx('sniper'); this.flash('#fff', 160); this.shake(22, 600); break;
      }
    },
  };

  VN.Trans = Trans;
  VN.Fx = Fx;
})();
