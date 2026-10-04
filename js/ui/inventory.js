/* ==========================================================================
   Кейс + досье Яна. Два режима:
     open()             — просмотр, применение лечилок вне боя
     select(filter, …)  — выбор предмета (обмен, взятка, предмет в бою)
   ========================================================================== */
(function () {
  'use strict';
  const VN = window.VN;
  const { el, esc } = VN.util;

  const KIND = { weapon: 'оружие', ammo: 'патроны', heal: 'лечение', combat: 'для боя', key: 'ключевой', trade: 'обмен' };

  const Inv = {
    open() { return this.render({ mode: 'view' }); },

    /** @returns {Promise<string|null>} */
    select(filter, title, sub) {
      return new Promise((resolve) => this.render({ mode: 'select', filter, title, sub, resolve }));
    },

    render(o) {
      const S = VN.S;
      const m = VN.Modal.open('inv', o.title || 'КЕЙС', o.sub || 'Всё, что при тебе. Наведи — прочитай. Клик — выбери.');
      let picked = null;
      if (o.mode === 'select') m.onClose = () => o.resolve(picked);

      const bg = VN.Backgrounds[S.background] || null;
      const left = el('div', 'inv-dossier');
      left.innerHTML = `
        <div class="inv-tag">ЛИЧНОЕ ДЕЛО</div>
        <div class="inv-name">ЯН КОРСАК</div>
        <div class="inv-bg">${bg ? bg.name : '—'}</div>
        <div class="inv-stats">${Object.entries(VN.State.STATS).map(([k, s]) => `
          <div class="inv-stat" style="--c:${s.color}"><span>${s.name}</span><b>${'<i></i>'.repeat(S.stats[k])}${'<i class="off"></i>'.repeat(Math.max(0, 3 - S.stats[k]))}</b><em>+${S.stats[k]}</em></div>`).join('')}
        </div>
        <div class="inv-hp"><span>ЗДОРОВЬЕ</span><div class="bar"><i style="width:${(S.hp / S.maxHp) * 100}%"></i></div><b>${S.hp}/${S.maxHp}</b></div>
        <div class="inv-perk">${bg ? bg.perk : ''}</div>
        <div class="inv-combat">${(() => { const c = VN.State.combatStats(); return `В бою: <b>${c.dice}</b> куба · <b>${c.rerolls}</b> переброс · удар <b>+${c.atkBonus}</b> · блок <b>+${c.blkBonus}</b>`; })()}</div>`;

      const right = el('div', 'inv-case');
      const grid = el('div', 'inv-grid');
      const detail = el('div', 'inv-detail', '<p class="muted">Выбери предмет.</p>');
      const ids = Object.keys(S.inv);
      const SLOTS = Math.max(12, ids.length);
      for (let i = 0; i < SLOTS; i++) {
        const id = ids[i];
        const cell = el('button', 'inv-cell' + (id ? '' : ' empty'));
        cell.setAttribute('data-ui', '');
        if (id) {
          const it = VN.Items[id];
          const ok = o.mode !== 'select' || !o.filter || o.filter(it, id);
          if (!ok) cell.classList.add('disabled');
          cell.innerHTML = `<span class="ic">${VN.Icons[it.icon] || ''}</span>${S.inv[id] > 1 ? `<span class="qty">×${S.inv[id]}</span>` : ''}<span class="kind k-${it.kind}"></span>`;
          const showDetail = () => {
            grid.querySelectorAll('.inv-cell').forEach((c) => c.classList.remove('sel'));
            cell.classList.add('sel');
            detail.innerHTML = `
              <div class="d-head"><span class="ic">${VN.Icons[it.icon]}</span><div><b>${esc(it.name)}</b><em>${KIND[it.kind] || ''}${S.inv[id] > 1 ? ' · ×' + S.inv[id] : ''}</em></div></div>
              <p>${esc(it.desc)}</p>`;
            if (o.mode === 'select' && ok) {
              const b = el('button', 'btn btn-acid', o.action || 'ОТДАТЬ');
              b.addEventListener('click', (e) => { e.stopPropagation(); picked = id; m.close(); });
              detail.appendChild(b);
            } else if (o.mode === 'view' && it.use && it.use.field && it.heal) {
              const b = el('button', 'btn btn-acid', `ИСПОЛЬЗОВАТЬ · +${it.heal}`);
              if (S.hp >= S.maxHp) { b.disabled = true; b.textContent = 'ЗДОРОВЬЕ ПОЛНОЕ'; }
              b.addEventListener('click', (e) => {
                e.stopPropagation();
                VN.State.take(id, 1, true); VN.State.heal(it.heal);
                m.close(); this.open();
              });
              detail.appendChild(b);
            }
          };
          cell.addEventListener('mouseenter', showDetail);
          cell.addEventListener('click', (e) => { e.stopPropagation(); showDetail(); VN.Audio.sfx('click'); });
        }
        cell.style.setProperty('--d', i * 25 + 'ms');
        grid.appendChild(cell);
      }
      right.appendChild(grid);
      right.appendChild(detail);
      if (o.mode === 'select') {
        const cancel = el('button', 'btn btn-ghost', 'ПЕРЕДУМАТЬ');
        cancel.addEventListener('click', (e) => { e.stopPropagation(); m.close(); });
        right.appendChild(cancel);
      }
      const wrap = el('div', 'inv-wrap');
      wrap.appendChild(left); wrap.appendChild(right);
      m.body.appendChild(wrap);
      return m;
    },
  };

  VN.Inventory = Inv;
})();
