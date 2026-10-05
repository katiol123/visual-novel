/* ==========================================================================
   Доска улик: 10 блоков пролога как полароиды на пробке, красная нить
   по пройденному пути, найденные улики-стикеры и открытые концовки.
   Наглядная карта нелинейности: видно, сколько дорог ещё не пройдено.
   ========================================================================== */
(function () {
  'use strict';
  const VN = window.VN;
  const { el, esc } = VN.util;
  const thumbs = {};

  function thumb(locId) {
    if (thumbs[locId]) return thumbs[locId];
    const loc = VN.Locations[locId];
    if (!loc) return '';
    const c = document.createElement('canvas');
    c.width = 384; c.height = 216;
    const ctx = c.getContext('2d');
    ctx.scale(0.2, 0.2);
    loc.paint && loc.paint(ctx, VN.util.seeded(loc.seed || 7), VN.Paint);
    (loc.signs || []).forEach((s) => VN.Paint.neon(ctx, s.text, s.x, s.y, s.size, s.color, 0.95, s.font));
    return (thumbs[locId] = c.toDataURL('image/jpeg', 0.8));
  }

  const Board = {
    open() {
      const S = VN.S;
      const m = VN.Modal.open('board', 'ДОСКА УЛИК', 'Каждая нить — твой выбор. Белые пятна — дороги, которыми ты не пошёл.');
      const wrap = el('div', 'board-wrap');
      const cork = el('div', 'cork');
      const act = S.act || 0;
      const visited = new Set(S.path);
      // варианты одного блока (например, разные начала главы) — одна карточка
      const groups = [];
      VN.Story.blocks(act).forEach((sc) => {
        let g = groups.find((x) => x.block === sc.block);
        if (!g) groups.push((g = { block: sc.block, board: sc.board, loc: sc.loc, title: null, seen: false }));
        if (visited.has(sc.id)) { g.seen = true; g.title = sc.title; g.loc = sc.loc; }
      });
      const scenes = groups;

      // нить
      const order = S.path.filter((id) => { const sc = VN.Story.get(id); return sc && sc.block && (sc.act || 0) === act; });
      const pts = order.map((id) => groups.find((g) => g.block === VN.Story.get(id).block).board);
      const svg = `<svg class="thread" viewBox="0 0 1200 720">${pts.slice(1).map((p, i) => {
        const a = pts[i], mx = (a.x + p.x) / 2, my = Math.max(a.y, p.y) + 40;
        return `<path d="M${a.x} ${a.y - 88} Q${mx} ${my - 88} ${p.x} ${p.y - 88}" style="--d:${i * 120}ms"/>`;
      }).join('')}</svg>`;
      cork.innerHTML = svg;

      scenes.forEach((sc, i) => {
        const seen = sc.seen;
        const p = el('div', 'polaroid' + (seen ? ' seen' : ''));
        p.style.left = sc.board.x + 'px'; p.style.top = sc.board.y + 'px';
        p.style.setProperty('--r', ((i * 37) % 11 - 5) + 'deg');
        p.style.setProperty('--d', i * 50 + 'ms');
        p.innerHTML = `<i class="pin"></i>
          <div class="pic">${seen ? `<img src="${thumb(sc.loc)}" alt="">` : '<span>?</span>'}</div>
          <div class="cap"><b>${sc.block}.</b> ${seen ? esc(sc.title || '') : 'не раскрыто'}</div>`;
        cork.appendChild(p);
      });

      const side = el('div', 'board-side');
      const clues = Object.keys(VN.Clues).filter((k) => S.flags[k]);
      side.innerHTML = `
        <h3>УЛИКИ <small>${clues.length}/${Object.keys(VN.Clues).length}</small></h3>
        <div class="notes">${clues.length ? clues.map((k, i) => `<div class="note" style="--r:${(i % 3) - 1}deg"><b>${VN.Clues[k].title}</b>${VN.Clues[k].text}</div>`).join('') : '<p class="muted">Пока пусто. Задавай вопросы.</p>'}</div>
        ${(() => {
          const met = Object.keys(S.met).filter((id) => VN.Characters[id]);
          if (!met.length || !act) return '';
          return `<h3>СВЯЗИ</h3><div class="rels">${met.map((id) => {
            const ch = VN.Characters[id], f = VN.State.friend(id), x = VN.State.foe(id);
            return `<div class="rel ${f ? 'f' : x ? 'x' : ''}" style="--c:${ch.color}"><b>${ch.short || ch.name}</b><span>${f ? 'друг' : x ? 'враг' : '?'}</span></div>`;
          }).join('')}</div>`;
        })()}
        <h3>КОНЦОВКИ ${act ? 'ГЛАВЫ I' : 'ПРОЛОГА'}</h3>
        <div class="ends">${Object.entries(VN.Endings).filter(([, e]) => (e.act || 0) === act).map(([id, e]) => {
          const got = VN.Meta.data.endings[id];
          return `<div class="end ${got ? 'got' : ''}" style="--c:${e.color}"><b>${got ? e.title : '? ? ?'}</b><span>${got ? e.sub : 'не открыта'}</span></div>`;
        }).join('')}</div>`;

      wrap.appendChild(cork); wrap.appendChild(side);
      m.body.appendChild(wrap);
    },
  };

  VN.Board = Board;
})();
