/* Каталог. Цены ориентировочные — правьте поле price.
   Поля товара:
     id     — уникальный код (латиницей)
     brand  — on | sc | now
     cat    — раздел каталога (см. BIZON_CATEGORIES)
     name   — название, size — фасовка, price — цена в рублях
     pack   — рисунок упаковки: tub (банка протеина) | jar (баночка) | bag (пакет) | bottle (бутылка)
     label  — 1–2 короткие строки на этикетке рисунка
     img    — необязательно: путь к фото товара, например 'img/products/on-whey.jpg'
     kb     — статья базы знаний, к которой относится товар
     stock  — false, если нет в наличии
*/
(function (G) {
  G.BIZON_BRANDS = {
    on: 'Optimum Nutrition',
    sc: 'Scitec Nutrition',
    now: 'NOW Foods'
  };

  G.BIZON_CATEGORIES = [
    { id: 'protein', title: 'Протеин', text: 'Сывороточный и казеиновый белок, чтобы добирать дневную норму.' },
    { id: 'gainer', title: 'Гейнеры', text: 'Белок с углеводами для тех, кому трудно набрать вес обычной едой.' },
    { id: 'creatine', title: 'Креатин', text: 'Самая изученная добавка для силы и мышечной массы.' },
    { id: 'amino', title: 'Аминокислоты', text: 'BCAA, глютамин, цитруллин, бета-аланин и карнитин.' },
    { id: 'pre', title: 'Перед тренировкой', text: 'Кофеин и компоненты для энергии и концентрации в зале.' },
    { id: 'vitamins', title: 'Витамины и минералы', text: 'Базовые витамины и минералы для восполнения дефицитов.' },
    { id: 'health', title: 'Здоровье и восстановление', text: 'Омега-3, суставы и связки, сон, адаптогены.' }
  ];

  G.BIZON_PRODUCTS = [
    /* ---------- Протеин ---------- */
    { id: 'on-whey-907', brand: 'on', cat: 'protein', name: 'Gold Standard 100% Whey', size: '907 г', price: 5490, pack: 'tub', label: ['GOLD', 'WHEY'], kb: 'whey',
      desc: 'Сывороточный протеин на основе изолята. Около 24 г белка в порции, хорошо размешивается.' },
    { id: 'on-whey-2270', brand: 'on', cat: 'protein', name: 'Gold Standard 100% Whey', size: '2,27 кг', price: 10990, pack: 'tub', label: ['GOLD', 'WHEY'], kb: 'whey',
      desc: 'Большая банка того же сывороточного протеина: выгоднее в пересчёте на порцию.' },
    { id: 'sc-whey-920', brand: 'sc', cat: 'protein', name: '100% Whey Protein Professional', size: '920 г', price: 3890, pack: 'tub', label: ['WHEY', 'PRO'], kb: 'whey',
      desc: 'Смесь концентрата и изолята сывороточного белка. Около 22 г белка в порции.' },
    { id: 'sc-whey-2350', brand: 'sc', cat: 'protein', name: '100% Whey Protein Professional', size: '2,35 кг', price: 8490, pack: 'tub', label: ['WHEY', 'PRO'], kb: 'whey',
      desc: 'Большая банка сывороточного протеина Scitec на 2–3 месяца регулярного приёма.' },
    { id: 'on-casein', brand: 'on', cat: 'protein', name: 'Gold Standard 100% Casein', size: '910 г', price: 5890, pack: 'tub', label: ['GOLD', 'CASEIN'], kb: 'casein',
      desc: 'Мицеллярный казеин. Усваивается медленно, поэтому его обычно пьют на ночь.' },
    { id: 'sc-casein', brand: 'sc', cat: 'protein', name: '100% Casein Complex', size: '920 г', price: 4490, pack: 'tub', label: ['CASEIN'], kb: 'casein',
      desc: 'Медленный белок на основе казеина для приёма перед сном или в долгих перерывах между едой.' },

    /* ---------- Гейнеры ---------- */
    { id: 'on-serious-mass', brand: 'on', cat: 'gainer', name: 'Serious Mass', size: '2,72 кг', price: 5490, pack: 'bag', label: ['SERIOUS', 'MASS'], kb: 'gainer',
      desc: 'Высококалорийный гейнер: около 1250 ккал и 50 г белка в полной порции. Полную порцию удобно делить на два приёма.' },
    { id: 'sc-jumbo', brand: 'sc', cat: 'gainer', name: 'Jumbo', size: '2,86 кг', price: 5290, pack: 'bag', label: ['JUMBO'], kb: 'gainer',
      desc: 'Гейнер с углеводами разной скорости усвоения и добавлением креатина.' },

    /* ---------- Креатин ---------- */
    { id: 'on-creatine', brand: 'on', cat: 'creatine', name: 'Micronized Creatine Powder', size: '300 г', price: 2290, pack: 'jar', label: ['CREATINE'], kb: 'creatine',
      desc: 'Микронизированный креатин моногидрат без вкуса. Банки хватает примерно на два-три месяца.' },
    { id: 'sc-creatine', brand: 'sc', cat: 'creatine', name: '100% Creatine Monohydrate', size: '300 г', price: 1490, pack: 'jar', label: ['CREATINE'], kb: 'creatine',
      desc: 'Чистый креатин моногидрат без добавок и вкуса.' },

    /* ---------- Аминокислоты ---------- */
    { id: 'on-bcaa-caps', brand: 'on', cat: 'amino', name: 'BCAA 1000 Caps', size: '200 капсул', price: 2490, pack: 'jar', label: ['BCAA', '1000'], kb: 'bcaa',
      desc: 'Лейцин, изолейцин и валин в соотношении 2:1:1 в капсулах.' },
    { id: 'sc-bcaa-xpress', brand: 'sc', cat: 'amino', name: 'BCAA Xpress', size: '280 г', price: 1990, pack: 'jar', label: ['BCAA', 'XPRESS'], kb: 'bcaa',
      desc: 'Порошковые BCAA со вкусом: удобно пить во время тренировки.' },
    { id: 'on-glutamine', brand: 'on', cat: 'amino', name: 'Glutamine Powder', size: '300 г', price: 2390, pack: 'jar', label: ['GLUTAMINE'], kb: 'glutamine',
      desc: 'L-глютамин в порошке без вкуса.' },
    { id: 'sc-glutamine', brand: 'sc', cat: 'amino', name: '100% L-Glutamine', size: '300 г', price: 1890, pack: 'jar', label: ['GLUTAMINE'], kb: 'glutamine',
      desc: 'Чистый L-глютамин в порошке.' },
    { id: 'sc-citrulline', brand: 'sc', cat: 'amino', name: 'Citrulline Malate', size: '90 капсул', price: 1690, pack: 'jar', label: ['CITRULLINE'], kb: 'citrulline',
      desc: 'Цитруллин малат в капсулах для приёма перед тренировкой.' },
    { id: 'now-citrulline', brand: 'now', cat: 'amino', name: 'L-Citrulline 750 mg', size: '90 капсул', price: 1890, pack: 'jar', label: ['CITRULLINE'], kb: 'citrulline',
      desc: 'L-цитруллин, 750 мг в капсуле.' },
    { id: 'sc-beta-alanine', brand: 'sc', cat: 'amino', name: 'Beta Alanine', size: '150 капсул', price: 1890, pack: 'jar', label: ['BETA', 'ALANINE'], kb: 'beta-alanine',
      desc: 'Бета-аланин в капсулах для курсового приёма.' },
    { id: 'now-beta', brand: 'now', cat: 'amino', name: 'Beta-Alanine 750 mg', size: '120 капсул', price: 2090, pack: 'jar', label: ['BETA', 'ALANINE'], kb: 'beta-alanine',
      desc: 'Бета-аланин, 750 мг в капсуле.' },
    { id: 'sc-carni-x', brand: 'sc', cat: 'amino', name: 'Liquid Carni-X 100 000', size: '500 мл', price: 1990, pack: 'bottle', label: ['CARNI-X'], kb: 'carnitine',
      desc: 'Жидкий концентрат L-карнитина.' },
    { id: 'now-carnitine', brand: 'now', cat: 'amino', name: 'L-Carnitine 500 mg', size: '60 капсул', price: 2090, pack: 'jar', label: ['CARNITINE'], kb: 'carnitine',
      desc: 'L-карнитин, 500 мг в капсуле.' },

    /* ---------- Перед тренировкой ---------- */
    { id: 'on-pre', brand: 'on', cat: 'pre', name: 'Gold Standard Pre-Workout', size: '300 г', price: 3490, pack: 'jar', label: ['PRE-', 'WORKOUT'], kb: 'preworkout',
      desc: 'Предтренировочный комплекс с кофеином, креатином, бета-аланином и цитруллином.' },
    { id: 'sc-hot-blood', brand: 'sc', cat: 'pre', name: 'Hot Blood Hardcore', size: '375 г', price: 2790, pack: 'jar', label: ['HOT', 'BLOOD'], kb: 'preworkout',
      desc: 'Предтренировочный комплекс с кофеином, аминокислотами и креатином.' },
    { id: 'on-amino-energy', brand: 'on', cat: 'pre', name: 'Essential Amino Energy', size: '270 г', price: 2890, pack: 'jar', label: ['AMINO', 'ENERGY'], kb: 'caffeine',
      desc: 'Аминокислоты с умеренной дозой кофеина. Мягче классического предтреника.' },

    /* ---------- Витамины и минералы ---------- */
    { id: 'now-d3', brand: 'now', cat: 'vitamins', name: 'Vitamin D-3 5000 IU', size: '120 капсул', price: 1190, pack: 'jar', label: ['D-3', '5000 IU'], kb: 'vitamin-d',
      desc: 'Витамин D3 в высокой дозировке — 5000 МЕ в капсуле. Подходит для восполнения подтверждённого дефицита.' },
    { id: 'now-d3k2', brand: 'now', cat: 'vitamins', name: 'Vitamin D-3 & K-2', size: '120 капсул', price: 1390, pack: 'jar', label: ['D-3', 'K-2'], kb: 'vitamin-d',
      desc: 'Витамин D3 в умеренной дозировке вместе с витамином K2.' },
    { id: 'now-mg-citrate', brand: 'now', cat: 'vitamins', name: 'Magnesium Citrate', size: '120 капсул', price: 1790, pack: 'jar', label: ['MAGNESIUM'], kb: 'magnesium',
      desc: 'Магний в форме цитрата — усваивается лучше, чем оксид.' },
    { id: 'now-zinc', brand: 'now', cat: 'vitamins', name: 'Zinc Picolinate 50 mg', size: '120 капсул', price: 1290, pack: 'jar', label: ['ZINC'], kb: 'zinc',
      desc: 'Цинк в форме пиколината, 50 мг в капсуле. Это высокая доза, не для постоянного приёма.' },
    { id: 'now-c1000', brand: 'now', cat: 'vitamins', name: 'Vitamin C-1000', size: '100 таблеток', price: 1590, pack: 'jar', label: ['C-1000'], kb: 'vitamin-c',
      desc: 'Витамин C, 1000 мг в таблетке.' },
    { id: 'now-b50', brand: 'now', cat: 'vitamins', name: 'B-50', size: '100 капсул', price: 1690, pack: 'jar', label: ['B-50'], kb: 'b-complex',
      desc: 'Комплекс витаминов группы B.' },
    { id: 'on-opti-men', brand: 'on', cat: 'vitamins', name: 'Opti-Men', size: '90 таблеток', price: 2890, pack: 'jar', label: ['OPTI-MEN'], kb: 'multivitamin',
      desc: 'Мультивитаминный комплекс для мужчин.' },
    { id: 'on-opti-women', brand: 'on', cat: 'vitamins', name: 'Opti-Women', size: '60 капсул', price: 2190, pack: 'jar', label: ['OPTI-', 'WOMEN'], kb: 'multivitamin',
      desc: 'Мультивитаминный комплекс для женщин.' },
    { id: 'now-adam', brand: 'now', cat: 'vitamins', name: "ADAM Men's Multi", size: '90 капсул', price: 2390, pack: 'jar', label: ['ADAM'], kb: 'multivitamin',
      desc: 'Мультивитамины для мужчин в мягких капсулах.' },
    { id: 'sc-mega-daily', brand: 'sc', cat: 'vitamins', name: 'Mega Daily One Plus', size: '60 капсул', price: 1290, pack: 'jar', label: ['MEGA', 'DAILY'], kb: 'multivitamin',
      desc: 'Витаминно-минеральный комплекс: одна капсула в день.' },
    { id: 'on-zma', brand: 'on', cat: 'vitamins', name: 'ZMA', size: '90 капсул', price: 2390, pack: 'jar', label: ['ZMA'], kb: 'zma',
      desc: 'Цинк, магний и витамин B6 в одной формуле.' },
    { id: 'now-zma', brand: 'now', cat: 'vitamins', name: 'ZMA', size: '90 капсул', price: 2290, pack: 'jar', label: ['ZMA'], kb: 'zma',
      desc: 'Цинк, магний и витамин B6 для приёма перед сном.' },

    /* ---------- Здоровье и восстановление ---------- */
    { id: 'now-omega', brand: 'now', cat: 'health', name: 'Omega-3 1000 mg', size: '200 капсул', price: 2290, pack: 'jar', label: ['OMEGA-3'], kb: 'omega-3',
      desc: 'Рыбий жир в мягких капсулах. Количество EPA и DHA в капсуле смотрите на этикетке.' },
    { id: 'sc-omega', brand: 'sc', cat: 'health', name: 'Omega 3', size: '100 капсул', price: 1290, pack: 'jar', label: ['OMEGA 3'], kb: 'omega-3',
      desc: 'Рыбий жир с EPA и DHA в капсулах.' },
    { id: 'sc-joint-x', brand: 'sc', cat: 'health', name: 'Joint-X', size: '100 капсул', price: 1890, pack: 'jar', label: ['JOINT-X'], kb: 'glucosamine',
      desc: 'Глюкозамин, хондроитин и МСМ для суставов.' },
    { id: 'now-gluco', brand: 'now', cat: 'health', name: 'Glucosamine & Chondroitin with MSM', size: '90 капсул', price: 2290, pack: 'jar', label: ['GLUCOS-', 'AMINE'], kb: 'glucosamine',
      desc: 'Глюкозамин и хондроитин с МСМ.' },
    { id: 'sc-collagen', brand: 'sc', cat: 'health', name: 'Collagen Xpress', size: '475 г', price: 2490, pack: 'jar', label: ['COLLAGEN'], kb: 'collagen',
      desc: 'Гидролизованный коллаген в порошке со вкусом.' },
    { id: 'now-melatonin', brand: 'now', cat: 'health', name: 'Melatonin 3 mg', size: '60 капсул', price: 890, pack: 'jar', label: ['MELATONIN'], kb: 'melatonin',
      desc: 'Мелатонин, 3 мг в капсуле.' },
    { id: 'now-ashwa', brand: 'now', cat: 'health', name: 'Ashwagandha 450 mg', size: '90 капсул', price: 1890, pack: 'jar', label: ['ASHWA-', 'GANDHA'], kb: 'ashwagandha',
      desc: 'Стандартизированный экстракт корня ашваганды, 450 мг в капсуле.' }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
