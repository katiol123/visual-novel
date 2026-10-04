/* ==========================================================================
   Сохранения: автосейв (перед каждым выбором) + 3 ручных слота.
   ========================================================================== */
(function () {
  'use strict';
  const VN = window.VN;
  const { el, esc } = VN.util;

  const Saves = {
    open(onlyLoad) {
      const m = VN.Modal.open('saves', onlyLoad ? 'ЗАГРУЗКА' : 'ЗАПИСЬ', 'Автосейв пишется перед каждым выбором');
      const grid = el('div', 'save-grid');
      ['auto', '1', '2', '3'].forEach((slot) => {
        const d = VN.State.peek(slot);
        const card = el('div', 'save-card' + (d ? '' : ' empty'));
        const date = d ? new Date(d.savedAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
        card.innerHTML = `
          <div class="sv-slot">${slot === 'auto' ? 'АВТО' : 'СЛОТ ' + slot}</div>
          ${d ? `<div class="sv-time">${VN.State.clock(d.time)}</div><div class="sv-scene">${esc(d.sceneTitle || '')}</div><div class="sv-meta">${(VN.Backgrounds[d.background] || {}).name || ''} · ${d.hp}/${d.maxHp} · ${date}</div>` : '<div class="sv-scene muted">пусто</div>'}
          <div class="sv-btns"></div>`;
        const btns = card.querySelector('.sv-btns');
        if (!onlyLoad && slot !== 'auto' && VN.Runner.canSave()) {
          const b = el('button', 'btn btn-ghost', 'ЗАПИСАТЬ');
          b.addEventListener('click', (e) => { e.stopPropagation(); VN.State.save(slot); VN.Audio.sfx('stamp'); m.close(); VN.Toast.show(`<b>Сохранено</b> · слот ${slot}`, 'time'); });
          btns.appendChild(b);
        }
        if (d) {
          const b = el('button', 'btn btn-acid', 'ЗАГРУЗИТЬ');
          b.addEventListener('click', (e) => { e.stopPropagation(); m.close(); VN.Runner.loadSlot(slot); });
          btns.appendChild(b);
        }
        grid.appendChild(card);
      });
      m.body.appendChild(grid);
      if (!onlyLoad) {
        const row = el('div', 'save-row');
        const t = el('button', 'btn btn-ghost', 'В ГЛАВНОЕ МЕНЮ');
        t.addEventListener('click', (e) => { e.stopPropagation(); m.close(); VN.Runner.stop(); VN.Title.show(); });
        const sp = el('button', 'btn btn-ghost', 'СКОРОСТЬ ТЕКСТА: ' + (VN.mode.textSpeed === 1 ? 'НОРМА' : VN.mode.textSpeed > 1 ? 'БЫСТРО' : 'МЕДЛЕННО'));
        sp.addEventListener('click', (e) => {
          e.stopPropagation();
          VN.mode.textSpeed = VN.mode.textSpeed === 1 ? 2 : VN.mode.textSpeed === 2 ? 0.6 : 1;
          sp.textContent = 'СКОРОСТЬ ТЕКСТА: ' + (VN.mode.textSpeed === 1 ? 'НОРМА' : VN.mode.textSpeed > 1 ? 'БЫСТРО' : 'МЕДЛЕННО');
        });
        row.appendChild(sp); row.appendChild(t);
        m.body.appendChild(row);
      }
    },
  };

  VN.Saves = Saves;
})();
