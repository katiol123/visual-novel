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
    shilo_knife: svg('<path d="M10 54l10-10M20 44l4 4M24 48l26-34-8 4-22 26z"/><path d="M30 34l3 3M36 26l3 3"/>'),
    key: svg('<rect x="22" y="22" width="20" height="34" rx="3"/><path d="M26 22V10h12v12M29 14h2M33 14h2"/><path d="M28 34h8M28 40h8"/>'),
    watch: svg('<circle cx="32" cy="36" r="18"/><path d="M32 26v10l7 5M26 10h12M32 10v8"/>'),
    mirror: svg('<ellipse cx="30" cy="26" rx="16" ry="18"/><path d="M38 40l14 16M24 18c3-4 9-4 12 0"/>'),
    vodka: svg('<path d="M26 8h12v10l4 8v30H22V26l4-8z"/><path d="M22 34h20M22 46h20"/>'),
    banana: svg('<path d="M12 18c4 22 18 34 40 30-18-4-28-14-32-30z"/><path d="M12 18l-2-6"/>'),
    ticket: svg('<path d="M8 20h48v8a4 4 0 0 0 0 8v8H8v-8a4 4 0 0 0 0-8z"/><path d="M24 20v24" stroke-dasharray="3 3"/>'),
    notebook: svg('<rect x="14" y="8" width="36" height="48" rx="2"/><path d="M20 8v48M26 20h18M26 28h18M26 36h12"/>'),
    tape: svg('<rect x="8" y="16" width="48" height="32" rx="3"/><circle cx="24" cy="32" r="5"/><circle cx="40" cy="32" r="5"/><path d="M18 44h28"/>'),
    syringe: svg('<path d="M44 8l12 12M50 14L22 42l-8 0 0-8L42 6M14 50l-6 6M30 26l8 8"/>'),
    cigs: svg('<rect x="14" y="22" width="36" height="32" rx="2"/><path d="M14 30h36M22 22v-8M30 22v-10M38 22v-8"/>'),
  };

  VN.Items = {
    revolver: {
      name: 'Револьвер «Бульдог»', value: 9, kind: 'weapon', icon: 'revolver', bundle: { bullet: 3 },
      desc: 'Короткий ствол, тяжёлый спуск. В барабане три патрона — на всю ночь. В бою открывает слот ВЫСТРЕЛ: куб × 3 урона сквозь любую защиту, шестёрка — 18. Куб, ушедший в выстрел, не бьёт и не блокирует.',
    },
    bullet: {
      name: 'Патрон .38', value: 2, kind: 'ammo', icon: 'bullet', tradeable: true,
      desc: 'Один выстрел — одна попытка всё исправить.',
    },
    medkit: {
      name: 'Аптечка', value: 5, kind: 'heal', icon: 'medkit', tradeable: true, heal: 8, cleanse: true,
      use: { field: true, combat: true },
      desc: 'Бинты, спирт, обезболивающее. Восстанавливает 8 здоровья и снимает кровотечение, ожог и яд.',
    },
    flask: {
      name: 'Фляжка коньяка', value: 4, kind: 'combat', icon: 'flask', tradeable: true, qty: 2,
      use: { combat: true },
      desc: 'Отцовская, на два глотка. В проверке — перебросить кубы после провала. В бою — лишний куб и +2 переброса в этом раунде.',
    },
    firecracker: {
      name: 'Петарда «Корсар-6»', value: 3, kind: 'combat', icon: 'firecracker', tradeable: true,
      use: { combat: true },
      desc: 'В бою — вспышка в лицо: в этом раунде противник бьёт вдвое слабее и не может блокировать.',
    },
    photo: {
      name: 'Фото Мики', kind: 'key', icon: 'photo',
      desc: 'Мике здесь девятнадцать. Он смеётся, у него ещё нет шрама над бровью. На обороте — почерк отца: «Мои счетоводы».',
    },
    mika_phone: {
      name: 'Телефон Мики', kind: 'key', icon: 'radio',
      desc: 'Тёплый ещё. Без пароля. В контактах — одна буква: «С.».',
    },
    wraps: {
      name: 'Бинты для рук', kind: 'key', icon: 'knuckles',
      desc: 'Четыре метра серой ткани. Малой мотает их лучше всех на Канальной — туго, но не пережимая.',
    },
    badge: {
      name: 'Старый жетон', kind: 'key', icon: 'badge',
      desc: 'Жетон №4417. Его забыли изъять при увольнении. Открывает некоторые двери — и рты.',
    },
    knuckles: {
      name: 'Кастет', value: 4, kind: 'weapon', icon: 'knuckles',
      desc: 'Память о подпольном ринге. Пассивно: +1 к УДАРУ.',
    },
    lockpicks: {
      name: 'Отмычки', value: 4, kind: 'key', icon: 'lockpicks',
      desc: 'Набор из семи штифтов. Любой замок — это просто вопрос терпения.',
    },
    shawarma: {
      name: 'Шаурма «Двойная»', value: 3, kind: 'heal', icon: 'shawarma', tradeable: true, food: true, heal: 10,
      use: { field: true, combat: true },
      desc: 'С огненным соусом. Подозрительно вкусная. Восстанавливает 10 здоровья.',
    },
    mandarin: {
      name: 'Мандарин', value: 1, kind: 'heal', icon: 'mandarin', tradeable: true, food: true, heal: 3,
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
    shilo_knife: {
      name: 'Нож Шила', value: 3, kind: 'weapon', icon: 'shilo_knife', tradeable: true,
      desc: 'Зазубренный, липкий. Пассивно: +1 к УДАРУ.',
    },
    cigs: {
      name: 'Сигареты «Полночь»', value: 3, kind: 'trade', icon: 'cigs', tradeable: true, food: true,
      desc: 'Полпачки. В этом городе — валюта твёрже рубля.',
    },
    watch: {
      name: 'Часы отца', value: 10, kind: 'trade', icon: 'watch', tradeable: true,
      desc: '«Полёт», позолота, на крышке гравировка «А.К. — за точный счёт». Остановились в 3:47. Стоят дорого. И не только в рублях.',
    },
    mirror: {
      name: 'Зеркальце шулера', value: 4, kind: 'combat', icon: 'mirror', tradeable: true, reveal: true,
      use: { combat: true },
      desc: 'Маленькое, в ладони не видно. В бою — заглянуть в скрытые кубы противника до удара.',
    },
    vodka: {
      name: 'Водка «Полярная»', value: 3, kind: 'trade', icon: 'vodka', tradeable: true, food: true,
      desc: 'Ноль семь. В эту ночь — жидкая валюта.',
    },
    banana: {
      name: 'Банан', value: 1, kind: 'trade', icon: 'banana', tradeable: true, food: true,
      desc: 'Обычный банан. Для некоторых — нет.',
    },
    ticket: {
      name: 'Билет на 06:40', value: 8, kind: 'key', icon: 'ticket', tradeable: true,
      desc: 'Поезд «Порт-Ветров — Москва», плацкарт, два места. Ещё можно уехать.',
    },
    notebook: {
      name: 'Тетрадь отца', kind: 'key', icon: 'notebook',
      desc: 'Столбики цифр, даты, инициалы. На последней странице — снежинка и число 3:47.',
    },
    tape: {
      name: 'Кассета', value: 6, kind: 'key', icon: 'tape', tradeable: true,
      desc: 'Запись из кабинета Гроха. Голоса, которые в суде звучат громче любых цифр.',
    },
    syringe: {
      name: 'Адреналин', value: 5, kind: 'heal', icon: 'syringe', tradeable: true, heal: 6,
      use: { field: true, combat: true },
      desc: 'Из больничного шкафа. Восстанавливает 6 здоровья.',
    },
    key: {
      name: 'Флешка «Ключ»', kind: 'key', icon: 'key',
      desc: 'Чёрная бухгалтерия БНК за двадцать лет. Ради этого куска пластика сегодня умрут люди.',
    },
  };
})();
