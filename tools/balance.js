/* ==========================================================================
   Симулятор баланса боя.  Запуск:  node tools/balance.js [число боёв]
   ---------------------------------------------------------------------------
   Грузит данные врагов, предыстории и формулу урона прямо из файлов игры.
   Бот: начинает с полным ХП, видит намерение (кроме скрытых кубов — за них
   считает средние 3,5), перебирает все раскладки кубов, перебрасывает слабые,
   один раз за бой лечится аптечкой (+8). Без револьвера.
   Цель калибровки (доля поражений бота): опасность 1 ≈ 0% (теряет ~10 ХП),
   далее +15% за уровень: 15 / 30 / 45 / 60%.
   ========================================================================== */
const fs = require('fs'), vm = require('vm'), path = require('path');
const G = path.join(__dirname, '..', 'js') + '/';
const ctx = { window: {}, console, localStorage: { getItem: () => null, setItem() {} }, setTimeout, Math };
ctx.window = ctx; vm.createContext(ctx);
for (const f of ['core/namespace.js', 'core/state.js', 'data/items.js', 'data/codex.js', 'data/characters.js', 'data/enemies.js', 'systems/combat.js']) vm.runInContext(fs.readFileSync(G + f, 'utf8'), ctx);
const VN = ctx.VN, evaluate = VN.Combat.evaluate;

// предыстории берутся из игры: VN.Backgrounds + VN.State.combatStats()
const BUILDS = {};
for (const [id, b] of Object.entries(VN.Backgrounds)) {
  VN.State.reset(); VN.S.background = id; VN.S.stats = { ...b.stats }; VN.State.give(b.item, 1, true);
  const c = VN.State.combatStats();
  BUILDS[id] = { hp: b.hp, dice: c.dice, rerolls: c.rerolls, atkBonus: c.atkBonus, blkBonus: c.blkBonus };
}
const d6 = () => 1 + Math.floor(Math.random() * 6);

// лучшая раскладка: перебор атака/блок/лоток
function bestAssign(vals, cs, en, intent, php) {
  const n = vals.length; let best = null;
  const incoming = intent.type === 'attack' || intent.type === 'barrage' ? intent.value : 0;
  for (let mask = 0; mask < 3 ** n; mask++) {
    const v = { atk: [], blk: [], shot: [], tray: [] }; let m = mask;
    for (let i = 0; i < n; i++) { const z = m % 3; m = (m / 3) | 0; (z === 0 ? v.atk : z === 1 ? v.blk : v.tray).push(vals[i]); }
    const r = evaluate(v, cs);
    const dealt = v.atk.length ? Math.max(0, r.atk - en.guard - en.armor) : 0;
    const taken = Math.max(0, incoming - r.blk);
    const counter = r.counter && incoming > 0 ? 3 : 0;
    let s = Math.min(dealt + counter, en.hp) * 1.0 - taken * (php - taken <= 0 ? 50 : 1.15);
    if (dealt >= en.hp) s += 100;
    if (!best || s > best.s) best = { s, v, r, dealt, taken, counter };
  }
  return best;
}

function fight(def, b, opt = {}) {
  const cs = { ...b, gun: false };
  const p = { hp: b.hp, max: b.hp, bleed: 0, burn: 0, cuff: false, heal: opt.heal ?? 8, healed: false };
  const e = { hp: def.hp, max: def.hp, armor: def.armor || 0, guard: 0, next: null, lastType: null };
  let round = 0;
  while (round < 60) {
    round++; e.guard = 0;
    // намерение
    let m;
    if (e.next != null) { m = def.moves[e.next]; e.next = null; }
    else {
      const pool = def.moves.filter((x) => x.w > 0 && !(x.type === 'guard' && e.lastType === 'guard') && !(x.type === 'charge' && round === 1));
      let r = Math.random() * pool.reduce((a, x) => a + x.w, 0); m = pool[pool.length - 1];
      for (const x of pool) { r -= x.w; if (r <= 0) { m = x; break; } }
    }
    const vals = []; for (let i = 0; i < (m.dice || 0); i++) vals.push(d6());
    let value = 0;
    const enr = opt.enrage && e.hp <= e.max / 2 ? opt.enrage : 0;
    if (m.type === 'attack') value = vals.reduce((a, x) => a + x, 0) + (m.bonus || 0) + (opt.dmg || 0) + enr;
    if (m.type === 'barrage') value = vals.filter((x) => x > 2).reduce((a, x) => a + x, 0) + (m.bonus || 0) + (opt.dmg || 0) + enr;
    if (m.type === 'guard') value = vals.reduce((a, x) => a + x, 0) + (m.bonus || 0);
    const intent = { type: m.type, value, pair: vals.length >= 2 && new Set(vals).size < vals.length };
    if (m.type === 'guard') e.guard = value;
    // вариант: блок с ответным уколом
    const chip = m.type === 'guard' && opt.chip ? opt.chip : 0;
    if (chip) { intent.type = 'attack'; intent.value = chip; }
    e.lastType = m.type; if (m.type === 'charge') e.next = m.next;
    // лечение: один раз, если удар может уронить ниже порога
    const inc0 = intent.type === 'attack' || intent.type === 'barrage' ? intent.value : 0;
    if (!p.healed && p.heal && (p.hp - inc0 <= 4 || p.hp <= p.max * 0.35)) { p.hp = Math.min(p.max, p.hp + p.heal); p.healed = true; }
    // бросок + перебросы
    const n = Math.max(1, b.dice - (p.cuff ? 1 : 0)); p.cuff = false;
    let dv = []; for (let i = 0; i < n; i++) dv.push(d6());
    for (let rr = 0; rr < b.rerolls; rr++) {
      // перебрасываем низкие кубы (≤3), не входящие в пару
      const cnt = {}; dv.forEach((x) => (cnt[x] = (cnt[x] || 0) + 1));
      const idx = dv.map((x, i) => i).filter((i) => dv[i] <= 3 && cnt[dv[i]] < 2);
      if (!idx.length) break;
      idx.forEach((i) => (dv[i] = d6()));
    }
    let seen = intent;
    if (opt.hidden && (intent.type === 'attack' || intent.type === 'barrage') && vals.length) {
      const h = vals[0]; const hv = intent.type === 'barrage' ? (h > 2 ? h : 0) : h;
      seen = { ...intent, value: intent.value - hv + (intent.type === 'barrage' ? 3 : 3.5) };
    }
    const best = bestAssign(dv, cs, e, seen, p.hp);
    // удар
    e.hp -= best.dealt; if (e.hp <= 0) return { win: true, lost: p.max - p.hp + (p.healed ? p.heal : 0), healed: p.healed, rounds: round };
    // ответ
    if (intent.type === 'attack' || intent.type === 'barrage') {
      const dmg = Math.max(0, intent.value - best.r.blk);
      if (dmg > 0) {
        p.hp -= dmg;
        if (m.onHit === 'burn') p.burn = 2;
        if (m.onHit === 'cuff') p.cuff = true;
        if (m.pairEffect === 'bleed' && intent.pair) p.bleed = 2;
      }
      if (best.r.counter && intent.value > 0) { e.hp -= 3; if (e.hp <= 0) return { win: true, lost: p.max - p.hp + (p.healed ? p.heal : 0), healed: p.healed, rounds: round }; }
    }
    for (const k of ['bleed', 'burn']) if (p[k] > 0) { p[k]--; p.hp -= 2; }
    if (p.hp <= 0) return { win: false, healed: p.healed, rounds: round };
  }
  return { win: false, rounds: round };
}

function stats(def, opt, N = 4000) {
  const out = {};
  let tl = 0, tw = 0, tlost = 0;
  for (const [bn, b] of Object.entries(BUILDS)) {
    let lose = 0, lost = 0, wins = 0, heals = 0, rounds = 0;
    for (let i = 0; i < N; i++) { const r = fight(def, b, opt); if (!r.win) lose++; else { wins++; lost += r.lost; } if (r.healed) heals++; rounds += r.rounds; }
    out[bn] = { lose: lose / N, lost: wins ? lost / wins : 0, heal: heals / N, rounds: rounds / N };
    tl += lose; tw += wins; tlost += lost;
  }
  out.avg = { lose: tl / (N * 3), lost: tw ? tlost / tw : 0 };
  return out;
}
module.exports = { VN, stats, fight, BUILDS };
if (require.main === module) {
  const N = +process.argv[2] || 3000;
  const pct = (x) => (x * 100).toFixed(1).padStart(5) + '%';
  console.log(`Бот на полном ХП, 1 аптечка (+8), скрытые кубы врагов. Боёв на предысторию: ${N}`);
  const ids = Object.keys(VN.Enemies).sort((a, b) => VN.Characters[a].dossier.threat - VN.Characters[b].dossier.threat);
  for (const id of ids) {
    const s = stats(VN.Enemies[id], { hidden: true }, N);
    console.log(`${id.padEnd(6)} опасность ${VN.Characters[id].dossier.threat} | поражений ${pct(s.avg.lose)} | теряет ХП ${s.avg.lost.toFixed(1).padStart(4)} | ` +
      Object.keys(BUILDS).map((k) => `${k} ${pct(s[k].lose)} ${s[k].rounds.toFixed(1)}р`).join('  '));
  }
}
