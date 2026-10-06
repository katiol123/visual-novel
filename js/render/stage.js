/* ==========================================================================
   Спрайты на сцене: появление (силуэт → цвет, сброс сверху, скольжение,
   глитч), фокус на говорящем, тряска, удар. Плюс карточка-досье
   при первой встрече с персонажем.
   ========================================================================== */
(function () {
  'use strict';
  const VN = window.VN;
  const { el, sleep, settle } = VN.util;

  const POS = { farleft: 300, left: 590, center: 960, right: 1330, farright: 1620, top: 1500 };

  const Stage = {
    root: null, sprites: {},

    init(root) { this.root = root; },

    async show(id, at = 'center', enter = 'silhouette', instant) {
      const ch = VN.Characters[id];
      if (!ch || !ch.sprite) return;
      const x = POS[at] != null ? POS[at] : POS.center;
      let sp = this.sprites[id];
      VN.S.stage.sprites[id] = { at };
      if (sp) {
        sp.style.left = x + 'px';
        sp.dataset.at = at;
        await sleep(instant ? 0 : 450);
        return;
      }
      sp = el('div', 'sprite');
      sp.dataset.id = id; sp.dataset.at = at;
      sp.style.left = x + 'px';
      sp.style.setProperty('--rim', ch.color);
      sp.innerHTML = `<div class="sprite-shadow"></div><div class="sprite-body"><img class="sprite-img" src="${ch.sprite}" alt="" draggable="false"></div>`;
      this.root.appendChild(sp);
      this.sprites[id] = sp;
      if (instant) { sp.classList.add('shown'); return; }
      sp.classList.add('enter-' + enter);
      await VN.util.frame();
      sp.classList.add('in');
      if (id === 'shilo') VN.Audio.sample('goblin'); // Шило всегда появляется со своим криком
      if (enter === 'drop') { if (id !== 'shilo') VN.Audio.sfx('impact'); setTimeout(() => VN.Fx.shake(14), 380); }
      else if (id === 'shilo') { /* крика достаточно */ }
      else if (enter === 'glitch') VN.Audio.sfx('glitch');
      else VN.Audio.sfx('whoosh');
      await settle(sp.querySelector('.sprite-body'), enter === 'silhouette' ? 1300 : 800);
      sp.classList.remove('enter-' + enter, 'in');
      sp.classList.add('shown');

      if (!VN.S.met[id] && ch.dossier) {
        VN.S.met[id] = true;
        await VN.Dossier.show(id);
      }
    },

    async hide(id, exit = 'fade') {
      const sp = this.sprites[id];
      if (!sp) return;
      delete this.sprites[id];
      delete VN.S.stage.sprites[id];
      sp.classList.add('exit-' + exit);
      await settle(sp, 600);
      sp.remove();
    },

    async clear() { await Promise.all(Object.keys(this.sprites).map((id) => this.hide(id))); },

    clearInstant() {
      Object.values(this.sprites).forEach((s) => s.remove());
      this.sprites = {};
      VN.S.stage.sprites = {};
    },

    restore(snapshot) {
      this.clearInstant();
      Object.entries(snapshot || {}).forEach(([id, s]) => this.show(id, s.at, null, true));
    },

    focus(id) {
      Object.entries(this.sprites).forEach(([sid, sp]) => {
        const speaking = sid === id;
        sp.classList.toggle('lit', speaking);
        sp.classList.toggle('dim', !speaking && !!id && id !== 'n');
      });
    },

    shake(id) {
      const sp = this.sprites[id]; if (!sp) return;
      sp.classList.remove('hit'); void sp.offsetWidth; sp.classList.add('hit');
    },

    get(id) { return this.sprites[id]; },
  };

  /* ---------------- карточка досье ---------------- */
  const Dossier = {
    async show(id) {
      const ch = VN.Characters[id], d = ch.dossier;
      const layer = document.getElementById('overlay');
      const card = el('div', 'dossier');
      const threat = Array.from({ length: 5 }, (_, i) => `<i class="${i < d.threat ? 'on' : ''}"></i>`).join('');
      card.style.setProperty('--c', ch.color);
      card.innerHTML = `
        <div class="dossier-clip"></div>
        <div class="dossier-head"><span>ДЕЛО № ${d.no}</span><span>ПОРТ-ВЕТРОВ · ОУР</span></div>
        <div class="dossier-photo">
          <div class="dossier-ruler">${[200, 190, 180, 170, 160].map((n) => `<b>${n}</b>`).join('')}</div>
          <img src="${ch.sprite}" alt="">
          <div class="dossier-plate">${ch.short || ch.name}</div>
        </div>
        <div class="dossier-name">${ch.name}</div>
        <div class="dossier-role">${d.role}</div>
        <div class="dossier-quote">«${d.quote}»</div>
        <div class="dossier-threat">УГРОЗА <span>${threat}</span></div>
        <div class="dossier-stamp" style="--s:${d.stampColor}">${d.stamp}</div>
        <div class="dossier-hint">клик — дальше</div>`;
      layer.appendChild(card);
      VN.Audio.sfx('flash');
      VN.Fx.flash('#fff', 180);
      await VN.util.frame();
      card.classList.add('in');
      setTimeout(() => { card.classList.add('stamped'); VN.Audio.sfx('stamp'); }, 650);
      await sleep(400);
      if (!VN.mode.skip) await VN.Input.wait();
      card.classList.add('out');
      VN.Audio.sfx('whoosh');
      await sleep(450);
      card.remove();
    },
  };

  VN.Stage = Stage;
  VN.Dossier = Dossier;
})();
