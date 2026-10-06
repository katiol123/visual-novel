/* ==========================================================================
   Действующие лица. Ключ объекта = короткое имя в сценарии:
   { kir: 'реплика' } — говорит Кит.
   dossier — карточка «дела», которая всплывает при первой встрече.
   ========================================================================== */
(function () {
  'use strict';
  const SP = 'assets/sprites/';

  window.VN.Characters = {
    n: { name: null, style: 'narrator' },

    yan: { name: 'ДЭН КОРВИН', short: 'ДЭН', color: '#e8e2d0', tag: 'это ты', style: 'self' },

    mika: { name: 'НИКИ', color: '#7fd6ff', tag: 'голос в трубке', style: 'phone' },
    mk: { name: 'НИКИ', color: '#7fd6ff', tag: 'младший брат', sprite: SP + 'mika.png' },
    radio: { name: 'РАЦИЯ · КАНАЛ 9', color: '#c9d4c2', tag: 'капитан Грох', style: 'phone' },

    kir: {
      name: 'КИТ УОЛШ', short: 'КИТ', color: '#b6ff3b', tag: 'бывший напарник',
      sprite: SP + 'kir.png',
      dossier: {
        no: '0412', role: 'Частный сыск · экс-опер Участка 13',
        quote: 'Знает всех. Должен всем.',
        threat: 2, stamp: 'НЕ ДОВЕРЯТЬ?', stampColor: '#b6ff3b',
      },
    },

    grokh: {
      name: 'КАПИТАН ГРОХ', short: 'ГРОХ', color: '#c9d4c2', tag: 'начальник Участка 13',
      sprite: SP + 'grokh.png',
      dossier: {
        no: '0013', role: 'Капитан полиции · 24 года в органах',
        quote: 'Закон в этом районе — это он.',
        threat: 3, stamp: 'ПОЛИЦИЯ', stampColor: '#7fd6ff',
      },
    },

    shef: {
      name: '«ШЕФ»', short: 'ШЕФ', color: '#ffb02e', tag: 'шаурма «Вертел 24»',
      sprite: SP + 'shef.png',
      dossier: {
        no: '2424', role: 'Владелец шаурмичной · кассир БНК',
        quote: 'Режет мясо. И не только.',
        threat: 2, stamp: 'БНК', stampColor: '#ff2a4d',
      },
    },

    shilo: {
      name: '«ШИЛО»', short: 'ШИЛО', color: '#8dff6a', tag: 'хозяин переулка',
      sprite: SP + 'shilo.png',
      dossier: {
        no: '6613', role: 'Уличный грабитель · два ножа, ноль тормозов',
        quote: 'Свистит перед ударом.',
        threat: 1, stamp: 'ОПАСЕН', stampColor: '#8dff6a',
      },
    },

    texas: {
      name: 'СЭМ «ТЕХАС»', short: 'ТЕХАС', color: '#9be15d', tag: 'контрабандист',
      sprite: SP + 'texas.png',
      dossier: {
        no: '0777', role: 'Контрабанда · скупка · слухи',
        quote: 'Продаст тебе твою же тень. Со скидкой.',
        threat: 1, stamp: 'ТОРГУЕТ', stampColor: '#9be15d',
      },
    },

    kong: {
      name: '«КОНГ»', short: 'КОНГ', color: '#ffe14d', tag: 'охрана БНК',
      sprite: SP + 'kong.png',
      dossier: {
        no: '1987', role: 'Боевик БНК · охрана объектов',
        quote: 'Не спрашивай про бананы.',
        threat: 4, stamp: 'БНК', stampColor: '#ff2a4d',
      },
    },

    bugai: {
      name: 'ТЕРРИ «БУГАЙ»', short: 'БУГАЙ', color: '#c27bff', tag: 'правая рука БНК',
      sprite: SP + 'bugai.png',
      dossier: {
        no: '0001', role: 'Силовое крыло БНК · 3 судимости, 0 сроков',
        quote: 'Бьёт один раз. Больше не нужно.',
        threat: 5, stamp: 'БНК', stampColor: '#ff2a4d',
      },
    },

    ded: {
      name: '«ДЕД»', short: 'ДЕД', color: '#ff2a4d', tag: 'снайпер БНК',
      sprite: SP + 'ded.png',
      dossier: {
        no: '3112', role: 'Снайпер · работает только в праздники',
        quote: 'Подарки получают не все.',
        threat: 5, stamp: 'ЛИКВИДАТОР', stampColor: '#ff2a4d',
      },
    },
    /* ---------- глава I ---------- */
    soroka: {
      name: '«СОРОКА»', short: 'СОРОКА', color: '#ff7ad9', tag: 'карманница',
      sprite: SP + 'soroka.png',
      dossier: { no: '7171', role: 'Карманные кражи · 14 приводов', quote: 'Что упало — то её. Что не упало — тоже.', threat: 1, stamp: 'ЛИПКИЕ ПАЛЬЦЫ', stampColor: '#ff7ad9' },
    },
    valya: {
      name: 'ТЁТЯ ВЭЛ', short: 'ВЭЛ', color: '#ffd28a', tag: 'барахолка',
      sprite: SP + 'valya.png',
      dossier: { no: '1950', role: 'Торговля с рук · 40 лет стажа', quote: 'Продаст ёлку в июле.', threat: 1, stamp: 'ТОРГУЕТ', stampColor: '#ffd28a' },
    },
    prof: {
      name: 'ПРОФЕССОР', short: 'ПРОФЕССОР', color: '#7fd6ff', tag: 'клуб «Пиксель»',
      sprite: SP + 'prof.png',
      dossier: { no: '1024', role: 'Взлом · шифры · бывший доцент', quote: 'Пароль — это всегда человек.', threat: 1, stamp: 'ЦИФРА', stampColor: '#7fd6ff' },
    },
    sanitar: {
      name: '«САНИТАР»', short: 'САНИТАР', color: '#d8e0dc', tag: 'больница №2',
      sprite: SP + 'sanitar.png',
      dossier: { no: '0303', role: 'Чистильщик БНК · медицинский профиль', quote: 'Укол — и спать.', threat: 2, stamp: 'БНК', stampColor: '#ff2a4d' },
    },
    banshik: {
      name: '«БАНЩИК»', short: 'БАНЩИК', color: '#ffb08a', tag: 'Баня №7',
      sprite: SP + 'banshik.png',
      dossier: { no: '0007', role: 'Охрана Совета · парилка', quote: 'С лёгким паром.', threat: 2, stamp: 'БНК', stampColor: '#ff2a4d' },
    },
    povar: {
      name: '«ПОВАР»', short: 'ПОВАР', color: '#ff6a3d', tag: 'кухня «Вертела»',
      sprite: SP + 'povar.png',
      dossier: { no: '2425', role: 'Личный нож Счетовода', quote: 'Режет тоньше бумаги.', threat: 3, stamp: 'БНК', stampColor: '#ff2a4d' },
    },
    /* ---------- глава II · воспоминание боксёра ---------- */
    maloy: {
      name: 'ТИМ «МАЛОЙ»', short: 'МАЛОЙ', color: '#9be15d', tag: 'спарринг-партнёр',
      sprite: SP + 'maloy.png',
      dossier: { no: '2003', role: 'Ринг «Котёл» · спарринг · 20 лет', quote: 'Бьёт честно. Пока.', threat: 1, stamp: 'ДОЛЖНИК', stampColor: '#9be15d' },
    },
    lysy: {
      name: '«ЛЫСЫЙ»', short: 'ЛЫСЫЙ', color: '#c27bff', tag: 'чемпион «Котла»',
      sprite: SP + 'lysy.png',
      dossier: { no: '1301', role: 'Ринг «Котёл» · 31 победа · 1 поражение', quote: 'Лысым звали с зоны. Ирокез отрастил назло.', threat: 3, stamp: 'ЧЕМПИОН', stampColor: '#c27bff' },
    },
    /* ---------- глава II · воспоминание карманника ---------- */
    valet: {
      name: '«ВАЛЕТ»', short: 'ВАЛЕТ', color: '#c27bff', tag: 'учитель',
      sprite: SP + 'valet.png',
      dossier: { no: '0052', role: 'Карманные кражи · ни одной судимости', quote: 'Карман — это доверие, которое человек забыл при себе.', threat: 2, stamp: 'НЕ ПОЙМАН', stampColor: '#c27bff' },
    },
    /* ---------- глава III · старый Новый год ---------- */
    mama: { name: 'МАМА', color: '#f2c6d0', tag: 'голос в трубке', style: 'phone' },
    nina: {
      name: 'НОРА ВЕЙЛ', short: 'НОРА', color: '#f2c6d0', tag: 'старшая медсестра',
      sprite: SP + 'nina.png',
      dossier: { no: '1402', role: 'Больница №2 · старшая медсестра · 31 год стажа', quote: 'Мать. Вдова. «Наверху».', threat: 5, stamp: 'НВ', stampColor: '#f2c6d0' },
    },
    likvidator: {
      name: 'ЛИКВИДАТОР', short: 'ЛИКВИДАТОР', color: '#ff7a3d', tag: 'Совет БНК',
      sprite: SP + 'likvidator.png',
      dossier: { no: '0113', role: 'Исполнитель решений Совета', quote: 'Срок — до старого Нового года.', threat: 3, stamp: 'СПИСАТЬ', stampColor: '#ff2a4d' },
    },
    schetovod: {
      name: 'ШЕФ · «СЧЕТОВОД»', short: 'СЧЕТОВОД', color: '#ffb02e', tag: 'глава БНК',
      sprite: SP + 'shef.png',
      dossier: { no: '0000', role: 'Глава Братства Ночного Канала', quote: 'Всё в этом городе — начинка.', threat: 5, stamp: 'СЧЕТОВОД', stampColor: '#ffb02e' },
    },
  };
})();
