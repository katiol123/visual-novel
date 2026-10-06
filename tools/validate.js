/* Проверка сценария: переходы, метки, персонажи, враги, предметы, локации.
   node tools/validate.js */
const fs = require('fs'), vm = require('vm'), path = require('path');
const G = path.join(__dirname, '..', 'js') + '/';
const ctx = { console, localStorage: { getItem: () => null, setItem() {} }, setTimeout, Math, document: { fonts: null } };
ctx.window = ctx; vm.createContext(ctx);
const files = ['core/namespace.js', 'core/state.js', 'data/characters.js', 'data/items.js', 'data/enemies.js', 'data/codex.js', 'data/combat-mods.js', 'data/merchants.js',
  'render/backdrop.js', 'data/locations.js', 'data/locations-act1.js', 'systems/combat-rules.js', 'engine/story.js',
  'story/prologue.js', 'story/endings.js', 'story/act1.js', 'story/act1-mid.js', 'story/act1-mid2.js', 'story/act1-end.js', 'story/act2.js', 'story/act2-cop.js', 'story/act2-boxer.js', 'story/act2-thief.js', 'story/act3.js', 'story/act3-mid.js', 'story/act3-end.js'];
for (const f of files) vm.runInContext(fs.readFileSync(G + f, 'utf8'), ctx, { filename: f });
const VN = ctx.VN, errs = [];
const scenes = VN.Story.all();
const chk = (cond, msg) => { if (!cond) errs.push(msg); };
for (const id of Object.keys(scenes)) {
  const sc = VN.Story.get(id);
  sc.compiled.forEach((c, i) => {
    const at = `${id}#${i}`;
    if (c.goto && typeof c.goto === 'string') chk(scenes[c.goto], `${at}: goto → нет сцены «${c.goto}»`);
    for (const k of ['jump', 'to']) if (c[k]) chk(sc.labels[c[k]] != null, `${at}: метка «${c[k]}» не найдена`);
    if (c.op === 'choice') c.options.forEach((o) => {
      for (const L of [o.doL, o.passL, o.failL]) if (L) chk(sc.labels[L] != null, `${at}: метка варианта`);
      (Array.isArray(o.need) ? o.need : o.need ? [o.need] : []).forEach((n) => chk(VN.Items[n], `${at}: need «${n}» — нет предмета`));
      if (o.check && typeof o.check !== 'function') chk(VN.State.STATS[o.check.stat], `${at}: стат ${o.check.stat}`);
    });
    if (c.say) chk(VN.Characters[c.say], `${at}: персонаж «${c.say}»`);
    if (c.show) chk(VN.Characters[c.show] && VN.Characters[c.show].sprite, `${at}: show «${c.show}» без спрайта`);
    if (c.hide) chk(VN.Characters[c.hide], `${at}: hide «${c.hide}»`);
    if (c.op === 'combat') chk(VN.Enemies[c.enemy], `${at}: враг «${c.enemy}»`);
    if (c.give) { const g = Array.isArray(c.give) ? c.give[0] : c.give; chk(VN.Items[g], `${at}: give «${g}»`); }
    if (c.take) { const g = Array.isArray(c.take) ? c.take[0] : c.take; chk(VN.Items[g], `${at}: take «${g}»`); }
    if (c.bg && typeof c.bg !== 'function') chk(VN.Locations[c.bg], `${at}: локация «${c.bg}»`);
    if (c.shop && typeof c.shop === 'string') chk(VN.Merchants[c.shop], `${at}: торговец «${c.shop}»`);
    if (c.ending) chk(VN.Endings[c.ending], `${at}: концовка «${c.ending}»`);
    if (c.rel) Object.keys(c.rel).forEach((k) => chk(VN.Characters[k], `${at}: rel «${k}»`));
  });
  if (sc.loc) chk(VN.Locations[sc.loc], `${id}: loc «${sc.loc}»`);
}
for (const [id, e] of Object.entries(VN.Enemies)) (e.passives || []).forEach((p) => chk(['steal', 'poison', 'reinforce', 'steam', 'reads', 'enrage', 'secondWind', 'doubleBook', 'longRange', 'thorns', 'drunk', 'cleaver', 'audit', 'cold', 'bolt', 'getaway', 'clinch', 'sway', 'sedate', 'lastWord', 'verdict', 'thirdRound', 'protocol'].includes(p.id), `враг ${id}: пассивка ${p.id}`));
const ends = Object.keys(VN.Endings), used = new Set();
for (const id of Object.keys(scenes)) VN.Story.get(id).compiled.forEach((c) => c.ending && used.add(c.ending));
ends.forEach((e) => chk(used.has(e), `концовка «${e}» нигде не вызывается`));
const blocks = (a) => new Set(VN.Story.blocks(a).map((s) => s.block)).size;
console.log(`Сцен: ${Object.keys(scenes).length} · блоков пролога: ${blocks(0)} · главы I: ${blocks(1)} · главы II: ${blocks(2)} · главы III: ${blocks(3)} · концовок: ${ends.length}`);
console.log(errs.length ? 'ОШИБКИ:\n' + errs.join('\n') : 'Ошибок нет.');
process.exit(errs.length ? 1 : 0);
