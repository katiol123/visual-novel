/* ==========================================================================
   Локации: paint() — статичный слой, animate() — покадровая динамика,
   signs — неоновые вывески, weather — дождь/снег/мокрый снег.
   ambient — синтезированный фон; music — фоновая музыка вместо него.
   Правило: где слышен дождь — только дождь (music не задаётся),
   в остальных сценах играет 'score'.
   ========================================================================== */
(function () {
  'use strict';
  const VN = window.VN;
  const W = 1920, H = 1080;
  const ACID = '#b6ff3b', VIOLET = '#c27bff', RED = '#ff2a4d', ICE = '#7fd6ff', AMBER = '#ffb02e';

  VN.Locations = {
    black: { name: '', music: 'score', paint(c) { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); } },

    /* ------------------------------------------------ квартира Яна */
    apartment: {
      name: 'Квартира Корсака', ambient: 'rain', seed: 11,
      weather: 'rain', weatherClip: [1060, 120, 700, 600],
      paint(c, r, P) {
        P.vgrad(c, 0, 0, W, H, [[0, '#0e1411'], [0.7, '#090d0b'], [1, '#040605']]);
        P.grime(c, r, 18, 'rgba(0,0,0,0.35)');
        // окно с видом на город
        c.save(); c.beginPath(); c.rect(1060, 120, 700, 600); c.clip();
        P.vgrad(c, 1060, 120, 700, 600, [[0, '#1c0f2e'], [0.6, '#1a1530'], [1, '#0f2018']]);
        P.skyline(c, r, { base: 720, minH: 120, maxH: 380, minW: 40, maxW: 110, color: '#121a20', windows: [VIOLET, ACID, '#ffd9a0'], winChance: 0.18, x0: 1040, x1: 1780 });
        P.glow(c, 1300, 640, 260, 'rgba(182,255,59,0.35)');
        P.glow(c, 1620, 520, 200, 'rgba(194,123,255,0.35)');
        P.skyline(c, r, { base: 740, minH: 40, maxH: 160, minW: 80, maxW: 160, color: '#06090a', windows: [AMBER], winChance: 0.08, x0: 1040, x1: 1780 });
        c.restore();
        // жалюзи
        for (let y = 130; y < 470; y += 22) {
          P.vgrad(c, 1060, y, 700, 12, [[0, '#1a201c'], [1, '#050706']]);
        }
        c.fillStyle = '#030504';
        c.fillRect(1040, 100, 740, 22); c.fillRect(1040, 718, 740, 30);
        c.fillRect(1040, 100, 22, 640); c.fillRect(1758, 100, 22, 640); c.fillRect(1400, 100, 14, 640);
        // пол
        P.vgrad(c, 0, 860, W, 220, [[0, '#0a0e0c'], [1, '#020303']]);
        // стол, лампа, бутылка
        c.fillStyle = '#040605';
        c.fillRect(80, 780, 820, 34); c.fillRect(110, 812, 26, 268); c.fillRect(840, 812, 26, 268);
        c.fillRect(540, 600, 16, 180); c.beginPath(); c.moveTo(470, 610); c.lineTo(630, 610); c.lineTo(590, 540); c.lineTo(510, 540); c.fill();
        P.cone(c, 550, 600, 420, Math.PI / 2, 0.75, 'rgba(255,190,110,0.9)', 0.35);
        P.glow(c, 550, 640, 260, 'rgba(255,170,90,0.35)');
        c.fillStyle = '#050807';
        c.fillRect(250, 680, 46, 100); c.fillRect(262, 640, 22, 44); c.fillRect(330, 730, 40, 50);
        c.fillStyle = 'rgba(182,255,59,0.25)'; c.fillRect(256, 700, 4, 70);
        // телефон
        c.fillStyle = '#070a09'; c.fillRect(680, 744, 120, 36); c.fillRect(690, 726, 100, 22);
      },
      animate(c, t, P) {
        // полосы света от жалюзи на стене и полу — дрожат вместе с неоном снаружи
        const a = 0.08 * P.flick(t, 3, 0.4);
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(182,255,59,${a})`;
        for (let i = 0; i < 9; i++) {
          const y = 160 + i * 64;
          c.beginPath(); c.moveTo(1040, y); c.lineTo(1040, y + 24); c.lineTo(80, y + 360 + i * 30); c.lineTo(80, y + 300 + i * 30); c.fill();
        }
        c.restore();
        // часы на микроволновке
        c.save(); c.font = '28px "IBM Plex Mono", monospace'; c.fillStyle = RED; c.shadowColor = RED; c.shadowBlur = 12;
        c.globalAlpha = (Math.floor(t * 2) % 2) ? 0.95 : 0.6; c.fillText(VN.State.clock(), 702, 772); c.restore();
      },
    },

    /* ------------------------------------------------ улица */
    street: {
      name: 'Улица Канальная', ambient: 'rain', seed: 21, weather: 'sleet',
      paint(c, r, P) {
        P.vgrad(c, 0, 0, W, H, [[0, '#0d0718'], [0.45, '#1e1033'], [0.75, '#0f1512'], [1, '#050706']]);
        P.skyline(c, r, { base: 760, minH: 200, maxH: 460, minW: 50, maxW: 120, color: '#1a1530', windows: [VIOLET, '#6a5a99'], winChance: 0.1 });
        P.glow(c, 960, 700, 600, 'rgba(194,123,255,0.18)');
        P.skyline(c, r, { base: 820, minH: 120, maxH: 300, minW: 90, maxW: 200, color: '#0b0f12', windows: [AMBER, ACID], winChance: 0.07, x0: 480, x1: 1440 });
        // ближние дома
        c.fillStyle = '#07090a'; c.fillRect(0, 0, 520, 900); c.fillRect(1400, 0, 520, 900);
        c.fillStyle = '#0c1110';
        for (let y = 80; y < 760; y += 120) for (let x = 40; x < 480; x += 110) c.fillRect(x, y, 60, 70);
        for (let y = 80; y < 760; y += 120) for (let x = 1440; x < 1880; x += 110) c.fillRect(x, y, 60, 70);
        // асфальт и отражения
        P.vgrad(c, 0, 840, W, 240, [[0, '#0b0f0e'], [1, '#020303']]);
        c.save(); c.globalCompositeOperation = 'lighter';
        [[260, VIOLET], [1650, ACID], [1660, AMBER], [960, RED]].forEach(([x, col]) => {
          const g = c.createLinearGradient(0, 860, 0, 1080);
          g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
          c.globalAlpha = 0.18; c.fillStyle = g; c.fillRect(x - 120, 860, 240, 220);
        });
        c.restore();
        // фонари
        [700, 1240].forEach((x) => {
          c.fillStyle = '#050606'; c.fillRect(x - 5, 360, 10, 500); c.fillRect(x - 40, 352, 80, 12);
          P.cone(c, x, 364, 560, Math.PI / 2, 0.42, 'rgba(220,255,200,0.9)', 0.16);
          P.glow(c, x, 366, 90, 'rgba(230,255,210,0.8)', 0.6);
        });
      },
      signs: [
        { text: 'ЛОМБАРД', x: 260, y: 420, size: 54, color: VIOLET, flicker: 1 },
        { text: 'БАР «ЯКОРЬ»', x: 1650, y: 380, size: 46, color: ACID },
        { text: 'ШАУРМА 24', x: 1660, y: 620, size: 38, color: AMBER, flicker: 2.3 },
      ],
      animate(c, t, P) {
        // гирлянда поперёк улицы
        c.save(); c.globalCompositeOperation = 'lighter';
        const cols = [RED, ACID, ICE, '#ffd23a', VIOLET];
        for (let i = 0; i <= 40; i++) {
          const k = i / 40, x = 520 + k * 880, y = 200 + Math.sin(k * Math.PI) * 120;
          const on = Math.sin(t * 3 + i * 1.7) > -0.2;
          c.globalAlpha = on ? 0.95 : 0.2;
          c.fillStyle = cols[i % cols.length];
          c.beginPath(); c.arc(x, y, 5, 0, 6.283); c.fill();
          if (on) { c.globalAlpha = 0.25; c.beginPath(); c.arc(x, y, 16, 0, 6.283); c.fill(); }
        }
        c.restore();
        P.neon(c, 'С НОВЫМ ГОДОМ', 960, 380, 44, RED, P.flick(t, 9, 0.7));
      },
    },

    /* ------------------------------------------------ шаурмичная */
    shawarma: {
      name: 'Шаурма «Вертел 24»', ambient: 'hum', music: 'score', seed: 31,
      weather: 'rain', weatherClip: [1500, 200, 360, 440],
      paint(c, r, P) {
        c.fillStyle = '#18201b'; c.fillRect(0, 0, W, H);
        c.strokeStyle = '#0c110e'; c.lineWidth = 3;
        for (let x = 0; x < W; x += 64) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
        for (let y = 0; y < H; y += 64) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
        P.grime(c, r, 30, 'rgba(60,40,10,0.25)');
        // окно
        P.vgrad(c, 1500, 200, 360, 440, [[0, '#0c0a1a'], [1, '#131c1a']]);
        P.skyline(c, r, { base: 640, minH: 60, maxH: 260, minW: 30, maxW: 70, color: '#0a0d10', windows: [VIOLET, ACID], winChance: 0.15, x0: 1500, x1: 1860 });
        c.strokeStyle = '#050605'; c.lineWidth = 14; c.strokeRect(1500, 200, 360, 440);
        // меню
        c.fillStyle = '#070908'; c.fillRect(500, 70, 900, 290);
        c.strokeStyle = '#2a2f2a'; c.lineWidth = 6; c.strokeRect(500, 70, 900, 290);
        // прилавок
        P.vgrad(c, 0, 760, W, 320, [[0, '#6c7570'], [0.04, '#2b3230'], [0.5, '#161b19'], [1, '#080a09']]);
        c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(0, 760, W, 4);
        // вертел
        c.fillStyle = '#2a1a0c'; c.fillRect(150, 230, 300, 560);
        c.fillStyle = '#888'; c.fillRect(296, 120, 8, 660);
      },
      signs: [
        { text: 'ШАУРМА ........ 250', x: 950, y: 150, size: 36, color: AMBER, font: '"IBM Plex Mono", monospace' },
        { text: 'ДВОЙНАЯ ....... 400', x: 950, y: 220, size: 36, color: AMBER, font: '"IBM Plex Mono", monospace' },
        { text: 'ОГНЕННАЯ ...... ???', x: 950, y: 290, size: 36, color: RED, flicker: 1.8, font: '"IBM Plex Mono", monospace' },
        { text: 'ВЕРТЕЛ 24', x: 1680, y: 140, size: 44, color: ACID, flicker: 0.6 },
      ],
      animate(c, t, P) {
        // нагреватель
        P.glow(c, 300, 500, 320, 'rgba(255,120,30,0.55)', 0.7 + 0.25 * Math.sin(t * 9));
        // вращающееся мясо
        c.save();
        c.beginPath(); c.moveTo(210, 250); c.lineTo(390, 250); c.lineTo(350, 760); c.lineTo(250, 760); c.closePath(); c.clip();
        P.vgrad(c, 200, 250, 200, 520, [[0, '#7a3e12'], [1, '#4a220a']]);
        c.fillStyle = 'rgba(255,170,80,0.35)';
        for (let i = 0; i < 9; i++) {
          const x = 200 + ((t * 60 + i * 26) % 220);
          c.fillRect(x, 250, 6, 520);
        }
        c.restore();
        // мерцающая лампа дневного света
        if (P.flick(t, 4, 0.3) < 0.5) { c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(0, 0, W, H); }
      },
    },

    /* ------------------------------------------------ Участок 13 */
    police: {
      name: 'Участок 13', ambient: 'hum', music: 'score', seed: 41,
      paint(c, r, P) {
        P.vgrad(c, 0, 0, W, 600, [[0, '#141a17'], [1, '#1f2925']]);
        P.vgrad(c, 0, 600, W, 260, [[0, '#121815'], [1, '#0c100e']]);
        c.fillStyle = '#2e3a33'; c.fillRect(0, 596, W, 8);
        P.vgrad(c, 0, 860, W, 220, [[0, '#0d100f'], [1, '#030404']]);
        P.grime(c, r, 26, 'rgba(0,0,0,0.3)');
        // обезьянник
        c.fillStyle = '#050706'; c.fillRect(40, 160, 500, 700);
        c.fillStyle = '#3a423d';
        for (let x = 60; x < 540; x += 38) c.fillRect(x, 160, 9, 700);
        c.fillRect(40, 150, 500, 16); c.fillRect(40, 500, 500, 10);
        // доска «разыскиваются»
        c.fillStyle = '#5a3f22'; c.fillRect(640, 220, 400, 300);
        for (let i = 0; i < 6; i++) {
          const x = 660 + (i % 3) * 126, y = 240 + Math.floor(i / 3) * 140;
          c.save(); c.translate(x + 50, y + 60); c.rotate((r() - 0.5) * 0.12);
          c.fillStyle = '#d8cfb4'; c.fillRect(-50, -60, 100, 125);
          c.fillStyle = '#1b1b1b'; c.beginPath(); c.arc(0, -15, 22, 0, 6.28); c.fill(); c.fillRect(-32, 8, 64, 40);
          c.fillStyle = '#9b1b1b'; c.fillRect(-40, -56, 80, 10);
          c.restore();
        }
        // окно с жалюзи
        P.vgrad(c, 1380, 180, 440, 380, [[0, '#0b0f1c'], [1, '#121a1c']]);
        for (let y = 190; y < 560; y += 20) { c.fillStyle = '#1e2622'; c.fillRect(1380, y, 440, 11); }
        c.strokeStyle = '#060807'; c.lineWidth = 14; c.strokeRect(1380, 180, 440, 380);
        // стол
        c.fillStyle = '#0a0d0c'; c.fillRect(1100, 820, 820, 260);
        c.fillStyle = '#1b2220'; c.fillRect(1100, 812, 820, 14);
        P.cone(c, 1600, 700, 400, Math.PI / 2, 0.8, 'rgba(255,220,150,0.9)', 0.2);
        c.fillStyle = '#060807'; c.fillRect(1570, 700, 60, 18); c.fillRect(1594, 716, 10, 100);
      },
      animate(c, t, P) {
        // лампы под потолком
        [520, 1300].forEach((x, i) => {
          const a = P.flick(t, 10 + i, 0.5);
          c.fillStyle = `rgba(230,255,240,${0.85 * a})`; c.fillRect(x - 160, 30, 320, 12);
          P.glow(c, x, 40, 520, 'rgba(200,255,220,0.35)', 0.5 * a);
        });
        // мигалка за окном
        const ph = (t % 4);
        if (ph < 1.4) {
          const col = Math.floor(t * 6) % 2 ? 'rgba(255,40,70,0.9)' : 'rgba(80,140,255,0.9)';
          c.save(); c.beginPath(); c.rect(1380, 180, 440, 380); c.clip();
          P.glow(c, 1600, 380, 380, col, 0.5);
          c.restore();
          P.glow(c, 1600, 380, 700, col, 0.08);
        }
        P.clockFace(c, 1160, 150, 58, VN.S.time);
        // мишура на решётке
        c.save(); c.strokeStyle = '#c0c0c0'; c.lineWidth = 3; c.globalAlpha = 0.7;
        c.beginPath();
        for (let x = 40; x <= 540; x += 10) c.lineTo(x, 200 + Math.sin(x / 40) * 18 + Math.sin(t * 2 + x) * 1.5);
        c.stroke(); c.restore();
      },
    },

    /* ------------------------------------------------ Кривой переулок */
    alley: {
      name: 'Кривой переулок', ambient: 'rain', seed: 51, weather: 'rain',
      paint(c, r, P) {
        P.vgrad(c, 0, 0, W, H, [[0, '#0b140f'], [1, '#030504']]);
        // дальний конец
        P.vgrad(c, 760, 260, 400, 580, [[0, '#0e1a14'], [1, '#050807']]);
        P.glow(c, 960, 640, 240, 'rgba(182,255,59,0.2)');
        // стены
        c.save(); c.beginPath(); c.moveTo(0, 0); c.lineTo(760, 260); c.lineTo(760, 840); c.lineTo(0, 1080); c.closePath(); c.clip();
        P.bricks(c, r, 0, 0, 760, 1080, '#1b1512', '#0b0908');
        P.vgrad(c, 0, 0, 760, 1080, [[0, 'rgba(0,0,0,0.3)'], [1, 'rgba(0,0,0,0.6)']]);
        c.restore();
        c.save(); c.beginPath(); c.moveTo(1920, 0); c.lineTo(1160, 260); c.lineTo(1160, 840); c.lineTo(1920, 1080); c.closePath(); c.clip();
        P.bricks(c, r, 1160, 0, 760, 1080, '#14171a', '#08090a');
        P.vgrad(c, 1160, 0, 760, 1080, [[0, 'rgba(0,0,0,0.35)'], [1, 'rgba(0,0,0,0.65)']]);
        c.restore();
        // земля
        c.fillStyle = '#050807'; c.beginPath(); c.moveTo(0, 1080); c.lineTo(760, 840); c.lineTo(1160, 840); c.lineTo(1920, 1080); c.fill();
        // пожарные лестницы
        c.strokeStyle = '#0a0c0d'; c.lineWidth = 8;
        for (let k = 0; k < 4; k++) {
          const y = 120 + k * 160;
          c.beginPath(); c.moveTo(1920, y); c.lineTo(1500, y + 60 - k * 8); c.stroke();
          c.beginPath(); c.moveTo(1500, y + 60 - k * 8); c.lineTo(1700, y + 150); c.stroke();
        }
        // мусорный бак
        c.fillStyle = '#0d1f16'; c.fillRect(160, 760, 380, 240);
        c.fillStyle = '#081109'; c.fillRect(140, 740, 420, 30);
        // граффити
        P.neon(c, 'ШИЛО', 400, 420, 110, '#8dff6a', 0.55);
      },
      animate(c, t, P) {
        const a = P.flick(t, 5, 0.8);
        c.fillStyle = '#111'; c.fillRect(1238, 230, 4, 60);
        P.glow(c, 1240, 300, 300, 'rgba(255,230,160,0.7)', 0.45 * a);
        P.glow(c, 1240, 300, 40, 'rgba(255,250,220,1)', a);
        // туман у земли
        for (let i = 0; i < 5; i++) {
          const x = ((t * 30 + i * 420) % 2400) - 240;
          P.glow(c, x, 940 + Math.sin(i) * 40, 380, 'rgba(120,255,140,0.12)', 0.9);
        }
      },
    },

    /* ------------------------------------------------ доки */
    docks: {
      name: 'Причал «Северный»', ambient: 'wind', music: 'score', seed: 61, weather: 'snow',
      paint(c, r, P) {
        P.vgrad(c, 0, 0, W, 640, [[0, '#050913'], [1, '#18263a']]);
        P.skyline(c, r, { base: 640, minH: 10, maxH: 70, minW: 20, maxW: 60, color: '#0d1522', windows: [ICE, AMBER], winChance: 0.3, winSize: 3, winGap: 8 });
        P.vgrad(c, 0, 640, W, 440, [[0, '#0b1420'], [1, '#03060a']]);
        // краны
        c.strokeStyle = '#04070b'; c.lineWidth = 14;
        [[300, 1], [1580, -1]].forEach(([x, d]) => {
          c.beginPath(); c.moveTo(x, 700); c.lineTo(x, 180); c.lineTo(x + d * 420, 160); c.stroke();
          c.beginPath(); c.moveTo(x - 60, 260); c.lineTo(x, 180); c.stroke();
          c.lineWidth = 3; c.beginPath(); c.moveTo(x + d * 320, 166); c.lineTo(x + d * 320, 420); c.stroke(); c.lineWidth = 14;
        });
        // контейнеры
        const cols = ['#3a1014', '#0f2a2c', '#2b2a12', '#1a1a2c'];
        for (let i = 0; i < 9; i++) {
          const x = (i % 3) * 190 - 40, y = 820 - Math.floor(i / 3) * 96;
          c.fillStyle = cols[(i * 7) % 4]; c.fillRect(x, y, 186, 92);
          c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 2;
          for (let k = 10; k < 186; k += 14) { c.beginPath(); c.moveTo(x + k, y); c.lineTo(x + k, y + 92); c.stroke(); }
        }
        // маяк
        c.fillStyle = '#0a0e14'; c.fillRect(1170, 520, 24, 120);
        // настил
        P.vgrad(c, 0, 920, W, 160, [[0, '#14110d'], [1, '#050403']]);
        c.strokeStyle = '#080605'; c.lineWidth = 3;
        for (let x = -200; x < W + 200; x += 70) { c.beginPath(); c.moveTo(x, 920); c.lineTo(x - 120, 1080); c.stroke(); }
        c.fillStyle = '#050403'; c.fillRect(1500, 860, 40, 70); c.fillRect(1490, 850, 60, 16);
      },
      animate(c, t, P) {
        const a = t * 0.9;
        P.cone(c, 1182, 518, 1100, a, 0.07, 'rgba(160,220,255,0.9)', 0.25);
        P.glow(c, 1182, 518, 50, 'rgba(200,240,255,1)', 0.8);
        c.save(); c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 60; i++) {
          const y = 660 + (i * 37) % 250, x = (i * 173) % W;
          c.globalAlpha = 0.1 + 0.1 * Math.sin(t * 2 + i);
          c.fillStyle = i % 3 ? ICE : AMBER; c.fillRect(x + Math.sin(t + i) * 20, y, 40 + (i % 5) * 12, 2);
        }
        c.restore();
      },
    },

    /* ------------------------------------------------ ворота хладокомбината */
    gate: {
      name: 'Хладокомбинат №3', ambient: 'wind', music: 'score', seed: 71, weather: 'snow',
      paint(c, r, P) {
        P.vgrad(c, 0, 0, W, H, [[0, '#070b12'], [0.6, '#111a22'], [1, '#05070a']]);
        // корпус
        c.fillStyle = '#0b1016'; c.fillRect(260, 320, 1400, 460);
        c.fillRect(420, 160, 70, 180); c.fillRect(560, 200, 60, 140); c.fillRect(1460, 140, 80, 200);
        c.fillStyle = '#121a22';
        for (let x = 300; x < 1640; x += 90) for (let y = 380; y < 740; y += 110) c.fillRect(x, y, 50, 60);
        c.fillStyle = 'rgba(127,214,255,0.18)'; c.fillRect(840, 600, 50, 60); c.fillRect(1290, 490, 50, 60);
        // земля в снегу
        P.vgrad(c, 0, 780, W, 300, [[0, '#2a3440'], [1, '#0d1116']]);
        // будка охраны
        c.fillStyle = '#0a0e12'; c.fillRect(1500, 560, 260, 300);
        c.fillStyle = 'rgba(255,190,90,0.8)'; c.fillRect(1540, 610, 180, 90);
        P.glow(c, 1630, 660, 260, 'rgba(255,170,80,0.5)', 0.6);
        // прожектор
        c.fillStyle = '#05070a'; c.fillRect(214, 200, 12, 680); c.fillRect(190, 190, 60, 28);
        P.cone(c, 220, 210, 1100, 0.9, 0.2, 'rgba(200,230,255,0.9)', 0.18);
        // забор и ворота
        c.strokeStyle = 'rgba(30,40,50,0.9)'; c.lineWidth = 2;
        for (let x = -400; x < W; x += 28) {
          c.beginPath(); c.moveTo(x, 560); c.lineTo(x + 340, 900); c.stroke();
          c.beginPath(); c.moveTo(x + 340, 560); c.lineTo(x, 900); c.stroke();
        }
        c.fillStyle = '#05070a';
        for (let x = 0; x < W; x += 240) c.fillRect(x, 540, 14, 380);
        c.fillRect(0, 540, W, 10);
        c.fillStyle = '#0b0f13'; c.fillRect(780, 520, 360, 400);
        c.fillStyle = '#1d262e';
        for (let x = 790; x < 1140; x += 30) c.fillRect(x, 530, 8, 390);
      },
      signs: [{ text: 'ХЛАДОКОМБИНАТ №3', x: 960, y: 270, size: 58, color: ICE, flicker: 1.4 }],
      animate(c, t, P) {
        // пар из труб
        [[455, 160], [590, 200], [1500, 140]].forEach(([x, y], i) => {
          for (let k = 0; k < 6; k++) {
            const p = ((t * 0.25 + k / 6 + i * 0.3) % 1);
            P.glow(c, x + Math.sin(p * 4 + i) * 30 + p * 60, y - p * 220, 40 + p * 90, 'rgba(180,200,220,0.25)', (1 - p) * 0.5);
          }
        });
      },
    },

    /* ------------------------------------------------ контора */
    office: {
      name: 'Контора · 2-й этаж', ambient: 'tension', music: 'score', seed: 81,
      paint(c, r, P) {
        P.vgrad(c, 0, 0, W, 760, [[0, '#14191c'], [1, '#1c2327']]);
        P.grime(c, r, 30, 'rgba(120,140,150,0.06)');
        P.grime(c, r, 20, 'rgba(0,0,0,0.4)');
        c.fillStyle = '#101417'; c.fillRect(0, 700, W, 70);
        P.vgrad(c, 0, 770, W, 310, [[0, '#120f0c'], [1, '#040303']]);
        c.strokeStyle = '#0a0806'; c.lineWidth = 3;
        for (let x = 0; x < W; x += 90) { c.beginPath(); c.moveTo(x, 770); c.lineTo(x - 180, 1080); c.stroke(); }
        // заиндевевшее окно
        P.vgrad(c, 120, 180, 400, 420, [[0, '#0d1c26'], [1, '#08121a']]);
        P.glow(c, 120, 180, 220, 'rgba(200,235,255,0.5)'); P.glow(c, 520, 600, 220, 'rgba(200,235,255,0.4)');
        P.glow(c, 520, 180, 160, 'rgba(200,235,255,0.35)'); P.glow(c, 120, 600, 160, 'rgba(200,235,255,0.35)');
        c.strokeStyle = '#06080a'; c.lineWidth = 16; c.strokeRect(120, 180, 400, 420);
        c.beginPath(); c.moveTo(320, 180); c.lineTo(320, 600); c.moveTo(120, 390); c.lineTo(520, 390); c.stroke();
        // счёты на стене
        c.fillStyle = '#3a2412'; c.fillRect(700, 190, 420, 200);
        c.fillStyle = '#120b06'; c.fillRect(716, 206, 388, 168);
        for (let i = 0; i < 7; i++) {
          const y = 226 + i * 22;
          c.fillStyle = '#9a9a9a'; c.fillRect(716, y, 388, 2);
          for (let k = 0; k < 10; k++) {
            const x = (k < 4 + (i % 3) ? 730 + k * 22 : 920 + k * 16);
            c.fillStyle = k === 4 || k === 5 ? '#d8cfb4' : '#6b3a17';
            c.beginPath(); c.ellipse(x, y + 1, 9, 8, 0, 0, 6.28); c.fill();
          }
        }
        c.font = '22px "PT Serif", serif'; c.fillStyle = 'rgba(216,207,180,0.35)'; c.textAlign = 'center';
        c.fillText('ПЯТИЛЕТКУ — В ЧЕТЫРЕ ГОДА!', 910, 450);
        // шкафы и сейф
        c.fillStyle = '#0c1012';
        c.fillRect(1460, 300, 170, 470); c.fillRect(1640, 300, 170, 470);
        c.fillStyle = '#1a2024';
        for (let k = 0; k < 4; k++) { c.fillRect(1500, 340 + k * 110, 90, 10); c.fillRect(1680, 340 + k * 110, 90, 10); }
        P.vgrad(c, 1220, 520, 200, 260, [[0, '#2a3034'], [1, '#121618']]);
        c.strokeStyle = '#0a0c0d'; c.lineWidth = 6; c.strokeRect(1240, 540, 160, 220);
        c.fillStyle = '#5a6268'; c.beginPath(); c.arc(1320, 630, 30, 0, 6.28); c.fill();
        c.fillStyle = '#20262a'; c.beginPath(); c.arc(1320, 630, 18, 0, 6.28); c.fill();
      },
      animate(c, t, P) {
        const sw = Math.sin(t * 1.3) * 0.22;
        const bx = 960 + Math.sin(sw) * 300, by = Math.cos(sw) * 300;
        c.strokeStyle = '#050505'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(960, 0); c.lineTo(bx, by); c.stroke();
        P.cone(c, bx, by, 900, Math.PI / 2 - sw * 0.8, 0.5, 'rgba(255,225,160,0.95)', 0.22);
        P.glow(c, bx, by + 10, 140, 'rgba(255,230,170,0.9)', 0.8);
        // стул и его тень
        c.save(); c.globalAlpha = 0.5; c.fillStyle = '#000';
        c.beginPath(); c.ellipse(960 - Math.sin(sw) * 160, 950, 200, 26, 0, 0, 6.28); c.fill(); c.restore();
        c.fillStyle = '#070606';
        c.fillRect(890, 760, 140, 16); c.fillRect(890, 620, 14, 300); c.fillRect(1016, 620, 14, 300); c.fillRect(890, 620, 140, 14);
      },
    },

    /* ------------------------------------------------ двор хладокомбината */
    yard: {
      name: 'Двор хладокомбината', ambient: 'wind', music: 'score', seed: 91, weather: 'snow',
      paint(c, r, P) {
        P.vgrad(c, 0, 0, W, H, [[0, '#04060c'], [0.5, '#0d141c'], [1, '#05070a']]);
        P.skyline(c, r, { base: 700, minH: 60, maxH: 220, minW: 60, maxW: 140, color: '#0a0f16', windows: [VIOLET, ICE], winChance: 0.1, x1: 1000 });
        // главный корпус справа
        c.fillStyle = '#080b10'; c.fillRect(1000, 260, 920, 640);
        c.fillStyle = '#0d1219'; c.fillRect(980, 250, 960, 24);
        c.fillStyle = '#10171f';
        for (let x = 1040; x < 1900; x += 110) for (let y = 330; y < 820; y += 130) c.fillRect(x, y, 60, 80);
        // водонапорная башня
        c.fillStyle = '#06080c'; c.fillRect(1640, 110, 160, 110); c.fillRect(1660, 220, 10, 40); c.fillRect(1770, 220, 10, 40);
        // снег
        P.vgrad(c, 0, 860, W, 220, [[0, '#3b4756'], [1, '#141920']]);
        c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 18;
        c.beginPath(); c.moveTo(300, 1080); c.quadraticCurveTo(700, 900, 1300, 880); c.stroke();
        // бочка
        c.fillStyle = '#1a0d08'; c.fillRect(260, 820, 120, 160);
        c.fillStyle = '#100805'; c.fillRect(256, 840, 128, 10); c.fillRect(256, 930, 128, 10);
      },
      animate(c, t, P) {
        P.glow(c, 320, 800, 380, 'rgba(255,120,40,0.6)', 0.55 + 0.2 * Math.sin(t * 11) * Math.sin(t * 7));
        for (let i = 0; i < 6; i++) {
          const p = (t * 1.6 + i / 6) % 1;
          P.glow(c, 320 + Math.sin(t * 5 + i) * 20, 820 - p * 120, 30 * (1 - p) + 6, 'rgba(255,200,90,1)', 1 - p);
        }
      },
    },

    /* ------------------------------------------------ крыша / полночь */
    rooftop: {
      name: 'Порт-Ветров · полночь', ambient: 'wind', music: 'score', seed: 101, weather: 'snow', fireworks: true,
      paint(c, r, P) {
        P.vgrad(c, 0, 0, W, H, [[0, '#05030f'], [0.55, '#1a1030'], [0.8, '#2a1530'], [1, '#05040a']]);
        P.skyline(c, r, { base: 820, minH: 80, maxH: 300, minW: 30, maxW: 90, color: '#0e0b1c', windows: [VIOLET, ACID, AMBER, ICE], winChance: 0.22, winSize: 3, winGap: 8 });
        P.glow(c, 960, 820, 900, 'rgba(194,123,255,0.15)');
        P.skyline(c, r, { base: 880, minH: 40, maxH: 200, minW: 80, maxW: 180, color: '#07060d', windows: [AMBER], winChance: 0.06 });
        // часовая башня
        c.fillStyle = '#0a0812'; c.fillRect(1360, 260, 120, 620); c.beginPath(); c.moveTo(1350, 262); c.lineTo(1420, 150); c.lineTo(1490, 262); c.fill();
        // парапет
        P.vgrad(c, 0, 900, W, 180, [[0, '#1b1a24'], [1, '#07060a']]);
        c.fillStyle = '#d8e6f2'; c.globalAlpha = 0.25; c.fillRect(0, 896, W, 8); c.globalAlpha = 1;
      },
      animate(c, t, P) {
        P.clockFace(c, 1420, 330, 44, Math.max(VN.S.time, 0));
      },
    },
  };
})();
