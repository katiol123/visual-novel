/* ==========================================================================
   Интерпретатор сценария. Идёт по плоскому списку команд сцены,
   исполняет простые ключи в фиксированном порядке и обрабатывает
   операции переходов (jif/jmp/choice/check/combat/trade).
   token — защита от «висящих» циклов после загрузки/рестарта.
   ========================================================================== */
(function () {
  'use strict';
  const VN = window.VN;
  const { sleep } = VN.util;

  const R = {
    token: 0, scene: null, i: 0, busy: false, inChoice: false,

    canSave() { return !!this.scene && !this.busy; },

    newGame() {
      VN.State.reset();
      VN.mode.auto = VN.mode.skip = false;
      this.start('intro', 0);
    },

    stop() {
      this.token++;
      VN.Input.flush();
      VN.Dialogue.hide();
      document.getElementById('choices').innerHTML = '';
      document.getElementById('choices').className = '';
      VN.Dialogue.box.classList.remove('dimmed');
    },

    async loadSlot(slot) {
      this.stop();
      const S = VN.State.load(slot);
      if (!S || !S.pointer) return;
      VN.Title.hide();
      VN.Modal.stack.slice().forEach((m) => VN.Modal.close(m));
      VN.Backdrop.set(S.stage.bg || 'black');
      VN.Audio.scene(VN.Locations[S.stage.bg]);
      VN.Stage.restore(S.stage.sprites);
      VN.Fx.laser(!!S.flags._laser);
      VN.HUD.show(true);
      VN.HUD.update();
      VN.Toast.show('<b>Загружено</b>', 'time');
      this.start(S.pointer.scene, S.pointer.i, true);
    },

    async start(sceneId, index = 0, resumed) {
      const my = ++this.token;
      VN.Input.flush();
      VN.HUD.show(true);
      let id = sceneId, i = index, fresh = !resumed;
      while (id && my === this.token) {
        const sc = VN.Story.get(id);
        if (!sc) { console.error('Нет сцены', id); return; }
        this.scene = sc;
        if (fresh && i === 0) {
          if (VN.S.path[VN.S.path.length - 1] !== id) VN.S.path.push(id);
        }
        fresh = true;
        let next = null;
        while (i < sc.compiled.length) {
          if (my !== this.token) return;
          VN.S.pointer = { scene: id, i };
          const res = await this.exec(sc.compiled[i], sc);
          if (my !== this.token) return;
          if (res && res.goto) { next = res.goto; break; }
          if (res && res.end) return;
          if (res && res.to != null) {
            const t = sc.labels[res.to];
            if (t == null) { console.error('Нет метки', res.to, 'в', id); return; }
            i = t;
          } else i++;
        }
        id = next; i = 0;
      }
    },

    /** Исполняет одну команду. Возвращает {to}|{goto}|{end}|undefined. */
    async exec(c, sc) {
      const S = VN.S, St = VN.State;
      switch (c.op) {
        case 'jmp': return { to: c.to };
        case 'jif': return c.cond(S) ? undefined : { to: c.to };
        case 'choice': return this.choice(c, sc);
        case 'check': {
          this.busy = true;
          const ok = await VN.Checks.run(typeof c.check === 'function' ? c.check(S) : c.check);
          this.busy = false;
          return { to: ok ? c.passL : c.failL };
        }
        case 'combat': {
          this.busy = true;
          VN.Dialogue.hide();
          const opts = Object.assign({ flee: c.flee }, typeof c.opts === 'function' ? c.opts(S) : c.opts || {});
          const res = await VN.Combat.start(c.enemy, opts);
          this.busy = false;
          // проигрыш не всегда смерть: сюжет продолжается — герой приходит в себя
          if (res !== 'win' && S.hp <= 0) { S.hp = Math.max(4, Math.round(S.maxHp * 0.2)); VN.bus.emit('state'); }
          return { to: c.labels[res] };
        }
        case 'trade': {
          const t = c.trade;
          const id = await new Promise((resolve) => VN.Inventory.render({
            mode: 'select', title: t.title || 'ОБМЕН', sub: t.prompt, action: t.action || 'ОТДАТЬ',
            filter: t.filter || ((it) => it.tradeable), resolve,
          }));
          if (id) { St.take(id, 1); S.flags._lastTrade = id; return { to: c.okL }; }
          return { to: c.noL };
        }
      }

      // ---- простые команды; порядок ключей важен ----
      if (c.bg) {
        const loc = VN.Locations[c.bg];
        await VN.Trans.run(c.trans || 'fade', async () => {
          VN.Stage.clearInstant();
          VN.Fx.laser(false); S.flags._laser = false;
          VN.Backdrop.set(c.bg);
          S.stage.bg = c.bg;
          VN.Dialogue.hide();
        });
        if (c.amb) VN.Audio.ambient(c.amb); else VN.Audio.scene(loc);
      }
      if (c.amb && !c.bg) VN.Audio.ambient(c.amb);
      if (c.chapter) { VN.Dialogue.hide(); await VN.Trans.chapter(c.chapter, c.title || ''); }
      if (c.place) VN.Trans.place(c.place);
      if (c.hide) await VN.Stage.hide(c.hide, c.exit);
      if (c.clear) await VN.Stage.clear();
      if (c.show) {
        VN.Dialogue.box.classList.add('dimmed');
        await VN.Stage.show(c.show, c.at || 'center', c.enter || 'silhouette');
        VN.Dialogue.box.classList.remove('dimmed');
      }
      if (c.sfx) VN.Audio.sfx(c.sfx);
      if (c.fx) {
        VN.Fx.run(c.fx);
        if (c.fx === 'laser') S.flags._laser = true;
        if (c.fx === 'nolaser') S.flags._laser = false;
      }
      if (c.act) {
        // начало акта: свои часы и дедлайн, раны перевязаны
        const A = c.act;
        S.act = A.n;
        S.clock = { start: A.start, deadline: A.deadline, label: A.label, date: A.date };
        S.time = A.start;
        if (A.maxHp) S.maxHp = A.maxHp;
        S.hp = S.maxHp;
        VN.bus.emit('state');
      }
      if (c.rel) Object.entries(c.rel).forEach(([k, v]) => St.addRel(k, v, c.quiet));
      if (c.shop) { this.busy = true; await VN.Trade.open(typeof c.shop === 'function' ? c.shop(S) : c.shop); this.busy = false; }
      if (c.time) St.addTime(c.time);
      if (c.setTime != null) { S.time = c.setTime; VN.bus.emit('state'); }
      if (c.set) Object.entries(c.set).forEach(([k, v]) => St.set(k, v));
      if (c.add) Object.entries(c.add).forEach(([k, v]) => St.set(k, (S.flags[k] || 0) + v));
      if (c.give) { const [id, n] = Array.isArray(c.give) ? c.give : [c.give, 1]; St.give(id, n); }
      if (c.take) { const [id, n] = Array.isArray(c.take) ? c.take : [c.take, 1]; St.take(id, n); }
      if (c.heal) St.heal(c.heal);
      if (c.hurt) { St.hurt(c.hurt); VN.Fx.flash('rgba(255,20,50,0.45)', 350); VN.Fx.shake(14); VN.Audio.sfx('hurt'); }
      if (c.sethp != null) { S.hp = Math.min(S.maxHp, c.sethp); VN.bus.emit('state'); }
      if (c.run) c.run(S);
      if (c.wait && !VN.mode.skip) await sleep(c.wait);
      if (c.say) {
        const text = typeof c.text === 'function' ? c.text(S) : c.text;
        await VN.Dialogue.say(c.say, text, { as: c.as });
      }
      if (c.creation) { VN.Dialogue.hide(); await VN.Creation.run(); }
      if (c.loadout) { VN.Dialogue.hide(); await VN.Loadout.run(c.loadout); }
      if (c.ending) {
        this.scene = null;
        await VN.Ending.show(c.ending);
        return { end: true };
      }
      if (c.goto) return { goto: typeof c.goto === 'function' ? c.goto(S) : c.goto };
      if (c.jump) return { to: c.jump };
      return undefined;
    },

    /** Подготовка вариантов выбора: видимость, блокировки, теги. */
    async choice(c, sc) {
      const S = VN.S, St = VN.State;
      const onceKey = (k) => `_once_${sc.id}_${c.id}_${k}`;
      const shown = [];
      c.options.forEach((o, k) => {
        if (o.if && !o.if(S)) return;
        if (o.once && S.flags[onceKey(k)]) return;
        const tags = [];
        let locked = false, reason = '';
        if (o.need) {
          const needs = Array.isArray(o.need) ? o.need : [o.need];
          needs.forEach((n) => {
            const it = VN.Items[n];
            tags.push({ t: '◆ ' + it.name, k: 'item' });
            if (!St.has(n)) { locked = true; reason = 'нужно: ' + it.name; }
          });
        }
        const ck = typeof o.check === 'function' ? o.check(S) : o.check;
        if (ck) {
          const st = St.STATS[ck.stat];
          tags.push({ t: `🎲 ${st.name} ${ck.dc} · ${VN.Choices.chance(S.stats[ck.stat], ck.dc)}%`, k: 'check-' + ck.stat });
        }
        if (o.time) tags.push({ t: `⏱ +${o.time} мин`, k: 'time' });
        if (o.tag) tags.push({ t: o.tag, k: 'flag' });
        if (o.combat) tags.push({ t: '⚔ бой', k: 'fight' });
        const text = typeof o.text === 'function' ? o.text(S) : o.text;
        shown.push({ k, o, ck, view: { text, tags, locked, reason } });
      });
      if (!shown.length) { console.warn('Нет доступных вариантов', sc.id, c.id); return undefined; }

      VN.State.save('auto');
      VN.Stage.focus(null);
      const idx = await VN.Choices.show(shown.map((s) => s.view), { timer: c.timer, prompt: c.prompt });
      if (idx < 0) return { to: c.timeoutL };
      const { k, o, ck } = shown[idx];
      if (o.once) S.flags[onceKey(k)] = true;
      if (o.time) St.addTime(o.time);
      if (ck) {
        this.busy = true;
        const ok = await VN.Checks.run({ stat: ck.stat, dc: ck.dc, label: VN.Typewriter.strip(typeof o.text === 'function' ? o.text(S) : o.text) });
        this.busy = false;
        return { to: ok ? o.passL : o.failL };
      }
      return { to: o.doL };
    },
  };

  VN.Runner = R;
})();
