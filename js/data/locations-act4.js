/* ==========================================================================
   Локации главы IV. Год спустя, 14 февраля: годовщина.
   ========================================================================== */
(function () {
  'use strict';
  const VN = window.VN;
  const W = 1920, H = 1080;
  const ICE = '#7fd6ff', AMBER = '#ffb02e';

  Object.assign(VN.Locations, {
    /* -------- Северное кладбище -------- */
    cemetery: {
      name: 'Северное кладбище', music: 'score', seed: 401, weather: 'snow',
      paint(c, r, P) {
        P.vgrad(c, 0, 0, W, H, [[0, '#03050a'], [0.5, '#0e1420'], [1, '#05070b']]);
        P.skyline(c, r, { base: 560, minH: 30, maxH: 160, minW: 60, maxW: 140, color: '#080c14', windows: [AMBER, ICE], winChance: 0.05 });
        // берёзы
        c.strokeStyle = '#141a24';
        for (let i = 0; i < 9; i++) { const x = 80 + i * 230 + r() * 60; c.lineWidth = 10 + r() * 8; c.beginPath(); c.moveTo(x, 760); c.lineTo(x + (r() - 0.5) * 40, 180 + r() * 120); c.stroke(); }
        // снег
        P.vgrad(c, 0, 700, W, 380, [[0, '#1a2230'], [1, '#07090d']]);
        // ряды крестов и плит
        for (let row = 0; row < 3; row++) {
          const y = 720 + row * 110, s = 0.7 + row * 0.25;
          for (let x = 40 + row * 70; x < W; x += 180 * s + r() * 60) {
            c.fillStyle = row === 2 ? '#05070a' : '#0b0f16';
            if (r() < 0.5) { c.fillRect(x, y - 90 * s, 14 * s, 100 * s); c.fillRect(x - 24 * s, y - 64 * s, 62 * s, 12 * s); }
            else { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 80 * s); c.arc(x + 30 * s, y - 80 * s, 30 * s, Math.PI, 0); c.lineTo(x + 60 * s, y); c.fill(); }
            c.strokeStyle = '#0d1118'; c.lineWidth = 3; c.strokeRect(x - 30 * s, y - 2, 120 * s, 22 * s);
          }
        }
      },
      animate(c, t, P) {
        P.glow(c, 1500, 640, 60, 'rgba(255,176,46,1)', 0.35 + 0.15 * Math.sin(t * 2)); // лампадка
        P.glow(c, 380, 300, 260, 'rgba(127,214,255,1)', 0.05);
      },
    },
  });
})();
