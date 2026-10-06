/* ==========================================================================
   Звук: SFX и большая часть эмбиента синтезируются WebAudio на лету,
   музыка и дождь — из файлов (assets/music). Общая громкость — ползунок
   (VN.Audio.setVolume, сохраняется между запусками).
   ========================================================================== */
(function () {
  'use strict';
  const VN = window.VN;

  const A = {
    ctx: null, master: null, sfxBus: null, ambBus: null, musBus: null,
    muted: false, noiseBuf: null, amb: {}, music: null, lastTick: 0,
    vol: (VN.Meta && VN.Meta.data.volume != null) ? VN.Meta.data.volume : 1, // 0…1, ползунок громкости
    duck: 1, // приглушение эмбиента во время боя

    /** Итоговая громкость синтеза (мастер-шина). */
    level() { return this.muted ? 0 : 0.8 * this.vol; },
    /** Ползунок громкости: 0…1. Применяется сразу ко всему — синтезу, музыке, дождю. */
    setVolume(v) {
      this.vol = Math.max(0, Math.min(1, v));
      if (VN.Meta) VN.Meta.set('volume', this.vol);
      if (this.master) this.master.gain.setTargetAtTime(this.level(), this.ctx.currentTime, 0.05);
      // всё, что звучит или нарастает, догоняет новую громкость (даже посреди плавного перехода)
      Object.entries(this.tracks || {}).forEach(([n, t]) => { if (t.on && !t.a.paused) this._fade(n, this._goal(t), 150); });
      VN.bus && VN.bus.emit('volume', this.vol);
    },

    init() {
      if (this.ctx) { this.ctx.resume && this.ctx.resume(); this.resumeMusic(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const c = (this.ctx = new AC());
      this.master = c.createGain(); this.master.gain.value = this.level();
      this.master.connect(c.destination);
      this.sfxBus = c.createGain(); this.sfxBus.gain.value = 0.9; this.sfxBus.connect(this.master);
      this.ambBus = c.createGain(); this.ambBus.gain.value = 0.7; this.ambBus.connect(this.master);
      this.musBus = c.createGain(); this.musBus.gain.value = 0.5; this.musBus.connect(this.master);
      const len = c.sampleRate * 2;
      this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      if (this.pendingAmb) this.ambient(this.pendingAmb);
      this.resumeMusic();
    },

    toggleMute() {
      this.muted = !this.muted;
      if (this.master) this.master.gain.setTargetAtTime(this.level(), this.ctx.currentTime, 0.05);
      Object.values(this.tracks || {}).forEach((t) => (t.a.muted = this.muted));
      VN.bus && VN.bus.emit('volume', this.vol);
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
        a.nodes.dead = true;
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
      if (name === 'rain') this._rainLoop(gain, nodes); // файл игрока, бесшовная петля
      if (name === 'room') { noiseLayer('lowpass', 500, 0.4, 0.05); drone(55, 0.04); }
      if (name === 'wind') { noiseLayer('bandpass', 400, 0.8, 0.18); drone(36.7, 0.05); }
      if (name === 'hum') { drone(49, 0.05); noiseLayer('bandpass', 120, 2, 0.06); }
      if (name === 'tension') { drone(32.7, 0.08); noiseLayer('lowpass', 300, 0.5, 0.06); }
      gain.gain.setTargetAtTime(1, now, 1.2);
      this.amb[name] = { gain, nodes };
    },

    /* ---------- музыка из файлов ----------
       Две «полки»: сцена (фоновая музыка локации) и бой (перекрывает сцену).
       HTMLAudio, а не fetch+decode — так работает и при открытии через file://. */
    TRACKS: {
      score: { src: 'assets/music/echoes-of-the-abyss.mp3', vol: 0.42 },
      fight: { src: 'assets/music/steel-tangerines.mp3', vol: 0.6 },
    },
    /** Громкость, к которой должен прийти трек сейчас: его база × ползунок × приглушение в бою. */
    _goal(t) { return t.target * this.vol * (t.duckable ? this.duck : 1); },
    /** Дождь — файл игрока (assets/music/rain.mp3, в base64 из js/data/rain-audio.js).
        HTMLAudio зацикливает mp3 с микропаузой, поэтому: декодируем один раз, срезаем тишину
        по краям и склеиваем конец с началом кроссфейдом — петля без единого шва.
        Идёт через шину эмбиента: громкость, «без звука» и приглушение в бою — как у всего. */
    RAIN_GAIN: 0.5, // тихо, фоном: дождь не должен заглушать реплики и эффекты
    _rainLoop(gain, nodes) {
      const c = this.ctx;
      const start = (buf) => {
        if (nodes.dead) return; // эмбиент уже сменился, пока декодировали
        const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
        const g = c.createGain(); g.gain.value = this.RAIN_GAIN;
        src.connect(g); g.connect(gain); src.start(); nodes.push(src);
      };
      if (this.rainBuf) { start(this.rainBuf); return; }
      if (!VN.RainMp3) return;
      const bin = atob(VN.RainMp3), bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const done = (raw) => { this.rainBuf = this._seamless(raw); start(this.rainBuf); };
      const p = c.decodeAudioData(bytes.buffer, done, () => {});
      if (p && p.catch) p.catch(() => {});
    },
    /** Бесшовная петля: срезать тишину mp3 по краям и вклеить хвост в начало (равномощный кроссфейд). */
    _seamless(raw) {
      const c = this.ctx, ch = raw.numberOfChannels, sr = raw.sampleRate;
      const thr = 0.003; let s = 0, e = raw.length;
      const loud = (i) => { for (let k = 0; k < ch; k++) if (Math.abs(raw.getChannelData(k)[i]) > thr) return true; return false; };
      while (s < e && !loud(s)) s++;
      while (e > s && !loud(e - 1)) e--;
      const n = e - s, F = Math.min(Math.floor(sr * 0.35), Math.floor(n / 4));
      if (n <= F * 2) return raw;
      const out = c.createBuffer(ch, n - F, sr);
      for (let k = 0; k < ch; k++) {
        const src = raw.getChannelData(k), dst = out.getChannelData(k);
        for (let i = 0; i < n - F; i++) dst[i] = src[s + i];
        for (let i = 0; i < F; i++) {
          const x = i / F; // начало нарастает, хвост затухает — равная мощность
          dst[i] = src[s + i] * Math.sin(x * Math.PI / 2) + src[s + n - F + i] * Math.cos(x * Math.PI / 2);
        }
      }
      return out;
    },
    tracks: {}, sceneTrack: null, fightOn: false, playing: null,

    _el(name) {
      if (!this.tracks[name]) {
        const t = this.TRACKS[name];
        const a = new Audio(t.src);
        a.loop = true; a.preload = 'auto'; a.volume = 0;
        this.tracks[name] = { a, target: t.vol, fade: null, duckable: !!t.duckable };
      }
      return this.tracks[name];
    },
    _fade(name, to, ms, then) {
      const t = this._el(name), a = t.a;
      clearInterval(t.fade);
      const from = a.volume, t0 = performance.now();
      t.fade = setInterval(() => {
        const k = Math.min(1, (performance.now() - t0) / ms);
        a.volume = Math.max(0, Math.min(1, from + (to - from) * k));
        if (k >= 1) { clearInterval(t.fade); t.fade = null; then && then(); }
      }, 30);
    },
    /** Переключить играющую музыку на трек name (или тишину) с кроссфейдом. */
    _switch(name, ms = 1400, restart) {
      if (this.playing === name && !restart) return;
      const old = this.playing;
      this.playing = name;
      if (old) { this._el(old).on = false; this._fade(old, 0, ms, () => { if (this.playing !== old) this._el(old).a.pause(); }); }
      if (!name) return;
      const t = this._el(name);
      t.on = true;
      if (restart || t.a.paused) { if (restart) t.a.currentTime = 0; }
      t.a.muted = this.muted;
      const p = t.a.play();
      if (p && p.catch) p.catch(() => { this.pendingMusic = true; });
      this._fade(name, this._goal(t), ms);
    },
    /** Фоновая музыка сцены: 'score' или null. Во время боя только запоминается. */
    music(name) {
      this.sceneTrack = name || null;
      if (!this.fightOn) this._switch(this.sceneTrack);
    },
    /** Боевая музыка: on — с начала трека, off — затухание и возврат к музыке сцены. */
    combatMusic(on) {
      this.fightOn = !!on;
      if (on) { this._duckAmbient(0.25); this._switch('fight', 500, true); }
      else { this._duckAmbient(1); this._switch(this.sceneTrack, 1800); }
    },
    _duckAmbient(k) {
      this.duck = k;
      if (this.ctx && this.ambBus) this.ambBus.gain.setTargetAtTime(0.7 * k, this.ctx.currentTime, 0.4);
    },
    /** Звук локации: дождь — только дождь; без дождя — фоновая музыка. */
    scene(loc) {
      if (!loc) { this.ambient(null); this.music(null); return; }
      if (loc.music) { this.ambient(loc.musicAmbient || null); this.music(loc.music); }
      else { this.music(null); this.ambient(loc.ambient); }
    },
    resumeMusic() {
      if (!this.pendingMusic || !this.playing) return;
      this.pendingMusic = false;
      const p = this._el(this.playing).a.play();
      if (p && p.catch) p.catch(() => { this.pendingMusic = true; });
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
