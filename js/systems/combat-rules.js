/* ==========================================================================
   ПРАВИЛА БОЯ — чистая логика без DOM.
   Используется и боем в игре (systems/combat.js), и симулятором баланса
   (tools/balance.js) — поэтому цифры в симуляторе совпадают с игрой.

   ПАССИВКИ ПРОТИВНИКА (def.passives = [{ id, ...параметры }]):
     steal       — каждый раунд крадёт твой самый сильный куб из броска
     poison      — пропущенный удар добавляет стак яда (урон в конце раунда)
     reinforce   — каждые N раундов подмога бьёт на dmg (блок не помогает)
     steam       — первые N раундов все кубы намерения скрыты
     reads       — знает твои приёмы: комбинации в УДАРЕ не работают
     enrage      — на ≤ at·ХП атаки сильнее на atk
     secondWind  — один раз при ≤ at·ХП лечится на heal
     doubleBook  — у атаки два варианта урона, настоящий — в момент удара
     longRange   — бьёт издалека: твой УДАР вдвое слабее (ВЫСТРЕЛ — нет)
     thorns      — каждый прошедший УДАР ранит тебя на dmg
     drunk       — пьяный прицел: атаки сильнее на atk, но с шансом miss мимо
     cleaver     — пропущенный удар (хоть 1 урона) → кровотечение на 2 раунда
     audit       — каждые every раунда навсегда списывает у тебя один переброс
     cold        — холод: с раунда from у тебя на куб меньше
     bolt        — не хочет драться: при ≤ at·ХП сбегает (бой выигран, но он ушёл)
     getaway     — рвётся к выходу: каждая его «защита» — шаг; на steps-м шаге уходит
     sway        — качка (трамвай): в нечётных раундах твой БЛОК −blk
     clinch      — грязный клинч: если ты погасил его удар целиком, он виснет на тебе — −1 куб в следующем раунде
     sedate      — наркоз: каждый every-й раунд у тебя на dice кубов меньше (игла достала)
     lastWord    — «последнее слово»: при ≤ at·ХП один раз закрывается — следующий ход всегда moves[move]

   МОДИФИКАТОРЫ БОЯ (VN.CombatMods, передаются сюжетом через opts.mods):
     баффы союзников и дебаффы-обстоятельства: hp, dice, dice1, rerolls,
     atk, blk, enemyHp, enemyAtk, reveal, allyStrike { every, dmg, name }
   ========================================================================== */
(function () {
  'use strict';
  const VN = (window.VN = window.VN || {});
  const d6 = () => 1 + Math.floor(Math.random() * 6);

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
    if (!ctx.noCombos) {
      if (best >= 3) { atk += 5; combos.push({ t: 'СТРИТ', v: '+5' }); }
      if (maxC >= 3) { atk *= 2; combos.push({ t: 'ТРОЙКА', v: '×2' }); }
      else if (pairs >= 2) { atk += 6; combos.push({ t: 'ДВЕ ПАРЫ', v: '+6' }); }
      else if (pairs === 1) { atk += 3; combos.push({ t: 'ДУПЛЕТ', v: '+3' }); }
    }
    if (ctx.halfAtk && atkV.length) atk = Math.floor(atk / 2);
    let blk = blkV.reduce((a, b) => a + b, 0);
    if (blkV.length) blk += ctx.blkBonus;
    const counter = blkV.includes(6);
    const mult = ctx.shotMult || 2;
    const shot = shotV.length ? (shotV[0] === 6 ? Math.max(15, 6 * mult) : shotV[0] * mult) : 0;
    return { atk, blk, shot, counter, combos, bullseye: shotV[0] === 6 };
  }

  const P = (def, id) => (def.passives || []).find((p) => p.id === id);

  const Rules = {
    evaluate,

    /** Время боя: сколько игровых минут стоит один раунд в каждом акте
        (дробное значение копится: 0.5 — минута за каждые 2 раунда).
        В прологе до полуночи меньше часа — затянутый бой может провалить всё. */
    MINUTES_PER_ROUND: { 0: 1.25, 1: 1.25, 3: 1.25 }, // пролог подобран ботом: ~1 забег из 5 опаздывает из-за боёв
    minutesPerRound(act) { return Rules.MINUTES_PER_ROUND[act || 0] || 0; },
    /** Сколько минут набежало за rounds сыгранных раундов. */
    fightMinutes(rounds, act) { return Math.floor(rounds * Rules.minutesPerRound(act) + 1e-9); },

    /** Состояние боя. cs — боевые параметры игрока (уже с модификаторами). */
    makeState(def, cs, player, mods = []) {
      const st = {
        def, round: 0,
        cs: { ...cs, noCombos: !!P(def, 'reads'), halfAtk: !!P(def, 'longRange') },
        player: { hp: player.hp, maxHp: player.maxHp, bleed: 0, burn: 0, cuff: false, poison: 0 },
        enemy: { hp: def.hp, maxHp: def.hp, armor: def.armor || 0, guard: 0, stunned: false, next: null, lastType: null, intent: null, atkMod: 0, enraged: false, winded: false },
        dice1: 0, reveal: false, allies: [], mods: [],
      };
      for (const m of mods) {
        if (!m) continue;
        st.mods.push(m);
        if (m.hp) st.player.hp = Math.max(1, Math.min(st.player.maxHp, st.player.hp + m.hp));
        if (m.dice) st.cs.dice += m.dice;
        if (m.dice1) st.dice1 += m.dice1;
        if (m.rerolls) st.cs.rerolls = Math.max(0, st.cs.rerolls + m.rerolls);
        if (m.atk) st.cs.atkBonus += m.atk;
        if (m.blk) st.cs.blkBonus += m.blk;
        if (m.enemyHp) st.enemy.hp = Math.max(1, st.enemy.hp - m.enemyHp);
        if (m.enemyAtk) st.enemy.atkMod += m.enemyAtk;
        if (m.reveal) st.reveal = true;
        if (m.allyStrike) st.allies.push(m.allyStrike);
      }
      return st;
    },

    pickMove(st) {
      const moves = st.def.moves, e = st.enemy;
      if (e.next != null) { const m = moves[e.next]; e.next = null; return m; }
      const pool = moves.filter((m) => m.w > 0 && !(m.type === 'guard' && e.lastType === 'guard') && !(m.type === 'charge' && st.round === 1));
      const tot = pool.reduce((a, m) => a + m.w, 0);
      let r = Math.random() * tot;
      for (const m of pool) { r -= m.w; if (r <= 0) return m; }
      return pool[0];
    },

    /** Новое намерение. Возвращает { intent, log }. */
    rollIntent(st) {
      const log = [], e = st.enemy, def = st.def;
      const sw = P(def, 'sway');
      if (sw) {
        if (st.baseBlk == null) st.baseBlk = st.cs.blkBonus;
        const rock = (st.round || 1) % 2 === 1;
        st.cs.blkBonus = st.baseBlk - (rock ? sw.blk : 0);
        if (rock) log.push({ t: 'КАЧКА', sub: `трамвай кренится: БЛОК −${sw.blk} в этом раунде`, kind: 'bad' });
      }
      e.guard = 0;
      const sd = P(def, 'sedate');
      if (sd && st.round % sd.every === 0) log.push({ t: 'НАРКОЗ', sub: `игла достала: −${sd.dice} куба в этом раунде`, kind: 'bad' });
      const lw = P(def, 'lastWord');
      if (lw && e.lastWordDue) { e.lastWordDue = false; e.next = lw.move; log.push({ t: lw.name || 'ПОСЛЕДНЕЕ СЛОВО', sub: 'он закрылся — этот раунд он только защищается', kind: 'bad' }); }
      const m = Rules.pickMove(st);
      const attacking = m.type === 'attack' || m.type === 'barrage';
      const vals = []; for (let i = 0; i < (m.dice || 0); i++) vals.push(d6());
      const sumOf = (vs) => (m.type === 'barrage' ? vs.filter((v) => v > 2) : vs).reduce((a, b) => a + b, 0);
      let bonus = (m.bonus || 0) + (attacking ? e.atkMod : 0);
      const en = P(def, 'enrage');
      if (en && attacking && e.hp <= e.maxHp * en.at) {
        bonus += en.atk;
        if (!e.enraged) { e.enraged = true; log.push({ t: 'ЯРОСТЬ', sub: `атаки +${en.atk}`, kind: 'bad' }); }
      }
      const dr = P(def, 'drunk');
      if (dr && attacking) bonus += dr.atk;
      const value = m.type === 'charge' ? 0 : sumOf(vals) + bonus;
      let nHidden = attacking ? Math.min(def.hidden || 0, vals.length) : 0;
      const steam = P(def, 'steam');
      if (steam && st.round <= steam.rounds && m.dice) { nHidden = vals.length; if (st.round === 1) log.push({ t: 'ПАР', sub: `${steam.rounds} раунда кубы не видно`, kind: 'bad' }); }
      if (st.reveal) nHidden = 0;
      const hiddenSum = sumOf(vals.slice(0, nHidden));
      const intent = { move: m, vals, value, bonus, pair: vals.length >= 2 && new Set(vals).size < vals.length, nHidden, hiddenSum, revealed: nHidden === 0 };
      // двойная бухгалтерия: второй вариант урона
      if (P(def, 'doubleBook') && attacking) {
        const alt = []; for (let i = 0; i < vals.length; i++) alt.push(d6());
        intent.alt = sumOf(alt) + bonus + 2;
        intent.altVals = alt;
      }
      if (m.type === 'guard') e.guard = value;
      const ga = P(def, 'getaway');
      if (ga && m.type === 'guard') { e.steps = (e.steps || 0) + 1; log.push({ t: 'К ВЫХОДУ', sub: `шаг ${e.steps} из ${ga.steps}`, kind: 'bad' }); }
      e.lastType = m.type;
      if (m.type === 'charge') e.next = m.next;
      e.intent = intent;
      return { intent, log };
    },

    /** Поправка к числу твоих кубов в этом раунде (холод и т. п.). */
    diceMod(st) {
      const c = P(st.def, 'cold'), sd = P(st.def, 'sedate');
      let m = c && st.round >= c.from ? -1 : 0;
      if (sd && st.round % sd.every === 0) m -= sd.dice;
      return m;
    },

    /** После броска игрока: может украсть куб. Возвращает индекс украденного или -1. */
    afterRoll(st, vals) {
      const p = P(st.def, 'steal');
      if (!p || vals.length <= 1) return -1;
      let hi = 0; vals.forEach((v, i) => { if (v > vals[hi]) hi = i; });
      return hi;
    },

    /** Настоящий урон намерения в момент удара (двойная бухгалтерия решает здесь). */
    realIncoming(st) {
      const it = st.enemy.intent;
      if (it.alt != null && it.realAlt == null) it.realAlt = Math.random() < 0.5;
      const dr = P(st.def, 'drunk');
      if (dr && it.missed == null) it.missed = Math.random() < dr.miss;
      if (dr && it.missed) return 0;
      return it.alt != null && it.realAlt ? it.alt : it.value;
    },

    /** Урон по противнику прошёл. Возвращает лог (шипы, второе дыхание). */
    afterEnemyHit(st, dmg, kind) {
      const log = [], e = st.enemy;
      const th = P(st.def, 'thorns');
      if (th && kind === 'atk' && dmg > 0) { st.player.hp -= th.dmg; log.push({ t: 'ШИПЫ', sub: `−${th.dmg} тебе`, kind: 'bad', toPlayer: th.dmg }); }
      const bo = P(st.def, 'bolt');
      if (bo && e.hp > 0 && e.hp <= e.maxHp * bo.at && !e.fled) { e.fled = true; log.push({ t: 'СБЕЖАЛ', sub: 'бросил всё и рванул прочь', kind: 'gold' }); }
      const lw = P(st.def, 'lastWord');
      if (lw && !e.lastWordUsed && e.hp > 0 && e.hp <= e.maxHp * lw.at) { e.lastWordUsed = true; e.lastWordDue = true; }
      const sw = P(st.def, 'secondWind');
      if (sw && !e.winded && e.hp > 0 && e.hp <= e.maxHp * sw.at) {
        e.winded = true; e.hp = Math.min(e.maxHp, e.hp + sw.heal);
        log.push({ t: sw.name || 'ВТОРОЕ ДЫХАНИЕ', sub: `+${sw.heal} здоровья`, kind: 'bad', toEnemyHeal: sw.heal });
      }
      return log;
    },

    /** Ты погасил удар целиком (урона 0 при входящем > 0). */
    afterFullBlock(st) {
      if (!P(st.def, 'clinch')) return [];
      st.player.cuff = true;
      return [{ t: 'КЛИНЧ', sub: 'повис на тебе: −1 куб в следующем раунде', kind: 'bad' }];
    },

    /** Удар противника прошёл по игроку. */
    afterPlayerHit(st, dmg) {
      const log = [];
      const po = P(st.def, 'poison');
      if (po && dmg > 0) { st.player.poison += po.stack || 1; log.push({ t: 'ЯД', sub: `стак ×${st.player.poison}`, kind: 'bad' }); }
      if (P(st.def, 'cleaver') && dmg > 0 && st.player.bleed < 2) { st.player.bleed = 2; log.push({ t: 'ТЕСАК', sub: 'кровотечение: −2 следующие 2 раунда', kind: 'bad' }); }
      return log;
    },

    /** Конец раунда: яд, подмога, удары союзников. */
    endRound(st) {
      const log = [];
      if (st.player.poison > 0) { st.player.hp -= st.player.poison; log.push({ t: 'ЯД', sub: `−${st.player.poison}`, kind: 'bad', toPlayer: st.player.poison }); }
      const ga = P(st.def, 'getaway');
      if (ga && (st.enemy.steps || 0) >= ga.steps && st.enemy.hp > 0) { st.escaped = true; log.push({ t: 'УШЁЛ', sub: 'он у выхода — и его уже нет', kind: 'bad' }); }
      const au = P(st.def, 'audit');
      if (au && st.round % au.every === 0 && st.cs.rerolls > 0) { st.cs.rerolls--; log.push({ t: 'АУДИТ', sub: `списан переброс — осталось ${st.cs.rerolls}`, kind: 'bad' }); }
      const rf = P(st.def, 'reinforce');
      if (rf && st.round % rf.every === 0) { st.player.hp -= rf.dmg; log.push({ t: rf.name || 'ПОДМОГА', sub: `−${rf.dmg}, блок не спасает`, kind: 'bad', toPlayer: rf.dmg }); }
      for (const a of st.allies) {
        if (st.round % a.every === 0 && st.enemy.hp > 0) { st.enemy.hp -= a.dmg; log.push({ t: a.name, sub: `−${a.dmg} противнику`, kind: 'gold', toEnemy: a.dmg }); }
      }
      return log;
    },

    /** Подписи пассивок для интерфейса. */
    describe(def) {
      const T = {
        steal: () => ['КАРМАННИК', 'каждый раунд крадёт твой лучший куб'],
        poison: () => ['ЯД', 'пропущенный удар травит: урон каждый раунд, стаки копятся'],
        reinforce: (p) => [p.name || 'ПОДМОГА', `каждые ${p.every} раунда −${p.dmg} тебе, блок не спасает`],
        steam: (p) => ['ПАР', `первые ${p.rounds} раунда кубы противника не видно`],
        reads: () => ['ЗНАЕТ ТВОИ ПРИЁМЫ', 'комбинации в УДАРЕ не работают'],
        enrage: (p) => ['ЯРОСТЬ', `при ≤${Math.round(p.at * 100)}% здоровья атаки +${p.atk}`],
        secondWind: (p) => [p.name || 'ВТОРОЕ ДЫХАНИЕ', `один раз при ≤${Math.round(p.at * 100)}% здоровья +${p.heal}`],
        doubleBook: () => ['ДВОЙНАЯ БУХГАЛТЕРИЯ', 'у атаки два варианта урона — настоящий узнаешь при ударе'],
        longRange: () => ['ДАЛЬНЯЯ ДИСТАНЦИЯ', 'твой УДАР вдвое слабее, ВЫСТРЕЛ — нет'],
        thorns: (p) => ['ШИПЫ', `каждый твой прошедший УДАР ранит и тебя: −${p.dmg}`],
        drunk: (p) => ['ПЬЯНЫЙ ПРИЦЕЛ', `атаки +${p.atk}, но ${Math.round(p.miss * 100)}% — мимо`],
        cleaver: () => ['ТЕСАК', 'пропустил хоть 1 урона — кровотечение на 2 раунда'],
        audit: (p) => ['АУДИТ', `каждые ${p.every} раунда навсегда списывает твой переброс`],
        cold: (p) => ['ИНЕЙ', `с ${p.from}-го раунда пальцы не слушаются: −1 куб`],
        bolt: (p) => ['НЕ БОЕЦ', `при ${Math.round(p.at * 100)}% здоровья сбежит`],
        sway: (p) => ['КАЧКА', `в нечётных раундах трамвай кренится: твой БЛОК −${p.blk}`],
        clinch: () => ['ГРЯЗНЫЙ КЛИНЧ', 'погасишь удар целиком — повиснет на тебе: −1 куб в следующем раунде'],
        sedate: (p) => ['НАРКОЗ', `каждый ${p.every}-й раунд у тебя −${p.dice} куба`],
        lastWord: (p) => [p.name || 'ПОСЛЕДНЕЕ СЛОВО', `при ≤${Math.round(p.at * 100)}% здоровья один раз уходит в глухую защиту`],
        getaway: (p) => ['К ОКНУ', `каждая его защита — шаг к выходу; ${p.steps}-й шаг — и он ушёл`],
      };
      return (def.passives || []).map((p) => { const f = T[p.id]; const [t, d] = f ? f(p) : [p.id, '']; return { t, d }; });
    },
  };

  VN.CombatRules = Rules;
})();
