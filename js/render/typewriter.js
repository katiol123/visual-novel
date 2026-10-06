/* ==========================================================================
   Печатная машинка с разметкой.
     {shake}…{/shake}  {wave}…{/wave}  {glitch}…{/glitch}
     {red} {green} {violet} {ice} {amber}  {i} {b} {big} {whisper}
     Новые:
     {static}  — помехи в трубке/рации: буквы мерцают и пропадают
     {frost}   — иней: буквы проступают сквозь изморозь, синеют и дрожат от холода
     {ghost}   — память: напечатано — и медленно выцветает, как старая фотография
     {pulse}   — сердцебиение: текст бьётся, как пульс
     {strike}  — вычеркнуто: красная черта по строчке, как в книге Совета
     {redact}  — замазано чёрным: строчку вымарали из протокола
     {cipher}  — шифр: каждая буква сперва перебирает случайные символы, потом «расшифровывается»
     {neon}    — неон: мерцает, как вывеска с плохим контактом
     {drip}    — кровь: красные буквы медленно стекают вниз
     {pause=400}  {speed=0.5}
   Все символы раскладываются заранее (невидимыми) → вёрстка не «прыгает».
   Слова завернуты в nowrap-обёртки → перенос только по пробелам.
   ========================================================================== */
(function () {
  'use strict';
  const VN = window.VN;

  const STYLE_TAGS = ['shake', 'wave', 'glitch', 'red', 'green', 'violet', 'ice', 'amber', 'i', 'b', 'big', 'whisper',
    'static', 'frost', 'ghost', 'pulse', 'strike', 'redact', 'cipher', 'neon', 'drip'];
  const RANDOM_FX = ['shake', 'glitch', 'static', 'frost', 'neon', 'drip']; // у этих — свой сдвиг фазы на каждую букву
  const CIPHER = '#%&@$*0123456789ABCDEFЖЩЫЮЯ░▒▓/\\<>';

  function parse(src) {
    const out = [];
    const re = /\{(\/?)([a-z]+)(?:=([\d.]+))?\}/g;
    let last = 0, m;
    const stack = [];
    while ((m = re.exec(src))) {
      if (m.index > last) out.push({ text: src.slice(last, m.index), cls: stack.slice() });
      const [, close, tag, val] = m;
      if (tag === 'pause') out.push({ pause: +val || 300 });
      else if (tag === 'speed') out.push({ speed: +val || 1 });
      else if (STYLE_TAGS.includes(tag)) {
        if (close) { const i = stack.lastIndexOf(tag); if (i >= 0) stack.splice(i, 1); }
        else stack.push(tag);
      }
      last = re.lastIndex;
    }
    if (last < src.length) out.push({ text: src.slice(last), cls: stack.slice() });
    return out;
  }

  /** Раскладывает текст в контейнер; возвращает {chars, actions}. */
  function build(container, src) {
    container.innerHTML = '';
    const chars = [];
    const actions = {};
    let word = null;
    let waveI = 0;
    for (const tok of parse(src)) {
      if (tok.pause != null || tok.speed != null) {
        const a = (actions[chars.length] = actions[chars.length] || {});
        if (tok.pause != null) a.pause = (a.pause || 0) + tok.pause;
        if (tok.speed != null) a.speed = tok.speed;
        continue;
      }
      for (const ch of tok.text) {
        if (ch === ' ' || ch === '\n') {
          word = null;
          container.appendChild(ch === '\n' ? document.createElement('br') : document.createTextNode(' '));
          continue;
        }
        if (!word) { word = document.createElement('span'); word.className = 'w'; container.appendChild(word); }
        const s = document.createElement('span');
        s.className = 'ch' + (tok.cls.length ? ' ' + tok.cls.map((c) => 'fx-' + c).join(' ') : '');
        s.textContent = ch;
        if (tok.cls.includes('wave')) s.style.setProperty('--i', waveI++);
        if (tok.cls.some((c) => RANDOM_FX.includes(c))) s.style.setProperty('--r', Math.random().toFixed(2));
        if (tok.cls.includes('pulse') || tok.cls.includes('ghost')) s.style.setProperty('--i', waveI++);
        word.appendChild(s);
        chars.push(s);
      }
    }
    return { chars, actions };
  }

  /** {cipher}: буква несколько раз перебирает случайные символы, потом встаёт на место. */
  function scramble(c) {
    const real = c.textContent;
    let n = 0;
    const t = setInterval(() => {
      if (++n > 7 || !c.isConnected) { clearInterval(t); c.textContent = real; c.classList.add('decoded'); return; }
      c.textContent = CIPHER[Math.floor(Math.random() * CIPHER.length)];
    }, 45);
  }

  function strip(src) { return src.replace(/\{[^}]*\}/g, ''); }

  /** Печатает текст. Возвращает контроллер { done: Promise, finish() }. */
  function type(container, src, opts = {}) {
    const { chars, actions } = build(container, src);
    let i = 0, speed = 1, timer = null, finished = false, resolve;
    const done = new Promise((r) => (resolve = r));
    const base = opts.cps ? 1000 / opts.cps : 26;
    const finish = () => {
      if (finished) return;
      finished = true; clearTimeout(timer);
      chars.forEach((c) => c.classList.add('on'));
      resolve();
    };
    const step = () => {
      if (finished) return;
      if (i >= chars.length) return finish();
      const a = actions[i];
      if (a && a.speed != null) speed = a.speed;
      if (a && a.pause && !a._done) { a._done = true; timer = setTimeout(step, a.pause / VN.mode.textSpeed); return; }
      const c = chars[i++];
      c.classList.add('on');
      if (c.classList.contains('fx-cipher')) scramble(c);
      if (opts.sound !== false && i % 2) VN.Audio.tick();
      const t = c.textContent;
      let d = base / speed;
      if ('.!?…'.includes(t)) d += 170; else if (',;:—'.includes(t)) d += 70;
      timer = setTimeout(step, d / VN.mode.textSpeed);
    };
    if (VN.mode.skip) finish(); else step();
    return { done, finish, get finished() { return finished; } };
  }

  VN.Typewriter = { parse, build, type, strip };
})();
