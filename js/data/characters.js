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
      name: 'СЁМА «ТЕХАС»', short: 'ТЕХАС', color: '#9be15d', tag: 'контрабандист',
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
      name: 'ТАРАС «БУГАЙ»', short: 'БУГАЙ', color: '#c27bff', tag: 'правая рука БНК',
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
  };
})();
