/* ==========================================================================
   Локации главы I. Ночь на 1 января: метель, город пуст, где-то ещё
   хлопают петарды. Почти везде — фоновая музыка (дождя нет).
   ========================================================================== */
(function () {
  'use strict';
  const VN = window.VN;
  const W = 1920, H = 1080;
  const ACID = '#b6ff3b', VIOLET = '#c27bff', RED = '#ff2a4d', ICE = '#7fd6ff', AMBER = '#ffb02e';

  const room = (c, P, top, bottom, floor = 820) => {
    P.vgrad(c, 0, 0, W, floor, [[0, top], [1, bottom]]);
    P.vgrad(c, 0, floor, W, H - floor, [[0, '#0b0a09'], [1, '#020202']]);
  };

  Object.assign(VN.Locations, {
    /* -------- котельная-укрытие -------- */
    hideout: {
      name: 'Котельная на Литейной', music: 'score', seed: 201,
      paint(c, r, P) {
        room(c, P, '#16120e', '#0e0b09');
        P.grime(c, r, 26, 'rgba(0,0,0,0.4)');
        c.strokeStyle = '#2a1e14'; c.lineWidth = 34;
        [[0, 260, 1920, 260], [300, 0, 300, 820], [1500, 0, 1500, 820]].forEach(([a, b, x, y]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(x, y); c.stroke(); });
        c.fillStyle = '#0a0806'; c.fillRect(700, 420, 520, 400); c.fillRect(760, 360, 400, 70);
        c.fillStyle = '#1a120b'; c.fillRect(820, 560, 280, 160);
        c.fillStyle = '#0d0a08'; c.fillRect(1600, 600, 260, 220); c.fillRect(120, 640, 420, 26);
      },
      animate(c, t, P) {
        P.glow(c, 960, 640, 420, 'rgba(255,110,30,0.55)', 0.5 + 0.15 * Math.sin(t * 6) * Math.sin(t * 3.3));
        c.fillStyle = `rgba(255,140,50,${0.6 + 0.3 * Math.sin(t * 9)})`; c.fillRect(840, 600, 240, 90);
        for (let i = 0; i < 4; i++) { const p = (t * 0.3 + i / 4) % 1; P.glow(c, 300, 260 - p * 200, 50 + p * 80, 'rgba(200,200,200,0.15)', 1 - p); }
      },
    },

    /* -------- больница -------- */
    hospital: {
      name: 'Городская больница №2', music: 'score', seed: 211,
      paint(c, r, P) {
        room(c, P, '#1b2524', '#121a19', 800);
        c.fillStyle = '#2b3a38'; c.fillRect(0, 520, W, 12);
        for (let x = 80; x < W; x += 360) { c.fillStyle = '#0e1514'; c.fillRect(x, 260, 200, 420); c.fillStyle = 'rgba(127,214,255,0.12)'; c.fillRect(x + 30, 300, 140, 110); }
        c.fillStyle = '#d8e0dc'; c.fillRect(1180, 640, 520, 30); c.fillRect(1200, 670, 12, 120); c.fillRect(1670, 670, 12, 120);
        c.fillStyle = '#9fb0aa'; c.fillRect(1180, 600, 140, 40);
        c.strokeStyle = '#3a4a46'; c.lineWidth = 4; c.beginPath(); c.moveTo(1760, 300); c.lineTo(1760, 640); c.stroke();
        c.fillStyle = 'rgba(180,220,255,0.3)'; c.fillRect(1740, 300, 40, 60);
      },
      animate(c, t, P) {
        const a = P.flick(t, 21, 0.4);
        c.fillStyle = `rgba(230,255,245,${0.8 * a})`; c.fillRect(600, 40, 700, 10);
        P.glow(c, 950, 50, 700, 'rgba(200,255,230,0.3)', 0.5 * a);
        c.save(); c.strokeStyle = ACID; c.lineWidth = 3; c.shadowColor = ACID; c.shadowBlur = 8; c.beginPath();
        for (let x = 0; x <= 220; x += 4) { const ph = ((x / 70) + t) % 1; c.lineTo(1500 + x, 420 + (ph > .45 && ph < .5 ? -40 : ph > .5 && ph < .55 ? 25 : 0)); }
        c.stroke(); c.restore();
        c.strokeStyle = '#0a0f0e'; c.lineWidth = 6; c.strokeRect(1490, 360, 240, 120);
      },
    },

    /* -------- квартира отца -------- */
    flat: {
      name: 'Квартира отца, ул. Счётная, 9', music: 'score', seed: 221, weather: 'snow', weatherClip: [1240, 160, 520, 460],
      paint(c, r, P) {
        room(c, P, '#2a2016', '#1a140e', 800);
        for (let x = 0; x < W; x += 80) { c.fillStyle = x % 160 ? 'rgba(80,60,30,0.15)' : 'rgba(0,0,0,0.1)'; c.fillRect(x, 0, 40, 800); }
        P.grime(c, r, 24, 'rgba(0,0,0,0.35)');
        P.vgrad(c, 1240, 160, 520, 460, [[0, '#0b1222'], [1, '#1a2438']]);
        P.skyline(c, r, { base: 620, minH: 40, maxH: 260, minW: 40, maxW: 90, color: '#0a0e18', windows: [AMBER, ICE], winChance: 0.12, x0: 1240, x1: 1760 });
        c.strokeStyle = '#120d08'; c.lineWidth = 16; c.strokeRect(1240, 160, 520, 460); c.beginPath(); c.moveTo(1500, 160); c.lineTo(1500, 620); c.stroke();
        c.fillStyle = '#120d08'; c.fillRect(180, 560, 640, 30); c.fillRect(200, 590, 20, 210); c.fillRect(780, 590, 20, 210);
        c.fillStyle = '#3a2a16'; c.fillRect(120, 180, 300, 300); c.fillStyle = '#1a120a';
        for (let y = 200; y < 470; y += 46) c.fillRect(140, y, 260, 8);
        c.fillStyle = '#d8cfb4'; c.save(); c.translate(520, 300); c.rotate(-0.05); c.fillRect(-70, -90, 140, 180); c.fillStyle = '#333'; c.fillRect(-52, -70, 104, 110); c.restore();
        c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(0, 0, W, H);
      },
      animate(c, t, P) {
        const sw = Math.sin(t * 0.9) * 0.08;
        P.cone(c, 560 + sw * 200, 0, 900, Math.PI / 2 + sw, 0.35, 'rgba(255,220,160,0.9)', 0.16);
        P.glow(c, 1500, 380, 320, 'rgba(127,214,255,0.25)', 0.6);
      },
    },

    /* -------- барахолка -------- */
    market: {
      name: 'Барахолка под эстакадой', music: 'score', seed: 231, weather: 'snow',
      paint(c, r, P) {
        P.vgrad(c, 0, 0, W, H, [[0, '#0a0712'], [0.5, '#16101e'], [1, '#050405']]);
        c.fillStyle = '#07060a'; c.fillRect(0, 120, W, 120); for (let x = 100; x < W; x += 420) c.fillRect(x, 120, 70, 700);
        for (let i = 0; i < 6; i++) {
          const x = 40 + i * 320, y = 520 + (i % 2) * 30;
          c.fillStyle = ['#2a1420', '#14202a', '#2a2414', '#1a2a14', '#2a1a10', '#1a142a'][i];
          c.beginPath(); c.moveTo(x, y); c.lineTo(x + 140, y - 90); c.lineTo(x + 280, y); c.fill();
          c.fillStyle = '#0c0a0c'; c.fillRect(x + 10, y, 260, 200);
          for (let k = 0; k < 7; k++) { c.fillStyle = `hsla(${(i * 50 + k * 30) % 360},40%,40%,.6)`; c.fillRect(x + 20 + k * 36, y + 20, 26, 18 + (k % 3) * 8); }
        }
        P.vgrad(c, 0, 780, W, 300, [[0, '#2a2a34'], [1, '#0a0a0e']]);
      },
      animate(c, t, P) {
        for (let i = 0; i < 6; i++) {
          const x = 180 + i * 320, a = P.flick(t, 30 + i, 0.6);
          P.glow(c, x, 470, 120, ['rgba(255,176,46,0.9)', 'rgba(194,123,255,0.9)', 'rgba(182,255,59,0.9)'][i % 3], 0.35 * a);
          c.fillStyle = '#ffe9b0'; c.globalAlpha = a; c.fillRect(x - 4, 440, 8, 12); c.globalAlpha = 1;
        }
        P.neon(c, 'ВСЁ ПО 1', 960, 330, 50, AMBER, P.flick(t, 7, 0.5));
      },
    },

    /* -------- клуб «Пиксель» -------- */
    club: {
      name: 'Компьютерный клуб «Пиксель»', music: 'score', seed: 241,
      paint(c, r, P) {
        room(c, P, '#08080f', '#05050a', 840);
        for (let i = 0; i < 8; i++) {
          const x = 120 + i * 220, y = 560;
          c.fillStyle = '#121220'; c.fillRect(x, y, 170, 120); c.fillStyle = '#0a0a12'; c.fillRect(x + 60, y + 120, 50, 60); c.fillRect(x - 10, y + 180, 190, 14);
        }
        c.fillStyle = '#0d0d16'; c.fillRect(1400, 200, 420, 300);
      },
      animate(c, t, P) {
        for (let i = 0; i < 8; i++) {
          const x = 120 + i * 220, y = 560, col = i === 6 ? ACID : ['#3a5aff', '#5a3aff', '#2a8aff'][i % 3];
          c.fillStyle = col; c.globalAlpha = 0.5 + 0.2 * Math.sin(t * 3 + i); c.fillRect(x + 8, y + 8, 154, 104); c.globalAlpha = 1;
          P.glow(c, x + 85, y + 60, 160, col, 0.25);
        }
        c.save(); c.font = '18px "IBM Plex Mono", monospace'; c.fillStyle = ACID; c.globalAlpha = 0.85;
        for (let k = 0; k < 12; k++) c.fillText(((t * 7 + k * 13) | 0).toString(16).repeat(6).slice(0, 28), 1420, 230 + k * 22);
        c.restore();
        P.neon(c, 'PIXEL', 960, 220, 90, VIOLET, P.flick(t, 41, 0.8));
      },
    },

    /* -------- мастерская Деда -------- */
    workshop: {
      name: 'Мастерская игрушек, Ёлочный переулок', music: 'score', seed: 251,
      paint(c, r, P) {
        room(c, P, '#1e1410', '#120c09', 800);
        c.fillStyle = '#0d0907'; for (let y = 180; y < 700; y += 130) c.fillRect(80, y, 700, 14);
        for (let y = 180; y < 700; y += 130) for (let x = 100; x < 760; x += 70) { c.fillStyle = `hsl(${(x * 3 + y) % 360},45%,${25 + (x % 3) * 8}%)`; c.fillRect(x, y - 50, 40, 50); }
        c.fillStyle = '#150e0a'; c.fillRect(1100, 560, 700, 40); c.fillRect(1120, 600, 20, 200); c.fillRect(1760, 600, 20, 200);
        c.strokeStyle = '#2a2a2a'; c.lineWidth = 10; c.beginPath(); c.moveTo(1200, 540); c.lineTo(1620, 520); c.stroke();
        c.fillStyle = '#1a1a1a'; c.fillRect(1380, 500, 60, 30);
        c.fillStyle = '#8a1a1a'; c.fillRect(1500, 300, 180, 220); c.fillStyle = '#e8e8e8'; c.fillRect(1500, 300, 180, 30);
      },
      animate(c, t, P) {
        P.cone(c, 1400, 200, 600, Math.PI / 2, 0.5, 'rgba(255,230,180,0.9)', 0.22);
        P.glow(c, 1400, 220, 60, 'rgba(255,240,200,1)', 0.9);
        for (let i = 0; i < 12; i++) { c.fillStyle = [RED, ACID, ICE, AMBER][i % 4]; c.globalAlpha = Math.sin(t * 2 + i) > 0 ? 0.9 : 0.25; c.beginPath(); c.arc(200 + i * 60, 130 + Math.sin(i) * 10, 6, 0, 6.28); c.fill(); }
        c.globalAlpha = 1;
      },
    },

    /* -------- бар -------- */
    bar: {
      name: 'Бар «Банановая республика»', music: 'score', seed: 261,
      paint(c, r, P) {
        room(c, P, '#1a1408', '#0e0a05', 860);
        c.fillStyle = '#2a1a0a'; c.fillRect(0, 640, W, 60); c.fillStyle = '#120a04'; c.fillRect(0, 700, W, 160);
        c.fillStyle = '#0c0805'; c.fillRect(200, 120, 1520, 360);
        for (let i = 0; i < 28; i++) { c.fillStyle = `hsla(${(i * 37) % 360},50%,35%,.8)`; c.fillRect(240 + i * 52, 260 + (i % 3) * 8, 26, 90 - (i % 4) * 10); }
        c.fillStyle = '#0a0705'; for (let x = 300; x < 1700; x += 260) { c.fillRect(x, 560, 60, 80); c.fillRect(x - 20, 550, 100, 14); }
      },
      animate(c, t, P) {
        P.neon(c, 'БАНАНОВАЯ РЕСПУБЛИКА', 960, 180, 54, '#ffe14d', P.flick(t, 51, 0.5));
        P.glow(c, 960, 640, 700, 'rgba(255,200,60,0.18)', 0.8);
        const a = (Math.sin(t * 2) + 1) / 2;
        P.glow(c, 400 + a * 1100, 860, 200, 'rgba(194,123,255,0.4)', 0.5);
      },
    },

    /* -------- логово Шила -------- */
    den: {
      name: 'Подвал под Кривым переулком', music: 'score', seed: 271,
      paint(c, r, P) {
        room(c, P, '#0e140e', '#070a07', 820);
        P.bricks(c, r, 0, 0, W, 820, '#141812', '#090b08'); c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(0, 0, W, 820);
        c.fillStyle = '#0a0d0a'; c.fillRect(200, 600, 500, 220); c.fillRect(1300, 520, 420, 300);
        c.strokeStyle = '#4a5a48'; c.lineWidth = 3;
        for (let i = 0; i < 9; i++) { c.save(); c.translate(860 + i * 50, 300); c.rotate(-0.3 + i * 0.07); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 90); c.stroke(); c.restore(); }
        P.neon(c, 'ШИЛО', 960, 200, 90, '#8dff6a', 0.4);
      },
      animate(c, t, P) {
        P.glow(c, 960, 430, 420, 'rgba(141,255,106,0.18)', 0.7 + 0.3 * Math.sin(t * 1.3));
        P.glow(c, 1500, 470, 120, 'rgba(255,230,160,0.9)', 0.5 * P.flick(t, 61, 0.7));
      },
    },

    /* -------- разводной мост (хаб) -------- */
    bridge: {
      name: 'Разводной мост', music: 'score', seed: 281, weather: 'snow',
      paint(c, r, P) {
        P.vgrad(c, 0, 0, W, H, [[0, '#04060e'], [0.55, '#121a2c'], [1, '#04060a']]);
        P.skyline(c, r, { base: 640, minH: 60, maxH: 300, minW: 40, maxW: 110, color: '#0a0f1a', windows: [AMBER, ICE, VIOLET], winChance: 0.14 });
        P.vgrad(c, 0, 640, W, 440, [[0, '#0a1424'], [1, '#02040a']]);
        c.fillStyle = '#05070c';
        c.beginPath(); c.moveTo(-50, 900); c.lineTo(860, 760); c.lineTo(900, 790); c.lineTo(-50, 960); c.fill();
        c.beginPath(); c.moveTo(1970, 900); c.lineTo(1060, 700); c.lineTo(1030, 730); c.lineTo(1970, 960); c.fill();
        c.fillRect(840, 380, 60, 420); c.fillRect(1030, 340, 60, 400);
        c.strokeStyle = '#0b0f18'; c.lineWidth = 5;
        for (let k = 0; k < 8; k++) { c.beginPath(); c.moveTo(870, 400); c.lineTo(100 + k * 100, 860 - k * 14); c.stroke(); c.beginPath(); c.moveTo(1060, 360); c.lineTo(1860 - k * 100, 880 - k * 20); c.stroke(); }
      },
      animate(c, t, P) {
        [[870, 380], [1060, 340]].forEach(([x, y], i) => P.glow(c, x, y, 50, i ? 'rgba(255,42,77,1)' : 'rgba(255,42,77,1)', (Math.sin(t * 3 + i) + 1) / 2));
        c.save(); c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 40; i++) { c.globalAlpha = 0.08 + 0.08 * Math.sin(t * 2 + i); c.fillStyle = i % 2 ? AMBER : ICE; c.fillRect((i * 211) % W + Math.sin(t + i) * 30, 700 + (i * 53) % 300, 60, 2); }
        c.restore();
      },
    },

    /* -------- скотобойня -------- */
    slaughter: {
      name: 'Скотобойня «Заря»', music: 'score', seed: 291,
      paint(c, r, P) {
        room(c, P, '#1a1414', '#0d0a0a', 820);
        c.fillStyle = '#5a1010'; c.globalAlpha = 0.15; for (let i = 0; i < 20; i++) c.fillRect(r() * W, 820 + r() * 200, 80 + r() * 160, 6); c.globalAlpha = 1;
        c.strokeStyle = '#2a2424'; c.lineWidth = 8; c.beginPath(); c.moveTo(0, 160); c.lineTo(W, 160); c.stroke();
        for (let x = 160; x < W; x += 230) { c.strokeStyle = '#3a3434'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, 160); c.lineTo(x, 300); c.stroke(); c.fillStyle = '#2a1414'; c.beginPath(); c.ellipse(x, 420, 60, 130, 0, 0, 6.28); c.fill(); }
      },
      animate(c, t, P) {
        P.cone(c, 960, 0, 1000, Math.PI / 2, 0.45, 'rgba(255,60,60,0.8)', 0.12 + 0.05 * Math.sin(t * 5));
        P.glow(c, 960, 40, 80, 'rgba(255,90,90,1)', 0.7);
      },
    },

    /* -------- «Вертел 24» ночью, закрыто -------- */
    vertel: {
      name: '«Вертел 24» · закрыто', music: 'score', seed: 301, weather: 'snow', weatherClip: [1500, 200, 360, 440],
      paint(c, r, P) {
        VN.Locations.shawarma.paint(c, r, P);
        c.fillStyle = 'rgba(0,0,10,0.62)'; c.fillRect(0, 0, W, H);
        c.fillStyle = '#5a0000'; c.fillRect(160, 230, 280, 560); c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(160, 230, 280, 560);
      },
      animate(c, t, P) {
        P.neon(c, 'ЗАКРЫТО', 950, 220, 60, RED, P.flick(t, 71, 0.5));
        P.glow(c, 300, 500, 200, 'rgba(255,60,20,0.3)', 0.4 + 0.2 * Math.sin(t * 2));
      },
    },

    /* -------- крыши -------- */
    roofs: {
      name: 'Крыши Литейного', music: 'score', seed: 311, weather: 'snow',
      paint(c, r, P) {
        P.vgrad(c, 0, 0, W, H, [[0, '#03040a'], [0.6, '#141a2c'], [1, '#05060a']]);
        P.skyline(c, r, { base: 760, minH: 100, maxH: 400, minW: 40, maxW: 120, color: '#0b0e18', windows: [AMBER, VIOLET], winChance: 0.16 });
        c.fillStyle = '#07080c'; c.beginPath(); c.moveTo(0, 820); c.lineTo(700, 780); c.lineTo(700, 1080); c.lineTo(0, 1080); c.fill();
        c.beginPath(); c.moveTo(980, 840); c.lineTo(1920, 800); c.lineTo(1920, 1080); c.lineTo(980, 1080); c.fill();
        c.fillStyle = '#d8e6f2'; c.globalAlpha = 0.3; c.fillRect(0, 812, 700, 6); c.fillRect(980, 832, 940, 6); c.globalAlpha = 1;
        c.fillStyle = '#0a0b10'; c.fillRect(300, 600, 60, 200); c.fillRect(1400, 640, 40, 180);
      },
    },

    /* -------- Баня №7 снаружи -------- */
    banya_out: {
      name: 'Баня №7 · вход со двора', music: 'score', seed: 321, weather: 'snow',
      paint(c, r, P) {
        P.vgrad(c, 0, 0, W, H, [[0, '#04050a'], [0.6, '#10141e'], [1, '#2a303a']]);
        c.fillStyle = '#0c0d12'; c.fillRect(300, 260, 1320, 560);
        c.fillStyle = '#1a1c24'; for (let x = 360; x < 1600; x += 160) c.fillRect(x, 330, 90, 120);
        c.fillStyle = '#0a0a0e'; c.fillRect(860, 560, 200, 260);
        c.fillStyle = '#14161c'; c.fillRect(1500, 120, 80, 160);
        P.vgrad(c, 0, 820, W, 260, [[0, '#3a4250'], [1, '#141820']]);
      },
      animate(c, t, P) {
        P.neon(c, 'БАНЯ № 7', 960, 220, 64, ICE, P.flick(t, 81, 0.4));
        P.glow(c, 960, 600, 160, 'rgba(255,190,90,0.8)', 0.6);
        for (let k = 0; k < 7; k++) { const p = (t * 0.2 + k / 7) % 1; P.glow(c, 1540 + Math.sin(p * 6 + k) * 30, 120 - p * 260, 40 + p * 120, 'rgba(220,220,230,0.3)', (1 - p) * 0.6); }
        for (let x = 360; x < 1600; x += 160) { c.fillStyle = `rgba(255,190,90,${0.25 + 0.15 * Math.sin(t + x)})`; c.fillRect(x, 330, 90, 120); }
      },
    },

    /* -------- Баня №7, зал Совета -------- */
    banya: {
      name: 'Баня №7 · зал Совета', music: 'score', seed: 331,
      paint(c, r, P) {
        room(c, P, '#2a1e14', '#1a120c', 820);
        c.fillStyle = '#3a2818'; for (let y = 0; y < 820; y += 42) { c.fillRect(0, y, W, 4); }
        c.fillStyle = '#0e0a07'; c.beginPath(); c.ellipse(960, 860, 620, 90, 0, 0, 6.28); c.fill();
        c.fillStyle = '#2a1c10'; c.beginPath(); c.ellipse(960, 840, 600, 80, 0, 0, 6.28); c.fill();
        c.fillStyle = '#0c0907'; c.fillRect(80, 460, 220, 360); c.fillStyle = '#5a1a08'; c.fillRect(120, 600, 140, 100);
      },
      animate(c, t, P) {
        P.glow(c, 190, 650, 260, 'rgba(255,120,40,0.7)', 0.5 + 0.2 * Math.sin(t * 7));
        for (let i = 0; i < 9; i++) { const x = ((t * 25 + i * 260) % 2400) - 240; P.glow(c, x, 380 + Math.sin(t * 0.5 + i) * 120, 360, 'rgba(230,230,235,0.12)', 1); }
        P.glow(c, 960, 120, 520, 'rgba(255,220,170,0.25)', 0.7);
      },
    },
  });
})();
