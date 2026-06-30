import { readCookieValue } from './preferences.js';

export const DEFAULT_LANGUAGE = 'zh';
export const LANGUAGE_COOKIE_NAME = 'ff14gils_language';
export const LANGUAGE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;
export const SUPPORTED_LANGUAGES = ['zh', 'ja', 'en'];

const TRANSLATIONS = {
  zh: {
    format: {
      gilUnit: 'gil',
    },
    dataCenterRegions: {
      europe: '歐洲資料中心',
      japan: '日本資料中心',
      northAmerica: '北美資料中心',
      oceania: '大洋洲資料中心',
      other: '其他資料中心',
    },
    meta: {
      title: 'FF14Gils | FF14 市場賺錢看板',
      description:
        'FF14 繁體中文玩家用的市場看板，可從銷售額、價格與成交量找出適合販售的金策候選。',
      ogDescription:
        '從市場銷售量與價格趨勢找出比較容易賣出的金策候選。預設 Typhon，聚焦國際服資料。',
      imageAlt: 'FF14Gils 繁體中文市場賺錢看板圖片',
      locale: 'zh_TW',
      inLanguage: 'zh-TW',
    },
    periods: {
      '1d': '1 天',
      '3d': '3 天',
      '7d': '7 天',
    },
    recommendations: {
      candidate: '候選',
      hot: '熱門',
      needsRestock: '補貨候選',
      rising: '上升',
      steady: '穩定',
    },
    results: {
      count: '{count} 筆',
    },
    sort: {
      avg: '平均價格',
      marketValue: '銷售額',
      minPrice: '最低價',
      name: '道具名稱',
      opportunityScore: '推薦度',
      percentChange: '價格變化',
      quantitySold: '成交量',
      state: '狀態',
    },
    states: {
      decreasing: '下跌',
      increasing: '上升中',
      out_of_stock: '缺貨',
      spiking: '急漲',
      stable: '穩定',
      unknown: '未知',
    },
    table: {
      avg: '平均價格',
      item: '道具',
      marketValue: '銷售額',
      minPrice: '最低價',
      percentChange: '價格變化',
      quantitySold: '成交量',
      rank: '排名',
      state: '狀態',
    },
    ui: {
      dataCenterLabel: '資料中心',
      dataCenterSelect: '選擇資料中心',
      emptyState: '沒有符合目前條件的道具。',
      eyebrow: 'FF14 市場金策',
      filterHelp: '選擇資料中心後會縮小世界清單。選過的世界下次會自動沿用。',
      filterKicker: '條件',
      filterPanelLabel: '篩選條件',
      filterTitle: '篩選',
      itemSearch: '道具搜尋',
      kofiSupport: '在 Ko-fi 支援原作者',
      languageLabel: '顯示語言',
      languageSelect: '選擇顯示語言',
      lead: '從市場銷售量與價格趨勢，找出比較容易賣出的金策候選。',
      loadError: '資料讀取失敗：{message}',
      minQuantity: '最低成交量',
      missingContract: 'JSON 契約缺少欄位：{keys}',
      otherDataCenter: '其他',
      periodLabel: '統計期間',
      periodSelect: '選擇銷售統計期間',
      resultsKicker: '清單',
      resultsLabel: '金策候選',
      resultsTitle: '金策候選',
      searchLabel: '道具搜尋',
      searchPlaceholder: '英文名、日文名或 ID',
      sortLabel: '排序',
      stateLegend: '狀態',
      updatedAt: '最後更新 {datetime}',
      updatedAtUnknown: '最後更新 -',
      worldLabel: '世界',
      worldSelect: '選擇世界',
      itemsNotArray: 'items 不是陣列',
    },
  },
  ja: {
    format: {
      gilUnit: 'ギル',
    },
    dataCenterRegions: {
      europe: '欧州データセンター',
      japan: '日本データセンター',
      northAmerica: '北米データセンター',
      oceania: 'オセアニアデータセンター',
      other: 'その他のデータセンター',
    },
    meta: {
      title: 'FF14Gils | FF14 マーケット金策',
      description:
        'FF14のマーケット売上、相場、販売数から、全DCの金策候補を探せるダークテーマのマーケットダッシュボードです。',
      ogDescription:
        'マーケットの売れ行きと相場から、売りやすい金策候補を探せます。Typhon初期表示、国際版サーバー対応。',
      imageAlt: 'FF14Gilsのマーケット金策ダッシュボード画像',
      locale: 'ja_JP',
      inLanguage: 'ja-JP',
    },
    periods: {
      '1d': '1日',
      '3d': '3日',
      '7d': '7日',
    },
    recommendations: {
      candidate: '候補',
      hot: '高騰',
      needsRestock: '補充候補',
      rising: '上昇',
      steady: '堅調',
    },
    results: {
      count: '{count} 件',
    },
    sort: {
      avg: '平均価格',
      marketValue: '売上額',
      minPrice: '最安値',
      name: 'アイテム名',
      opportunityScore: 'おすすめ度',
      percentChange: '価格変動',
      quantitySold: '売れた数',
      state: '状態',
    },
    states: {
      decreasing: '値下がり',
      increasing: '上昇中',
      out_of_stock: '在庫なし',
      spiking: '急騰',
      stable: '安定',
      unknown: '不明',
    },
    table: {
      avg: '平均価格',
      item: 'アイテム',
      marketValue: '売上額',
      minPrice: '最安値',
      percentChange: '価格変動',
      quantitySold: '売れた数',
      rank: '順位',
      state: '状態',
    },
    ui: {
      dataCenterLabel: 'データセンター',
      dataCenterSelect: 'DCを選択',
      emptyState: '条件に一致するアイテムがありません。',
      eyebrow: 'FF14 マーケット金策',
      filterHelp: 'DCを選ぶとワールド候補を絞れます。選んだワールドは次回も使えます。',
      filterKicker: '条件',
      filterPanelLabel: '絞り込み',
      filterTitle: '絞り込み',
      itemSearch: 'アイテム検索',
      kofiSupport: 'Ko-fiで支援する',
      languageLabel: '表示言語',
      languageSelect: '表示言語を選択',
      lead: 'マーケットの売れ行きと相場から、売りやすい金策候補を探せます。',
      loadError: 'データを読み込めませんでした: {message}',
      minQuantity: '最低販売数',
      missingContract: 'JSON契約が不足しています: {keys}',
      otherDataCenter: 'その他',
      periodLabel: '集計期間',
      periodSelect: '売上の集計期間',
      resultsKicker: '一覧',
      resultsLabel: '金策候補',
      resultsTitle: '金策候補',
      searchLabel: 'アイテム検索',
      searchPlaceholder: '日本語名・英語名・ID',
      sortLabel: '並び替え',
      stateLegend: '状態',
      updatedAt: '最終更新 {datetime}',
      updatedAtUnknown: '最終更新 -',
      worldLabel: 'ワールド',
      worldSelect: 'ワールドを選択',
      itemsNotArray: 'items が配列ではありません',
    },
  },
  en: {
    format: {
      gilUnit: 'gil',
    },
    dataCenterRegions: {
      europe: 'European Data Centers',
      japan: 'Japanese Data Centers',
      northAmerica: 'North American Data Centers',
      oceania: 'Oceanic Data Centers',
      other: 'Other Data Centers',
    },
    meta: {
      title: 'FF14Gils | FF14 Market Profit Dashboard',
      description:
        'A dark market dashboard for finding profitable Final Fantasy XIV items from sales, prices, and purchase volume across all data centers.',
      ogDescription:
        'Find easier-to-sell market opportunities from sales volume and price trends. Starts on Typhon and uses global server data.',
      imageAlt: 'FF14Gils market profit dashboard image',
      locale: 'en_US',
      inLanguage: 'en-US',
    },
    periods: {
      '1d': '1 day',
      '3d': '3 days',
      '7d': '7 days',
    },
    recommendations: {
      candidate: 'Candidate',
      hot: 'Hot',
      needsRestock: 'Restock',
      rising: 'Rising',
      steady: 'Steady',
    },
    results: {
      count: '{count} items',
    },
    sort: {
      avg: 'Average price',
      marketValue: 'Sales',
      minPrice: 'Lowest price',
      name: 'Item name',
      opportunityScore: 'Recommendation',
      percentChange: 'Price change',
      quantitySold: 'Sold',
      state: 'State',
    },
    states: {
      decreasing: 'Decreasing',
      increasing: 'Increasing',
      out_of_stock: 'Out of stock',
      spiking: 'Spiking',
      stable: 'Stable',
      unknown: 'Unknown',
    },
    table: {
      avg: 'Average price',
      item: 'Item',
      marketValue: 'Sales',
      minPrice: 'Lowest price',
      percentChange: 'Price change',
      quantitySold: 'Sold',
      rank: 'Rank',
      state: 'State',
    },
    ui: {
      dataCenterLabel: 'Data center',
      dataCenterSelect: 'Select data center',
      emptyState: 'No items match the current filters.',
      eyebrow: 'FF14 market profit',
      filterHelp: 'Choose a data center to narrow the world list. Your selected world will be remembered next time.',
      filterKicker: 'Filters',
      filterPanelLabel: 'Filters',
      filterTitle: 'Filters',
      itemSearch: 'Item search',
      kofiSupport: 'Support on Ko-fi',
      languageLabel: 'Language',
      languageSelect: 'Select language',
      lead: 'Find easier-to-sell market opportunities from recent sales and prices.',
      loadError: 'Could not load data: {message}',
      minQuantity: 'Minimum sold',
      missingContract: 'JSON contract is missing: {keys}',
      otherDataCenter: 'Other',
      periodLabel: 'Sales period',
      periodSelect: 'Select sales period',
      resultsKicker: 'Results',
      resultsLabel: 'Profit candidates',
      resultsTitle: 'Profit candidates',
      searchLabel: 'Item search',
      searchPlaceholder: 'Japanese name, English name, or ID',
      sortLabel: 'Sort',
      stateLegend: 'State',
      updatedAt: 'Updated {datetime}',
      updatedAtUnknown: 'Updated -',
      worldLabel: 'World',
      worldSelect: 'Select world',
      itemsNotArray: 'items is not an array',
    },
  },
};

export function normalizeLanguage(language) {
  return parseLanguage(language) ?? DEFAULT_LANGUAGE;
}

export function resolvePreferredLanguage(cookieString = '', browserLanguage = '') {
  const savedLanguage = parseLanguage(readCookieValue(cookieString, LANGUAGE_COOKIE_NAME));
  if (savedLanguage) return savedLanguage;

  return parseLanguage(browserLanguage) ?? DEFAULT_LANGUAGE;
}

export function buildLanguagePreferenceCookie(language) {
  return [
    `${LANGUAGE_COOKIE_NAME}=${encodeURIComponent(normalizeLanguage(language))}`,
    `Max-Age=${LANGUAGE_COOKIE_MAX_AGE_SECONDS}`,
    'Path=/',
    'SameSite=Lax',
  ].join('; ');
}

export function translate(language, key, values = {}) {
  const normalizedLanguage = normalizeLanguage(language);
  const template =
    getTranslationValue(TRANSLATIONS[normalizedLanguage], key) ??
    getTranslationValue(TRANSLATIONS[DEFAULT_LANGUAGE], key) ??
    key;

  return String(template).replace(/\{(\w+)\}/g, (_, name) =>
    Object.hasOwn(values, name) ? String(values[name]) : `{${name}}`,
  );
}

export function localeForLanguage(language) {
  const normalizedLanguage = normalizeLanguage(language);

  if (normalizedLanguage === 'en') return 'en-US';
  if (normalizedLanguage === 'ja') return 'ja-JP';

  return 'zh-TW';
}

export function selectItemDisplayName(item, language = DEFAULT_LANGUAGE) {
  const normalizedLanguage = normalizeLanguage(language);

  if (normalizedLanguage === 'en' || normalizedLanguage === 'zh') {
    return normalizeText(item?.nameEn) || normalizeText(item?.name) || normalizeText(item?.nameJa);
  }

  return normalizeText(item?.nameJa) || normalizeText(item?.name) || normalizeText(item?.nameEn);
}

export function selectItemAlternateName(item, language = DEFAULT_LANGUAGE) {
  const normalizedLanguage = normalizeLanguage(language);
  const displayName = selectItemDisplayName(item, normalizedLanguage);
  const alternateName =
    normalizedLanguage === 'en' || normalizedLanguage === 'zh'
      ? normalizeText(item?.nameJa)
      : normalizeText(item?.nameEn);

  return alternateName && alternateName !== displayName ? alternateName : '';
}

export function periodLabel(periodKey, language = DEFAULT_LANGUAGE, fallback = '') {
  const translated = translate(language, `periods.${periodKey}`);

  return translated === `periods.${periodKey}` ? fallback : translated;
}

export function recommendationLabel(level, language = DEFAULT_LANGUAGE) {
  const key = {
    hot: 'hot',
    'needs-restock': 'needsRestock',
    rising: 'rising',
    steady: 'steady',
  }[level] ?? 'candidate';

  return translate(language, `recommendations.${key}`);
}

function parseLanguage(language) {
  const value = String(language ?? '').trim().toLowerCase().replace('_', '-');
  if (value === 'zh-tw' || value === 'zh-hant') return 'zh';
  const languageCode = value.split('-')[0];

  return SUPPORTED_LANGUAGES.includes(languageCode) ? languageCode : null;
}

function getTranslationValue(source, key) {
  return String(key)
    .split('.')
    .reduce((current, part) => current?.[part], source);
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}
