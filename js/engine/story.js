/* ==========================================================================
   Реестр сцен и компилятор сценарного DSL.
   ---------------------------------------------------------------------------
   Сценарий пишется как массив команд-объектов (см. js/story/*.js).
   Вложенные блоки (if/then/else, варианты выбора, исходы проверок и боёв)
   компилируются в ПЛОСКИЙ список с метками и переходами. Благодаря этому
   позиция в сцене — просто индекс, и сохранение/загрузка работают
   в любой точке, даже внутри ветки.
   ========================================================================== */
(function () {
  'use strict';
  const VN = window.VN;

  const scenes = {};
  let uid = 0;

  /** { kir: 'текст', as: '…' } → { say: 'kir', text: '…', as: '…' } */
  function normalize(raw) {
    if (typeof raw !== 'object' || raw.say) return raw;
    for (const k of Object.keys(raw)) {
      if (VN.Characters[k]) {
        const cmd = Object.assign({}, raw, { say: k, text: raw[k] });
        delete cmd[k];
        return cmd;
      }
    }
    return raw;
  }

  function compile(list, out, labels) {
    for (const r of list) {
      const cmd = normalize(r);

      if (cmd.label) { labels[cmd.label] = out.length; continue; }

      if ('if' in cmd) {
        const elseL = '__else' + uid++, endL = '__end' + uid++;
        out.push({ op: 'jif', cond: cmd.if, to: elseL });
        compile(cmd.then || [], out, labels);
        out.push({ op: 'jmp', to: endL });
        labels[elseL] = out.length;
        compile(cmd.else || [], out, labels);
        labels[endL] = out.length;
        continue;
      }

      if (cmd.choice) {
        const endL = '__cend' + uid++;
        const node = { op: 'choice', id: 'c' + uid++, options: [], timer: cmd.timer, prompt: cmd.prompt };
        out.push(node);
        const blocks = [];
        cmd.choice.forEach((o) => {
          const opt = Object.assign({}, o);
          delete opt.do; delete opt.pass; delete opt.fail;
          if (o.check) {
            opt.passL = '__p' + uid++; opt.failL = '__f' + uid++;
            blocks.push([opt.passL, o.pass || []], [opt.failL, o.fail || []]);
          } else {
            opt.doL = '__d' + uid++;
            blocks.push([opt.doL, o.do || []]);
          }
          node.options.push(opt);
        });
        if (cmd.timeout) { node.timeoutL = '__t' + uid++; blocks.push([node.timeoutL, cmd.timeout]); }
        for (const [L, body] of blocks) {
          labels[L] = out.length;
          compile(body, out, labels);
          out.push({ op: 'jmp', to: endL });
        }
        labels[endL] = out.length;
        continue;
      }

      if (cmd.check) {
        const passL = '__p' + uid++, failL = '__f' + uid++, endL = '__e' + uid++;
        out.push({ op: 'check', check: cmd.check, passL, failL });
        labels[passL] = out.length; compile(cmd.pass || [], out, labels); out.push({ op: 'jmp', to: endL });
        labels[failL] = out.length; compile(cmd.fail || [], out, labels);
        labels[endL] = out.length;
        continue;
      }

      if (cmd.combat) {
        const L = { win: '__w' + uid++, lose: '__l' + uid++, fled: '__r' + uid++ }, endL = '__e' + uid++;
        out.push({ op: 'combat', enemy: cmd.combat, flee: !!cmd.flee, opts: cmd.opts, labels: L });
        ['win', 'lose', 'fled'].forEach((k) => {
          labels[L[k]] = out.length;
          compile(cmd[k] || (k === 'fled' ? cmd.win || [] : []), out, labels);
          out.push({ op: 'jmp', to: endL });
        });
        labels[endL] = out.length;
        continue;
      }

      if (cmd.trade) {
        const okL = '__o' + uid++, noL = '__n' + uid++, endL = '__e' + uid++;
        out.push({ op: 'trade', trade: cmd.trade, okL, noL });
        labels[okL] = out.length; compile(cmd.trade.do || [], out, labels); out.push({ op: 'jmp', to: endL });
        labels[noL] = out.length; compile(cmd.trade.cancel || [], out, labels);
        labels[endL] = out.length;
        continue;
      }

      out.push(cmd);
    }
    return out;
  }

  VN.Story = {
    /** Объявить сцену. meta: { title, block, loc, board:{x,y}, script:[…] } */
    scene(id, meta) {
      scenes[id] = Object.assign({ id }, meta, { compiled: null, labels: null });
    },
    get(id) {
      const s = scenes[id];
      if (s && !s.compiled) {
        s.labels = {};
        s.compiled = compile(s.script, [], s.labels);
      }
      return s;
    },
    /** Сцены-блоки акта (для доски улик). Несколько сцен могут делить один блок — это варианты. */
    blocks(act) {
      return Object.values(scenes).filter((s) => s.block && (act == null || (s.act || 0) === act)).sort((a, b) => a.block - b.block);
    },
    all() { return scenes; },
  };
})();
