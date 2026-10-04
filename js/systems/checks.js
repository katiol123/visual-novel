/* ==========================================================================
   Проверка навыка: 2к6 + стат ≥ сложность.
   Игрок сам бросает кубы. «Змеиные глаза» (1-1) — всегда провал,
   «Две шестёрки» — всегда успех. Провал можно перебросить, отпив
   из фляжки (тратит глоток).
   ========================================================================== */
(function () {
  'use strict';
  const VN = window.VN;
  const { el, sleep } = VN.util;

  const Checks = {
    run({ stat, dc, label }) {
      return new Promise((resolve) => {
        const st = VN.State.STATS[stat];
        const val = VN.S.stats[stat];
        const pct = VN.Choices.chance(val, dc);
        const m = el('div', 'check');
        m.style.setProperty('--c', st.color);
        m.innerHTML = `
          <div class="ck-card">
            <div class="ck-kicker">ПРОВЕРКА</div>
            <div class="ck-stat">${st.name}</div>
            <div class="ck-label">${label || ''}</div>
            <div class="ck-row">
              <div class="ck-dice"></div>
              <div class="ck-op">+</div>
              <div class="ck-mod"><b>${val}</b><span>${st.short}</span></div>
              <div class="ck-op">≥</div>
              <div class="ck-dc"><b>${dc}</b><span>сложность</span></div>
            </div>
            <div class="ck-total"><span class="ck-sum">—</span><em>шанс ${pct}%</em></div>
            <div class="ck-result"></div>
            <div class="ck-btns"><button class="btn btn-acid ck-roll">БРОСИТЬ КУБЫ <small>[пробел]</small></button></div>
          </div>`;
        const diceBox = m.querySelector('.ck-dice');
        const dice = [VN.Dice.make(VN.Dice.d6(), 'bone'), VN.Dice.make(VN.Dice.d6(), 'bone')];
        dice.forEach((d) => diceBox.appendChild(d.el));
        const btns = m.querySelector('.ck-btns');
        const sumEl = m.querySelector('.ck-sum');
        const resEl = m.querySelector('.ck-result');
        let primary = m.querySelector('.ck-roll');
        let busy = false;

        const onKey = (e) => {
          if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); e.stopPropagation(); primary && !primary.disabled && primary.click(); }
        };
        window.addEventListener('keydown', onKey, true);
        m.addEventListener('click', (e) => e.stopPropagation());

        const close = async (ok) => {
          window.removeEventListener('keydown', onKey, true);
          m.classList.add('out');
          await sleep(400);
          m.remove();
          VN.Input.modal--;
          resolve(ok);
        };

        const roll = async () => {
          if (busy) return; busy = true;
          btns.innerHTML = '';
          resEl.className = 'ck-result'; resEl.innerHTML = '';
          m.classList.remove('ok', 'bad');
          VN.Audio.sfx('dice');
          const a = VN.Dice.d6(), b = VN.Dice.d6();
          await Promise.all([dice[0].roll(a, { from: { x: -260, y: 160 } }), dice[1].roll(b, { from: { x: 260, y: 160 } })]);
          // счётчик суммы
          const total = a + b + val;
          for (let i = 0; i <= total; i++) { sumEl.textContent = i; await sleep(24); }
          const snake = a === 1 && b === 1, boxcars = a === 6 && b === 6;
          const ok = !snake && (boxcars || total >= dc);
          const special = snake ? 'ЗМЕИНЫЕ ГЛАЗА' : boxcars ? 'ДВЕ ШЕСТЁРКИ' : '';
          resEl.innerHTML = `<span class="stamp">${ok ? 'УСПЕХ' : 'ПРОВАЛ'}</span>${special ? `<em>${special}</em>` : ''}`;
          resEl.classList.add('show', ok ? 'ok' : 'bad');
          m.classList.add(ok ? 'ok' : 'bad');
          VN.Audio.sfx('stamp');
          setTimeout(() => VN.Audio.sfx(ok ? 'success' : 'fail'), 120);
          if (!ok) VN.Fx.shake(8);
          busy = false;
          if (!ok && VN.State.has('flask')) {
            const re = el('button', 'btn btn-ghost', `ГЛОТОК ИЗ ФЛЯЖКИ — ПЕРЕБРОСИТЬ <small>(${VN.State.count('flask')})</small>`);
            re.addEventListener('click', () => { VN.State.take('flask', 1); roll(); });
            btns.appendChild(re);
          }
          const next = el('button', 'btn btn-acid', 'ДАЛЕЕ <small>[пробел]</small>');
          next.addEventListener('click', () => close(ok));
          btns.appendChild(next);
          primary = next;
          if (VN.mode.skip) setTimeout(() => close(ok), 600);
        };
        m.querySelector('.ck-roll').addEventListener('click', roll);

        VN.Input.modal++;
        document.getElementById('overlay').appendChild(m);
        VN.Audio.sfx('whoosh');
        requestAnimationFrame(() => m.classList.add('in'));
        if (VN.mode.skip) setTimeout(roll, 300);
      });
    },
  };

  VN.Checks = Checks;
})();
