/* ==========================================================================
   Симулятор баланса боя.
     node tools/balance.js [боёв]            — отчёт по всем врагам
     node tools/balance.js tune id1 id2 ...  — подобрать ХП и урон под шкалу
   ---------------------------------------------------------------------------
   Грузит из игры: данные врагов, предыстории, ПРАВИЛА БОЯ (combat-rules.js —
   тот же код, что в бою: пассивки, скрытые кубы, двойная бухгалтерия…).
   Бот: полный ХП, одна аптечка (+8), без револьвера и без модификаторов.
   Видит намерение (скрытые кубы считает как 3,5; при двух вариантах урона
   — среднее), перебирает все раскладки, перебрасывает слабые кубы.
   Цель (доля поражений бота) по уровню опасности:
     1 ≈ 0% (бот теряет ~10 ХП) · 2 ≈ 15% · 3 ≈ 30% · 4 ≈ 45% · 5 ≈ 60%
   ========================================================================== */
const fs = require('fs'), vm = require('vm'), path = require('path');
const G = path.join(__dirname, '..', 'js') + '/';
const ctx = { console, localStorage: { getItem: () => null, setItem() {} }, setTimeout, Math, performance: { now: () => Date.now() } };
ctx.window = ctx; vm.createContext(ctx);
for (const f of ['core/namespace.js', 'core/state.js', 'data/items.js', 'data/codex.js', 'data/characters.js', 'data/enemies.js', 'systems/combat-rules.js'])
  vm.runInContext(fs.readFileSync(G + f, 'utf8'), ctx);
const VN = ctx.VN, R = VN.CombatRules;
const TARGET = { 1: 0, 2: 0.15, 3: 0.3, 4: 0.45, 5: 0.6 };

const BUILDS = {};
for (const [id, b] of Object.entries(VN.Backgrounds)) {
  VN.State.reset(); VN.S.background = id; VN.S.stats = { ...b.stats }; VN.State.give(b.item, 1, true);
  const c = VN.State.combatStats();
  BUILDS[id] = { hp: b.hp, cs: { dice: c.dice, rerolls: c.rerolls, atkBonus: c.atkBonus, blkBonus: c.blkBonus, gun: false } };
}
const d6 = () => 1 + Math.floor(Math.random() * 6);
const threatOf = (id) => VN.Enemies[id].threat || ((VN.Characters[id] || {}).dossier || {}).threat || 1;

function bestAssign(vals, cs, e, incoming, php) {
  const n = vals.length; let best = null;
  for (let mask = 0; mask < 3 ** n; mask++) {
    const v = { atk: [], blk: [], shot: [], tray: [] }; let m = mask;
    for (let i = 0; i < n; i++) { const z = m % 3; m = (m / 3) | 0; (z === 0 ? v.atk : z === 1 ? v.blk : v.tray).push(vals[i]); }
    const r = R.evaluate(v, cs);
    const dealt = v.atk.length ? Math.max(0, r.atk - e.guard - e.armor) : 0;
    const taken = Math.max(0, incoming - r.blk);
    let s = Math.min(dealt + (r.counter && incoming > 0 ? 3 : 0), e.hp) - taken * (php - taken <= 0 ? 50 : 1.15);
    if (dealt >= e.hp) s += 100;
    if (!best || s > best.s) best = { s, v, r, dealt };
  }
  return best;
}

function fight(def, build) {
  const st = R.makeState(def, build.cs, { hp: build.hp, maxHp: build.hp }, []);
  const p = st.player, e = st.enemy, cs = st.cs;
  let healed = false;
  const res = (win) => ({ win, lost: build.hp - p.hp + (healed ? 8 : 0), healed, rounds: st.round });
  while (st.round < 80) {
    st.round++;
    const { intent } = R.rollIntent(st);
    const m = intent.move;
    const attacking = m.type === 'attack' || m.type === 'barrage';
    let seen = attacking ? intent.value - intent.hiddenSum + intent.nHidden * (m.type === 'barrage' ? 3 : 3.5) : 0;
    if (attacking && intent.alt != null) seen = (seen + intent.alt) / 2;
    if (!healed && (p.hp - seen <= 4 || p.hp <= p.maxHp * 0.35)) { p.hp = Math.min(p.maxHp, p.hp + 8); healed = true; }
    const n = Math.max(1, cs.dice + (st.round === 1 ? st.dice1 : 0) - (p.cuff ? 1 : 0) + R.diceMod(st)); p.cuff = false;
    let dv = []; for (let i = 0; i < n; i++) dv.push(d6());
    const stolen = R.afterRoll(st, dv); if (stolen >= 0) dv.splice(stolen, 1);
    for (let rr = 0; rr < cs.rerolls; rr++) {
      const cnt = {}; dv.forEach((x) => (cnt[x] = (cnt[x] || 0) + 1));
      const idx = dv.map((x, i) => i).filter((i) => dv[i] <= 3 && cnt[dv[i]] < 2);
      if (!idx.length) break;
      idx.forEach((i) => (dv[i] = d6()));
    }
    const best = bestAssign(dv, cs, e, seen, p.hp);
    // удар
    if (best.v.atk.length) {
      const dmg = Math.max(0, best.r.atk - e.guard - e.armor);
      e.hp -= dmg; if (e.hp <= 0) return res(true);
      R.afterEnemyHit(st, dmg, 'atk'); if (e.fled) return res(true); if (p.hp <= 0) return res(false);
    }
    // ответ
    if (attacking) {
      const inc = R.realIncoming(st);
      const dmg = Math.max(0, inc - best.r.blk);
      if (dmg > 0) {
        p.hp -= dmg;
        if (m.onHit === 'burn') p.burn = 2;
        if (m.onHit === 'cuff') p.cuff = true;
        if (m.pairEffect === 'bleed' && intent.pair) p.bleed = 2;
        R.afterPlayerHit(st, dmg);
      } else if (inc > 0) R.afterFullBlock(st);
      if (best.r.counter && inc > 0) { e.hp -= 3; if (e.hp <= 0) return res(true); }
    }
    for (const k of ['bleed', 'burn']) if (p[k] > 0) { p[k]--; p.hp -= 2; }
    R.endRound(st);
    if (e.hp <= 0) return res(true);
    if (st.escaped) return res(false);
    if (p.hp <= 0) return res(false);
  }
  return res(false);
}

function stats(def, N = 2000) {
  const out = {}; let L = 0, W = 0, lost = 0;
  for (const [k, b] of Object.entries(BUILDS)) {
    let l = 0, w = 0, ls = 0, rd = 0;
    for (let i = 0; i < N; i++) { const r = fight(def, b); rd += r.rounds; if (r.win) { w++; ls += r.lost; } else l++; }
    out[k] = { lose: l / N, rounds: rd / N }; L += l; W += w; lost += ls;
  }
  out.avg = { lose: L / (N * 3), lost: W ? lost / W : 0 };
  return out;
}

/** Копия врага: ХП и прибавка к атакам. */
function variant(def, hp, dmg) {
  return { ...def, hp, moves: def.moves.map((m) => (m.type === 'attack' || m.type === 'barrage' ? { ...m, bonus: (m.bonus || 0) + dmg } : m)) };
}

function tune(id) {
  const def = VN.Enemies[id], th = threatOf(id), target = TARGET[th];
  let best = null;
  for (let dmg = -3; dmg <= 4; dmg++) {
    let lo = 15, hi = 160;
    for (let it = 0; it < 7; it++) {
      const hp = Math.round((lo + hi) / 2);
      const s = stats(variant(def, hp, dmg), 500).avg;
      const score = th === 1 ? (s.lose > 0.04 ? 10 + s.lose : Math.abs(s.lost - 10) / 10) : Math.abs(s.lose - target);
      if (!best || score < best.score) best = { score, hp, dmg };
      if (th === 1 ? s.lost < 10 && s.lose <= 0.04 : s.lose < target) lo = hp; else hi = hp;
    }
  }
  const fin = stats(variant(def, best.hp, best.dmg), 3000);
  return { id, threat: th, hp: best.hp, dmg: best.dmg, lose: fin.avg.lose, lost: fin.avg.lost, rounds: Object.keys(BUILDS).map((k) => fin[k].rounds.toFixed(1)).join('/') };
}

module.exports = { VN, stats, fight, BUILDS, tune, variant };
if (require.main === module) {
  const pct = (x) => (x * 100).toFixed(1).padStart(5) + '%';
  if (process.argv[2] === 'tune') {
    for (const id of process.argv.slice(3)) {
      const t = tune(id);
      console.log(`${id.padEnd(10)} опасность ${t.threat} → ХП ${t.hp}, урон ${t.dmg >= 0 ? '+' : ''}${t.dmg} | поражений ${pct(t.lose)} | теряет ${t.lost.toFixed(1)} | раунды ${t.rounds}`);
    }
  } else {
    const N = +process.argv[2] || 2000;
    console.log(`Бот: полное ХП, 1 аптечка (+8). Боёв на предысторию: ${N}`);
    for (const id of Object.keys(VN.Enemies).sort((a, b) => threatOf(a) - threatOf(b))) {
      const s = stats(VN.Enemies[id], N);
      console.log(`${id.padEnd(10)} опасность ${threatOf(id)} | цель ${pct(TARGET[threatOf(id)])} | поражений ${pct(s.avg.lose)} | теряет ХП ${s.avg.lost.toFixed(1).padStart(4)} | ` +
        Object.keys(BUILDS).map((k) => `${k} ${pct(s[k].lose)} ${s[k].rounds.toFixed(1)}р`).join('  '));
    }
  }
}
