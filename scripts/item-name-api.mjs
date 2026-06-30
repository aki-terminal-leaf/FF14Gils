export const UNIVERSALIS_HOME = 'https://universalis.app/';
export const SUPPORTED_ITEM_DATA_LANGUAGES = ['ja', 'en', 'de', 'fr', 'chs', 'ko', 'tc'];

const DEFAULT_LANGUAGE = 'tc';
const APP_CHUNK_PATTERN = /\/_next\/static\/chunks\/pages\/_app-[^"']+\.js/;

export async function fetchItemNames(
  itemIds,
  {
    fetchImpl = fetch,
    itemData,
    language = DEFAULT_LANGUAGE,
    log = () => {},
  } = {},
) {
  const ids = normalizeItemIds(itemIds);
  const data =
    itemData ?? (await fetchUniversalisItemData({ fetchImpl, language, log }));

  return Object.fromEntries(
    ids
      .map((id) => [id, data[id]?.name?.trim()])
      .filter(([, name]) => name)
      .sort(([left], [right]) => Number(left) - Number(right)),
  );
}

export async function fetchUniversalisItemData({
  fetchImpl = fetch,
  language = DEFAULT_LANGUAGE,
  log = () => {},
} = {}) {
  const normalizedLanguage = normalizeItemDataLanguage(language);
  const appChunkUrl = await resolveUniversalisAppChunkUrl({ fetchImpl });
  const response = await fetchImpl(appChunkUrl, {
    headers: {
      'user-agent': 'FF14Gils Universalis item data fetcher',
    },
  });

  if (!response.ok) {
    throw new Error(`Universalis app chunk failed: ${response.status} ${response.statusText}`);
  }

  const script = await response.text();
  const data = extractUniversalisItemData(script, normalizedLanguage);

  log(`Loaded ${Object.keys(data).length} ${normalizedLanguage} item records from Universalis`);

  return data;
}

export function extractUniversalisItemData(script, language = DEFAULT_LANGUAGE) {
  const normalizedLanguage = normalizeItemDataLanguage(language);
  const moduleStart = script.indexOf('rV:function');
  if (moduleStart === -1) {
    throw new Error('Universalis item data module was not found');
  }
  const moduleEnd = script.indexOf('function ae', moduleStart);
  const source = moduleEnd === -1 ? script.slice(moduleStart) : script.slice(moduleStart, moduleEnd);
  const varByLanguage = {
    ja: 'J',
    en: 'w',
    de: 'A',
    fr: 'M',
    chs: 'x',
    ko: 'G',
    tc: 'R',
  };
  const variable = varByLanguage[normalizedLanguage];
  const pattern = new RegExp(`${variable}=JSON\\.parse\\('((?:\\\\.|[^\\\\'])*)'\\)`);
  const match = source.match(pattern);

  if (!match) {
    throw new Error(`Universalis ${normalizedLanguage} item data bundle was not found`);
  }

  return JSON.parse(evaluateJsStringLiteral(match[1]));
}

export async function resolveUniversalisAppChunkUrl({
  fetchImpl = fetch,
  homeUrl = UNIVERSALIS_HOME,
} = {}) {
  const response = await fetchImpl(homeUrl, {
    headers: {
      'user-agent': 'FF14Gils Universalis item data fetcher',
    },
  });

  if (!response.ok) {
    throw new Error(`Universalis homepage failed: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const path = html.match(APP_CHUNK_PATTERN)?.[0];
  if (!path) {
    throw new Error('Universalis _app chunk path was not found');
  }

  return new URL(path, homeUrl).toString();
}

export function normalizeItemDataLanguage(language) {
  const value = String(language ?? '').trim().toLowerCase().replace('_', '-');
  if (value === 'zh' || value === 'zh-tw' || value === 'traditional-chinese') return 'tc';
  if (value === 'zh-cn' || value === 'cn') return 'chs';

  return SUPPORTED_ITEM_DATA_LANGUAGES.includes(value) ? value : DEFAULT_LANGUAGE;
}

export function normalizeXivapiLanguage(language) {
  return normalizeItemDataLanguage(language);
}

export function fetchJapaneseItemNames(itemIds, options = {}) {
  return fetchItemNames(itemIds, { ...options, language: 'ja' });
}

export function normalizeItemIds(itemIds) {
  return [
    ...new Set(
      [...(itemIds ?? [])]
        .map((itemId) => normalizeItemId(itemId))
        .filter(Boolean),
    ),
  ].sort((left, right) => Number(left) - Number(right));
}

function normalizeItemId(itemId) {
  const value = String(itemId ?? '').trim();
  return /^\d+$/.test(value) ? value : '';
}

function evaluateJsStringLiteral(value) {
  return Function(`"use strict"; return '${value}';`)();
}
