/* ==========================================================================
   БОЙ НА КУБАХ «Кости на сукне»
   ---------------------------------------------------------------------------
   Раунд:
   1. Противник открыто бросает кубы — НАМЕРЕНИЕ (урон / блок / подготовка).
   2. Ты бросаешь свой пул (3–4 куба) и раскладываешь их по слотам:
        УДАР    — сумма + бонус силы/оружия → урон противнику
        БЛОК    — сумма → гасит входящий урон; шестёрка = КОНТРА (3 урона)
        ВЫСТРЕЛ — 1 куб × 3 сквозь любую защиту (нужен ствол и патрон)
      Кубы в лотке можно перебросить (число перебросов ограничено).
   3. Комбинации в УДАРЕ: ДУПЛЕТ (+3), ДВЕ ПАРЫ (+6), СТРИТ (+5), ТРОЙКА (×2).
   4. Удар → ответ противника → эффекты (кровотечение, ожог, наручники).
   5. СКРЫТЫЙ КУБ: у атак противника часть кубов (def.hidden) лежит рубашкой
      вверх — видно только «7 + ?». Куб вскрывается в момент удара.
      Предмет с флагом reveal вскрывает их заранее.
   ========================================================================== */
(function () {
  'use strict';
  const VN = window.VN;
  const { el, sleep, pick, clamp } = VN.util;
  const sgn = (x) => (x < 0 ? '−' + -x : '+' + x);

  const Rules = VN.CombatRules;
  const evaluate = Rules.evaluate;

  class Fight {
    constructor(id, opts, done) {
      this.id = id;
      this.def = VN.Enemies[id];
      this.opts = opts || {};
      this.done = done;
      const mods = (typeof this.opts.mods === 'function' ? this.opts.mods(VN.S) : this.opts.mods || []).map((m) => (typeof m === 'string' ? VN.CombatMods[m] : m)).filter(Boolean);
      // состояние боя живёт в модуле правил: те же формулы, что в симуляторе баланса
      const st = (this.st = Rules.makeState(this.def, VN.State.combatStats(), { hp: VN.S.hp, maxHp: VN.S.maxHp }, mods));
      if (this.opts.enemyHp) st.enemy.hp = Math.ceil(st.enemy.hp * this.opts.enemyHp);
      this.cs = st.cs;
      this.enemy = st.enemy;
      this.player = st.player;
      this.mods = st.mods;
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
          <div class="cb-ename">${d.name}</div>
          <div class="cb-estats">
            <span title="Прибавка к сумме кубов в атаках противника">АТАКА <b>${this.atkText()}</b></span>
            <span title="Броня: снижает урон твоего УДАРА">БРОНЯ <b>${this.enemy.armor || 0}</b></span>
          </div>
          <div class="cb-bar enemy"><i class="lag"></i><i class="fill"></i><span></span></div>
          <div class="cb-passives">${Rules.describe(d).map((p) => `<span title="${p.d}">${p.t}</span>`).join('')}</div>
          <div class="cb-estatus"></div>
        </div>
        <div class="cb-intent">
          <div class="it-label">НАМЕРЕНИЕ</div>
          <div class="it-name">…</div>
          <div class="it-dice"></div>
          <div class="it-formula"></div>
          <div class="it-value"></div>
          <div class="it-desc"></div>
        </div>
        <div class="cb-ppanel">
          <div class="cb-pname">ДЭН КОРВИН <small>${(VN.Backgrounds[VN.S.background] || {}).name || ''}</small></div>
          <div class="cb-bar player"><i class="lag"></i><i class="fill"></i><span></span></div>
          <div class="cb-res"></div>
          <div class="cb-mods">${this.mods.map((m) => `<span class="${m.kind}" title="${m.desc}">${m.name}</span>`).join('')}</div>
          <div class="cb-pstatus"></div>
          ${Rules.minutesPerRound(VN.S.act) ? `<div class="cb-clock" title="Бой идёт в реальном времени ночи: каждый раунд отнимает минуты до полуночи"></div>` : ''}
        </div>
        <div class="cb-table">
          <div class="cb-tray" data-zone="tray"><label>ЛОТОК · кубы здесь можно перебросить</label><div class="zone"></div></div>
          <div class="cb-slots">
            <div class="slot s-atk" data-zone="atk"><header>УДАР <em>+${this.cs.atkBonus}</em></header><div class="zone"></div><footer><b class="sum">0</b><span class="combo"></span></footer></div>
            <div class="slot s-blk" data-zone="blk"><header>БЛОК ${this.cs.blkBonus ? `<em>${sgn(this.cs.blkBonus)}</em>` : ''}</header><div class="zone"></div><footer><b class="sum">0</b><span class="combo"></span></footer></div>
            <div class="slot s-shot" data-zone="shot"><header>ВЫСТРЕЛ <em>×${this.cs.shotMult || 2}</em></header><div class="zone"></div><footer><b class="sum">0</b><span class="combo"></span></footer><div class="slot-lock"></div></div>
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
    /* ------------------------------------------------------------ интро
       Многоэтапная заставка (клик/пробел — пропустить):
       1 ТРЕВОГА  — мигалка, полосы «опасно», глитч-слово СХВАТКА
       2 ДОСЬЕ    — карточки бойцов выезжают навстречу, угроза набирается
       3 VS       — удар, трещина, ударная волна
       4 КОСТИ    — по экрану катятся кубы, «БРОСАЙ»  → шторка в бой */
    async intro() {
      const d = this.def, cs = this.cs;
      const dos = (VN.Characters[d.char || this.id] || {}).dossier || {};
      const threat = d.threat || dos.threat || 1;
      const bg = VN.Backgrounds[VN.S.background] || {};
      const row = (k, v) => `<div class="ci-row"><span>${k}</span><b>${v}</b></div>`;
      const bar = (hp, max) => `<div class="ci-bar"><i style="--w:${Math.round((hp / max) * 100)}%"></i></div>`;
      const vs = el('div', 'cbi');
      vs.style.setProperty('--ec', d.color);
      vs.innerHTML = `
        <div class="ci-tint"></div>
        <div class="ci-hazard top"><i></i></div><div class="ci-hazard bot"><i></i></div>
        <div class="ci-siren"></div>
        <div class="ci-code">31.12 · ${VN.State.clock()} · ОПЕРАТИВНАЯ СВОДКА · КОД 10-10</div>
        <div class="ci-word" data-t="СХВАТКА">СХВАТКА</div>
        <div class="ci-card ci-left">
          <div class="ci-tag">ФИГУРАНТ №1 · ${bg.name || ''}</div>
          <div class="ci-name">ДЭН<br>КОРВИН</div>
          ${row('ЗДОРОВЬЕ', `${this.player.hp}/${this.player.maxHp}`)}${bar(this.player.hp, this.player.maxHp)}
          ${row('КУБЫ', cs.dice + (this.st.dice1 ? ` <small>(${this.st.dice1 > 0 ? '+' : ''}${this.st.dice1} в 1-м раунде)</small>` : ''))}${row('ПЕРЕБРОСЫ', cs.rerolls)}${row('УДАР', sgn(cs.atkBonus))}${row('БЛОК', sgn(cs.blkBonus))}
        </div>
        <div class="ci-enemy"><img src="${d.sprite}" alt="" draggable="false"></div>
        <div class="ci-card ci-right">
          <div class="ci-tag">${d.boss ? 'ГЛАВНАЯ ЦЕЛЬ' : 'ФИГУРАНТ №2'} · ${dos.role || ''}</div>
          <div class="ci-name">${d.name}</div>
          <div class="ci-threat"><span>УГРОЗА</span>${[1, 2, 3, 4, 5].map((n) => `<i class="${n <= threat ? 'on' : ''}" style="--n:${n}"></i>`).join('')}</div>
          ${row('ЗДОРОВЬЕ', `${this.enemy.hp}/${this.enemy.maxHp}`)}${bar(this.enemy.hp, this.enemy.maxHp)}
          ${row('АТАКА', this.atkText())}${row('БРОНЯ', this.enemy.armor || '—')}${d.hidden ? row('СКРЫТЫЕ КУБЫ', '?'.repeat(d.hidden)) : ''}
        </div>
        ${(Rules.describe(d).length || this.mods.length) ? `<div class="ci-mods">
          ${Rules.describe(d).map((p) => `<div class="ci-mod passive"><b>${p.t}</b><span>${p.d}</span></div>`).join('')}
          ${this.mods.map((m) => `<div class="ci-mod ${m.kind}"><b>${m.name}</b><span>${m.desc}</span></div>`).join('')}
        </div>` : ''}
        <div class="ci-crack"></div>
        <div class="ci-vs"><i class="ring"></i><i class="ring r2"></i><b>VS</b></div>
        <div class="ci-dice"></div>
        <div class="ci-go"><b>БРОСАЙ КОСТИ</b><span>${d.boss ? 'ПОСЛЕДНИЙ РАУНД ЭТОЙ НОЧИ' : 'КОСТИ НА СУКНЕ'}</span></div>
        <div class="ci-shutter"><i></i><i></i></div>
        <div class="ci-skip">клик — пропустить</div>`;
      document.getElementById('overlay').appendChild(vs);

      // пропуск: клик или пробел мгновенно доводят заставку до конца
      let skipped = VN.mode.skip, wake = null;
      const skip = (e) => { if (e) { e.stopPropagation(); if (e.type === 'keydown') e.preventDefault(); } skipped = true; wake && wake(); };
      const onKey = (e) => { if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') skip(e); };
      vs.addEventListener('click', skip);
      window.addEventListener('keydown', onKey, true);
      const wait = (ms) => (skipped ? Promise.resolve() : new Promise((r) => { const t = setTimeout(r, ms); wake = () => { clearTimeout(t); r(); }; }));
      const stage = (n) => { vs.className = 'cbi s' + n; };

      VN.Audio.combatMusic(true);
      await VN.util.frame();
      // 1 · тревога
      stage(1); VN.Audio.sfx('glitch'); VN.Audio.sfx('heartbeat');
      await wait(420); if (!skipped) { VN.Audio.sfx('heartbeat'); VN.Fx.shake(8, 300); }
      await wait(780);
      // 2 · досье
      stage(2); if (!skipped) { VN.Audio.sfx('whoosh'); setTimeout(() => !skipped && VN.Audio.sfx('stamp'), 420); }
      for (let n = 1; n <= threat && !skipped; n++) setTimeout(() => !skipped && VN.Audio.sfx('clock'), 600 + n * 120);
      await wait(this.mods.length || (this.def.passives || []).length ? 2600 : 1350);
      // 3 · VS
      stage(3); if (!skipped) { VN.Audio.sfx('impact'); VN.Fx.shake(26, 650); VN.Fx.flash('#fff', 160); }
      await wait(1050);
      // 4 · кости
      stage(4);
      if (!skipped) {
        VN.Audio.sfx('dice');
        const box = vs.querySelector('.ci-dice');
        [0, 1, 2].forEach((k) => {
          const die = VN.Dice.make(1, k === 1 ? 'blood' : 'bone');
          box.appendChild(die.el);
          die.roll(VN.Dice.d6(), { from: { x: -700 + k * 80, y: 120 - k * 60 }, dur: 900 + k * 120 });
        });
      }
      await wait(1250);
      // шторка → стол
      stage(5); if (!skipped) VN.Audio.sfx('shutter');
      await wait(380);
      this.build();
      this.pinIntent();
      window.removeEventListener('keydown', onKey, true);
      vs.classList.add('out');
      this.root.classList.add('in');
      await sleep(450);
      vs.remove();
      if (!VN.Meta.data.tutorial) { VN.Meta.set('tutorial', true); await this.help(); }
    }

    help() {
      return new Promise((resolve) => {
        const h = el('div', 'cb-help');
        h.innerHTML = `<div class="hc">
          <h3>КОСТИ НА СУКНЕ</h3>
          <ol>
            <li><b>Противник ходит открыто.</b> Его кубы — это его НАМЕРЕНИЕ: сколько урона он нанесёт или сколько заблокирует. Урон = кубы + его АТАКА (указана под полосой здоровья).</li>
            <li><b>Разложи свои кубы.</b> <span class="c-atk">УДАР</span> бьёт, <span class="c-blk">БЛОК</span> гасит входящий урон, <span class="c-shot">ВЫСТРЕЛ</span> — один куб ×3 сквозь броню (нужен патрон).</li>
            <li><b>Комбинации в УДАРЕ:</b> пара — ДУПЛЕТ +3, две пары +6, три подряд — СТРИТ +5, три одинаковых — ТРОЙКА ×2.</li>
            <li><b>Шестёрка в БЛОКЕ</b> — КОНТРА: противник получит 3 урона, если ударит.</li>
            <li><b>Кубы с «?»</b> — противник скрывает их до удара. Видна только часть урона: ставь блок с запасом.</li>
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
      if (this.player.poison) st.push(`<span class="st bleed">ЯД ×${this.player.poison}</span>`);
      this.$('.cb-pstatus').innerHTML = st.join('');
      const es = [];
      if (this.enemy.guard) es.push(`<span class="st guard">БЛОК ${this.enemy.guard}</span>`);
      if (this.enemy.stunned) es.push('<span class="st stun">ОГЛУШЁН</span>');
      if (this.enemy.dazed) es.push('<span class="st stun">ОСЛЕПЛЁН</span>');
      if (this.enemy.steps) es.push(`<span class="st bleed">К ВЫХОДУ ${this.enemy.steps}</span>`);
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
    async enemyIntent() {
      const { intent, log } = Rules.rollIntent(this.st);
      const m = intent.move;
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
        await Promise.all(ds.map((d, k) => { const v = intent.vals[k]; vals.push(v); return d.roll(v, { from: { x: 120, y: -120 }, dur: 800 }); }));
        if (m.type === 'barrage') ds.forEach((d) => { if (d.value <= 2) d.el.classList.add('miss'); });
        this.intentDice = ds;
      }
      const nHidden = intent.nHidden;
      for (let i = 0; i < nHidden; i++) {
        const d = this.intentDice[i];
        d.el.classList.remove('miss');
        d.el.appendChild(el('i', 'die-cover', '?'));
        d.el.classList.add('hidden-die');
      }
      this.renderIntentValue();
      box.classList.add('show');
      for (const l of log) await this.banner(l.t, l.sub, l.kind);
      if (Math.random() < 0.6) this.say(pick(this.def.taunts));
      this.updateBars();
    }

    /** Диапазон прибавки атаки по всем атакующим приёмам: «+4» или «+4…+7». */
    atkText() {
      const extra = this.enemy.atkMod + ((this.def.passives || []).find((p) => p.id === 'drunk') || { atk: 0 }).atk;
      const b = this.def.moves.filter((m) => m.type === 'attack' || m.type === 'barrage').map((m) => (m.bonus || 0) + extra);
      if (!b.length) return '—';
      const sg = (x) => (x < 0 ? '−' + -x : '+' + x);
      const lo = Math.min(...b), hi = Math.max(...b);
      return lo === hi ? sg(lo) : `${sg(lo)}…${sg(hi)}`;
    }

    /** Расшифровка намерения: «кубы 7 + атака 4». */
    renderFormula() {
      const it = this.enemy.intent, m = it.move, f = this.$('.it-formula');
      if (m.type === 'charge' || this.enemy.stunned) { f.innerHTML = ''; return; }
      const bonus = it.bonus != null ? it.bonus : m.bonus || 0;
      const dice = it.value - bonus;
      const shown = it.vals.length - it.nHidden; // сколько кубов видно
      const q = '?'.repeat(it.nHidden).split('').join(' + ');
      const diceTxt = it.revealed ? dice : shown > 0 ? `${dice - it.hiddenSum} + ${q}` : q;
      const what = m.type === 'guard' ? 'ЗАЩИТА' : 'АТАКА';
      const note = m.type === 'barrage' ? ' <em>(1–2 мимо)</em>' : '';
      f.innerHTML = `кубы <b>${diceTxt}</b>${note}${bonus ? ` + ${what} <b>${bonus}</b>` : ''}${it.alt != null ? ' <em>· или вторая книга</em>' : ''}`;
    }

    renderIntentValue() {
      this.renderFormula();
      const it = this.enemy.intent, m = it.move;
      const lab = m.type === 'guard' ? 'БЛОК' : m.type === 'charge' ? 'ГОТОВИТСЯ' : 'УРОН';
      const box = this.$('.it-value');
      if (m.type === 'charge') { box.innerHTML = `<b>!</b><span>${lab}</span>`; return; }
      const alt = it.alt != null ? `<i class="alt">/${it.alt}</i>` : '';
      if (!it.revealed) {
        const seen = it.value - it.hiddenSum;
        box.innerHTML = `<b>${seen}<i class="q">+${'?'.repeat(it.nHidden)}</i>${alt}</b><span>${lab}</span>`;
        return;
      }
      box.innerHTML = `<b>${it.value}${alt}</b><span>${lab}${it.pair && m.pairEffect ? ' · ПАРА!' : ''}</span>`;
    }

    /** Вскрыть скрытые кубы намерения (при ударе или предметом с reveal). */
    async revealHidden() {
      const it = this.enemy.intent;
      if (!it || it.revealed) return;
      it.revealed = true;
      (this.intentDice || []).forEach((d, i) => {
        if (i >= it.nHidden) return;
        const c = d.el.querySelector('.die-cover');
        d.el.classList.remove('hidden-die');
        if (c) { c.classList.add('flip'); setTimeout(() => c.remove(), 450); }
        if (it.move.type === 'barrage' && d.value <= 2) d.el.classList.add('miss');
      });
      VN.Audio.sfx('flash');
      this.renderIntentValue();
      if (this.phase === 'assign') this.preview();
      await sleep(VN.mode.skip ? 100 : 550);
    }

    async playerRoll() {
      this.dice.forEach((d) => d.d.el.remove());
      this.dice = [];
      const n = Math.max(1, this.cs.dice + (this.st.round === 1 ? this.st.dice1 : 0) - (this.player.cuff ? 1 : 0) + Rules.diceMod(this.st));
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
      const stolen = Rules.afterRoll(this.st, this.dice.map((o) => o.d.value));
      if (stolen >= 0) {
        const o = this.dice.splice(stolen, 1)[0];
        o.d.el.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate(900px, -500px) rotate(200deg) scale(.5)', opacity: 0 }], { duration: 600, easing: 'cubic-bezier(.5,0,.8,.4)', fill: 'forwards' });
        this.say('Моё!');
        await this.banner('КРАЖА', `унесли твой куб ${o.d.value}`, 'bad');
        o.d.el.remove();
      }
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
            let z = this.zoneAt(ev.clientX, ev.clientY, elx);
            if (z && z !== o.zone && !this.canPlace(z)) z = null;
            if (hover !== z) { this.root.querySelectorAll('.hot').forEach((h) => h.classList.remove('hot')); z && this.zoneBox(z).classList.add('hot'); hover = z; }
          }
        };
        const up = (ev) => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
          this.root.querySelectorAll('.hot').forEach((h) => h.classList.remove('hot'));
          if (drag) {
            // зону ищем ДО снятия .dragging, иначе под курсором окажется сам куб
            const z = this.zoneAt(ev.clientX, ev.clientY, elx);
            elx.classList.remove('dragging');
            if (z && z !== o.zone && this.canPlace(z)) this.place(o, z, true);
            else this.place(o, o.zone, true);
          } else this.cycle(o);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
      });
    }
    zoneBox(z) { return z === 'tray' ? this.$('.cb-tray') : this.$('.s-' + z); }
    /** Зона под курсором; перетаскиваемый куб (и всё внутри него) пропускаем. */
    zoneAt(x, y, skip) {
      for (const n of document.elementsFromPoint(x, y)) {
        if (skip && skip.contains(n)) continue;
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
      const attacking = it && !this.enemy.stunned && (it.move.type === 'attack' || it.move.type === 'barrage');
      const half = (x) => (this.enemy.dazed ? Math.floor(x / 2) : x);
      const incoming = attacking ? half(it.value) : 0;
      const dealt = Math.max(0, r.atk - this.enemy.guard - this.enemy.armor) * (v.atk.length ? 1 : 0) + r.shot;
      const taken = Math.max(0, incoming - r.blk);
      let takenTxt = String(taken), takenMax = taken;
      if (attacking && it.alt != null) {
        const a = Math.max(0, half(it.alt) - r.blk);
        takenMax = Math.max(taken, a);
        takenTxt = `${Math.min(taken, a)}–${takenMax}`;
      }
      if (attacking && !it.revealed) {
        // диапазон по скрытым кубам: шквал считает 1–2 промахом
        const seen = it.value - it.hiddenSum;
        const lo = half(seen + it.nHidden * (it.move.type === 'barrage' ? 0 : 1)), hi = half(seen + it.nHidden * 6);
        const tLo = Math.max(0, lo - r.blk);
        takenMax = Math.max(0, hi - r.blk);
        takenTxt = tLo === takenMax ? String(tLo) : `${tLo}–${takenMax}`;
      }
      this.$('.cb-forecast').innerHTML = `<span class="f-out">нанесёшь <b>${dealt}</b></span><span class="f-in ${takenMax ? 'bad' : 'ok'}">получишь <b>${takenTxt}</b></span>${v.tray.length ? `<span class="f-warn">${v.tray.length} куб. в лотке пропадёт</span>` : ''}`;
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
        if (it.cleanse && (this.player.bleed || this.player.burn || this.player.poison)) {
          this.player.bleed = this.player.burn = this.player.poison = 0;
          await this.banner('ПЕРЕВЯЗКА', 'кровь, ожог и яд сняты', 'gold');
        }
      }
      if (it.reveal) { await this.revealHidden(); await this.banner('ВСКРЫТО', 'все кубы противника на виду', 'gold'); }
      if (id === 'flask') {
        this.rerolls += 2; this.maxRerolls += 2;
        // лишний куб в лоток — второе дыхание
        const d = VN.Dice.make(1, 'bone'), o = { d, zone: 'tray' };
        this.zones.tray.appendChild(d.el); this.bindDie(o); this.dice.push(o);
        await d.roll(VN.Dice.d6(), { from: { x: -380, y: 260 } });
        await this.banner('ГЛОТОК', '+1 куб и +2 переброса', 'gold');
      }
      if (id === 'firecracker') {
        this.enemy.dazed = true; this.enemy.guard = 0;
        VN.Audio.sfx('firework'); VN.Fx.flash('#fff', 250); VN.Fx.shake(14);
        this.say('А-А-А! ГЛАЗА!');
        await this.banner('БА-БАХ!', 'противник ослеп: его удар вдвое слабее, блока нет', 'gold');
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
        if (r.bullseye) await this.banner('В ЯБЛОЧКО', `${r.shot} урона сквозь защиту`, 'gold');
        this.hitEnemy(r.shot, 'shot');
        await this.applyLog(Rules.afterEnemyHit(this.st, r.shot, 'shot'));
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
        await this.applyLog(Rules.afterEnemyHit(this.st, dmg, 'atk'));
        if (this.enemy.fled) return this.finish('win');
        if (this.player.hp <= 0) return this.finish('lose');
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
      await this.applyLog(Rules.endRound(this.st));
      if (this.enemy.hp <= 0) return this.finish('win');
      if (this.st.escaped) return this.finish('escaped');
      if (this.player.hp <= 0) return this.finish('lose');
      this.nextRound();
    }

    /** Показать события правил (баннеры, урон). Урон уже посчитан в правилах. */
    async applyLog(log) {
      for (const l of log) {
        if (l.toPlayer) { this.pop(this.$('.cb-ppanel'), '−' + l.toPlayer, 'dmg'); VN.Audio.sfx('hurt'); VN.Fx.shake(10, 300); }
        if (l.toEnemy) { const e = this.$('.cb-esprite'); e.classList.remove('hurt'); void e.offsetWidth; e.classList.add('hurt'); this.pop(e, '−' + l.toEnemy, 'shot'); VN.Audio.sfx('gunshot'); }
        if (l.toEnemyHeal) this.pop(this.$('.cb-esprite'), '+' + l.toEnemyHeal, 'heal');
        this.updateBars();
        await this.banner(l.t, l.sub, l.kind);
      }
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
      await this.revealHidden();
      this.$('.it-dice').querySelectorAll('.die').forEach((d, i) => d.animate(
        [{ transform: 'translate(0,0)' }, { transform: `translate(${-500 - i * 40}px, 120px) scale(0.6)`, opacity: 0.2 }],
        { duration: 300, easing: 'cubic-bezier(.5,0,1,.5)', fill: 'forwards' }));
      await sleep(260);
      let incoming = Rules.realIncoming(this.st);
      if (this.enemy.dazed && incoming > 0) { incoming = Math.floor(incoming / 2); await this.banner('ОСЛЕПЛЁН', `бьёт наугад: урон ${incoming}`, 'gold'); }
      if (it.missed) { this.say(pick(['Мимо!..', 'Где ты?!', 'Стой ровно!'])); await this.banner('ПЬЯНЫЙ ПРИЦЕЛ', 'мимо', 'acid'); }
      if (it.alt != null) { this.$('.it-value').innerHTML = `<b>${incoming}</b><span>НАСТОЯЩАЯ КНИГА</span>`; await this.banner('НАСТОЯЩАЯ КНИГА', `урон ${incoming}`, 'bad'); }
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
        await this.applyLog(Rules.afterPlayerHit(this.st, dmg));
      } else if (incoming > 0) {
        VN.Audio.sfx('lock');
        await this.banner('ЧИСТЫЙ БЛОК', '', 'acid');
        await this.applyLog(Rules.afterFullBlock(this.st));
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

    /** Окно намерения всегда под панелью противника: пассивки и статусы
        растут вниз — окно съезжает следом и никогда их не перекрывает. */
    pinIntent() {
      const ep = this.$('.cb-epanel'), it = this.$('.cb-intent');
      if (!ep || !it) return;
      const place = () => { it.style.top = Math.max(230, ep.offsetTop + ep.offsetHeight + 10) + 'px'; };
      place();
      if (window.ResizeObserver) { this.ro = new ResizeObserver(place); this.ro.observe(ep); }
    }

    /** Часы боя: сыгранные раунды съедают минуты до полуночи. */
    tickClock() {
      const box = this.$('.cb-clock');
      if (!Rules.minutesPerRound(VN.S.act) || !box) return;
      const due = Rules.fightMinutes(this.st.round, VN.S.act) - (this.clockMin || 0);
      if (due > 0) {
        this.clockMin = (this.clockMin || 0) + due;
        VN.State.addTime(due);
        this.pop(box, `+${due} МИН`, 'guard');
      }
      const left = VN.State.minutesLeft();
      box.className = 'cb-clock' + (left <= 10 ? ' hot' : '');
      box.innerHTML = `⏱ <b>${VN.State.clock()}</b> · ${(VN.S.clock && VN.S.clock.label) || 'до полуночи'} <b>${left}</b> мин`;
    }

    async nextRound() {
      this.tickClock();
      this.enemy.dazed = false;
      // убрать кубы со стола
      this.dice.forEach((o) => o.d.el.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(0.6)' }], { duration: 200, fill: 'forwards' }));
      this.$('.cb-intent').classList.remove('show');
      await sleep(250);
      this.st.round++;
      const rd = this.$('.cb-round');
      rd.textContent = 'РАУНД ' + this.st.round;
      rd.classList.remove('show'); void rd.offsetWidth; rd.classList.add('show');
      VN.Audio.sfx('clock');
      await sleep(VN.mode.skip ? 100 : 500);
      await this.enemyIntent();
      await this.playerRoll();
    }

    async finish(result) {
      this.phase = 'end';
      this.tickClock();
      this.updateRes();
      VN.Audio.combatMusic(false);
      const words = { win: this.enemy.fled ? ['СБЕЖАЛ', 'он бросил всё и ушёл'] : ['ЧИСТО', 'противник повержен'], lose: ['НОКАУТ', 'ты на асфальте'], fled: ['УШЁЛ', 'не сегодня'], escaped: ['УШЁЛ', 'он ушёл — с тем, за чем приходил'] };
      // исход для сюжета: «сбежал» — это победа с пометкой, «ушёл с добычей» — поражение с пометкой
      VN.S.flags._enemyFled = !!this.enemy.fled;
      VN.S.flags._enemyEscaped = result === 'escaped';
      if (result === 'escaped') result = 'lose';
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
      if (this.ro) this.ro.disconnect();
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
    Fight,
    start(id, opts) {
      return new Promise((resolve) => { new Fight(id, opts, resolve).run(); });
    },
  };
})();
