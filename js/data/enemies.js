/* ==========================================================================
   Противники для боя на кубах.
   Каждый ход противник открыто бросает кубы — «намерение».
   type: attack — урон = сумма + bonus
         guard  — блок = сумма + bonus (поглощает твой УДАР в этом раунде)
         charge — ничего не делает, но следующий ход = move.next
         barrage — как attack, но кубы 1–2 считаются промахом
   onHit: эффект, если удар прошёл (bleed / burn / cuff)
   hidden: сколько кубов атаки противник прячет «рубашкой вверх»

   Баланс откалиброван симуляцией (node tools/balance.js; бот, полное ХП,
   1 аптечка), доля поражений по уровню опасности: 1 ≈ 0% (теряет ~10 ХП),
   2 ≈ 15%, 3 ≈ 30%, 4 ≈ 45%, 5 ≈ 60%.
   ========================================================================== */
(function () {
  'use strict';
  const SP = 'assets/sprites/';

  window.VN.Enemies = {
    shilo: {
      name: '«ШИЛО»', sprite: SP + 'shilo.png', color: '#8dff6a',
      hp: 46, hidden: 1, armor: 0,
      moves: [
        { name: 'Двойной порез', type: 'attack', dice: 2, bonus: 4, w: 3, pairEffect: 'bleed', desc: 'Пара на кубах → кровотечение.' },
        { name: 'Фьюи-и-ить!', type: 'attack', dice: 1, bonus: 7, w: 2, desc: 'Свист — и выпад.' },
        { name: 'Присел в тени', type: 'guard', dice: 2, w: 1, desc: 'Блокирует твой удар.' },
      ],
      taunts: ['Фьють.', 'Ботиночки-то какие…', 'Вжик-вжик. Слышишь?', 'Не дёргайся — будет ровнее.'],
      hurt: ['С-сука!', 'Ай!..', 'Ты чё?!'],
    },

    shef: {
      name: '«ШЕФ»', sprite: SP + 'shef.png', color: '#ffb02e',
      hp: 66, hidden: 1, armor: 0,
      moves: [
        { name: 'Шаурмомёт', type: 'attack', dice: 2, bonus: 6, w: 3, desc: 'Ствол в лаваше.' },
        { name: 'Огненный соус', type: 'attack', dice: 1, bonus: 5, w: 2, onHit: 'burn', desc: 'Попадание → ожог на 2 хода.' },
        { name: 'Прячется за вертелом', type: 'guard', dice: 2, bonus: 1, w: 1, desc: 'Блокирует твой удар.' },
      ],
      taunts: ['С ОГНЁМ ИЛИ БЕЗ?!', 'Сегодня ты — начинка!', 'Двойную! ДВОЙНУЮ!', 'Соус за счёт заведения!'],
      hurt: ['МОЙ ФАРТУК!', 'Ай-ай-ай!', 'Нечестно!'],
    },

    grokh: {
      name: 'КАПИТАН ГРОХ', sprite: SP + 'grokh.png', color: '#c9d4c2',
      hp: 70, hidden: 1, armor: 1,
      moves: [
        { name: 'Дубинка', type: 'attack', dice: 2, bonus: 6, w: 3, desc: 'Резиновое правосудие.' },
        { name: 'Наручники', type: 'attack', dice: 1, bonus: 6, w: 2, onHit: 'cuff', desc: 'Попадание → −1 куб на следующий ход.' },
        { name: 'Стойка по уставу', type: 'guard', dice: 2, bonus: 2, w: 1, desc: 'Блокирует твой удар.' },
      ],
      taunts: ['Сопротивление при задержании, Корсак.', 'Я тебя двадцать лет терпел.', 'Статья 318. Поздравляю.', 'Лежать!'],
      hurt: ['Ты труп, Корсак.', 'Ах ты…', 'Сержант!'],
    },

    kong: {
      name: '«КОНГ»', sprite: SP + 'kong.png', color: '#ffe14d',
      hp: 65, hidden: 1, armor: 0,
      moves: [
        { name: 'Банановый шквал', type: 'barrage', dice: 4, bonus: 3, w: 3, desc: 'Четыре куба, но 1–2 — промах.' },
        { name: 'Прицеливается…', type: 'charge', w: 1, next: 2, desc: 'Следующий ход — ДВОЙНОЙ ВЫСТРЕЛ.' },
        { name: 'Двойной выстрел', type: 'attack', dice: 3, bonus: 6, w: 0, desc: 'Оба ствола разом.' },
      ],
      taunts: ['БАНАНЫ!', 'Не спрашивай про бананы!', 'Пиу-пиу, Корсак!', 'Учёт! Новый год! БАНАНЫ!'],
      hurt: ['МОЙ БАНАН!', 'Уа-а-а!', 'Так нельзя!'],
    },

    bugai: {
      name: 'ТАРАС «БУГАЙ»', sprite: SP + 'bugai.png', color: '#c27bff',
      hp: 93, hidden: 1, armor: 2, boss: true,
      moves: [
        { name: 'Кулак', type: 'attack', dice: 2, bonus: 6, w: 3, desc: 'Как отбойный молоток.' },
        { name: 'Опускает голову…', type: 'charge', w: 1, next: 2, desc: 'Следующий ход — ТАРАН.' },
        { name: 'ТАРАН', type: 'attack', dice: 3, bonus: 8, w: 0, desc: 'Рога. Вся масса. Блокируй.' },
        { name: 'Скрестил руки', type: 'guard', dice: 2, bonus: 3, w: 1, desc: 'Блокирует твой удар.' },
      ],
      taunts: ['Отец тоже дёргался.', 'Я не тороплюсь, Корсак.', 'Ну. Ударь.', 'Хрусть.'],
      hurt: ['Хм.', 'Неплохо.', 'ГРРА!'],
    },
    /* ======================= ГЛАВА I =======================
       char — чей это персонаж (досье, имя), threat — уровень опасности. */
    soroka: {
      char: 'soroka', threat: 1, name: '«СОРОКА»', sprite: SP + 'soroka.png', color: '#ff7ad9',
      hp: 30, hidden: 1, armor: 0, passives: [{ id: 'steal' }],
      moves: [
        { name: 'Подсечка', type: 'attack', dice: 2, bonus: 2, w: 3, desc: 'Низко и быстро.' },
        { name: 'Шпилька', type: 'attack', dice: 1, bonus: 4, w: 2, desc: 'Точно под ребро.' },
        { name: 'Финт', type: 'guard', dice: 2, w: 1, desc: 'Ускользает от удара.' },
      ],
      taunts: ['Ой, что это у тебя?', 'Было твоё — стало моё.', 'Не догонишь!'],
      hurt: ['Ай!', 'Так нечестно!', 'Пусти!'],
    },
    sanitar: {
      char: 'sanitar', threat: 2, name: '«САНИТАР»', sprite: SP + 'sanitar.png', color: '#d8e0dc',
      hp: 99, hidden: 1, armor: 0, passives: [{ id: 'poison', stack: 1 }],
      moves: [
        { name: 'Шприц', type: 'attack', dice: 1, bonus: 2, w: 3, desc: 'Попадание — стак яда.' },
        { name: 'Скальпель', type: 'attack', dice: 2, bonus: 0, w: 2, desc: 'Аккуратный надрез.' },
        { name: 'Каталка', type: 'guard', dice: 2, bonus: 1, w: 1, desc: 'Прячется за каталкой.' },
      ],
      taunts: ['Не дёргайтесь, больной.', 'Будет немножко больно.', 'Режим есть режим.'],
      hurt: ['Тьфу.', 'Неаккуратно.', 'Ах ты…'],
    },
    banshik: {
      char: 'banshik', threat: 2, name: '«БАНЩИК»', sprite: SP + 'banshik.png', color: '#ffb08a',
      hp: 94, hidden: 0, armor: 0, passives: [{ id: 'steam', rounds: 2 }],
      moves: [
        { name: 'Дубовый веник', type: 'attack', dice: 2, bonus: 3, w: 3, desc: 'С оттяжкой.' },
        { name: 'Ковш кипятка', type: 'attack', dice: 1, bonus: 5, w: 2, onHit: 'burn', desc: 'Попадание → ожог.' },
        { name: 'В пар', type: 'guard', dice: 2, bonus: 1, w: 1, desc: 'Растворяется в пару.' },
      ],
      taunts: ['С лёгким паром!', 'Поддай-ка!', 'Совет занят.'],
      hurt: ['Ух!', 'Горячо пошло!', 'Ёлки…'],
    },
    shilo_a1: {
      char: 'shilo', threat: 2, name: '«ШИЛО»', sprite: SP + 'shilo.png', color: '#8dff6a',
      hp: 59, hidden: 1, armor: 0, passives: [{ id: 'enrage', at: 0.5, atk: 3 }],
      moves: [
        { name: 'Двойной порез', type: 'attack', dice: 2, bonus: 5, w: 3, pairEffect: 'bleed', desc: 'Пара → кровотечение.' },
        { name: 'Фьюи-и-ить!', type: 'attack', dice: 1, bonus: 8, w: 2, desc: 'Свист — и выпад.' },
        { name: 'Присел в тени', type: 'guard', dice: 2, w: 1, desc: 'Блокирует удар.' },
      ],
      taunts: ['Фьють. Вспомнил меня?', 'Ботиночки снова при тебе?', 'Вжик.'],
      hurt: ['С-сука!', 'Ай!..', 'Ты чё?!'],
    },
    povar: {
      char: 'povar', threat: 3, name: '«ПОВАР»', sprite: SP + 'povar.png', color: '#ff6a3d',
      hp: 45, hidden: 2, armor: 0, passives: [{ id: 'cleaver' }],
      moves: [
        { name: 'Веер ножей', type: 'attack', dice: 3, bonus: 4, w: 3, desc: 'Три ножа веером.' },
        { name: 'Тесак', type: 'attack', dice: 2, bonus: 7, w: 2, desc: 'Сверху вниз.' },
        { name: 'За стойку', type: 'guard', dice: 2, bonus: 2, w: 1, desc: 'Блокирует удар.' },
      ],
      taunts: ['Шеф просил тонко.', 'На шаурму пойдёшь.', 'Не дёргайся, порежу ровно.'],
      hurt: ['Хм.', 'Ты острый.', 'Кх…'],
    },
    kir_e: {
      char: 'kir', threat: 3, name: 'КИР ВОЛЬСКИЙ', sprite: SP + 'kir.png', color: '#b6ff3b',
      hp: 40, hidden: 1, armor: 0, passives: [{ id: 'reads' }],
      moves: [
        { name: 'Табельный', type: 'attack', dice: 2, bonus: 9, w: 3, desc: 'Два в корпус.' },
        { name: 'Подсечка по-оперски', type: 'attack', dice: 1, bonus: 10, w: 2, onHit: 'cuff', desc: 'Попадание → −1 куб.' },
        { name: 'За угол', type: 'guard', dice: 2, bonus: 2, w: 1, desc: 'Блокирует удар.' },
      ],
      taunts: ['Я учил тебя этому, Ян.', 'Ты всегда открываешься слева.', 'Не заставляй меня.'],
      hurt: ['Старая школа…', 'Неплохо, напарник.', 'Чёрт.'],
    },
    grokh_a1: {
      char: 'grokh', threat: 3, name: 'КАПИТАН ГРОХ', sprite: SP + 'grokh.png', color: '#c9d4c2',
      hp: 95, hidden: 1, armor: 1, passives: [{ id: 'reinforce', every: 3, dmg: 5, name: 'СЕРЖАНТ' }],
      moves: [
        { name: 'Дубинка', type: 'attack', dice: 2, bonus: 2, w: 3, desc: 'Резиновое правосудие.' },
        { name: 'Наручники', type: 'attack', dice: 1, bonus: 2, w: 2, onHit: 'cuff', desc: 'Попадание → −1 куб.' },
        { name: 'Стойка по уставу', type: 'guard', dice: 2, bonus: 2, w: 1, desc: 'Блокирует удар.' },
      ],
      taunts: ['Сержант, ко мне!', 'Ты ещё здесь, Корсак?', 'Статья 317 — это пожизненно.'],
      hurt: ['Ты труп.', 'Ах ты…', 'Подкрепление!'],
    },
    kong_a1: {
      char: 'kong', threat: 4, name: '«КОНГ»', sprite: SP + 'kong.png', color: '#ffe14d',
      hp: 86, hidden: 1, armor: 0, passives: [{ id: 'drunk', atk: 4, miss: 0.3 }],
      moves: [
        { name: 'Банановый шквал', type: 'barrage', dice: 4, bonus: -1, w: 3, desc: 'Четыре куба, но 1–2 — промах.' },
        { name: 'Прицеливается…', type: 'charge', w: 1, next: 2, desc: 'Следующий ход — ДВОЙНОЙ ВЫСТРЕЛ.' },
        { name: 'Двойной выстрел', type: 'attack', dice: 3, bonus: 2, w: 0, desc: 'Оба ствола разом.' },
      ],
      taunts: ['Я помню твоё лицо!', 'БАНАНЫ!', 'Реванш, мужик!'],
      hurt: ['МОЙ БАНАН!', 'Уа-а-а!', 'Опять?!'],
    },
    ded_e: {
      char: 'ded', threat: 4, name: '«ДЕД»', sprite: SP + 'ded.png', color: '#ff2a4d',
      hp: 23, hidden: 2, armor: 0, passives: [{ id: 'longRange' }],
      moves: [
        { name: 'Оптика', type: 'attack', dice: 2, bonus: 11, w: 3, desc: 'Через всю мастерскую.' },
        { name: 'Смена позиции', type: 'guard', dice: 3, bonus: 2, w: 1, desc: 'Уходит за стеллаж.' },
        { name: 'Подарок готовится…', type: 'charge', w: 1, next: 3, desc: 'Следующий ход — ВЫСТРЕЛ В СЕРДЦЕ.' },
        { name: 'Выстрел в сердце', type: 'attack', dice: 3, bonus: 14, w: 0, desc: 'Блокируй всем, что есть.' },
      ],
      taunts: ['Хо. Хо.', 'Подарки получают не все.', 'Стой спокойно, внучек.'],
      hurt: ['Хо…', 'Старость.', 'Неплохо.'],
    },
    bugai_a1: {
      char: 'bugai', threat: 5, name: 'ТАРАС «БУГАЙ»', sprite: SP + 'bugai.png', color: '#c27bff', boss: true,
      hp: 73, hidden: 1, armor: 2, passives: [{ id: 'thorns', dmg: 1 }, { id: 'secondWind', at: 0.4, heal: 20, name: 'ВТОРОЕ ДЫХАНИЕ' }],
      moves: [
        { name: 'Кулак', type: 'attack', dice: 2, bonus: 4, w: 3, desc: 'Как отбойный молоток.' },
        { name: 'Опускает голову…', type: 'charge', w: 1, next: 2, desc: 'Следующий ход — ТАРАН.' },
        { name: 'ТАРАН', type: 'attack', dice: 3, bonus: 6, w: 0, desc: 'Рога. Вся масса.' },
        { name: 'Скрестил руки', type: 'guard', dice: 2, bonus: 3, w: 1, desc: 'Блокирует удар.' },
      ],
      taunts: ['Второй раунд, Корсак.', 'Я не тороплюсь.', 'Хрусть.'],
      hurt: ['Хм.', 'ГРРА!', 'Опять ты.'],
    },
    /* ---------- глава II · воспоминание опера (10 лет назад) ---------- */
    kong_fb: {
      char: 'kong', threat: 1, name: '«КОНГ» · 19 ЛЕТ', sprite: SP + 'kong.png', color: '#ffe14d',
      hp: 58, hidden: 0, armor: 0, passives: [{ id: 'bolt', at: 0.5 }, { id: 'cold', from: 3 }],
      moves: [
        { name: 'Дубинка сторожа', type: 'attack', dice: 2, bonus: 4, w: 3, desc: 'Машет, не глядя.' },
        { name: 'Фонарь в глаза', type: 'attack', dice: 1, bonus: 6, w: 2, desc: 'Слепит и толкает.' },
        { name: 'Пятится к двери', type: 'guard', dice: 2, w: 1, desc: 'Прикрывается дверью.' },
      ],
      taunts: ['Я ничего не видел!', 'Не подходи, начальник!', 'Мне сказали — не пускать!'],
      hurt: ['Ай!', 'Не надо!', 'Мама…'],
    },
    bugai_fb: {
      char: 'bugai', threat: 3, name: 'ТАРАС «БУГАЙ» · 10 ЛЕТ НАЗАД', sprite: SP + 'bugai.png', color: '#c27bff',
      hp: 69, hidden: 1, armor: 1, passives: [{ id: 'getaway', steps: 3 }],
      moves: [
        { name: 'Кулак', type: 'attack', dice: 2, bonus: 4, w: 3, desc: 'Ещё без кастета. Пока.' },
        { name: 'Швырнуть стулом', type: 'attack', dice: 1, bonus: 7, w: 2, desc: 'Что под руку попало.' },
        { name: 'Шаг к окну', type: 'guard', dice: 2, bonus: 2, w: 2, desc: 'Пятится к окну, прикрываясь стулом. Три шага — и он ушёл.' },
      ],
      taunts: ['Иди домой, мент.', 'Это не твоё дело.', 'Тебе скажут — несчастный случай.'],
      hurt: ['Хм.', 'Крепкий.', 'ГРРА!'],
    },
    /* ---------- глава II · воспоминание боксёра (полтора года назад) ---------- */
    lysy_fb: {
      char: 'lysy', threat: 3, name: '«ЛЫСЫЙ» · РЕВАНШ', sprite: SP + 'lysy.png', color: '#c27bff',
      hp: 74, hidden: 1, armor: 0, passives: [{ id: 'clinch' }],
      moves: [
        { name: 'Джеб-джеб', type: 'attack', dice: 2, bonus: 5, w: 3, desc: 'Прощупывает. Два раза.' },
        { name: 'Апперкот с зоны', type: 'attack', dice: 1, bonus: 9, w: 2, desc: 'Снизу, исподтишка.' },
        { name: 'Висит на канатах', type: 'guard', dice: 2, bonus: 2, w: 1, desc: 'Тянет время.' },
      ],
      taunts: ['Ну что, Корсак, третий раунд скоро.', 'Ляжешь — не больно будет.', 'Я тот бой помню. А ты?'],
      hurt: ['Ха.', 'Нормально.', 'Хорош…'],
    },
    /* ---------- глава II · воспоминание карманника (год назад) ---------- */
    valet_fb: {
      char: 'valet', threat: 2, name: '«ВАЛЕТ» · ПОСЛЕДНИЙ ТРАМВАЙ', sprite: SP + 'valet.png', color: '#c27bff',
      hp: 40, hidden: 1, armor: 0, passives: [{ id: 'steal' }, { id: 'sway', blk: 1 }],
      moves: [
        { name: 'Бритва из манжеты', type: 'attack', dice: 2, bonus: 3, w: 3, desc: 'Тонко. Почти без боли — сначала.' },
        { name: 'Локтем в солнышко', type: 'attack', dice: 1, bonus: 6, w: 2, desc: 'Как в давке на остановке.' },
        { name: 'За поручень', type: 'guard', dice: 2, bonus: 1, w: 1, desc: 'Трамвай качнуло — он уже в стороне.' },
      ],
      taunts: ['Я тебя этому не учил.', 'Руки помнят, Ян. А голова?', 'Заказ есть заказ, ученик.'],
      hurt: ['Неплохо.', 'Ученик…', 'Ай-яй.'],
    },
    schetovod: {
      char: 'schetovod', threat: 5, name: 'ШЕФ · «СЧЕТОВОД»', sprite: SP + 'shef.png', color: '#ffb02e', boss: true,
      hp: 147, hidden: 1, armor: 1, passives: [{ id: 'doubleBook' }, { id: 'audit', every: 3 }],
      moves: [
        { name: 'Шаурмомёт', type: 'attack', dice: 2, bonus: 0, w: 3, desc: 'Тот самый ствол в лаваше.' },
        { name: 'Огненный соус', type: 'attack', dice: 1, bonus: 1, w: 2, onHit: 'burn', desc: 'Попадание → ожог.' },
        { name: 'Сальдо', type: 'guard', dice: 2, bonus: 3, w: 1, desc: 'Сводит баланс.' },
        { name: 'Подбивает итог…', type: 'charge', w: 1, next: 4, desc: 'Следующий ход — СПИСАНИЕ.' },
        { name: 'СПИСАНИЕ', type: 'attack', dice: 3, bonus: 3, w: 0, desc: 'Тебя вычёркивают из книги.' },
      ],
      taunts: ['Двойную? С огненным?', 'Всё в этом городе — начинка.', 'Я считал твоего отца. Теперь тебя.'],
      hurt: ['Мой фартук!', 'Пересчитаем.', 'Убыток…'],
    },
  };
})();
