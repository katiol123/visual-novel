/* ==========================================================================
   Действующие лица. Ключ объекта = короткое имя в сценарии:
   { kir: 'реплика' } — говорит Кир.
   dossier — карточка «дела», которая всплывает при первой встрече.
   ========================================================================== */
(function () {
  'use strict';
  const SP = 'assets/sprites/';

  window.VN.Characters = {
    n: { name: null, style: 'narrator' },

    yan: { name: 'ЯН КОРСАК', short: 'ЯН', color: '#e8e2d0', tag: 'это ты', style: 'self' },

    mika: { name: 'МИКА', color: '#7fd6ff', tag: 'голос в трубке', style: 'phone' },
    mk: { name: 'МИКА', color: '#7fd6ff', tag: 'младший брат' },
    radio: { name: 'РАЦИЯ · КАНАЛ 9', color: '#c9d4c2', tag: 'капитан Грох', style: 'phone' },

    kir: {
      name: 'КИР ВОЛЬСКИЙ', short: 'КИР', color: '#b6ff3b', tag: 'бывший напарник',
      sprite: SP + 'sofa.png',
      dossier: {
        no: '0412', role: 'Частный сыск · экс-опер Участка 13',
        quote: 'Знает всех. Должен всем.',
        threat: 2, stamp: 'НЕ ДОВЕРЯТЬ?', stampColor: '#b6ff3b',
      },
    },

    grokh: {
      name: 'КАПИТАН ГРОХ', short: 'ГРОХ', color: '#c9d4c2', tag: 'начальник Участка 13',
      sprite: SP + 'plumber.png',
      dossier: {
        no: '0013', role: 'Капитан полиции · 24 года в органах',
        quote: 'Закон в этом районе — это он.',
        threat: 4, stamp: 'ПОЛИЦИЯ', stampColor: '#7fd6ff',
      },
    },

    shef: {
      name: '«ШЕФ»', short: 'ШЕФ', color: '#ffb02e', tag: 'шаурма «Вертел 24»',
      sprite: SP + 'shawarma.png',
      dossier: {
        no: '2424', role: 'Владелец шаурмичной · кассир БНК',
        quote: 'Режет мясо. И не только.',
        threat: 3, stamp: 'БНК', stampColor: '#ff2a4d',
      },
    },

    frog: {
      name: '«ЖАБА»', short: 'ЖАБА', color: '#8dff6a', tag: 'хозяин переулка',
      sprite: SP + 'frog.png',
      dossier: {
        no: '6613', role: 'Уличный грабитель · два ножа, ноль тормозов',
        quote: 'Квакает перед ударом.',
        threat: 3, stamp: 'ОПАСЕН', stampColor: '#8dff6a',
      },
    },

    pelmen: {
      name: 'СЁМА «ПЕЛЬМЕНЬ»', short: 'ПЕЛЬМЕНЬ', color: '#9be15d', tag: 'контрабандист',
      sprite: SP + 'dumpling.png',
      dossier: {
        no: '0777', role: 'Контрабанда · скупка · слухи',
        quote: 'Продаст тебе твою же тень. Со скидкой.',
        threat: 1, stamp: 'ТОРГУЕТ', stampColor: '#9be15d',
      },
    },

    goose: {
      name: '«ГУСЬ»', short: 'ГУСЬ', color: '#ffe14d', tag: 'охрана БНК',
      sprite: SP + 'goose.png',
      dossier: {
        no: '1987', role: 'Боевик БНК · охрана объектов',
        quote: 'Не спрашивай про бананы.',
        threat: 4, stamp: 'БНК', stampColor: '#ff2a4d',
      },
    },

    bugai: {
      name: 'ТАРАС «БУГАЙ»', short: 'БУГАЙ', color: '#c27bff', tag: 'правая рука БНК',
      sprite: SP + 'cat.png',
      dossier: {
        no: '0001', role: 'Силовое крыло БНК · 3 судимости, 0 сроков',
        quote: 'Бьёт один раз. Больше не нужно.',
        threat: 5, stamp: 'БНК', stampColor: '#ff2a4d',
      },
    },

    ded: {
      name: '«ДЕД»', short: 'ДЕД', color: '#ff2a4d', tag: 'снайпер БНК',
      sprite: SP + 'granny.png',
      dossier: {
        no: '3112', role: 'Снайпер · работает только в праздники',
        quote: 'Подарки получают не все.',
        threat: 5, stamp: 'ЛИКВИДАТОР', stampColor: '#ff2a4d',
      },
    },
  };
})();
