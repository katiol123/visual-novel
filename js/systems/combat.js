/* ==========================================================================
   БОЙ НА КУБАХ «Кости на сукне»
   ---------------------------------------------------------------------------
   Раунд:
   1. Противник открыто бросает кубы — НАМЕРЕНИЕ (урон / блок / подготовка).
   2. Ты бросаешь свой пул (3–4 куба) и раскладываешь их по слотам:
        УДАР    — сумма + бонус силы/оружия → урон противнику
        БЛОК    — сумма → гасит входящий урон; шестёрка = КОНТРА (3 урона)
        ВЫСТРЕЛ — 1 куб × 2 сквозь любую защиту (нужен ствол и патрон);
                  шестёрка = В ЯБЛОЧКО (15)
      Кубы в лотке можно перебросить (число перебросов ограничено).
   3. Комбинации в УДАРЕ: ДУПЛЕТ (+3), ДВЕ ПАРЫ (+6), СТРИТ (+5), ТРОЙКА (×2).
   4. Удар → ответ противника → эффекты (кровотечение, ожог, наручники).
   ========================================================================== */
(function () {
  'use strict';
  const VN = window.VN;
  const { el, sleep, pick, clamp } = VN.util;

  function evaluate(values, ctx) {
    const atkV = values.atk, blkV = values.blk, shotV = values.shot;
    const combos = [];
    let atk = atkV.reduce((a, b) => a + b, 0);
    if (atkV.length) atk += ctx.atkBonus;
    const counts = {};
    atkV.forEach((v) => (counts[v] = (counts[v] || 0) + 1));
    const maxC = Math.max(0, ...Object.values(counts));
    const pairs = Object.values(counts).filter((c) => c >= 2).length;
    const uniq = [...new Set(atkV)].sort((a, b) => a - b);
    let run = 1, best = 1;
    for (let i = 1; i < uniq.length; i++) { run = uniq[i] === uniq[i - 1] + 1 ? run + 1 : 1; best = Math.max(best, run); }
    if (best >= 3) { atk += 5; combos.push({ t: 'СТРИТ', v: '+5' }); }
    if (maxC >= 3) { atk *= 2; combos.push({ t: 'ТРОЙКА', v: '×2' }); }
    else if (pairs >= 2) { atk += 6; combos.push({ t: 'ДВЕ ПАРЫ', v: '+6' }); }
    else if (pairs === 1) { atk += 3; combos.push({ t: 'ДУПЛЕТ', v: '+3' }); }
    let blk = blkV.reduce((a, b) => a + b, 0);
    if (blkV.length) blk += ctx.blkBonus;
    const counter = blkV.includes(6);
    const shot = shotV.length ? (shotV[0] === 6 ? 15 : shotV[0] * 2) : 0;
    return { atk, blk, shot, counter, combos, bullseye: shotV[0] === 6 };
  }

  class Fight {
    constructor(id, opts, done) {
      this.def = VN.Enemies[id];
      this.opts = opts || {};
      this.done = done;
      const cs = VN.State.combatStats();
      this.cs = cs;
      const hpMul = this.opts.enemyHp || 1;
      this.enemy = { hp: Math.ceil(this.def.hp * hpMul), maxHp: this.def.hp, armor: this.def.armor || 0, guard: 0, stunned: false, next: null, lastType: null, intent: null };
      this.player = { hp: VN.S.hp, maxHp: VN.S.maxHp, bleed: 0, burn: 0, cuff: false };
      this.round = 0;
      this.dice = [];
      this.phase = 'intro';
    }

    /* ------------------------------------------------------------ DOM */
    build() {
      const d = this.def;
      const root = (this.root = el('div', 'combat'));
      root.style.setProperty('--ec', d.color);
      root.innerHTML = `
        <div class="cb-felt"></div>
        <div class="cb-enemy">
          <div class="cb-esprite"><img src="${d.sprite}" alt="" draggable="false"></div>
          <div class="cb-bubble"></div>
        </div>
        <div class="cb-epanel">
          <div class="cb-ename">${d.name}${this.enemy.armor ? `<span class="armor" title="Броня: снижает урон УДАРА">🛡 ${this.enemy.armor}</span>` : ''}</div>
          <div class="cb-bar enemy"><i class="lag"></i><i class="fill"></i><span></span></div>
          <div class="cb-estatus"></div>
        </div>
        <div class="cb-intent">
          <div class="it-label">НАМЕРЕНИЕ</div>
          <div class="it-name">…</div>
          <div class="it-dice"></div>
          <div class="it-value"></div>
          <div class="it-desc"></div>
        </div>
        <div class="cb-ppanel">
          <div class="cb-pname">ЯН КОРСАК <small>${(VN.Backgrounds[VN.S.background] || {}).name || ''}</small></div>
          <div class="cb-bar player"><i class="lag"></i><i class="fill"></i><span></span></div>
          <div class="cb-res"></div>
          <div class="cb-pstatus"></div>
        </div>
        <div class="cb-table">
          <div class="cb-tray" data-zone="tray"><label>ЛОТОК · кубы здесь можно перебросить</label><div class="zone"></div></div>
          <div class="cb-slots">
            <div class="slot s-atk" data-zone="atk"><header>УДАР <em>+${this.cs.atkBonus}</em></header><div class="zone"></div><footer><b class="sum">0</b><span class="combo"></span></footer></div>
            <div class="slot s-blk" data-zone="blk"><header>БЛОК ${this.cs.blkBonus ? `<em>+${this.cs.blkBonus}</em>` : ''}</header><div class="zone"></div><footer><b class="sum">0</b><span class="combo"></span></footer></div>
            <div class="slot s-shot" data-zone="shot"><header>ВЫСТРЕЛ <em>×2</em></header><div class="zone"></div><footer><b class="sum">0</b><span class="combo"></span></footer><div class="slot-lock"></div></div>
          </div>
        </div>
        <div class="cb-forecast"></div>
        <div class="cb-actions">
          <button class="cb-btn" data-a="help" title="Правила">?</button>
          <button class="cb-btn" data-a="reroll">ПЕРЕБРОС <b></b> <small>[R]</small></button>
          <button class="cb-btn" data-a="item">ПРЕДМЕТ <small>[E]</small></button>
          ${this.opts.flee ? '<button class="cb-btn" data-a="flee">БЕЖАТЬ <small>ЛОВ 9</small></button>' : ''}
          <button class="cb-btn go" data-a="go">В БОЙ! <small>[пробел]</small></button>
        </div>
        <div class="cb-hint">Клик по кубу — переложить: лоток → УДАР → БЛОК → ВЫСТРЕЛ. Или перетащи.</div>
        <div class="cb-round"></div>
        <div class="cb-banner"></div>
        <div class="cb-pops"></div>`;
      root.addEventListener('click', (e) => e.stopPropagation());
      root.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); this.action(b.dataset.a); }));
      this.$ = (s) => root.querySelector(s);
      this.zones = { tray: this.$('.cb-tray .zone'), atk: this.$('.s-atk .zone'), blk: this.$('.s-blk .zone'), shot: this.$('.s-shot .zone') };
      this.keys = (e) => {
        if (VN.Input.modal > 1) return;
        if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); e.stopPropagation(); this.action('go'); }
        if (e.code === 'KeyR') { e.stopPropagation(); this.action('reroll'); }
        if (e.code === 'KeyE') { e.stopPropagation(); this.action('item'); }
      };
      window.addEventListener('keydown', this.keys, true);
      document.getElementById('overlay').appendChild(root);
      this.updateBars(true);
      this.updateRes();
    }

    /* ------------------------------------------------------------ интро */
    async intro() {
      const vs = el('div', 'cb-vs');
      vs.style.setProperty('--ec', this.def.color);
      vs.innerHTML = `
        <div class="vs-left"><div><small>${(VN.Backgrounds[VN.S.background] || {}).name || ''}</small><b>ЯН<br>КОРСАК</b></div></div>
        <div class="vs-right"><img src="${this.def.sprite}" alt=""><div><small>${this.def.boss ? 'БОСС' : 'ПРОТИВНИК'}</small><b>${this.def.name}</b></div></div>
        <div class="vs-x">VS</div>
        <div class="vs-word">СХВАТКА</div>`;
      document.getElementById('overlay').appendChild(vs);
      VN.Audio.sfx('impact');
      VN.Fx.shake(20, 500);
      await VN.util.frame();
      vs.classList.add('in');
      await sleep(VN.mode.skip ? 500 : 1700);
      this.build();
      vs.classList.add('out');
      await sleep(500);
      vs.remove();
      this.root.classList.add('in');
      VN.Audio.combatMusic(true);
      await sleep(400);
      if (!VN.Meta.data.tutorial) { VN.Meta.set('tutorial', true); await this.help(); }
    }

    help() {
      return new Promise((resolve) => {
        const h = el('div', 'cb-help');
        h.innerHTML = `<div class="hc">
          <h3>КОСТИ НА СУКНЕ</h3>
          <ol>
            <li><b>Противник ходит открыто.</b> Его кубы — это его НАМЕРЕНИЕ: сколько урона он нанесёт или сколько заблокирует.</li>
            <li><b>Разложи свои кубы.</b> <span class="c-atk">УДАР</span> бьёт, <span class="c-blk">БЛОК</span> гасит входящий урон, <span class="c-shot">ВЫСТРЕЛ</span> — один куб ×2 сквозь броню (нужен патрон).</li>
            <li><b>Комбинации в УДАРЕ:</b> пара — ДУПЛЕТ +3, две пары +6, три подряд — СТРИТ +5, три одинаковых — ТРОЙКА ×2.</li>
            <li><b>Шестёрка в БЛОКЕ</b> — КОНТРА: противник получит 3 урона, если ударит. Шестёрка в ВЫСТРЕЛЕ — В ЯБЛОЧКО: 15.</li>
            <li><b>Не нравится бросок?</b> Кубы, оставшиеся в лотке, можно перебросить. Предмет — один за раунд.</li>
          </ol>
          <button class="btn btn-acid">ПОНЯЛ</button></div>`;
        VN.Input.modal++;
        this.root.appendChild(h);
        requestAnimationFrame(() => h.classList.add('in'));
        h.querySelector('button').addEventListener('click', (e) => {
          e.stopPropagation(); VN.Input.modal--; h.remove(); resolve();
        });
      });
    }

    /* ------------------------------------------------------------ полосы */
    updateBars(instant) {
      [['enemy', this.enemy], ['player', this.player]].forEach(([k, o]) => {
        const bar = this.$('.cb-bar.' + k);
        const pct = clamp(o.hp / o.maxHp, 0, 1) * 100;
        bar.querySelector('.fill').style.width = pct + '%';
        const lag = bar.querySelector('.lag');
        if (instant) lag.style.width = pct + '%';
        else setTimeout(() => (lag.style.width = pct + '%'), 450);
        bar.querySelector('span').textContent = `${Math.max(0, o.hp)} / ${o.maxHp}`;
        bar.classList.toggle('low', pct < 30);
      });
      const st = [];
      if (this.player.bleed) st.push(`<span class="st bleed">КРОВЬ ×${this.player.bleed}</span>`);
      if (this.player.burn) st.push(`<span class="st burn">ОЖОГ ×${this.player.burn}</span>`);
      if (this.player.cuff) st.push('<span class="st cuff">НАРУЧНИКИ −1 куб</span>');
      this.$('.cb-pstatus').innerHTML = st.join('');
      const es = [];
      if (this.enemy.guard) es.push(`<span class="st guard">БЛОК ${this.enemy.guard}</span>`);
      if (this.enemy.stunned) es.push('<span class="st stun">ОГЛУШЁН</span>');
      this.$('.cb-estatus').innerHTML = es.join('');
    }

    updateRes() {
      const b = VN.State.count('bullet');
      this.$('.cb-res').innerHTML = `
        <span title="Перебросы">ПЕРЕБРОС ${'<i class="chip"></i>'.repeat(this.rerolls || 0)}${'<i class="chip off"></i>'.repeat(Math.max(0, (this.maxRerolls || 0) - (this.rerolls || 0)))}</span>
        ${this.cs.gun ? `<span title="Патроны">ПАТРОНЫ ${'<i class="bul"></i>'.repeat(b) || '—'}</span>` : ''}`;
      const rr = this.$('[data-a="reroll"]');
      rr.querySelector('b').textContent = this.rerolls || 0;
      rr.disabled = this.phase !== 'assign' || !this.rerolls || !this.dice.some((d) => d.zone === 'tray');
      const it = this.$('[data-a="item"]');
      it.disabled = this.phase !== 'assign' || this.itemUsed;
      const go = this.$('[data-a="go"]'); go.disabled = this.phase !== 'assign';
      const fl = this.$('[data-a="flee"]'); if (fl) fl.disabled = this.phase !== 'assign';
      const shot = this.$('.s-shot');
      const shotOk = this.cs.gun && b > 0;
      shot.classList.toggle('locked', !shotOk);
      shot.querySelector('.slot-lock').textContent = !this.cs.gun ? 'НЕТ СТВОЛА' : b <= 0 ? 'НЕТ ПАТРОНОВ' : '';
    }

    pop(target, text, cls) {
      const p = el('div', 'cb-pop ' + (cls || ''), text);
      const r = target.getBoundingClientRect(), g = document.getElementById('game').getBoundingClientRect();
      p.style.left = ((r.left + r.width / 2 - g.left) / VN.scale) + 'px';
      p.style.top = ((r.top + r.height * 0.35 - g.top) / VN.scale) + 'px';
      this.$('.cb-pops').appendChild(p);
      setTimeout(() => p.remove(), 1400);
    }

    async banner(text, sub, cls) {
      const b = this.$('.cb-banner');
      b.className = 'cb-banner ' + (cls || '');
      b.innerHTML = `<b>${text}</b>${sub ? `<span>${sub}</span>` : ''}`;
      void b.offsetWidth; b.classList.add('show');
      await sleep(VN.mode.skip ? 200 : 620);
      b.classList.remove('show');
    }

    say(text) {
      const bub = this.$('.cb-bubble');
      bub.textContent = text;
      bub.classList.remove('show'); void bub.offsetWidth; bub.classList.add('show');
    }

    /* ------------------------------------------------------------ раунд */
    pickMove() {
      const moves = this.def.moves;
      if (this.enemy.next != null) { const m = moves[this.enemy.next]; this.enemy.next = null; return m; }
      const pool = moves.filter((m) => m.w > 0 && !(m.type === 'guard' && this.enemy.lastType === 'guard') && !(m.type === 'charge' && this.round === 1));
      const tot = pool.reduce((a, m) => a + m.w, 0);
      let r = Math.random() * tot;
      for (const m of pool) { r -= m.w; if (r <= 0) return m; }
      return pool[0];
    }

    async enemyIntent() {
      const m = this.pickMove();
      const box = this.$('.cb-intent');
      box.className = 'cb-intent t-' + m.type;
      this.$('.it-name').textContent = m.name;
      this.$('.it-desc').textContent = m.desc || '';
      const dz = this.$('.it-dice'); dz.innerHTML = '';
      const vals = [];
      if (m.dice) {
        const ds = [];
        for (let i = 0; i < m.dice; i++) { const d = VN.Dice.make(1, 'blood'); dz.appendChild(d.el); ds.push(d); }
        VN.Audio.sfx('dice');
        await Promise.all(ds.map((d) => { const v = VN.Dice.d6(); vals.push(v); return d.roll(v, { from: { x: 120, y: -120 }, dur: 800 }); }));
        if (m.type === 'barrage') ds.forEach((d) => { if (d.value <= 2) d.el.classList.add('miss'); });
      }
      let value = 0;
      if (m.type === 'attack') value = vals.reduce((a, b) => a + b, 0) + (m.bonus || 0);
      if (m.type === 'barrage') value = vals.filter((v) => v > 2).reduce((a, b) => a + b, 0) + (m.bonus || 0);
      if (m.type === 'guard') value = vals.reduce((a, b) => a + b, 0) + (m.bonus || 0);
      const pair = vals.length >= 2 && new Set(vals).size < vals.length;
      this.enemy.intent = { move: m, value, pair, vals };
      this.enemy.guard = m.type === 'guard' ? value : 0;
      this.enemy.lastType = m.type;
      if (m.type === 'charge') this.enemy.next = m.next;
      const lab = m.type === 'guard' ? 'БЛОК' : m.type === 'charge' ? 'ГОТОВИТСЯ' : 'УРОН';
      this.$('.it-value').innerHTML = m.type === 'charge' ? `<b>!</b><span>${lab}</span>` : `<b>${value}</b><span>${lab}${pair && m.pairEffect ? ' · ПАРА!' : ''}</span>`;
      box.classList.add('show');
      if (Math.random() < 0.6) this.say(pick(this.def.taunts));
      this.updateBars();
    }

    async playerRoll() {
      this.dice.forEach((d) => d.d.el.remove());
      this.dice = [];
      const n = Math.max(1, this.cs.dice - (this.player.cuff ? 1 : 0));
      this.player.cuff = false;
      this.maxRerolls = this.cs.rerolls;
      this.rerolls = this.cs.rerolls;
      this.itemUsed = false;
      VN.Audio.sfx('dice');
      const rolls = [];
      for (let i = 0; i < n; i++) {
        const d = VN.Dice.make(1, 'bone');
        const o = { d, zone: 'tray' };
        this.zones.tray.appendChild(d.el);
        this.bindDie(o);
        this.dice.push(o);
        rolls.push(d.roll(VN.Dice.d6(), { from: { x: -380 + i * 40, y: 260 } }));
      }
      await Promise.all(rolls);
      this.phase = 'assign';
      this.root.classList.add('assigning');
      this.preview();
      this.updateRes();
    }

    /* ------------------------------------------------------------ кубы */
    bindDie(o) {
      const elx = o.d.el;
      elx.addEventListener('pointerdown', (e) => {
        if (this.phase !== 'assign') return;
        e.preventDefault(); e.stopPropagation();
        const sx = e.clientX, sy = e.clientY;
        let drag = false, hover = null;
        const move = (ev) => {
          const dx = (ev.clientX - sx) / VN.scale, dy = (ev.clientY - sy) / VN.scale;
          if (!drag && Math.hypot(dx, dy) > 6) { drag = true; elx.classList.add('dragging'); }
          if (drag) {
            elx.style.transform = `translate(${dx}px, ${dy}px) scale(1.15)`;
            const z = this.zoneAt(ev.clientX, ev.clientY);
            if (hover !== z) { this.root.querySelectorAll('.hot').forEach((h) => h.classList.remove('hot')); z && this.zoneBox(z).classList.add('hot'); hover = z; }
          }
        };
        const up = (ev) => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
          this.root.querySelectorAll('.hot').forEach((h) => h.classList.remove('hot'));
          if (drag) {
            elx.classList.remove('dragging');
            const z = this.zoneAt(ev.clientX, ev.clientY);
            if (z && z !== o.zone && this.canPlace(z)) this.place(o, z, true);
            else this.place(o, o.zone, true);
          } else this.cycle(o);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
      });
    }
    zoneBox(z) { return z === 'tray' ? this.$('.cb-tray') : this.$('.s-' + z); }
    zoneAt(x, y) {
      for (const n of document.elementsFromPoint(x, y)) {
        const z = n.closest && n.closest('[data-zone]');
        if (z && this.root.contains(z)) return z.dataset.zone;
      }
      return null;
    }
    canPlace(z) {
      if (z !== 'shot') return true;
      return this.cs.gun && VN.State.count('bullet') > 0 && !this.dice.some((d) => d.zone === 'shot');
    }
    cycle(o) {
      const order = ['tray', 'atk', 'blk', 'shot'];
      let i = order.indexOf(o.zone);
      for (let k = 0; k < 4; k++) {
        i = (i + 1) % 4;
        if (order[i] === 'tray' || this.canPlace(order[i])) break;
      }
      this.place(o, order[i]);
    }
    place(o, zone, fromDrag) {
      const elx = o.d.el;
      const first = elx.getBoundingClientRect();
      elx.style.transform = '';
      this.zones[zone].appendChild(elx);
      o.zone = zone;
      const last = elx.getBoundingClientRect();
      const dx = (first.left - last.left) / VN.scale, dy = (first.top - last.top) / VN.scale;
      elx.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${fromDrag ? 1.15 : 1})` }, { transform: 'translate(0,0) scale(1)' }], { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' });
      VN.Audio.sfx('diceLand');
      this.preview();
      this.updateRes();
    }
    values() {
      const v = { atk: [], blk: [], shot: [], tray: [] };
      this.dice.forEach((o) => v[o.zone].push(o.d.value));
      return v;
    }
    preview() {
      const v = this.values();
      const r = evaluate(v, this.cs);
      const set = (k, sum, combo) => {
        const s = this.$('.s-' + k);
        s.querySelector('.sum').textContent = sum;
        s.querySelector('.combo').innerHTML = combo;
        s.classList.toggle('filled', v[k].length > 0);
      };
      set('atk', v.atk.length ? r.atk : 0, r.combos.map((c) => `<i>${c.t} ${c.v}</i>`).join(''));
      set('blk', v.blk.length ? r.blk : 0, r.counter ? '<i>КОНТРА 3</i>' : '');
      set('shot', r.shot, r.bullseye ? '<i>В ЯБЛОЧКО</i>' : '');
      const it = this.enemy.intent;
      const incoming = it && !this.enemy.stunned && (it.move.type === 'attack' || it.move.type === 'barrage') ? it.value : 0;
      const dealt = Math.max(0, r.atk - this.enemy.guard - this.enemy.armor) * (v.atk.length ? 1 : 0) + r.shot;
      const taken = Math.max(0, incoming - r.blk);
      this.$('.cb-forecast').innerHTML = `<span class="f-out">нанесёшь <b>${dealt}</b></span><span class="f-in ${taken ? 'bad' : 'ok'}">получишь <b>${taken}</b></span>${v.tray.length ? `<span class="f-warn">${v.tray.length} куб. в лотке пропадёт</span>` : ''}`;
      this.lastEval = r;
    }

    /* ------------------------------------------------------------ действия */
    async action(a) {
      if (a === 'help') { await this.help(); return; }
      if (this.phase !== 'assign') return;
      if (a === 'reroll') {
        const tray = this.dice.filter((o) => o.zone === 'tray');
        if (!this.rerolls || !tray.length) { VN.Audio.sfx('lock'); return; }
        this.rerolls--;
        this.phase = 'rolling'; this.updateRes();
        VN.Audio.sfx('dice');
        await Promise.all(tray.map((o, i) => o.d.roll(VN.Dice.d6(), { from: { x: -120 + i * 60, y: 160 }, dur: 700 })));
        this.phase = 'assign';
        this.preview(); this.updateRes();
      }
      if (a === 'item') {
        const id = await new Promise((resolve) => VN.Inventory.render({
          mode: 'select', title: 'ПРЕДМЕТ В БОЮ', sub: 'Один предмет за раунд', action: 'ИСПОЛЬЗОВАТЬ',
          filter: (it) => it.use && it.use.combat, resolve,
        }));
        if (!id) return;
        await this.useItem(id);
      }
      if (a === 'flee') {
        this.phase = 'resolve'; this.updateRes();
        const ok = await VN.Checks.run({ stat: 'agi', dc: 9, label: 'Вырваться и бежать' });
        if (ok) return this.finish('fled');
        await this.banner('НЕ ВЫШЛО', 'противник бьёт в спину', 'bad');
        this.dice.forEach((o) => { if (o.zone !== 'tray') this.zones.tray.appendChild(o.d.el); o.zone = 'tray'; });
        await this.enemyAct({ blk: 0, counter: false });
        if (this.player.hp <= 0) return this.finish('lose');
        return this.nextRound();
      }
      if (a === 'go') {
        this.phase = 'resolve'; this.updateRes();
        this.root.classList.remove('assigning');
        await this.resolve();
      }
    }

    async useItem(id) {
      const it = VN.Items[id];
      VN.State.take(id, 1, true);
      this.itemUsed = true;
      VN.Audio.sfx('item');
      if (it.heal) {
        const before = this.player.hp;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + it.heal);
        this.pop(this.$('.cb-ppanel'), '+' + (this.player.hp - before), 'heal');
      }
      if (id === 'flask') { this.rerolls += 2; this.maxRerolls += 2; await this.banner('ГЛОТОК', '+2 переброса', 'gold'); }
      if (id === 'firecracker') {
        this.enemy.stunned = true; this.enemy.guard = 0;
        VN.Audio.sfx('firework'); VN.Fx.flash('#fff', 250); VN.Fx.shake(14);
        this.$('.it-dice').querySelectorAll('.die').forEach((d) => d.classList.add('shatter'));
        this.$('.it-value').innerHTML = '<b>0</b><span>ОГЛУШЁН</span>';
        this.say('А-А-А! ГЛАЗА!');
        await this.banner('БА-БАХ!', 'противник оглушён', 'gold');
      }
      this.updateBars(); this.preview(); this.updateRes();
    }

    /* ------------------------------------------------------------ развязка раунда */
    async resolve() {
      const v = this.values();
      const r = evaluate(v, this.cs);
      const espr = this.$('.cb-esprite');

      // 1. выстрел
      if (v.shot.length) {
        VN.State.take('bullet', 1, true);
        this.zones.shot.querySelector('.die').classList.add('fire');
        VN.Audio.sfx('gunshot'); VN.Fx.flash('#fff6d0', 200); VN.Fx.shake(16, 400);
        this.root.classList.add('muzzle'); setTimeout(() => this.root.classList.remove('muzzle'), 200);
        await sleep(160);
        if (r.bullseye) await this.banner('В ЯБЛОЧКО', '15 урона сквозь защиту', 'gold');
        this.hitEnemy(r.shot, 'shot');
        await sleep(500);
        this.updateRes();
        if (this.enemy.hp <= 0) return this.finish('win');
      }

      // 2. удар
      if (v.atk.length) {
        for (const c of r.combos) { VN.Audio.sfx('crit'); await this.banner(c.t, c.v, 'acid'); }
        this.zones.atk.querySelectorAll('.die').forEach((d, i) => d.animate(
          [{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(${200 + i * 30}px, -420px) scale(0.6)`, opacity: 0.2 }],
          { duration: 320, easing: 'cubic-bezier(.5,0,1,.5)', fill: 'forwards' }));
        await sleep(300);
        const absorbed = Math.min(r.atk, this.enemy.guard + this.enemy.armor);
        const dmg = r.atk - absorbed;
        if (absorbed && this.enemy.guard) this.pop(espr, `БЛОК −${absorbed}`, 'guard');
        if (dmg > 0) this.hitEnemy(dmg, dmg >= 14 ? 'crit' : 'hit');
        else { VN.Audio.sfx('lock'); this.pop(espr, 'НЕ ПРОБИЛ', 'guard'); }
        await sleep(dmg >= 14 ? 900 : 550);
        if (this.enemy.hp <= 0) return this.finish('win');
      }

      // 3. ответ противника
      await this.enemyAct(r);
      if (this.enemy.hp <= 0) return this.finish('win');

      // 4. статусы
      for (const k of ['bleed', 'burn']) {
        if (this.player[k] > 0) {
          this.player[k]--;
          this.player.hp -= 2;
          this.pop(this.$('.cb-ppanel'), `−2 ${k === 'bleed' ? 'КРОВЬ' : 'ОЖОГ'}`, 'dmg');
          VN.Audio.sfx('hurt');
          this.updateBars();
          await sleep(450);
        }
      }
      if (this.player.hp <= 0) return this.finish('lose');
      this.nextRound();
    }

    hitEnemy(dmg, kind) {
      const espr = this.$('.cb-esprite');
      this.enemy.hp -= dmg;
      espr.classList.remove('hurt', 'crit'); void espr.offsetWidth;
      espr.classList.add(kind === 'crit' ? 'crit' : 'hurt');
      this.pop(espr, '−' + dmg, kind === 'crit' ? 'crit' : kind === 'shot' ? 'shot' : 'dmg');
      VN.Audio.sfx(kind === 'crit' ? 'crit' : 'hit');
      VN.Fx.shake(kind === 'crit' ? 26 : 12, kind === 'crit' ? 700 : 350);
      if (kind === 'crit') { this.root.classList.add('slowmo'); setTimeout(() => this.root.classList.remove('slowmo'), 900); }
      if (this.enemy.hp > 0 && Math.random() < 0.7) this.say(pick(this.def.hurt));
      this.updateBars();
    }

    async enemyAct(r) {
      const it = this.enemy.intent, m = it.move;
      const pp = this.$('.cb-ppanel');
      if (this.enemy.stunned) {
        this.enemy.stunned = false;
        await this.banner('ОГЛУШЁН', 'противник пропускает ход', 'gold');
        return;
      }
      if (m.type === 'charge') { this.say(m.name); await this.banner(m.name.toUpperCase(), m.desc, 'bad'); return; }
      if (m.type === 'guard') return;
      this.$('.it-dice').querySelectorAll('.die').forEach((d, i) => d.animate(
        [{ transform: 'translate(0,0)' }, { transform: `translate(${-500 - i * 40}px, 120px) scale(0.6)`, opacity: 0.2 }],
        { duration: 300, easing: 'cubic-bezier(.5,0,1,.5)', fill: 'forwards' }));
      await sleep(260);
      const incoming = it.value;
      const blocked = Math.min(incoming, r.blk);
      const dmg = incoming - blocked;
      if (blocked) this.pop(this.$('.s-blk'), `БЛОК −${blocked}`, 'guard');
      if (dmg > 0) {
        this.player.hp -= dmg;
        this.pop(pp, '−' + dmg, 'dmg big');
        VN.Audio.sfx('hurt');
        VN.Fx.flash('rgba(255,20,50,0.45)', 380);
        VN.Fx.shake(dmg >= 10 ? 26 : 14, 500);
        this.root.classList.remove('ouch'); void this.root.offsetWidth; this.root.classList.add('ouch');
        if (m.onHit === 'burn') { this.player.burn = 2; await this.banner('ОЖОГ', '2 урона следующие 2 раунда', 'bad'); }
        if (m.onHit === 'cuff') { this.player.cuff = true; await this.banner('НАРУЧНИКИ', '−1 куб в следующем раунде', 'bad'); }
        if (m.pairEffect === 'bleed' && it.pair) { this.player.bleed = 2; await this.banner('КРОВОТЕЧЕНИЕ', '2 урона следующие 2 раунда', 'bad'); }
      } else if (incoming > 0) {
        VN.Audio.sfx('lock');
        await this.banner('ЧИСТЫЙ БЛОК', '', 'acid');
      } else {
        this.say('Промах!');
      }
      if (r.counter && incoming > 0) {
        await sleep(200);
        await this.banner('КОНТРА', '3 урона', 'acid');
        this.hitEnemy(3, 'hit');
      }
      this.updateBars();
      await sleep(500);
    }

    async nextRound() {
      this.enemy.guard = 0;
      // убрать кубы со стола
      this.dice.forEach((o) => o.d.el.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(0.6)' }], { duration: 200, fill: 'forwards' }));
      this.$('.cb-intent').classList.remove('show');
      await sleep(250);
      this.round++;
      const rd = this.$('.cb-round');
      rd.textContent = 'РАУНД ' + this.round;
      rd.classList.remove('show'); void rd.offsetWidth; rd.classList.add('show');
      VN.Audio.sfx('clock');
      await sleep(VN.mode.skip ? 100 : 500);
      await this.enemyIntent();
      await this.playerRoll();
    }

    async finish(result) {
      this.phase = 'end';
      this.updateRes();
      VN.Audio.combatMusic(false);
      const words = { win: ['ЧИСТО', 'противник повержен'], lose: ['НОКАУТ', 'ты на асфальте'], fled: ['УШЁЛ', 'не сегодня'] };
      if (result === 'win') { this.$('.cb-esprite').classList.add('ko'); VN.Audio.sfx('impact'); }
      if (result === 'lose') { VN.Fx.flash('rgba(120,0,10,0.8)', 900); this.root.classList.add('dead'); VN.Audio.sfx('impact'); }
      await sleep(700);
      const end = el('div', 'cb-end ' + result);
      end.innerHTML = `<div class="stamp">${words[result][0]}</div><p>${words[result][1]}</p><button class="btn btn-acid">ДАЛЕЕ</button>`;
      this.root.appendChild(end);
      VN.Audio.sfx('stamp');
      requestAnimationFrame(() => end.classList.add('in'));
      await new Promise((res) => {
        end.querySelector('button').addEventListener('click', (e) => { e.stopPropagation(); res(); });
        if (VN.mode.skip) setTimeout(res, 700);
      });
      window.removeEventListener('keydown', this.keys, true);
      VN.S.hp = clamp(this.player.hp, 0, VN.S.maxHp);
      VN.bus.emit('state');
      this.root.classList.add('out');
      await sleep(500);
      this.root.remove();
      document.getElementById('game').classList.remove('in-combat');
      VN.Input.modal = Math.max(0, VN.Input.modal - 1);
      this.done(result);
    }

    async run() {
      VN.Input.modal++;
      document.getElementById('game').classList.add('in-combat');
      await this.intro();
      await this.nextRound();
    }
  }

  VN.Combat = {
    evaluate,
    start(id, opts) {
      return new Promise((resolve) => { new Fight(id, opts, resolve).run(); });
    },
  };
})();
