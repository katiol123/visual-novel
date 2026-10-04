/* ==========================================================================
   Звук без единого файла: всё синтезируется WebAudio на лету.
   Эмбиент (дождь, гул), SFX (телефон, кости, выстрел…) и боевой луп.
   ========================================================================== */
(function () {
  'use strict';
  const VN = window.VN;

  const A = {
    ctx: null, master: null, sfxBus: null, ambBus: null, musBus: null,
    muted: false, noiseBuf: null, amb: {}, music: null, lastTick: 0,

    init() {
      if (this.ctx) { this.ctx.resume && this.ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const c = (this.ctx = new AC());
      this.master = c.createGain(); this.master.gain.value = this.muted ? 0 : 0.8;
      this.master.connect(c.destination);
      this.sfxBus = c.createGain(); this.sfxBus.gain.value = 0.9; this.sfxBus.connect(this.master);
      this.ambBus = c.createGain(); this.ambBus.gain.value = 0.7; this.ambBus.connect(this.master);
      this.musBus = c.createGain(); this.musBus.gain.value = 0.5; this.musBus.connect(this.master);
      const len = c.sampleRate * 2;
      this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      if (this.pendingAmb) this.ambient(this.pendingAmb);
    },

    toggleMute() {
      this.muted = !this.muted;
      if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.8, this.ctx.currentTime, 0.05);
      return this.muted;
    },

    /* ---------- примитивы ---------- */
    noise(dur, o = {}) {
      const c = this.ctx; if (!c) return;
      const t = c.currentTime + (o.delay || 0);
      const src = c.createBufferSource(); src.buffer = this.noiseBuf;
      const f = c.createBiquadFilter(); f.type = o.type || 'bandpass';
      f.frequency.value = o.freq || 1000; f.Q.value = o.q || 1;
      if (o.sweep) f.frequency.exponentialRampToValueAtTime(o.sweep, t + dur);
      const g = c.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(o.gain || 0.3, t + (o.attack || 0.002));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(o.bus || this.sfxBus);
      src.start(t, Math.random()); src.stop(t + dur + 0.05);
    },
    tone(freq, dur, o = {}) {
      const c = this.ctx; if (!c) return;
      const t = c.currentTime + (o.delay || 0);
      const osc = c.createOscillator(); osc.type = o.type || 'sine';
      osc.frequency.setValueAtTime(freq, t);
      if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t + dur);
      const g = c.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(o.gain || 0.2, t + (o.attack || 0.005));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      let node = osc;
      if (o.lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; osc.connect(f); node = f; }
      node.connect(g); g.connect(o.bus || this.sfxBus);
      osc.start(t); osc.stop(t + dur + 0.05);
    },

    /* ---------- SFX ---------- */
    sfx(name) {
      if (!this.ctx) return;
      const s = SFX[name];
      if (s) s.call(this);
    },

    tick() {
      if (!this.ctx) return;
      const now = performance.now();
      if (now - this.lastTick < 45) return;
      this.lastTick = now;
      this.noise(0.025, { type: 'highpass', freq: 2500 + Math.random() * 2500, gain: 0.05 });
    },

    /* ---------- эмбиент ---------- */
    ambient(name) {
      if (!this.ctx) { this.pendingAmb = name; return; }
      const c = this.ctx, now = c.currentTime;
      Object.keys(this.amb).forEach((k) => {
        if (k === name) return;
        const a = this.amb[k];
        a.gain.gain.setTargetAtTime(0, now, 0.6);
        setTimeout(() => a.nodes.forEach((n) => { try { n.stop(); } catch (e) {} }), 3000);
        delete this.amb[k];
      });
      if (!name || name === 'none' || this.amb[name]) return;
      const gain = c.createGain(); gain.gain.value = 0; gain.connect(this.ambBus);
      const nodes = [];
      const noiseLayer = (type, freq, q, g) => {
        const src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
        const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
        const gg = c.createGain(); gg.gain.value = g;
        src.connect(f); f.connect(gg); gg.connect(gain); src.start(); nodes.push(src);
      };
      const drone = (freq, g) => {
        [freq, freq * 1.006, freq * 1.5].forEach((fq, i) => {
          const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fq;
          const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 180 + i * 40;
          const gg = c.createGain(); gg.gain.value = g * (i === 2 ? 0.4 : 1);
          o.connect(f); f.connect(gg); gg.connect(gain); o.start(); nodes.push(o);
        });
      };
      if (name === 'rain') { noiseLayer('lowpass', 1400, 0.3, 0.16); noiseLayer('highpass', 5000, 0.5, 0.025); drone(41.2, 0.05); }
      if (name === 'room') { noiseLayer('lowpass', 500, 0.4, 0.05); drone(55, 0.04); }
      if (name === 'wind') { noiseLayer('bandpass', 400, 0.8, 0.18); drone(36.7, 0.05); }
      if (name === 'hum') { drone(49, 0.05); noiseLayer('bandpass', 120, 2, 0.06); }
      if (name === 'tension') { drone(32.7, 0.08); noiseLayer('lowpass', 300, 0.5, 0.06); }
      gain.gain.setTargetAtTime(1, now, 1.2);
      this.amb[name] = { gain, nodes };
    },

    /* ---------- боевой луп: бочка + бас + хэт ---------- */
    combatMusic(on) {
      if (!this.ctx) return;
      if (!on) { if (this.music) { clearInterval(this.music.id); this.music = null; } return; }
      if (this.music) return;
      const bpm = 112, step = 60 / bpm / 2;
      const bass = [41.2, 0, 41.2, 49, 0, 41.2, 55, 49];
      let n = 0, next = this.ctx.currentTime + 0.1;
      const id = setInterval(() => {
        const c = this.ctx;
        while (next < c.currentTime + 0.2) {
          const d = next - c.currentTime;
          if (n % 4 === 0) this.tone(90, 0.25, { slide: 38, gain: 0.5, delay: d, bus: this.musBus });
          if (n % 2 === 1) this.noise(0.05, { type: 'highpass', freq: 7000, gain: 0.06, delay: d, bus: this.musBus });
          if (n % 8 === 4) this.noise(0.18, { type: 'bandpass', freq: 1800, q: 0.7, gain: 0.12, delay: d, bus: this.musBus });
          const b = bass[n % 8];
          if (b) this.tone(b, step * 0.9, { type: 'sawtooth', lp: 260, gain: 0.16, delay: d, bus: this.musBus });
          next += step; n++;
        }
      }, 40);
      this.music = { id };
    },
  };

  const SFX = {
    click() { this.tone(1800, 0.04, { type: 'square', gain: 0.04 }); },
    hover() { this.tone(2400, 0.03, { type: 'sine', gain: 0.03 }); },
    select() { this.tone(660, 0.08, { type: 'triangle', gain: 0.12 }); this.tone(990, 0.12, { type: 'triangle', gain: 0.08, delay: 0.05 }); },
    phone() {
      for (let r = 0; r < 2; r++) for (let i = 0; i < 12; i++) {
        this.tone(440, 0.05, { type: 'square', gain: 0.05, delay: r * 1.1 + i * 0.07, lp: 2000 });
        this.tone(480, 0.05, { type: 'square', gain: 0.05, delay: r * 1.1 + i * 0.07, lp: 2000 });
      }
    },
    hangup() { for (let i = 0; i < 4; i++) this.tone(425, 0.25, { type: 'sine', gain: 0.08, delay: i * 0.5 }); },
    whoosh() { this.noise(0.5, { type: 'bandpass', freq: 300, sweep: 3000, q: 0.8, gain: 0.25, attack: 0.15 }); },
    shutter() { this.noise(0.03, { type: 'highpass', freq: 3000, gain: 0.3 }); this.noise(0.05, { type: 'bandpass', freq: 1500, gain: 0.2, delay: 0.06 }); },
    flash() { this.tone(3000, 0.4, { slide: 6000, gain: 0.04 }); SFX.shutter.call(this); },
    stamp() { this.tone(110, 0.2, { slide: 50, gain: 0.5 }); this.noise(0.1, { type: 'lowpass', freq: 800, gain: 0.3 }); },
    hit() { this.tone(140, 0.2, { slide: 40, gain: 0.6 }); this.noise(0.12, { type: 'lowpass', freq: 1200, gain: 0.4 }); },
    crit() { SFX.hit.call(this); this.tone(1200, 0.6, { type: 'triangle', gain: 0.1, slide: 600 }); this.tone(1800, 0.5, { type: 'sine', gain: 0.06, delay: 0.03 }); },
    hurt() { this.tone(90, 0.35, { slide: 30, gain: 0.6, type: 'triangle' }); this.noise(0.25, { type: 'lowpass', freq: 600, gain: 0.35 }); },
    gunshot() { this.noise(0.6, { type: 'lowpass', freq: 3000, sweep: 200, gain: 0.8, attack: 0.001 }); this.tone(70, 0.4, { slide: 30, gain: 0.7 }); },
    sniper() { SFX.gunshot.call(this); this.noise(1.5, { type: 'bandpass', freq: 600, sweep: 150, q: 0.5, gain: 0.25, delay: 0.1 }); },
    dice() {
      for (let i = 0; i < 7; i++) this.noise(0.03, { type: 'bandpass', freq: 2500 + Math.random() * 2500, q: 3, gain: 0.25, delay: i * 0.05 + Math.random() * 0.03 });
    },
    diceLand() { this.noise(0.04, { type: 'bandpass', freq: 1800, q: 2, gain: 0.3 }); this.tone(220, 0.05, { gain: 0.08 }); },
    success() { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.25, { type: 'triangle', gain: 0.12, delay: i * 0.07 })); },
    fail() { [300, 240, 180].forEach((f, i) => this.tone(f, 0.3, { type: 'sawtooth', gain: 0.08, lp: 900, delay: i * 0.12 })); },
    heartbeat() { this.tone(60, 0.15, { slide: 40, gain: 0.5 }); this.tone(55, 0.15, { slide: 35, gain: 0.4, delay: 0.22 }); },
    firework() {
      this.tone(300, 0.6, { slide: 1500, gain: 0.04, type: 'sine' });
      this.noise(0.9, { type: 'lowpass', freq: 2000, sweep: 200, gain: 0.35, delay: 0.6 });
      for (let i = 0; i < 10; i++) this.noise(0.03, { type: 'highpass', freq: 4000, gain: 0.08, delay: 0.75 + Math.random() * 0.8 });
    },
    radio() { this.noise(0.4, { type: 'bandpass', freq: 1800, q: 4, gain: 0.2 }); this.tone(1000, 0.08, { type: 'square', gain: 0.04, delay: 0.4 }); },
    item() { this.tone(880, 0.1, { type: 'triangle', gain: 0.1 }); this.tone(1320, 0.18, { type: 'triangle', gain: 0.08, delay: 0.08 }); },
    clue() { this.tone(392, 0.4, { type: 'triangle', gain: 0.1 }); this.tone(587, 0.5, { type: 'triangle', gain: 0.08, delay: 0.12 }); this.tone(784, 0.6, { type: 'sine', gain: 0.05, delay: 0.24 }); },
    clock() { this.tone(2200, 0.03, { type: 'square', gain: 0.03 }); },
    impact() { this.tone(60, 0.8, { slide: 25, gain: 0.8 }); this.noise(0.6, { type: 'lowpass', freq: 400, gain: 0.5 }); },
    glitch() { for (let i = 0; i < 6; i++) this.tone(100 + Math.random() * 2000, 0.03, { type: 'square', gain: 0.04, delay: i * 0.03 }); },
    lock() { this.tone(500, 0.05, { type: 'square', gain: 0.05 }); this.tone(350, 0.08, { type: 'square', gain: 0.05, delay: 0.06 }); },
  };

  VN.Audio = A;
})();
