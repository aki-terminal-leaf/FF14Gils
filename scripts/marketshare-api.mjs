export const UNIVERSALIS_AGGREGATED_ENDPOINT =
  'https://universalis.app/api/v2/aggregated';
export const UNIVERSALIS_MARKETABLE_ENDPOINT =
  'https://universalis.app/api/v2/marketable';

export const DEFAULT_MAX_ITEMS = 300;
export const UNIVERSALIS_BATCH_SIZE = 100;

export function buildUniversalisAggregatedUrl(worldDcRegion, itemIds) {
  const normalizedServer = String(worldDcRegion ?? '').trim();
  const ids = normalizeItemIds(itemIds);

  if (!normalizedServer) {
    throw new Error('worldDcRegion is required');
  }
  if (ids.length === 0) {
    throw new Error('at least one item id is required');
  }
  if (ids.length > UNIVERSALIS_BATCH_SIZE) {
    throw new Error(`Universalis supports at most ${UNIVERSALIS_BATCH_SIZE} item ids`);
  }

  return `${UNIVERSALIS_AGGREGATED_ENDPOINT}/${encodeURIComponent(normalizedServer)}/${ids.join(',')}`;
}

export function normalizeUniversalisAggregatedResponse(
  response,
  {
    itemNames = {},
    itemData = {},
    periodHours = 168,
    sortBy = 'marketValue',
    maxItems = DEFAULT_MAX_ITEMS,
  } = {},
) {
  const periodDays = Math.max(1, Number(periodHours) / 24 || 1);
  const rows = Array.isArray(response?.results) ? response.results : [];
  const items = rows
    .map((row) => convertAggregatedRow(row, { itemNames, itemData, periodDays }))
    .filter(Boolean)
    .filter((item) => item.quantitySold > 0 || item.minPrice > 0)
    .sort((left, right) => compareItems(left, right, sortBy))
    .slice(0, Math.max(1, Number(maxItems) || DEFAULT_MAX_ITEMS));

  return { data: items };
}

export function chunkItemIds(itemIds, size = UNIVERSALIS_BATCH_SIZE) {
  const ids = normalizeItemIds(itemIds);
  const chunks = [];

  for (let index = 0; index < ids.length; index += size) {
    chunks.push(ids.slice(index, index + size));
  }

  return chunks;
}

export function normalizeItemIds(itemIds) {
  return [
    ...new Set(
      [...(itemIds ?? [])]
        .map((itemId) => Number.parseInt(String(itemId).trim(), 10))
        .filter((itemId) => Number.isInteger(itemId) && itemId > 0),
    ),
  ].sort((left, right) => left - right);
}

function convertAggregatedRow(row, { itemNames, itemData, periodDays }) {
  const itemId = Number.parseInt(String(row?.itemId ?? ''), 10);
  if (!Number.isInteger(itemId)) return null;

  const id = String(itemId);
  const nq = row?.nq ?? {};
  const hq = row?.hq ?? {};
  const minPrice = minPositive([
    nq.minListing?.dc?.price,
    nq.minListing?.world?.price,
    hq.minListing?.dc?.price,
    hq.minListing?.world?.price,
  ]);
  const averagePrice =
    weightedAverage([
      {
        price: nq.averageSalePrice?.dc?.price ?? nq.averageSalePrice?.world?.price,
        quantity: nq.dailySaleVelocity?.dc?.quantity ?? nq.dailySaleVelocity?.world?.quantity,
      },
      {
        price: hq.averageSalePrice?.dc?.price ?? hq.averageSalePrice?.world?.price,
        quantity: hq.dailySaleVelocity?.dc?.quantity ?? hq.dailySaleVelocity?.world?.quantity,
      },
    ]) || minPrice || 0;
  const dailyVelocity =
    toNumber(nq.dailySaleVelocity?.dc?.quantity ?? nq.dailySaleVelocity?.world?.quantity) +
    toNumber(hq.dailySaleVelocity?.dc?.quantity ?? hq.dailySaleVelocity?.world?.quantity);
  const quantitySold = Math.round(dailyVelocity * periodDays);
  const marketValue = Math.round(averagePrice * quantitySold);
  const percentChange =
    averagePrice > 0 && minPrice > 0
      ? Math.round(((minPrice - averagePrice) / averagePrice) * 1000) / 10
      : 0;
  const name = itemNames[id] ?? itemData[id]?.name ?? `Item ${id}`;

  return {
    avg: Math.round(averagePrice),
    itemID: id,
    marketValue,
    median: Math.round(averagePrice),
    minPrice: minPrice ?? 0,
    name,
    npc_vendor_info: '',
    percentChange,
    purchaseAmount: quantitySold,
    quantitySold,
    state: minPrice ? marketState({ percentChange, quantitySold }) : 'out of stock',
    url: `https://universalis.app/market/${id}`,
  };
}

function marketState({ percentChange, quantitySold }) {
  if (quantitySold <= 0) return 'slow';
  if (percentChange >= 25) return 'increasing';
  if (percentChange <= -25) return 'decreasing';
  return 'stable';
}

function minPositive(values) {
  const numbers = values.map(toNumber).filter((value) => value > 0);
  return numbers.length > 0 ? Math.min(...numbers) : null;
}

function weightedAverage(values) {
  let weightedTotal = 0;
  let totalQuantity = 0;

  for (const value of values) {
    const price = toNumber(value.price);
    const quantity = toNumber(value.quantity);
    if (price <= 0 || quantity <= 0) continue;

    weightedTotal += price * quantity;
    totalQuantity += quantity;
  }

  return totalQuantity > 0 ? weightedTotal / totalQuantity : 0;
}

function compareItems(left, right, sortBy) {
  const key = ['quantitySold', 'minPrice', 'avg', 'percentChange'].includes(sortBy)
    ? sortBy
    : 'marketValue';

  return (toNumber(right[key]) - toNumber(left[key])) || left.name.localeCompare(right.name);
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}
