/* ==========================================================================
   Окно торговли: бартер на весах.
   Слева — твои вещи (клик — на весы), справа — товар торговца (клик —
   хочу). В центре весы: твоё предложение в его глазах против цены.
   «Торговаться» — одна попытка НЕРВАМИ за визит. Сдачи не бывает.
   ========================================================================== */
(function () {
  'use strict';
  const VN = window.VN;
  const { el, esc, pick } = VN.util;

  const Trade = {
    /** Ценность вещи в глазах торговца. */
    worth(m, id) {
      const it = VN.Items[id];
      return Math.round((it.value || 0) * ((m.likes || {})[id] || (m.dislikes || {})[id] || 1) * 10) / 10;
    },
    priceMul(m) {
      const r = VN.State.rel(m.char);
      return r >= 2 ? 0.8 : r <= -2 ? 1.4 : 1;
    },

    open(mid) {
      const m = VN.Merchants[mid];
      const ch = VN.Characters[m.char] || {};
      const S = VN.S;
      S.stock = S.stock || {};
      const stock = (S.stock[mid] = S.stock[mid] || m.stock.map((x) => ({ ...x, qty: x.qty || 1 })));
      return new Promise((resolve) => {
        const md = VN.Modal.open('trade', `ТОРГ · ${ch.short || ch.name || ''}`, 'Бартер: вещь за вещь. Сдачи не бывает.');
        md.onClose = () => resolve();
        const foe = VN.State.foe(m.char), friend = VN.State.friend(m.char);
        if (foe && m.refuseFoe) {
          md.body.innerHTML = `<div class="tr-refuse"><p>«${esc(m.lines.foe)}»</p></div>`;
          return;
        }
        let haggle = 1, haggled = false;
        const offer = new Set(), want = new Set();
        const wrap = el('div', 'tr-wrap');
        wrap.innerHTML = `
          <div class="tr-col tr-mine"><h3>ТВОЁ</h3><div class="tr-grid"></div></div>
          <div class="tr-mid">
            <div class="tr-quote">«${esc(m.greet)}»</div>
            ${friend ? `<div class="tr-mood f">${esc(m.lines.friend)} −20%</div>` : foe ? `<div class="tr-mood x">${esc(m.lines.foe)} +40%</div>` : ''}
            <div class="tr-scale"><i class="beam"><b class="pan l"></b><b class="pan r"></b></i><i class="post"></i></div>
            <div class="tr-sums"><div><span>ТЫ ДАЁШЬ</span><b class="s-off">0</b></div><div><span>ЦЕНА</span><b class="s-price">0</b></div></div>
            <div class="tr-verdict"></div>
            <div class="tr-btns"><button class="btn btn-ghost tr-hag">ТОРГОВАТЬСЯ <small>НРВ ${m.haggleDc}</small></button><button class="btn btn-acid tr-deal" disabled>ПО РУКАМ</button></div>
          </div>
          <div class="tr-col tr-his"><h3>У НЕГО</h3><div class="tr-list"></div></div>`;
        md.body.appendChild(wrap);
        const mine = wrap.querySelector('.tr-mine .tr-grid'), his = wrap.querySelector('.tr-list');

        const price = (x) => Math.max(1, Math.round(x.price * this.priceMul(m) * haggle));
        const render = () => {
          mine.innerHTML = '';
          Object.keys(S.inv).filter((id) => VN.Items[id].tradeable).forEach((id) => {
            const it = VN.Items[id], w = this.worth(m, id);
            const n = S.inv[id], used = [...offer].filter((o) => o.split('#')[0] === id).length;
            for (let k = 0; k < n; k++) {
              const key = id + '#' + k;
              const c = el('button', 'tr-item' + (offer.has(key) ? ' on' : ''));
              const mult = (m.likes || {})[id] ? 'like' : (m.dislikes || {})[id] ? 'dis' : '';
              c.innerHTML = `<span class="ic">${VN.Icons[it.icon]}</span><span class="nm">${esc(it.name)}</span><b class="v ${mult}">${w}</b>`;
              c.title = mult === 'like' ? 'Он это любит' : mult === 'dis' ? 'Ему это не нужно' : '';
              c.addEventListener('click', (e) => { e.stopPropagation(); offer.has(key) ? offer.delete(key) : offer.add(key); VN.Audio.sfx('click'); render(); });
              mine.appendChild(c);
            }
            void used;
          });
          if (!mine.children.length) mine.innerHTML = '<p class="muted">Меняться нечем.</p>';
          his.innerHTML = '';
          stock.forEach((x, i) => {
            if (x.qty <= 0 || (x.flag && S.flags[x.flag])) return;
            const it = x.id ? VN.Items[x.id] : x;
            const c = el('button', 'tr-good' + (want.has(i) ? ' on' : ''));
            c.innerHTML = `<span class="ic">${VN.Icons[it.icon]}</span><span class="nm">${esc(it.name)}${x.qty > 1 ? ` <small>×${x.qty}</small>` : ''}<em>${esc(it.desc || '')}</em></span><b class="v">${price(x)}</b>`;
            c.addEventListener('click', (e) => { e.stopPropagation(); want.has(i) ? want.delete(i) : want.add(i); VN.Audio.sfx('click'); render(); });
            his.appendChild(c);
          });
          const off = [...offer].reduce((a, key) => a + this.worth(m, key.split('#')[0]), 0);
          const pr = [...want].reduce((a, i) => a + price(stock[i]), 0);
          wrap.querySelector('.s-off').textContent = Math.round(off * 10) / 10;
          wrap.querySelector('.s-price').textContent = pr;
          const tilt = pr || off ? Math.max(-14, Math.min(14, (pr - off) * 2)) : 0;
          wrap.querySelector('.beam').style.transform = `rotate(${-tilt}deg)`;
          const v = wrap.querySelector('.tr-verdict');
          const ok = want.size && off >= pr;
          v.className = 'tr-verdict ' + (ok ? 'ok' : want.size ? 'bad' : '');
          v.textContent = !want.size ? 'Выбери, что хочешь получить' : ok ? (off - pr >= 2 ? `Переплата ${Math.round((off - pr) * 10) / 10} — сдачи не будет` : 'Весы уравновешены') : `Не хватает ${Math.round((pr - off) * 10) / 10}`;
          wrap.querySelector('.tr-deal').disabled = !ok;
          wrap.querySelector('.tr-hag').disabled = haggled;
        };

        wrap.querySelector('.tr-hag').addEventListener('click', async (e) => {
          e.stopPropagation();
          if (haggled) return;
          haggled = true;
          const ok = await VN.Checks.run({ stat: 'nrv', dc: m.haggleDc, label: 'Сбить цену' });
          haggle = ok ? 0.75 : 1.25;
          if (!ok) VN.State.addRel(m.char, -1, true);
          wrap.querySelector('.tr-quote').textContent = `«${ok ? m.lines.win : m.lines.lose}»`;
          render();
        });
        wrap.querySelector('.tr-deal').addEventListener('click', (e) => {
          e.stopPropagation();
          const counts = {};
          [...offer].forEach((key) => { const id = key.split('#')[0]; counts[id] = (counts[id] || 0) + 1; });
          Object.entries(counts).forEach(([id, n]) => { VN.State.take(id, n, true); S.flags[`sold_${id}_${mid}`] = true; });
          [...want].forEach((i) => {
            const x = stock[i];
            x.qty--;
            if (x.id) VN.State.give(x.id, 1);
            else { VN.State.set(x.flag, true); VN.Toast.show(`<small>СДЕЛКА</small><b>${esc(x.name)}</b>`, 'item', VN.Icons[x.icon]); }
          });
          S.flags['traded_' + mid] = (S.flags['traded_' + mid] || 0) + 1;
          offer.clear(); want.clear();
          VN.Audio.sfx('stamp');
          wrap.querySelector('.tr-quote').textContent = `«${pick(m.lines.deal)}»`;
          render();
        });
        render();
      });
    },
  };

  VN.Trade = Trade;
})();
