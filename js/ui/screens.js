/* ==========================================================================
   Полноэкранные экраны:
     Title     — опознание: восемь силуэтов у ростовой линейки
     Creation  — «Кем ты был?»: три досье-предыстории
     Loadout   — ящик комода: взять N предметов
     Ending    — карточка концовки
   ========================================================================== */
(function () {
  'use strict';
  const VN = window.VN;
  const { el, sleep, esc } = VN.util;

  /* ---------------- титульный экран ---------------- */
  const Title = {
    node: null,
    show() {
      VN.Dialogue.hide();
      VN.HUD.show(false);
      VN.Stage.clearInstant();
      VN.Fx.laser(false);
      VN.Backdrop.set('street');
      VN.Audio.combatMusic(false);
      VN.Audio.scene(VN.Locations.street);
      VN.Audio.music('title'); // своя тема главного меню
      if (this.node) this.node.remove();
      const t = (this.node = el('div', 'title-screen'));
      const cast = ['shilo', 'shef', 'grokh', 'kir', 'texas', 'kong', 'bugai', 'ded'];
      const hasSave = !!VN.State.peek('auto');
      const ends = Object.keys(VN.Meta.data.endings).length;
      t.innerHTML = `
        <div class="lineup">
          <div class="lineup-wall">${[210, 200, 190, 180, 170, 160, 150].map((n) => `<div class="hl"><span>${n}</span></div>`).join('')}</div>
          <div class="lineup-cast">${cast.map((id, i) => `
            <div class="suspect" style="--c:${VN.Characters[id].color};--i:${i}">
              <img src="${VN.Characters[id].sprite}" alt="" draggable="false">
              <div class="plate"><b>${i + 1}</b><span>${VN.Characters[id].short || VN.Characters[id].name}</span></div>
            </div>`).join('')}</div>
        </div>
        <div class="title-logo">
          <div class="tl-kicker">ПОРТ-ВЕТРОВ · 31.12 · 23:07</div>
          <h1><span class="tl-a">ПОСЛЕДНЯЯ</span><span class="tl-b">НОЧЬ ГОДА</span></h1>
          <div class="tl-sub">криминальная драма</div>
        </div>
        <div class="title-menu">
          <button data-a="new">НОВОЕ ДЕЛО</button>
          <button data-a="cont" ${hasSave ? '' : 'disabled'}>ПРОДОЛЖИТЬ</button>
          <button data-a="load">ЗАГРУЗИТЬ</button>
          <button data-a="board">КОНЦОВКИ <small>${ends}/${Object.keys(VN.Endings).length}</small></button>
        </div>
        <div class="title-foot">Пробел / клик — дальше · 1–9 — выбор · I — кейс · B — доска · L — журнал · A — авто · S — пропуск · H — скрыть UI</div>`;
      const tv = el('div', 'title-vol'); tv.appendChild(VN.volumeControl()); t.appendChild(tv);
      document.getElementById('game').appendChild(t);
      requestAnimationFrame(() => t.classList.add('in'));
      t.addEventListener('click', (e) => e.stopPropagation());
      // Секретные коды на титуле (по физическим клавишам — работают и в русской раскладке):
      //   test1 — сразу главу II за опера, test2 — за боксёра, test3 — за карманника.
      //   test4 / test5 / test6 — главу III за опера / боксёра / карманника со случайным прошлым.
      //   test7 / test8 / test9 — главу IV (финал) за опера / боксёра / карманника, прошлое случайное.
      let typed = '';
      const codes = { KeyT: 't', KeyE: 'e', KeyS: 's', Digit1: '1', Numpad1: '1', Digit2: '2', Numpad2: '2', Digit3: '3', Numpad3: '3', Digit4: '4', Numpad4: '4', Digit5: '5', Numpad5: '5', Digit6: '6', Numpad6: '6', Digit7: '7', Numpad7: '7', Digit8: '8', Numpad8: '8', Digit9: '9', Numpad9: '9' };
      const onCode = (ev) => {
        if (this.node !== t) { window.removeEventListener('keydown', onCode, true); return; }
        typed = (typed + (codes[ev.code] || '·')).slice(-5);
        const test4 = { test7: 'cop', test8: 'boxer', test9: 'thief' }[typed];
        if (test4) {
          window.removeEventListener('keydown', onCode, true);
          this.hide();
          const past = VN.TestPast4(test4);
          VN.mode.auto = VN.mode.skip = false;
          VN.Toast.show(`<small>ТЕСТ · ГЛАВА IV</small><b>${VN.Backgrounds[test4].name} · ${VN.Endings[past].title}</b>`, 'item', VN.Icons[VN.Backgrounds[test4].icon]);
          VN.Runner.start('a4_start', 0);
          return;
        }
        const test3 = { test4: 'cop', test5: 'boxer', test6: 'thief' }[typed];
        if (test3) {
          window.removeEventListener('keydown', onCode, true);
          this.hide();
          const past = VN.TestPast(test3);
          VN.mode.auto = VN.mode.skip = false;
          VN.Toast.show(`<small>ТЕСТ · ГЛАВА III</small><b>${VN.Backgrounds[test3].name} · ${VN.Endings[past].title}</b>`, 'item', VN.Icons[VN.Backgrounds[test3].icon]);
          VN.Runner.start('a3_start', 0);
          return;
        }
        const testBg = { test1: 'cop', test2: 'boxer', test3: 'thief' }[typed];
        if (testBg) {
          window.removeEventListener('keydown', onCode, true);
          this.hide();
          VN.State.reset();
          const B = VN.Backgrounds[testBg];
          Object.assign(VN.S, { background: testBg, stats: { ...B.stats }, hp: B.hp, maxHp: B.hp });
          VN.State.give(B.item, 1, true);
          VN.mode.auto = VN.mode.skip = false;
          VN.Toast.show(`<small>ТЕСТ</small><b>Глава II · ${B.name}</b>`, 'item', VN.Icons[B.icon]);
          VN.Runner.start('a2_start', 0);
        }
      };
      window.addEventListener('keydown', onCode, true);
      t.querySelectorAll('[data-a]').forEach((b) => {
        b.addEventListener('mouseenter', () => VN.Audio.sfx('hover'));
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          VN.Audio.init(); VN.Audio.sfx('select');
          const a = b.dataset.a;
          if (a === 'new') { this.hide(); VN.Runner.newGame(); }
          if (a === 'cont') { this.hide(); VN.Runner.loadSlot('auto'); }
          if (a === 'load') VN.Saves.open(true);
          if (a === 'act1') { this.hide(); VN.State.loadActStart(1); VN.mode.auto = VN.mode.skip = false; VN.Runner.start('a1_start', 0); }
          if (a === 'act2') { this.hide(); VN.State.loadActStart(2); VN.mode.auto = VN.mode.skip = false; VN.Runner.start('a2_start', 0); }
          if (a === 'act3') { this.hide(); VN.State.loadActStart(3); VN.mode.auto = VN.mode.skip = false; VN.Runner.start('a3_start', 0); }
          if (a === 'board') VN.Gallery.open();
        });
      });
    },
    hide() {
      const t = this.node; if (!t) return;
      this.node = null;
      t.classList.add('out');
      setTimeout(() => t.remove(), 900);
    },
  };

  /* ---------------- создание персонажа ---------------- */
  const Creation = {
    run() {
      return new Promise((resolve) => {
        const s = el('div', 'screen creation');
        s.innerHTML = `<div class="cr-head"><small>ЛИЧНОЕ ДЕЛО · КОРВИН Я.</small><h2>Восемь лет ты был опером. Два года назад жетон забрали. Кем ты стал?</h2></div><div class="cr-cards"></div>`;
        const cards = s.querySelector('.cr-cards');
        Object.entries(VN.Backgrounds).forEach(([id, b], i) => {
          const c = el('button', 'cr-card');
          c.style.setProperty('--d', i * 120 + 'ms');
          c.innerHTML = `
            <div class="cr-ic">${VN.Icons[b.icon]}</div>
            <div class="cr-name">${b.name}</div>
            <div class="cr-stats">${Object.entries(VN.State.STATS).map(([k, st]) => `<div style="--c:${st.color}"><span>${st.name}</span><b>${'<i></i>'.repeat(b.stats[k])}${'<i class="off"></i>'.repeat(3 - b.stats[k])}</b></div>`).join('')}</div>
            <p>${b.text}</p>
            ${(() => {
              const c = VN.State.combatStatsFor(id, b.stats, (x) => x === b.item);
              const cell = (k, v) => `<div><b>${v}</b><span>${k}</span></div>`;
              return `<div class="cr-sec">В БОЮ</div>
                <div class="cr-combat">${cell('кубы', c.dice)}${cell('перебросы', c.rerolls)}${cell('удар', '+' + c.atkBonus)}${cell('блок', '+' + c.blkBonus)}${cell('здоровье', b.hp)}</div>
                <div class="cr-perk">${b.perk}</div>
                <div class="cr-sec">ВНЕ БОЯ</div>
                <div class="cr-perk">${b.field}</div>`;
            })()}
            <div class="cr-stamp">ПРИНЯТО</div>`;
          c.addEventListener('mouseenter', () => VN.Audio.sfx('hover'));
          c.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (s.dataset.done) return; s.dataset.done = 1;
            c.classList.add('chosen'); s.classList.add('decided');
            VN.Audio.sfx('stamp');
            const S = VN.S;
            S.background = id; S.stats = { ...b.stats }; S.hp = S.maxHp = b.hp;
            VN.State.give(b.item, 1, true);
            VN.bus.emit('state');
            await sleep(1300);
            s.classList.add('out'); await sleep(500); s.remove(); VN.Input.modal--;
            VN.Toast.show(`<small>ПОЛУЧЕНО</small><b>${VN.Items[b.item].name}</b>`, 'item', VN.Icons[VN.Items[b.item].icon]);
            resolve(id);
          });
          cards.appendChild(c);
        });
        VN.Input.modal++;
        document.getElementById('overlay').appendChild(s);
        requestAnimationFrame(() => s.classList.add('in'));
      });
    },
  };

  /* ---------------- ящик комода ---------------- */
  const Loadout = {
    run({ count, options }) {
      return new Promise((resolve) => {
        const chosen = new Set();
        const s = el('div', 'screen loadout');
        s.innerHTML = `<div class="cr-head"><small>ЯЩИК КОМОДА</small><h2>Карманов — два. Что берёшь?</h2></div><div class="lo-items"></div><button class="btn btn-acid lo-go" disabled>ВЗЯТЬ <span>0/${count}</span></button>`;
        const box = s.querySelector('.lo-items'), go = s.querySelector('.lo-go');
        options.forEach((id, i) => {
          const it = VN.Items[id];
          const extra = it.bundle ? Object.entries(it.bundle).map(([b, n]) => ` + ${VN.Items[b].name} ×${n}`).join('') : it.qty ? ` ×${it.qty}` : '';
          const c = el('button', 'lo-item');
          c.style.setProperty('--d', i * 90 + 'ms');
          c.innerHTML = `<div class="lo-ic">${VN.Icons[it.icon]}</div><b>${it.name}${extra}</b><p>${it.desc}</p><i class="lo-check"></i>`;
          c.addEventListener('click', (e) => {
            e.stopPropagation();
            if (chosen.has(id)) chosen.delete(id);
            else if (chosen.size < count) chosen.add(id);
            else { VN.Audio.sfx('lock'); return; }
            VN.Audio.sfx('click');
            c.classList.toggle('on', chosen.has(id));
            go.disabled = chosen.size !== count;
            go.querySelector('span').textContent = `${chosen.size}/${count}`;
          });
          box.appendChild(c);
        });
        go.addEventListener('click', async (e) => {
          e.stopPropagation();
          VN.Audio.sfx('select');
          s.classList.add('out'); await sleep(500); s.remove(); VN.Input.modal--;
          for (const id of chosen) {
            const it = VN.Items[id];
            VN.State.give(id, it.qty || 1);
            if (it.bundle) Object.entries(it.bundle).forEach(([b, n]) => VN.State.give(b, n));
            await sleep(250);
          }
          resolve([...chosen]);
        });
        VN.Input.modal++;
        document.getElementById('overlay').appendChild(s);
        requestAnimationFrame(() => s.classList.add('in'));
      });
    },
  };

  /* ---------------- галерея концовок (титул) ---------------- */
  const GALLERY_TABS = [[0, 'ПРОЛОГ'], [1, 'ГЛАВА I'], [2, 'ГЛАВА II'], [3, 'ГЛАВА III'], [4, 'ГЛАВА IV']];
  VN.Gallery = {
    open(tab) {
      const m = VN.Modal.open('gallery', 'КОНЦОВКИ', 'Выбери главу: открытые концовки — и те, что ещё впереди.');
      let cur = tab != null ? tab : 0;
      const render = () => {
        const list = Object.entries(VN.Endings).filter(([, e]) => (e.act || 0) === cur);
        const got = list.filter(([k]) => VN.Meta.data.endings[k]).length;
        m.body.innerHTML = `<div class="gal-tabs">${GALLERY_TABS.map(([n, t]) => {
          const all = Object.entries(VN.Endings).filter(([, e]) => (e.act || 0) === n);
          const g = all.filter(([k]) => VN.Meta.data.endings[k]).length;
          return `<button class="gal-tab${n === cur ? ' on' : ''}" data-t="${n}">${t} <small>${g}/${all.length}</small></button>`;
        }).join('')}</div>
          <p class="gal-count">Открыто: <b>${got}</b> из ${list.length}</p>
          <div class="ends gal-ends">${list.map(([id, e]) => {
            const ok = VN.Meta.data.endings[id];
            return `<div class="end ${ok ? 'got' : ''}" style="--c:${e.color}"><b>${ok ? e.title : '? ? ?'}</b><span>${ok ? e.sub : 'ещё не открыта'}</span></div>`;
          }).join('')}</div>`;
        m.body.querySelectorAll('.gal-tab').forEach((b) => b.addEventListener('click', (ev) => { ev.stopPropagation(); VN.Audio.sfx('click'); cur = +b.dataset.t; render(); }));
      };
      render();
    },
  };

  /* ---------------- концовка ---------------- */
  const Ending = {
    show(id) {
      return new Promise((resolve) => {
        const e = VN.Endings[id];
        const first = !VN.Meta.data.endings[id];
        VN.Meta.unlock(id);
        VN.Dialogue.hide();
        VN.HUD.show(false);
        VN.Audio.combatMusic(false);
        const S = VN.S;
        const act = e.act || 0;
        const actBlocks = VN.Story.blocks(act);
        const total = new Set(actBlocks.map((b) => b.block)).size;
        const blocks = new Set(S.path.map((p) => VN.Story.get(p)).filter((sc) => sc && sc.block && (sc.act || 0) === act).map((sc) => sc.block)).size;
        const actEnds = Object.entries(VN.Endings).filter(([, x]) => (x.act || 0) === act);
        const gotEnds = actEnds.filter(([k]) => VN.Meta.data.endings[k]).length;
        if (e.next) { S.flags[act ? 'act' + act + 'Ending' : 'prologueEnding'] = id; VN.State.saveActStart(act + 1); }
        const ACTN = ['ПРОЛОГА', 'ГЛАВЫ I', 'ГЛАВЫ II', 'ГЛАВЫ III', 'ИСТОРИИ'], NEXT = { a1_start: 'ГЛАВА I · «ЧЁРНАЯ БУХГАЛТЕРИЯ»', a2_start: 'ГЛАВА II · «ЧТО БЫЛО ДО»', a3_start: 'ГЛАВА III · «НАВЕРХУ»', a4_start: 'ГЛАВА IV · «САЛЬДО»' };
        const actClues = Object.keys(VN.Clues).filter((k) => (VN.Clues[k].act || 0) === act);
        const clues = actClues.filter((k) => S.flags[k]).length;
        const s = el('div', 'screen ending');
        s.style.setProperty('--c', e.color);
        s.innerHTML = `
          <div class="en-kicker">${act === 2 ? 'КОНЕЦ ВОСПОМИНАНИЯ' : 'КОНЕЦ ' + ACTN[act]}${first ? ' · <b>НОВАЯ КОНЦОВКА</b>' : ''}</div>
          <div class="en-title">${e.title}</div>
          <div class="en-sub">${e.sub}</div>
          <div class="en-stats">
            ${S.clock && S.clock.still ? '' : `<div><b>${VN.State.clock()}</b><span>время</span></div>`}
            <div><b>${blocks}/${total}</b><span>локаций посещено</span></div>
            <div><b>${clues}/${actClues.length}</b><span>улик</span></div>
            <div><b>${gotEnds}/${actEnds.length}</b><span>концовок ${act === 4 ? 'истории' : act ? 'главы' : 'пролога'}</span></div>
          </div>
          <div class="en-next">${e.next ? 'Решения этой ночи пойдут с тобой дальше' : act === 4 ? 'Сальдо подведено. Так закончилась история Дэна Корвина — из всех, что могли случиться, эта' : 'Этот путь обрывается здесь'}</div>
          <div class="en-btns">${e.next ? `<button class="btn btn-acid" data-a="next">${NEXT[e.next] || 'ДАЛЬШЕ'} →</button>` : ''}<button class="btn ${e.next ? 'btn-ghost' : 'btn-acid'}" data-a="new">НОВОЕ ДЕЛО</button><button class="btn btn-ghost" data-a="board">ДОСКА УЛИК</button><button class="btn btn-ghost" data-a="menu">ГЛАВНОЕ МЕНЮ</button></div>`;
        s.addEventListener('click', (ev) => ev.stopPropagation());
        s.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', (ev) => {
          ev.stopPropagation();
          VN.Audio.sfx('select');
          const a = b.dataset.a;
          if (a === 'board') { VN.Board.open(); return; }
          s.classList.add('out'); setTimeout(() => s.remove(), 600);
          if (a === 'new') VN.Runner.newGame();
          if (a === 'next') VN.Runner.start(e.next, 0);
          if (a === 'menu') VN.Title.show();
          resolve(a);
        }));
        document.getElementById('overlay').appendChild(s);
        VN.Audio.sfx('impact');
        requestAnimationFrame(() => s.classList.add('in'));
      });
    },
  };

  VN.Title = Title;
  VN.Creation = Creation;
  VN.Loadout = Loadout;
  VN.Ending = Ending;
})();
