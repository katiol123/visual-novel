/* ==========================================================================
   3D-кубики на CSS (preserve-3d). Бросок = полёт по дуге (WAAPI)
   + кувырок куба до нужной грани (CSS transition).
   ========================================================================== */
(function () {
  'use strict';
  const VN = window.VN;
  const { el, randInt } = VN.util;

  const PIPS = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
  // поворот куба, при котором грань N смотрит на зрителя
  const ROT = { 1: [0, 0], 6: [0, 180], 3: [0, -90], 4: [0, 90], 2: [-90, 0], 5: [90, 0] };

  function face(n) {
    const f = el('div', 'face f' + n);
    for (let i = 1; i <= 9; i++) f.appendChild(el('i', PIPS[n].includes(i) ? 'pip' : ''));
    return f;
  }

  function make(value = 1, kind = 'bone') {
    const root = el('div', 'die die-' + kind);
    const cube = el('div', 'cube');
    for (let n = 1; n <= 6; n++) cube.appendChild(face(n));
    root.appendChild(cube);
    const d = {
      el: root, cube, value,
      set(v) {
        this.value = v;
        const [x, y] = ROT[v];
        cube.style.transition = 'none';
        cube.style.transform = `rotateX(${x}deg) rotateY(${y}deg)`;
        root.dataset.v = v;
      },
      /** Бросок с полётом. from: {x,y} смещение старта в px. */
      roll(v, opts = {}) {
        this.value = v;
        root.dataset.v = v;
        root.classList.add('rolling');
        const [x, y] = ROT[v];
        const kx = randInt(2, 4) * 360 * (Math.random() < 0.5 ? -1 : 1);
        const ky = randInt(2, 4) * 360 * (Math.random() < 0.5 ? -1 : 1);
        const dur = opts.dur || 900 + Math.random() * 350;
        cube.style.transition = 'none';
        cube.style.transform = `rotateX(${randInt(0, 360)}deg) rotateY(${randInt(0, 360)}deg) rotateZ(${randInt(0, 360)}deg)`;
        void cube.offsetWidth;
        cube.style.transition = `transform ${dur}ms cubic-bezier(.15,.75,.3,1)`;
        cube.style.transform = `rotateX(${x + kx}deg) rotateY(${y + ky}deg) rotateZ(0deg)`;
        const fx = opts.from ? opts.from.x : randInt(-160, 160), fy = opts.from ? opts.from.y : 220;
        root.animate([
          { transform: `translate(${fx}px, ${fy}px) scale(1.5)`, opacity: 0 },
          { transform: `translate(${fx * 0.45}px, -70px) scale(1.25)`, opacity: 1, offset: 0.35 },
          { transform: 'translate(0, 0) scale(1)', offset: 0.7 },
          { transform: 'translate(0, -14px) scale(1)', offset: 0.82 },
          { transform: 'translate(0, 0) scale(1)' },
        ], { duration: dur, easing: 'ease-out' });
        return new Promise((r) => setTimeout(() => {
          root.classList.remove('rolling');
          root.classList.add('landed');
          setTimeout(() => root.classList.remove('landed'), 400);
          VN.Audio.sfx('diceLand');
          r(v);
        }, dur));
      },
    };
    d.set(value);
    return d;
  }

  VN.Dice = { make, d6: () => randInt(1, 6) };
})();
