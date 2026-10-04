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
      const map = { KeyI: 'inv', KeyB: 'board', KeyL: 'log', KeyA: 'auto', KeyS: 'skip', KeyM: 'mute' };
      if (map[e.code]) { VN.HUD.action(map[e.code]); return; }
      if (e.code === 'KeyH') toggleUI();
    });

    VN.Title.show();
  }

  function toggleUI() {
    VN.mode.uiHidden = !VN.mode.uiHidden;
    document.getElementById('game').classList.toggle('ui-hidden', VN.mode.uiHidden);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
