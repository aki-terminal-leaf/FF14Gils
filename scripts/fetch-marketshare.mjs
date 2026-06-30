import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  assertMarketshareResponse,
  createSnapshot,
} from '../src/marketshare.js';
import {
  DEFAULT_SALES_PERIOD,
  buildWorldPeriodSnapshotPath,
  createWorldIndex,
  parseWorldList,
  parseSalesPeriodList,
  resolveDefaultWorld,
} from '../src/worlds.js';
import {
  DEFAULT_MAX_ITEMS,
  UNIVERSALIS_MARKETABLE_ENDPOINT,
  buildUniversalisAggregatedUrl,
  chunkItemIds,
  normalizeItemIds,
  normalizeUniversalisAggregatedResponse,
} from './marketshare-api.mjs';
import {
  fetchItemNames,
  fetchUniversalisItemData,
  normalizeItemDataLanguage,
} from './item-name-api.mjs';
import { fetchWithRetry } from './retry-fetch.mjs';

const dataDir = fileURLToPath(new URL('../data/', import.meta.url));
const outputPath = fileURLToPath(new URL('../data/marketshare.json', import.meta.url));
const itemNameLanguage = normalizeItemDataLanguage(
  process.env.FF14GILS_ITEM_NAME_LANGUAGE ?? 'tc',
);
const itemNameCachePath = fileURLToPath(
  new URL(`../data/item-names-${itemNameLanguage}.json`, import.meta.url),
);
const worldsDir = fileURLToPath(new URL('../data/worlds/', import.meta.url));
const worldIndexPath = fileURLToPath(new URL('../data/worlds.json', import.meta.url));
const retryOptions = {
  retries: Number(process.env.FF14GILS_FETCH_RETRIES ?? 3),
  baseDelayMs: Number(process.env.FF14GILS_FETCH_RETRY_DELAY_MS ?? 1000),
};
const chunkDelayMs = Number(process.env.FF14GILS_FETCH_CHUNK_DELAY_MS ?? 0);
const worlds = parseWorldList(process.env.FF14GILS_WORLDS);
const periods = parseSalesPeriodList(process.env.FF14GILS_PERIODS);
const query = {
  salesAmount: process.env.FF14GILS_SALES_AMOUNT ?? 1,
  averagePrice: process.env.FF14GILS_AVERAGE_PRICE ?? 1,
  preset: process.env.FF14GILS_PRESET ?? 'all',
  sortBy: process.env.FF14GILS_SORT_BY ?? 'marketValue',
  filters: [0],
};
const maxItems = Number(process.env.FF14GILS_MAX_ITEMS ?? DEFAULT_MAX_ITEMS);
const itemLimit = parseItemLimit(process.env.FF14GILS_ITEM_LIMIT);
const defaultWorld = resolveDefaultWorld(worlds, process.env.FF14GILS_SERVER);

const itemData = await loadItemData();
const marketableItemIds = await fetchMarketableItemIds();
const itemIds = selectItemIds(marketableItemIds, itemData, itemLimit);
const itemNames = await resolveItemNames(itemIds, itemData);
const marketshareResults = [];

console.log(`Scanning ${itemIds.length} marketable items across ${worlds.length} worlds`);

for (const world of worlds) {
  const results = await fetchWorldAggregatedRows(world, itemIds);
  console.log(`Fetched ${results.length} Universalis aggregated rows for ${world}`);

  for (const period of periods) {
    const result = createWorldMarketshare(world, period, results, itemNames, itemData);
    marketshareResults.push(result);
    console.log(
      `Prepared ${result.apiResponse.data.length} recommendation items for ${world} (${period.label})`,
    );
  }
}

const snapshots = marketshareResults.map(({ apiResponse, query: snapshotQuery }) =>
  createSnapshot({
    query: snapshotQuery,
    response: apiResponse,
    source: 'https://universalis.app/api/v2/aggregated',
    itemNames,
    itemNameLanguage,
  }),
);

await mkdir(dataDir, { recursive: true });
await mkdir(worldsDir, { recursive: true });
await writeJsonAtomically(itemNameCachePath, itemNames);

for (const snapshot of snapshots) {
  await writeJsonAtomically(
    fileURLToPath(
      new URL(
        `../${buildWorldPeriodSnapshotPath(snapshot.query.server, snapshot.query.periodKey)}`,
        import.meta.url,
      ),
    ),
    snapshot,
  );
}

const defaultSnapshot =
  snapshots.find(
    (snapshot) =>
      snapshot.query.server === defaultWorld &&
      snapshot.query.periodKey === DEFAULT_SALES_PERIOD,
  ) ?? snapshots.find((snapshot) => snapshot.query.server === defaultWorld) ?? snapshots[0];
await writeJsonAtomically(outputPath, defaultSnapshot);
await writeJsonAtomically(
  worldIndexPath,
  createWorldIndex({
    worlds,
    defaultWorld: defaultSnapshot.query.server,
    periods,
    defaultPeriod: DEFAULT_SALES_PERIOD,
    generatedAt: new Date(),
  }),
);

console.log(
  `Wrote ${snapshots.length} period snapshots. Default: ${defaultSnapshot.query.server} (${defaultSnapshot.query.periodKey})`,
);

async function loadItemData() {
  const cached = await readJsonIfExists(itemNameCachePath);
  if (Object.values(cached)[0]?.name) return cached;

  return fetchUniversalisItemData({
    language: itemNameLanguage,
    log: (message) => console.warn(message),
  });
}

async function fetchMarketableItemIds() {
  const response = await fetchWithRetry(
    UNIVERSALIS_MARKETABLE_ENDPOINT,
    {
      headers: {
        'user-agent': 'FF14Gils Universalis marketable fetcher',
      },
    },
    retryOptions,
  );

  if (!response.ok) {
    throw new Error(`Universalis marketable API failed: ${response.status} ${response.statusText}`);
  }

  return normalizeItemIds(await response.json());
}

function parseItemLimit(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (!normalized) return DEFAULT_MAX_ITEMS;
  if (['all', 'full', '*'].includes(normalized)) return Infinity;

  const limit = Number(normalized);
  return Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_MAX_ITEMS;
}

function selectItemIds(marketableItemIds, itemData, limit) {
  const candidates = marketableItemIds.filter((itemId) => itemData[String(itemId)]);
  if (limit === Infinity) return candidates;
  return candidates.slice(0, Math.max(1, Number(limit) || DEFAULT_MAX_ITEMS));
}

async function fetchWorldAggregatedRows(world, itemIds) {
  const results = [];

  const chunks = chunkItemIds(itemIds);
  for (const [index, chunk] of chunks.entries()) {
    const url = buildUniversalisAggregatedUrl(world, chunk);
    const response = await fetchWithRetry(
      url,
      {
        headers: {
          'user-agent': 'FF14Gils Universalis data fetcher',
        },
      },
      retryOptions,
    );

    if (!response.ok) {
      throw new Error(`Universalis aggregated API failed for ${world}: ${response.status} ${response.statusText}`);
    }

    const payload = await response.json();
    results.push(...(Array.isArray(payload?.results) ? payload.results : []));

    if (chunkDelayMs > 0 && index < chunks.length - 1) {
      await sleep(chunkDelayMs);
    }
  }

  return results;
}

function createWorldMarketshare(world, period, results, itemNames, itemData) {
  const apiResponse = normalizeUniversalisAggregatedResponse(
    { results },
    {
      itemNames,
      itemData,
      maxItems,
      periodHours: period.hours,
      sortBy: query.sortBy,
    },
  );
  assertMarketshareResponse(apiResponse);

  return {
    query: {
      ...query,
      server: world,
      periodKey: period.key,
      periodLabel: period.label,
      timePeriod: period.hours,
      scannedItemCount: results.length,
    },
    apiResponse,
  };
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function resolveItemNames(itemIds, itemData) {
  const cachedNames = await readJsonIfExists(itemNameCachePath);
  const cachedPlainNames = Object.fromEntries(
    Object.entries(cachedNames)
      .filter(([, value]) => typeof value === 'string')
      .map(([itemId, name]) => [itemId, name]),
  );
  const missingIds = itemIds
    .map(String)
    .filter((itemId) => !cachedPlainNames[itemId]);

  if (missingIds.length > 0) {
    console.log(
      `Resolving ${missingIds.length} ${itemNameLanguage} item names from Universalis item data`,
    );
  }

  const fetchedNames = await fetchItemNames(missingIds, {
    itemData,
    language: itemNameLanguage,
  });
  const itemNames = Object.fromEntries(
    Object.entries({ ...cachedPlainNames, ...fetchedNames })
      .filter(([itemId]) => itemIds.map(String).includes(itemId))
      .sort(([left], [right]) => Number(left) - Number(right)),
  );

  console.log(`Resolved ${Object.keys(itemNames).length} ${itemNameLanguage} item names`);

  return itemNames;
}

async function readJsonIfExists(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

async function writeJsonAtomically(path, data) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(`${path}.tmp`, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  await rename(`${path}.tmp`, path);
}
