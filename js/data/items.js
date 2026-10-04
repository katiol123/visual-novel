/* ==========================================================================
   Предметы. Иконки — инлайн SVG (обводка = currentColor).
   kind: weapon | ammo | heal | combat | key | trade
   use.field  — можно применить вне боя; use.combat — в бою.
   tradeable  — можно отдать в обмен (торговля, взятки).
   ========================================================================== */
(function () {
  'use strict';
  const VN = window.VN;

  const svg = (body) => `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

  VN.Icons = {
    revolver: svg('<path d="M8 22h38l4-4h6v8H46l-2 4H30l-3 6-1 14H14l3-16-9-2z"/><circle cx="34" cy="27" r="4"/><path d="M27 34c2 4 5 4 8 2"/>'),
    bullet: svg('<path d="M26 54V26c0-8 6-16 6-16s6 8 6 16v28z"/><path d="M26 44h12M26 48h12"/>'),
    medkit: svg('<rect x="10" y="20" width="44" height="32" rx="4"/><path d="M24 20v-6h16v6M32 28v16M24 36h16"/>'),
    flask: svg('<path d="M18 16h28v34a6 6 0 0 1-6 6H24a6 6 0 0 1-6-6z"/><path d="M26 16V8h12v8M18 30h28"/>'),
    firecracker: svg('<rect x="20" y="24" width="20" height="30" rx="3"/><path d="M20 34h20M20 44h20M30 24c0-6 4-8 8-10"/><path d="M42 8l2 4 4-2-2 4 4 2-4 2"/>'),
    photo: svg('<rect x="12" y="8" width="40" height="48" rx="2"/><rect x="17" y="13" width="30" height="28"/><circle cx="32" cy="24" r="5"/><path d="M22 41c2-6 6-8 10-8s8 2 10 8"/>'),
    badge: svg('<path d="M32 6l20 8v14c0 14-9 24-20 30C21 52 12 42 12 28V14z"/><path d="M32 18l4 8 9 1-6 6 2 9-9-5-9 5 2-9-6-6 9-1z"/>'),
    knuckles: svg('<circle cx="16" cy="22" r="6"/><circle cx="28" cy="20" r="6"/><circle cx="40" cy="20" r="6"/><circle cx="52" cy="22" r="6"/><path d="M10 28c0 10 8 18 22 18s22-8 22-18"/>'),
    lockpicks: svg('<path d="M10 50l30-30M18 54l30-30"/><path d="M40 20l6-4 2 4M48 24l6-2-1 5"/><circle cx="10" cy="50" r="3"/><circle cx="18" cy="54" r="3"/>'),
    shawarma: svg('<path d="M18 52L40 10c6 2 12 6 14 12L22 56z"/><path d="M30 30c4 2 8 2 12 0M26 40c4 2 8 2 11 0"/>'),
    mandarin: svg('<circle cx="32" cy="36" r="18"/><path d="M32 18c0-6 4-10 10-10-1 6-4 10-10 10z"/><path d="M26 30l2 2M38 40l2 2M30 44l1 1"/>'),
    radio: svg('<rect x="18" y="18" width="28" height="40" rx="4"/><path d="M26 18V6M24 28h16M24 34h16M24 40h16"/><circle cx="32" cy="50" r="3"/>'),
    grokh_file: svg('<path d="M8 16h18l4 6h26v32H8z"/><path d="M16 32h32M16 40h24M16 48h18"/>'),
    map: svg('<path d="M8 14l16-6 16 6 16-6v42l-16 6-16-6-16 6z"/><path d="M24 8v42M40 14v42"/><path d="M14 30l6 4 8-6 6 6" stroke-dasharray="3 3"/>'),
    frog_knife: svg('<path d="M10 54l10-10M20 44l4 4M24 48l26-34-8 4-22 26z"/><path d="M30 34l3 3M36 26l3 3"/>'),
    key: svg('<rect x="22" y="22" width="20" height="34" rx="3"/><path d="M26 22V10h12v12M29 14h2M33 14h2"/><path d="M28 34h8M28 40h8"/>'),
    cigs: svg('<rect x="14" y="22" width="36" height="32" rx="2"/><path d="M14 30h36M22 22v-8M30 22v-10M38 22v-8"/>'),
  };

  VN.Items = {
    revolver: {
      name: 'Револьвер «Бульдог»', kind: 'weapon', icon: 'revolver', bundle: { bullet: 3 },
      desc: 'Короткий ствол, тяжёлый спуск. В барабане три патрона. В бою открывает слот ВЫСТРЕЛ: куб × 2 урона, сквозь любую защиту. Нужны патроны.',
    },
    bullet: {
      name: 'Патрон .38', kind: 'ammo', icon: 'bullet', tradeable: true,
      desc: 'Один выстрел — одна попытка всё исправить.',
    },
    medkit: {
      name: 'Аптечка', kind: 'heal', icon: 'medkit', tradeable: true, heal: 8,
      use: { field: true, combat: true },
      desc: 'Бинты, спирт, обезболивающее. Восстанавливает 8 здоровья.',
    },
    flask: {
      name: 'Фляжка коньяка', kind: 'combat', icon: 'flask', tradeable: true, qty: 2,
      use: { combat: true },
      desc: 'Отцовская, на два глотка. В проверке — перебросить кубы после провала. В бою — +2 переброса в этом раунде.',
    },
    firecracker: {
      name: 'Петарда «Корсар-6»', kind: 'combat', icon: 'firecracker', tradeable: true,
      use: { combat: true },
      desc: 'В бою — оглушает противника: его намерение в этом раунде сгорает.',
    },
    photo: {
      name: 'Фото Мики', kind: 'key', icon: 'photo',
      desc: 'Мике здесь девятнадцать. Он смеётся, у него ещё нет шрама над бровью. На обороте — почерк отца: «Мои счетоводы».',
    },
    badge: {
      name: 'Старый жетон', kind: 'key', icon: 'badge',
      desc: 'Жетон №4417. Его забыли изъять при увольнении. Открывает некоторые двери — и рты.',
    },
    knuckles: {
      name: 'Кастет', kind: 'weapon', icon: 'knuckles',
      desc: 'Память о подпольном ринге. Пассивно: +2 к УДАРУ.',
    },
    lockpicks: {
      name: 'Отмычки', kind: 'key', icon: 'lockpicks',
      desc: 'Набор из семи штифтов. Любой замок — это просто вопрос терпения.',
    },
    shawarma: {
      name: 'Шаурма «Двойная»', kind: 'heal', icon: 'shawarma', tradeable: true, food: true, heal: 10,
      use: { field: true, combat: true },
      desc: 'С огненным соусом. Подозрительно вкусная. Восстанавливает 10 здоровья.',
    },
    mandarin: {
      name: 'Мандарин', kind: 'heal', icon: 'mandarin', tradeable: true, food: true, heal: 3,
      use: { field: true, combat: true },
      desc: 'Пахнет Новым годом и детством. Восстанавливает 3 здоровья.',
    },
    radio: {
      name: 'Рация Гроха', kind: 'key', icon: 'radio',
      desc: 'Девятый канал. Капитан ждёт звонка. Капитан всегда ждёт.',
    },
    grokh_file: {
      name: 'Папка Гроха', kind: 'key', icon: 'grokh_file',
      desc: 'Ведомость выплат БНК с подписью капитана. Достаточно, чтобы его посадить. Или чтобы тебя убили.',
    },
    map: {
      name: 'Схема хладокомбината', kind: 'key', icon: 'map',
      desc: 'Синька 1979 года. Вентиляционный короб ведёт прямо в контору второго этажа.',
    },
    frog_knife: {
      name: 'Нож Жабы', kind: 'weapon', icon: 'frog_knife', tradeable: true,
      desc: 'Зазубренный, липкий. Пассивно: +1 к УДАРУ.',
    },
    cigs: {
      name: 'Сигареты «Полночь»', kind: 'trade', icon: 'cigs', tradeable: true, food: true,
      desc: 'Полпачки. В этом городе — валюта твёрже рубля.',
    },
    key: {
      name: 'Флешка «Ключ»', kind: 'key', icon: 'key',
      desc: 'Чёрная бухгалтерия БНК за двадцать лет. Ради этого куска пластика сегодня умрут люди.',
    },
  };
})();
