/* ==========================================================================
   HUD: часы обратного отсчёта до полуночи, пульс-кардиограмма здоровья,
   статы, панель кнопок. Тосты (предмет, улика, время). Базовая модалка.
   ========================================================================== */
(function () {
  'use strict';
  const VN = window.VN;
  const { el, $ } = VN.util;

  /* ---------------- модальные окна ---------------- */
  const Modal = {
    stack: [],
    open(kind, title, sub) {
      const wrap = el('div', 'modal modal-' + kind);
      wrap.innerHTML = `<div class="modal-card">
          <div class="modal-head"><div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div><button class="modal-x" data-ui title="Закрыть (Esc)">✕</button></div>
          <div class="modal-body"></div></div>`;
      document.getElementById('overlay').appendChild(wrap);
      VN.Input.modal++;
      VN.Audio.sfx('whoosh');
      const m = { el: wrap, body: wrap.querySelector('.modal-body'), onClose: null, close: () => this.close(m) };
      wrap.querySelector('.modal-x').addEventListener('click', (e) => { e.stopPropagation(); m.close(); });
      wrap.addEventListener('click', (e) => { e.stopPropagation(); if (e.target === wrap) m.close(); });
      this.stack.push(m);
      requestAnimationFrame(() => wrap.classList.add('in'));
      return m;
    },
    close(m) {
      m = m || this.stack[this.stack.length - 1];
      if (!m || m.closed) return;
      m.closed = true;
      this.stack = this.stack.filter((x) => x !== m);
      VN.Input.modal = Math.max(0, VN.Input.modal - 1);
      m.el.classList.remove('in');
      setTimeout(() => m.el.remove(), 300);
      if (m.onClose) m.onClose();
    },
    top() { return this.stack[this.stack.length - 1]; },
  };

  /* ---------------- тосты ---------------- */
  const Toast = {
    show(html, kind = 'item', icon) {
      const root = document.getElementById('toasts');
      const t = el('div', 'toast toast-' + kind);
      t.innerHTML = (icon ? `<span class="toast-ic">${icon}</span>` : '') + `<span class="toast-tx">${html}</span>`;
      root.appendChild(t);
      requestAnimationFrame(() => t.classList.add('in'));
      setTimeout(() => t.classList.add('out'), 3200);
      setTimeout(() => t.remove(), 3700);
    },
  };

  /* ---------------- HUD ---------------- */
  const HUD = {
    root: null, beatT: 0,
    init() {
      const root = (this.root = $('#hud'));
      root.innerHTML = `
        <div class="hud-left" data-ui>
          <div class="hud-clock">
            <div class="clk-label">31 ДЕКАБРЯ</div>
            <div class="clk-time">23:07</div>
            <div class="clk-left">до полуночи <b>53</b> мин</div>
            <div class="clk-bar"></div>
          </div>
          <div class="hud-vitals">
            <div class="hp-row"><span class="hp-label">ПУЛЬС</span><span class="hp-num">22/22</span></div>
            <svg class="ecg" viewBox="0 0 220 40" preserveAspectRatio="none"><path d=""/></svg>
            <div class="hud-stats"></div>
          </div>
        </div>
        <div class="hud-right" data-ui>
          <button data-act="inv" title="Кейс и досье [I]">${VN.Icons.revolver}<span>КЕЙС</span></button>
          <button data-act="board" title="Доска улик [B]">${VN.Icons.photo}<span>ДОСКА</span></button>
          <button data-act="log" title="Журнал [L]"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3"><path d="M14 10h28l8 8v36H14z M22 26h20 M22 34h20 M22 42h14"/></svg><span>ЖУРНАЛ</span></button>
          <button data-act="auto" title="Авто [A]"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 14l30 18-30 18z"/></svg><span>АВТО</span></button>
          <button data-act="skip" title="Пропуск [S]"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3"><path d="M10 14l22 18-22 18z M32 14l22 18-22 18z"/></svg><span>ПРОПУСК</span></button>
          <button data-act="save" title="Сохранить / загрузить"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 10h34l8 8v36H12z M20 10v14h22V10 M20 54V38h24v16"/></svg><span>ЗАПИСЬ</span></button>
          <button data-act="mute" title="Громкость · M — без звука"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3"><path d="M10 24h10l14-12v40L20 40H10z M42 22c4 4 4 16 0 20 M48 16c8 8 8 24 0 32"/></svg><span>ЗВУК</span></button>
        </div>`;
      // громкость: всплывающая панель под кнопкой «ЗВУК»
      const pop = el('div', 'vol-pop');
      pop.setAttribute('data-ui', '');
      pop.appendChild(VN.volumeControl());
      $('.hud-right', root).appendChild(pop);
      pop.addEventListener('click', (e) => e.stopPropagation());
      document.addEventListener('click', () => pop.classList.remove('open'));
      this.volPop = pop;
      root.querySelectorAll('[data-act]').forEach((b) => {
        b.addEventListener('click', (e) => { e.stopPropagation(); VN.Audio.sfx('click'); this.action(b.dataset.act); });
      });
      const bar = $('.clk-bar', root);
      for (let i = 0; i < 60; i++) bar.appendChild(el('i'));
      VN.bus.on('state', () => this.update());
      VN.bus.on('time', ({ delta }) => {
        this.update();
        const c = $('.hud-clock', root);
        c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump');
        if (delta > 0) Toast.show(`<b>+${delta} мин</b> · ${VN.State.clock()}`, 'time');
      });
      VN.bus.on('hp', ({ delta }) => {
        const v = $('.hud-vitals', root);
        v.classList.remove('hurt', 'healed'); void v.offsetWidth;
        if (delta < 0) v.classList.add('hurt');
        if (delta > 0) { v.classList.add('healed'); Toast.show(`<b>+${delta}</b> здоровья`, 'heal'); }
      });
      VN.bus.on('inv:add', ({ id, n }) => {
        const it = VN.Items[id]; if (!it) return;
        VN.Audio.sfx('item');
        Toast.show(`<small>ПОЛУЧЕНО</small><b>${it.name}${n > 1 ? ' ×' + n : ''}</b>`, 'item', VN.Icons[it.icon]);
      });
      VN.bus.on('inv:remove', ({ id, n }) => {
        const it = VN.Items[id]; if (!it) return;
        Toast.show(`<small>ПОТЕРЯНО</small><b>${it.name}${n > 1 ? ' ×' + n : ''}</b>`, 'lost', VN.Icons[it.icon]);
      });
      VN.bus.on('rel', ({ id }) => {
        const ch = VN.Characters[id]; if (!ch) return;
        Toast.show(`<small>ОТНОШЕНИЯ</small><b>${ch.short || ch.name} это запомнит.</b>`, 'rel');
      });
      VN.bus.on('clue', (k) => {
        const c = VN.Clues[k];
        VN.Audio.sfx('clue');
        Toast.show(`<small>НОВАЯ УЛИКА</small><b>${c.title}</b><em>${c.text}</em>`, 'clue');
      });
      this.ecgLoop();
    },

    show(on) { this.root.classList.toggle('on', on); },

    action(a) {
      if (a === 'inv') VN.Inventory.open();
      if (a === 'board') VN.Board.open();
      if (a === 'log') VN.Backlog.open();
      if (a === 'save') VN.Saves.open();
      if (a === 'auto') { VN.mode.auto = !VN.mode.auto; VN.mode.skip = false; if (VN.mode.auto) VN.Input.advance(); }
      if (a === 'skip') { VN.mode.skip = !VN.mode.skip; VN.mode.auto = false; if (VN.mode.skip) VN.Input.advance(); }
      if (a === 'mute') this.volPop.classList.toggle('open');
      if (a === 'muteKey') VN.Audio.toggleMute();
      this.update();
    },

    update() {
      const S = VN.S, r = this.root;
      if (!r) return;
      const left = VN.State.minutesLeft();
      const C = S.clock;
      $('.clk-time', r).textContent = VN.State.clock();
      $('.clk-label', r).textContent = C.date;
      $('.clk-left', r).innerHTML = C.still ? C.label : `${C.label} <b>${left}</b> мин`;
      if (C.still) $('.clk-time', r).textContent = '—:—';
      const gone = Math.round(((S.time - C.start) / (C.deadline - C.start)) * 60);
      r.querySelectorAll('.clk-bar i').forEach((i, k) => i.classList.toggle('gone', k < gone));
      $('.hud-clock', r).classList.toggle('urgent', left <= Math.max(15, (C.deadline - C.start) * 0.15));
      $('.hp-num', r).textContent = `${S.hp}/${S.maxHp}`;
      $('.hud-vitals', r).classList.toggle('low', S.hp <= S.maxHp * 0.3);
      $('.hud-stats', r).innerHTML = Object.entries(VN.State.STATS)
        .map(([k, s]) => `<span style="--c:${s.color}"><em>${s.short}</em>${'<i></i>'.repeat(S.stats[k])}${'<i class="off"></i>'.repeat(Math.max(0, 3 - S.stats[k]))}</span>`).join('');
      r.querySelector('[data-act="auto"]').classList.toggle('active', VN.mode.auto);
      r.querySelector('[data-act="skip"]').classList.toggle('active', VN.mode.skip);
      r.querySelector('[data-act="mute"]').classList.toggle('active', VN.Audio.muted);
    },

    /** Кардиограмма: частота и амплитуда зависят от здоровья. */
    ecgLoop() {
      const path = $('.ecg path', this.root);
      let off = 0, last = performance.now();
      const draw = (now) => {
        const dt = (now - last) / 1000; last = now;
        const k = VN.S.maxHp ? VN.S.hp / VN.S.maxHp : 1;
        const bpm = 70 + (1 - k) * 80;
        off += dt * bpm / 60;
        let d = '';
        for (let x = 0; x <= 220; x += 2) {
          const ph = ((x / 55) + off) % 1;
          let y = 20;
          if (VN.S.hp > 0) {
            if (ph > 0.40 && ph < 0.44) y = 20 - (ph - 0.40) * 120;
            else if (ph >= 0.44 && ph < 0.48) y = 15 + (ph - 0.44) * 600 * (0.5 + k * 0.5);
            else if (ph >= 0.48 && ph < 0.52) y = 30 - (ph - 0.48) * 500;
            else if (ph > 0.62 && ph < 0.72) y = 20 - Math.sin((ph - 0.62) * 31.4) * 3;
          }
          d += (x ? 'L' : 'M') + x + ' ' + y.toFixed(1);
        }
        path.setAttribute('d', d);
        if (k < 0.3 && VN.S.hp > 0 && now - this.beatT > 60000 / bpm && this.root.classList.contains('on')) {
          this.beatT = now; VN.Audio.sfx('heartbeat');
        }
        requestAnimationFrame(draw);
      };
      requestAnimationFrame(draw);
    },
  };

  VN.Modal = Modal;

  /** Ползунок громкости + кнопка «без звука». Один компонент — для HUD и для титула. */
  VN.volumeControl = function () {
    const w = el('div', 'vol-ctl');
    w.innerHTML = `<span class="vol-lbl">ГРОМКОСТЬ</span>
      <input type="range" min="0" max="100" step="1" value="${Math.round(VN.Audio.vol * 100)}" aria-label="Громкость">
      <b class="vol-num">${Math.round(VN.Audio.vol * 100)}</b>
      <button class="vol-mute" title="Без звука [M]">${VN.Audio.muted ? 'ВКЛЮЧИТЬ' : 'БЕЗ ЗВУКА'}</button>`;
    const r = w.querySelector('input'), num = w.querySelector('.vol-num'), mb = w.querySelector('.vol-mute');
    const paint = () => { r.style.setProperty('--p', r.value + '%'); num.textContent = r.value; mb.textContent = VN.Audio.muted ? 'ВКЛЮЧИТЬ' : 'БЕЗ ЗВУКА'; w.classList.toggle('muted', VN.Audio.muted); };
    r.addEventListener('input', () => { VN.Audio.init(); if (VN.Audio.muted && +r.value > 0) VN.Audio.toggleMute(); VN.Audio.setVolume(r.value / 100); paint(); });
    r.addEventListener('change', () => VN.Audio.sfx('click'));
    mb.addEventListener('click', (e) => { e.stopPropagation(); VN.Audio.init(); VN.Audio.toggleMute(); VN.bus.emit('volume'); });
    ['click', 'mousedown', 'pointerdown', 'keydown'].forEach((ev) => w.addEventListener(ev, (e) => e.stopPropagation()));
    VN.bus.on('volume', () => { r.value = Math.round(VN.Audio.vol * 100); paint(); });
    paint();
    return w;
  };
  VN.Toast = Toast;
  VN.HUD = HUD;
})();
