/* ==========================================================================
   ГЛАВА II · ВОСПОМИНАНИЕ
   Короткая глава-флешбэк, у каждой предыстории своя. Время не идёт,
   обстоятельства прошлых глав в боях не действуют, инвентарь — только то,
   что было у героя тогда. Решения записываются во флаги fb_* для главы III.
   ========================================================================== */
(function () {
  'use strict';
  const VN = window.VN;
  const scene = (id, meta) => VN.Story.scene(id, Object.assign({ act: 2 }, meta));

  /** Отложить настоящий инвентарь и здоровье — воспоминание живёт своей жизнью. */
  VN.Flashback = {
    enter(S, items) {
      if (!S.flags._preFlash) S.flags._preFlash = { inv: { ...S.inv }, hp: S.hp, maxHp: S.maxHp };
      S.inv = {};
      Object.entries(items).forEach(([id, n]) => (S.inv[id] = n));
      VN.bus.emit('state');
    },
    leave(S) {
      const p = S.flags._preFlash;
      if (p) { S.inv = p.inv; S.hp = p.hp; S.maxHp = p.maxHp; delete S.flags._preFlash; }
      VN.bus.emit('state');
    },
  };

  scene('a2_start', {
    title: 'Глава II',
    script: [
      { act: { n: 2, start: 0, deadline: 99999, label: 'воспоминание', date: '10 ЛЕТ НАЗАД', still: true } },
      // в воспоминании все старые знакомые уже «знакомы» — без досье из настоящего
      { run: (S) => { ['kir', 'grokh', 'kong', 'bugai', 'shef', 'mk', 'texas'].forEach((id) => (S.met[id] = true)); } },
      { bg: 'black', trans: 'fade' },
      { chapter: 'ГЛАВА II', title: 'Что было до' },
      { goto: () => ({ cop: 'a2c_call', boxer: 'a2b_locker', thief: 'a2t_tram' }[VN.S.background] || 'a2_soon') },
    ],
  });

  scene('a2_soon', {
    title: 'Воспоминание',
    script: [
      { n: 'Память не отпускает. Но эта дверь ещё заперта. {pause=400}{i}Воспоминание этой предыстории появится в следующем обновлении.{/i}' },
      { run: () => { VN.Flashback.leave(VN.S); VN.Runner.stop(); VN.Title.show(); } },
    ],
  });
})();
