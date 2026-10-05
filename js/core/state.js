/* ==========================================================================
   Состояние партии: статы, здоровье, время до полуночи, флаги-улики,
   инвентарь, путь по сюжету. Всё сериализуемо → сохранения в localStorage.
   VN.Meta — данные между прохождениями (открытые концовки).
   ========================================================================== */
(function () {
  'use strict';
  const VN = window.VN;
  const KEY = 'lnoy_save_';
  const META_KEY = 'lnoy_meta';

  const STATS = {
    str: { name: 'СИЛА', short: 'СИЛ', color: '#ff5a5a' },
    agi: { name: 'ЛОВКОСТЬ', short: 'ЛОВ', color: '#b6ff3b' },
    nrv: { name: 'НЕРВЫ', short: 'НРВ', color: '#c27bff' },
  };
  const DEADLINE = 60; // минут после 23:00 → полночь

  function fresh() {
    return {
      v: 1,
      stats: { str: 1, agi: 1, nrv: 1 },
      hp: 22, maxHp: 22,
      time: 7,               // минут после 23:00
      background: null,      // id предыстории
      flags: {},
      inv: {},
      met: {},
      path: [],
      stage: { bg: null, sprites: {} },
      pointer: null,
      log: [],
    };
  }

  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function fetchJSON(k) { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : null; } catch (e) { return null; } }

  VN.S = fresh();

  VN.State = {
    STATS, DEADLINE,

    reset() { VN.S = fresh(); VN.bus.emit('state:reset'); return VN.S; },

    /* ---- инвентарь ---- */
    has(id, n = 1) { return (VN.S.inv[id] || 0) >= n; },
    count(id) { return VN.S.inv[id] || 0; },
    give(id, n = 1, quiet) {
      VN.S.inv[id] = (VN.S.inv[id] || 0) + n;
      if (!quiet) VN.bus.emit('inv:add', { id, n });
      VN.bus.emit('state');
    },
    take(id, n = 1, quiet) {
      if (!VN.S.inv[id]) return false;
      VN.S.inv[id] -= n;
      if (VN.S.inv[id] <= 0) delete VN.S.inv[id];
      if (!quiet) VN.bus.emit('inv:remove', { id, n });
      VN.bus.emit('state');
      return true;
    },

    /* ---- флаги/улики ---- */
    flag(k) { return !!VN.S.flags[k]; },
    set(k, v) {
      const was = VN.S.flags[k];
      VN.S.flags[k] = v;
      if (!was && v && VN.Clues && VN.Clues[k]) VN.bus.emit('clue', k);
      VN.bus.emit('state');
    },

    /* ---- время ---- */
    addTime(m) {
      if (!m) return;
      VN.S.time += m;
      VN.bus.emit('time', { delta: m });
      VN.bus.emit('state');
    },
    clock(t = VN.S.time) {
      const tot = 23 * 60 + t;
      const h = Math.floor(tot / 60) % 24, m = ((tot % 60) + 60) % 60;
      return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    },
    minutesLeft() { return Math.max(0, DEADLINE - VN.S.time); },

    /* ---- здоровье ---- */
    heal(n) {
      const before = VN.S.hp;
      VN.S.hp = Math.min(VN.S.maxHp, VN.S.hp + n);
      VN.bus.emit('hp', { delta: VN.S.hp - before });
      VN.bus.emit('state');
    },
    hurt(n) {
      VN.S.hp = Math.max(0, VN.S.hp - n);
      VN.bus.emit('hp', { delta: -n });
      VN.bus.emit('state');
    },

    /* ---- производные боевые параметры ---- */
    combatStats() {
      const S = VN.S, bg = S.background;
      let atkBonus = Math.max(0, S.stats.str - 1);
      if (this.has('knuckles')) atkBonus += 1;
      if (bg === 'cop') atkBonus += 2; // выучка опера
      if (this.has('frog_knife')) atkBonus += 1;
      return {
        dice: 3 + (bg === 'thief' ? 1 : 0),
        rerolls: 1 + (bg === 'cop' ? 2 : 0),
        atkBonus,
        blkBonus: bg === 'boxer' || bg === 'cop' ? 1 : 0,
        gun: this.has('revolver'),
      };
    },

    /* ---- сохранения ---- */
    save(slot) {
      const data = VN.util.clone(VN.S);
      data.savedAt = Date.now();
      data.sceneTitle = (VN.Story.get(data.pointer && data.pointer.scene) || {}).title || '';
      return store(KEY + slot, data);
    },
    peek(slot) { return fetchJSON(KEY + slot); },
    load(slot) {
      const d = fetchJSON(KEY + slot);
      if (!d) return null;
      VN.S = Object.assign(fresh(), d);
      VN.bus.emit('state');
      return VN.S;
    },
  };

  /* ---- мета-прогресс между прохождениями ---- */
  VN.Meta = {
    data: Object.assign({ endings: {}, tutorial: false }, fetchJSON(META_KEY) || {}),
    unlock(id) { this.data.endings[id] = Date.now(); store(META_KEY, this.data); },
    set(k, v) { this.data[k] = v; store(META_KEY, this.data); },
  };
})();
