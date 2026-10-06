/* ==========================================================================
   Точка входа: инициализация модулей, масштабирование, ввод.
   ========================================================================== */
(function () {
  'use strict';
  const VN = window.VN;

  function boot() {
    VN.fit();
    window.addEventListener('resize', VN.fit);

    VN.Backdrop.init(document.getElementById('bg'));
    VN.Stage.init(document.getElementById('sprites'));
    VN.Dialogue.init();
    VN.HUD.init();

    // первый жест пользователя включает звук (политика автоплея браузеров)
    const unlock = () => { VN.Audio.init(); window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);

    // клик по сцене = «дальше»
    document.getElementById('game').addEventListener('click', (e) => {
      if (e.target.closest('[data-ui], button, .modal, .screen, .check, .combat, #choices.open')) return;
      if (VN.mode.uiHidden) { toggleUI(); return; }
      if (VN.mode.skip) { VN.mode.skip = false; VN.HUD.update(); }
      VN.Input.advance();
    });
    // правый клик — спрятать интерфейс (классика ВН)
    document.getElementById('game').addEventListener('contextmenu', (e) => { e.preventDefault(); toggleUI(); });
    // колесо вверх — журнал
    document.getElementById('game').addEventListener('wheel', (e) => {
      if (e.deltaY < -20 && !VN.Input.modal && VN.Runner.scene) VN.Backlog.open();
    }, { passive: true });

    window.addEventListener('keydown', (e) => {
      if (e.repeat && e.code !== 'ControlLeft') return;
      const inGame = !!VN.Runner.scene && !document.querySelector('.title-screen');
      if (e.code === 'Escape') {
        if (document.querySelector('.check')) return; // идёт проверка — сперва бросок
        if (VN.Modal.top()) { VN.Modal.close(); return; }
        if (inGame && !VN.Input.modal) VN.Saves.open();
        return;
      }
      if (VN.Input.modal) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (VN.mode.uiHidden) { toggleUI(); return; }
        VN.Input.advance();
        return;
      }
      if (!inGame) return;
      const map = { KeyI: 'inv', KeyB: 'board', KeyL: 'log', KeyA: 'auto', KeyS: 'skip', KeyM: 'muteKey' };
      if (map[e.code]) { VN.HUD.action(map[e.code]); return; }
      if (e.code === 'KeyH') toggleUI();
    });

    splash();
  }

  /** Заставка «Нажмите, чтобы начать»: браузер даёт включить звук только после жеста игрока,
      поэтому первый клик — здесь, и главное меню открывается уже с музыкой. */
  function splash() {
    const s = VN.util.el('div', 'splash');
    s.innerHTML = `
      <div class="sp-kicker">ПОРТ-ВЕТРОВ · 31.12</div>
      <div class="sp-logo"><span class="sp-a">ПОСЛЕДНЯЯ</span><span class="sp-b">НОЧЬ ГОДА</span></div>
      <button class="sp-start">НАЖМИТЕ, ЧТОБЫ НАЧАТЬ</button>
      <div class="sp-hint">лучше в наушниках · звук можно настроить в меню</div>`;
    document.getElementById('game').appendChild(s);
    requestAnimationFrame(() => s.classList.add('in'));
    let done = false;
    const go = (e) => {
      if (done) return;
      done = true;
      if (e) { e.preventDefault && e.preventDefault(); e.stopPropagation && e.stopPropagation(); }
      window.removeEventListener('keydown', go, true);
      VN.Audio.init();
      VN.Audio.sfx('select');
      s.classList.add('out');
      setTimeout(() => s.remove(), 900);
      VN.Title.show();
    };
    s.addEventListener('click', go);
    window.addEventListener('keydown', go, true);
  }

  function toggleUI() {
    VN.mode.uiHidden = !VN.mode.uiHidden;
    document.getElementById('game').classList.toggle('ui-hidden', VN.mode.uiHidden);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
