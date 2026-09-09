export interface InsulationMaterial {
  insulationId: number;
  insulationName: string;
  insulationManufacturer: string;
  insulationApplication: string;
  insulationSku: string;
  insulationType: string;
  insulationThicknessMm: number;
  insulationWidthMm: number;
  insulationLengthMm: number;
  insulationPriceRubM2: number;
  insulationDescription: string;
  insulationStatus: 'draft' | 'published' | 'deleted';
  insulationImageKey: string;
  insulationVideoKey: string;
  insulationSourceUrl: string;
  insulationLikes: { insulationReaderId: number }[];
}

// Единственная коллекция модели. Лайки — учебные ID пользователей нашего приложения.
// Цена — за м² из зафиксированных страниц продавца; источники описаны в docs.
export const insulationMaterials: InsulationMaterial[] = [
  { insulationId: 1, insulationName: 'Технолайт Оптима', insulationManufacturer: 'ТЕХНОНИКОЛЬ', insulationType: 'Минвата', insulationThicknessMm: 50, insulationWidthMm: 600, insulationLengthMm: 1200, insulationPriceRubM2: 281.60, insulationApplication: 'Каркасные стены', insulationSku: '012889',
    insulationDescription: 'Каменная вата для утепления каркасных стен и ненагружаемых перекрытий. Плиты укладывают между стойками каркаса или лагами. Размер плиты — 1200 × 600 × 50 мм. Теплопроводность при условиях D — 0,037 Вт/(м·К).',
    insulationStatus: 'published', insulationImageKey: 'technolight-optima-50.jpg', insulationVideoKey: 'technolight-optima-50.mp4', insulationSourceUrl: 'https://www.tstn.ru/product/bazaltovyy-uteplitel-tekhnonikol-tekhnolayt-optima-1200kh600kh50-mm-12-sht/',
    insulationLikes: Array.from({ length: 24 }, (_, i) => ({ insulationReaderId: i + 1 })) },
  { insulationId: 2, insulationName: 'Технолайт Экстра', insulationManufacturer: 'ТЕХНОНИКОЛЬ', insulationType: 'Минвата', insulationThicknessMm: 50, insulationWidthMm: 600, insulationLengthMm: 1200, insulationPriceRubM2: 229.63, insulationApplication: 'Ненагружаемые конструкции', insulationSku: '012203',
    insulationDescription: 'Минераловатные плиты для теплоизоляции ненагружаемых конструкций. Размер одной плиты — 1200 × 600 × 50 мм. В упаковке 12 плит. При подборе утепления учитываются конструкция здания и выбранная толщина слоя.',
    insulationStatus: 'published', insulationImageKey: 'technolight-extra-50.jpg', insulationVideoKey: 'technolight-extra-50.mp4', insulationSourceUrl: 'https://www.tstn.ru/product/bazaltovyy-uteplitel-tekhnonikol-tekhnolayt-ekstra-1200kh600kh50-mm-12-sht/',
    insulationLikes: Array.from({ length: 15 }, (_, i) => ({ insulationReaderId: i + 1 })) },
  { insulationId: 3, insulationName: 'THERM ППС15', insulationManufacturer: 'RAFINAD', insulationType: 'Пенопласт', insulationThicknessMm: 50, insulationWidthMm: 600, insulationLengthMm: 1200, insulationPriceRubM2: 322.22, insulationApplication: 'Полы и перекрытия', insulationSku: '142367',
    insulationDescription: 'Пенополистирольная плита для полов, перекрытий и стен. Марка RAFINAD THERM ППС15-Т-А. Размер — 1200 × 600 × 50 мм, площадь материала в упаковке — 4,32 м².',
    insulationStatus: 'published', insulationImageKey: 'rafinad-therm-50.jpg', insulationVideoKey: 'rafinad-therm-50.mp4', insulationSourceUrl: 'https://www.tstn.ru/product/rafinad-therm-1200kh600kh50/',
    insulationLikes: Array.from({ length: 12 }, (_, i) => ({ insulationReaderId: i + 1 })) },
  { insulationId: 4, insulationName: 'THERM FACADE', insulationManufacturer: 'RAFINAD', insulationType: 'Пенопласт', insulationThicknessMm: 50, insulationWidthMm: 600, insulationLengthMm: 1200, insulationPriceRubM2: 322.22, insulationApplication: 'Фасады под штукатурку', insulationSku: '142357',
    insulationDescription: 'Пенополистирольная плита для фасадов под штукатурку. Марка RAFINAD THERM FACADE ППС16Ф-Р-А. Фрезерованная поверхность с микроканавками улучшает сцепление со штукатуркой. Размер — 1200 × 600 × 50 мм. Площадь плит в упаковке — 4,32 м².',
    insulationStatus: 'published', insulationImageKey: 'rafinad-facade-50.jpg', insulationVideoKey: 'rafinad-facade-50.mp4', insulationSourceUrl: 'https://www.tstn.ru/product/rafinad-therm-facade-1200kh600kh50/',
    insulationLikes: Array.from({ length: 9 }, (_, i) => ({ insulationReaderId: i + 1 })) },
  { insulationId: 5, insulationName: 'LOGICPIR Баня', insulationManufacturer: 'ТЕХНОНИКОЛЬ', insulationType: 'PIR-плита', insulationThicknessMm: 50, insulationWidthMm: 590, insulationLengthMm: 1190, insulationPriceRubM2: 1038.60, insulationApplication: 'Бани и сауны', insulationSku: '684039',
    insulationDescription: 'Теплоизоляционная плита LOGICPIR Баня с фольгированным покрытием Ф/Ф. Размер — 1190 × 590 × 50 мм, L-образная кромка. В карточке продавца указана группа горючести Г1.',
    insulationStatus: 'published', insulationImageKey: 'logicpir-banya-50.jpg', insulationVideoKey: 'logicpir-banya-50.mp4', insulationSourceUrl: 'https://www.tstn.ru/product/logicpir-banya-f-f-g2-l-1190kh590kh50/',
    insulationLikes: Array.from({ length: 18 }, (_, i) => ({ insulationReaderId: i + 1 })) },
  { insulationId: 6, insulationName: 'LOGICPIR СХМ/СХМ', insulationManufacturer: 'ТЕХНОНИКОЛЬ', insulationType: 'PIR-плита', insulationThicknessMm: 50, insulationWidthMm: 590, insulationLengthMm: 1190, insulationPriceRubM2: 1570.15, insulationApplication: 'Кровли и слоистые стены', insulationSku: '696675',
    insulationDescription: 'Теплоизоляционная плита LOGICPIR с покрытием СХМ/СХМ и L-образной кромкой. Размер — 1190 × 590 × 50 мм. В упаковке 5 плит, суммарная площадь — 3,5105 м². В карточке продавца указана группа горючести Г4.',
    insulationStatus: 'published', insulationImageKey: 'logicpir-skhm-50.jpg', insulationVideoKey: 'logicpir-skhm-50.mp4', insulationSourceUrl: 'https://www.tstn.ru/product/logicpir-skhm-skhm-l-1190kh590kh50/',
    insulationLikes: Array.from({ length: 21 }, (_, i) => ({ insulationReaderId: i + 1 })) },
  { insulationId: 7, insulationName: 'Технолайт Оптима', insulationManufacturer: 'ТЕХНОНИКОЛЬ', insulationType: 'Минвата', insulationThicknessMm: 100, insulationWidthMm: 600, insulationLengthMm: 1200, insulationPriceRubM2: 563.19, insulationApplication: 'Каркасные стены', insulationSku: '012890',
    insulationDescription: 'Каменная вата для каркасных стен и ненагружаемых перекрытий. Размер — 1200 × 600 × 100 мм. Теплопроводность при условиях D — 0,037 Вт/(м·К).',
    insulationStatus: 'draft', insulationImageKey: 'technolight-optima-100-draft.jpg', insulationVideoKey: 'technolight-optima-100-draft.mp4', insulationSourceUrl: 'https://www.tstn.ru/product/bazaltovyy-uteplitel-tekhnonikol-tekhnolayt-optima-1200kh600kh100-mm-6-sht/', insulationLikes: [] },
  { insulationId: 8, insulationName: 'Архивный вариант Технолайт Оптима', insulationManufacturer: 'ТЕХНОНИКОЛЬ', insulationType: 'Минвата', insulationThicknessMm: 50, insulationWidthMm: 600, insulationLengthMm: 1200, insulationPriceRubM2: 281.60, insulationApplication: 'Архив', insulationSku: '012889',
    insulationDescription: 'Удалённая учебная запись. Не отображается ни в каталоге, ни в ленте, ни в черновике.', insulationStatus: 'deleted', insulationImageKey: 'technolight-optima-50.jpg', insulationVideoKey: 'technolight-optima-50.mp4', insulationSourceUrl: 'https://www.tstn.ru/product/bazaltovyy-uteplitel-tekhnonikol-tekhnolayt-optima-1200kh600kh50-mm-12-sht/', insulationLikes: [] }
];
