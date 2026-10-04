/* ==========================================================================
   Выборы: карточки с номерами, тегами проверок (стат, сложность, шанс),
   стоимостью во времени, требованиями к предметам. Закрытые варианты
   видны, но зачёркнуты — игрок понимает, что мир шире, чем его билд.
   timer — выбор на время (горящий фитиль), по истечении — timeout.
   ========================================================================== */
(function () {
  'use strict';
  const VN = window.VN;
  const { el, sleep } = VN.util;

  /** Шанс успеха 2к6 + стат ≥ сложности (1-1 — всегда провал, 6-6 — всегда успех). */
  function chance(stat, dc) {
    let ok = 0;
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) {
      if (a === 1 && b === 1) continue;
      if ((a === 6 && b === 6) || a + b + stat >= dc) ok++;
    }
    return Math.round((ok / 36) * 100);
  }

  const Choices = {
    chance,

    /**
     * @param {Array} items — [{text, tags:[{t, k}], locked, reason}]
     * @returns {Promise<number>} индекс или -1 (время вышло)
     */
    show(items, opts = {}) {
      const root = document.getElementById('choices');
      root.innerHTML = '';
      root.className = 'open' + (opts.timer ? ' timed' : '');
      if (opts.prompt) root.appendChild(el('div', 'ch-prompt', opts.prompt));
      VN.Dialogue.box.classList.add('dimmed');

      return new Promise((resolve) => {
        let done = false, timerId = null, tickId = null;
        const keyHandler = (e) => {
          const n = parseInt(e.key, 10);
          if (n >= 1 && n <= items.length && !items[n - 1].locked) { e.preventDefault(); finish(n - 1); }
        };
        const finish = async (i) => {
          if (done) return; done = true;
          clearTimeout(timerId); clearInterval(tickId);
          window.removeEventListener('keydown', keyHandler, true);
          VN.Audio.sfx('select');
          const cards = root.querySelectorAll('.ch-card');
          cards.forEach((c, k) => c.classList.add(k === i ? 'picked' : 'gone'));
          await sleep(520);
          root.className = ''; root.innerHTML = '';
          VN.Dialogue.box.classList.remove('dimmed');
          resolve(i);
        };

        items.forEach((it, i) => {
          const card = el('button', 'ch-card' + (it.locked ? ' locked' : ''));
          card.style.setProperty('--d', i * 70 + 'ms');
          const tags = (it.tags || []).map((t) => `<span class="tag tag-${t.k}">${t.t}</span>`).join('');
          card.innerHTML = `
            <span class="ch-num">${String(i + 1).padStart(2, '0')}</span>
            <span class="ch-main"><span class="ch-text">${it.text}</span>${tags ? `<span class="ch-tags">${tags}</span>` : ''}</span>
            ${it.locked ? `<span class="ch-lock">${it.reason || 'закрыто'}</span>` : '<span class="ch-arrow">▶</span>'}`;
          if (!it.locked) {
            card.addEventListener('click', (e) => { e.stopPropagation(); finish(i); });
            card.addEventListener('mouseenter', () => VN.Audio.sfx('hover'));
          } else {
            card.addEventListener('click', (e) => { e.stopPropagation(); VN.Audio.sfx('lock'); card.classList.remove('nope'); void card.offsetWidth; card.classList.add('nope'); });
          }
          root.appendChild(card);
        });
        window.addEventListener('keydown', keyHandler, true);
        requestAnimationFrame(() => root.classList.add('in'));

        if (opts.timer) {
          const fuse = el('div', 'ch-fuse', '<i></i><b></b>');
          root.prepend(fuse);
          fuse.style.setProperty('--t', opts.timer + 'ms');
          requestAnimationFrame(() => fuse.classList.add('burn'));
          tickId = setInterval(() => VN.Audio.sfx('clock'), 500);
          timerId = setTimeout(() => finish(-1), opts.timer);
        }
      });
    },
  };

  VN.Choices = Choices;
})();
