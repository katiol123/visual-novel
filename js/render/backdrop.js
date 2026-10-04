/* ==========================================================================
   Процедурные фоны на canvas. Статичный слой рисуется один раз в offscreen,
   динамика (неон, дождь, снег, туман, маяк, фейерверки) — каждый кадр.
   Локации описаны в data/locations.js через помощники VN.Paint.
   ========================================================================== */
(function () {
  'use strict';
  const VN = window.VN;
  const W = 1920, H = 1080;

  /* ---------------- помощники рисования ---------------- */
  const P = {
    vgrad(ctx, x, y, w, h, stops) {
      const g = ctx.createLinearGradient(0, y, 0, y + h);
      stops.forEach(([o, c]) => g.addColorStop(o, c));
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    },
    glow(ctx, x, y, r, color, a = 1) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.restore();
    },
    cone(ctx, x, y, len, angle, spread, color, a = 0.25) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a;
      const g = ctx.createRadialGradient(x, y, 0, x, y, len);
      g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.arc(x, y, len, angle - spread, angle + spread);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    },
    skyline(ctx, rng, o) {
      let x = o.x0 || -40;
      const x1 = o.x1 || W + 40;
      while (x < x1) {
        const w = o.minW + rng() * (o.maxW - o.minW);
        const h = o.minH + rng() * (o.maxH - o.minH);
        const top = o.base - h;
        ctx.fillStyle = o.color;
        ctx.fillRect(x, top, w, h + 2);
        if (rng() < 0.25) ctx.fillRect(x + w * 0.4, top - 30 - rng() * 40, 3, 60);
        if (o.windows) {
          const ws = o.winSize || 4, gap = o.winGap || 10;
          for (let wy = top + 10; wy < o.base - 6; wy += gap) {
            for (let wx = x + 6; wx < x + w - 6; wx += gap * 0.8) {
              if (rng() < (o.winChance || 0.12)) {
                ctx.globalAlpha = 0.35 + rng() * 0.6;
                ctx.fillStyle = o.windows[Math.floor(rng() * o.windows.length)];
                ctx.fillRect(wx, wy, ws, ws * 1.3);
              }
            }
          }
          ctx.globalAlpha = 1;
        }
        x += w + (o.gap || 0) * rng();
      }
    },
    neon(ctx, text, x, y, size, color, a = 1, font) {
      if (a <= 0.01) return;
      ctx.save();
      ctx.font = `${size}px ${font || '"Rubik Mono One", "Oswald", sans-serif'}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.globalAlpha = a;
      ctx.shadowColor = color; ctx.shadowBlur = size * 0.9;
      ctx.fillStyle = color; ctx.fillText(text, x, y);
      ctx.shadowBlur = size * 0.3;
      ctx.globalAlpha = a * 0.75; ctx.fillStyle = '#fff'; ctx.fillText(text, x, y);
      ctx.restore();
    },
    bricks(ctx, rng, x, y, w, h, base, mortar) {
      ctx.fillStyle = base; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = mortar; ctx.lineWidth = 2;
      for (let r = 0, yy = y; yy < y + h; r++, yy += 26) {
        ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke();
        for (let xx = x + (r % 2 ? 0 : 30); xx < x + w; xx += 60) {
          ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx, yy + 26); ctx.stroke();
          if (rng() < 0.08) { ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fillRect(xx, yy, 60, 26); }
        }
      }
    },
    grime(ctx, rng, n, color) {
      for (let i = 0; i < n; i++) {
        const x = rng() * W, y = rng() * H, r = 40 + rng() * 200;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
    },
    clockFace(ctx, x, y, r, minutes, color = '#e8e2d0') {
      const tot = 23 * 60 + minutes;
      const hA = ((tot / 60) % 12) / 12 * Math.PI * 2 - Math.PI / 2;
      const mA = (tot % 60) / 60 * Math.PI * 2 - Math.PI / 2;
      ctx.save();
      ctx.fillStyle = 'rgba(232,226,208,0.9)';
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#111'; ctx.lineWidth = r * 0.08; ctx.stroke();
      ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78);
        ctx.lineTo(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9); ctx.stroke();
      }
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#111'; ctx.lineWidth = r * 0.1;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(hA) * r * 0.5, y + Math.sin(hA) * r * 0.5); ctx.stroke();
      ctx.lineWidth = r * 0.06; ctx.strokeStyle = minutes >= 50 ? '#c4001f' : '#111';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(mA) * r * 0.8, y + Math.sin(mA) * r * 0.8); ctx.stroke();
      ctx.restore();
    },
    /** Мерцание неона: 0..1, иногда «проваливается». */
    flick(t, seed, rate = 1) {
      const s = Math.sin(t * 13.7 * rate + seed * 7.1) + Math.sin(t * 31.3 * rate + seed * 3.3);
      if (s > 1.75) return 0.15;
      return 0.85 + 0.15 * Math.sin(t * 50 + seed);
    },
  };
  VN.Paint = P;

  /* ---------------- рендерер ---------------- */
  const B = {
    canvas: null, ctx: null, stat: null, sctx: null,
    loc: null, id: null, t: 0, rain: [], snow: [], fw: [], fwUntil: 0, nextFw: 0, running: false,

    init(canvas) {
      this.canvas = canvas; canvas.width = W; canvas.height = H;
      this.ctx = canvas.getContext('2d');
      this.stat = document.createElement('canvas'); this.stat.width = W; this.stat.height = H;
      this.sctx = this.stat.getContext('2d');
      for (let i = 0; i < 380; i++) this.rain.push(this.newDrop(true));
      for (let i = 0; i < 260; i++) this.snow.push(this.newFlake(true));
      // шрифты для неона могут догрузиться позже — перерисуем статику
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => this.id && this.set(this.id));
      this.running = true;
      let last = performance.now();
      const loop = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        this.t += dt;
        this.frame(dt);
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    },

    newDrop(any) {
      return { x: Math.random() * (W + 400) - 200, y: any ? Math.random() * H : -40 - Math.random() * 200, l: 18 + Math.random() * 30, v: 1400 + Math.random() * 900, a: 0.12 + Math.random() * 0.25 };
    },
    newFlake(any) {
      return { x: Math.random() * W, y: any ? Math.random() * H : -10, r: 0.8 + Math.random() * 2.8, v: 40 + Math.random() * 90, p: Math.random() * 6.28, a: 0.3 + Math.random() * 0.6 };
    },

    set(id) {
      const loc = VN.Locations[id] || VN.Locations.black;
      this.id = id; this.loc = loc;
      const c = this.sctx;
      c.save(); c.clearRect(0, 0, W, H); c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      loc.paint && loc.paint(c, VN.util.seeded(loc.seed || 7), P);
      c.restore();
      this.fw = [];
      this.frame(0);
    },

    fireworks(ms) { this.fwUntil = performance.now() + ms; },

    frame(dt) {
      const ctx = this.ctx, loc = this.loc;
      if (!loc) return;
      ctx.drawImage(this.stat, 0, 0);
      const t = this.t;
      if (loc.signs) loc.signs.forEach((s, i) => {
        const a = s.flicker ? P.flick(t, i + 1, s.flicker) : 0.95;
        P.neon(ctx, s.text, s.x, s.y, s.size, s.color, a, s.font);
      });
      if (loc.animate) loc.animate(ctx, t, P, this);
      const clip = loc.weatherClip;
      if (clip) { ctx.save(); ctx.beginPath(); ctx.rect(clip[0], clip[1], clip[2], clip[3]); ctx.clip(); }
      if (loc.weather === 'rain' || loc.weather === 'sleet') this.drawRain(ctx, dt, loc.weather === 'sleet' ? 0.6 : 1);
      if (loc.weather === 'snow' || loc.weather === 'sleet') this.drawSnow(ctx, dt, loc.weather === 'sleet' ? 0.5 : 1);
      if (clip) ctx.restore();
      if (loc.fireworks || performance.now() < this.fwUntil) this.drawFireworks(ctx, dt);
      else if (this.fw.length) this.drawFireworks(ctx, dt, true);
    },

    drawRain(ctx, dt, density) {
      ctx.save();
      ctx.strokeStyle = '#a9c4b4'; ctx.lineWidth = 1.4;
      const n = Math.floor(this.rain.length * density);
      for (let i = 0; i < n; i++) {
        const d = this.rain[i];
        d.y += d.v * dt; d.x += d.v * dt * 0.18;
        if (d.y > H + 40) Object.assign(d, this.newDrop(false));
        ctx.globalAlpha = d.a;
        ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.l * 0.18, d.y - d.l); ctx.stroke();
      }
      ctx.restore();
    },
    drawSnow(ctx, dt, density) {
      ctx.save(); ctx.fillStyle = '#e8f4ff';
      const n = Math.floor(this.snow.length * density);
      for (let i = 0; i < n; i++) {
        const f = this.snow[i];
        f.y += f.v * dt; f.p += dt * 1.3; f.x += Math.sin(f.p) * 20 * dt + 12 * dt;
        if (f.y > H + 10) Object.assign(f, this.newFlake(false));
        if (f.x > W + 10) f.x = -10;
        ctx.globalAlpha = f.a;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fill();
      }
      ctx.restore();
    },
    drawFireworks(ctx, dt, drainOnly) {
      const now = performance.now();
      if (!drainOnly && now > this.nextFw) {
        this.nextFw = now + 500 + Math.random() * 900;
        this.fw.push({ rocket: true, x: 200 + Math.random() * (W - 400), y: H * 0.75, vy: -(700 + Math.random() * 300), tgt: 120 + Math.random() * 330 });
      }
      const COLORS = ['#b6ff3b', '#c27bff', '#ff2a4d', '#7fd6ff', '#ffd23a', '#ffffff'];
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = this.fw.length - 1; i >= 0; i--) {
        const p = this.fw[i];
        if (p.rocket) {
          p.y += p.vy * dt;
          ctx.fillStyle = '#ffe9b0'; ctx.globalAlpha = 0.9;
          ctx.fillRect(p.x, p.y, 3, 12);
          if (p.y < p.tgt) {
            this.fw.splice(i, 1);
            const col = COLORS[Math.floor(Math.random() * COLORS.length)];
            const n = 70 + Math.floor(Math.random() * 40);
            for (let k = 0; k < n; k++) {
              const a = Math.random() * 6.283, sp = 120 + Math.random() * 320;
              this.fw.push({ x: p.x, y: p.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.4 + Math.random() * 0.8, age: 0, col });
            }
            VN.Audio.sfx('firework');
          }
          continue;
        }
        p.age += dt; p.vy += 220 * dt; p.vx *= 0.985; p.vy *= 0.985;
        p.x += p.vx * dt; p.y += p.vy * dt;
        const k = 1 - p.age / p.life;
        if (k <= 0) { this.fw.splice(i, 1); continue; }
        ctx.globalAlpha = k; ctx.fillStyle = p.col;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.4 * k + 0.6, 0, 6.283); ctx.fill();
      }
      ctx.restore();
    },
  };

  VN.Backdrop = B;
})();
