import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import {
  DEFAULT_SALES_PERIOD,
  DEFAULT_WORLDS,
  WORLD_DATA_CENTERS,
  WORLD_DATA_CENTER_REGIONS,
  buildWorldPeriodSnapshotPath,
  createWorldIndex,
  filterWorldsByDataCenter,
  listDataCenterGroupsForWorlds,
  listDataCentersForWorlds,
  normalizeWorldIndex,
  parseSalesPeriodList,
  parseWorldList,
  resolveDefaultWorld,
  resolveWorldDataCenter,
  worldSlug,
} from '../src/worlds.js';

describe('Traditional Chinese worlds', () => {
  it('繁中服陸行鳥 DC 的 8 個世界を既定対象にする', () => {
    assert.deepEqual(WORLD_DATA_CENTERS, [
      {
        name: '陸行鳥',
        worlds: ['伊弗利特', '迦樓羅', '利維坦', '鳳凰', '奧汀', '巴哈姆特', '拉姆', '泰坦'],
      },
    ]);
    assert.deepEqual(WORLD_DATA_CENTER_REGIONS, [
      { key: 'traditionalChinese', dataCenters: ['陸行鳥'] },
    ]);
    assert.deepEqual(DEFAULT_WORLDS, WORLD_DATA_CENTERS[0].worlds);
  });

  it('繁中世界名を安定した JSON path slug にする', () => {
    assert.equal(worldSlug('伊弗利特'), 'ifrit');
    assert.equal(worldSlug('迦樓羅'), 'garuda');
    assert.equal(buildWorldPeriodSnapshotPath('伊弗利特', '7d'), 'data/worlds/ifrit.json');
    assert.equal(buildWorldPeriodSnapshotPath('伊弗利特', '1d'), 'data/worlds/ifrit-1d.json');
  });

  it('未指定時は繁中服全世界を返し、既定世界は伊弗利特にする', () => {
    assert.deepEqual(parseWorldList(''), DEFAULT_WORLDS);
    assert.equal(resolveDefaultWorld(['伊弗利特', '泰坦']), '伊弗利特');
    assert.equal(resolveDefaultWorld(['泰坦'], '鳳凰'), '泰坦');
    assert.equal(resolveWorldDataCenter('巴哈姆特'), '陸行鳥');
  });

  it('worlds.json contract を生成する', () => {
    const index = createWorldIndex({
      worlds: ['伊弗利特', '泰坦'],
      defaultWorld: '泰坦',
      generatedAt: '2026-06-30T00:00:00.000Z',
    });

    assert.equal(index.defaultWorld, '泰坦');
    assert.equal(index.defaultPeriod, DEFAULT_SALES_PERIOD);
    assert.deepEqual(index.worlds.map((world) => `${world.dataCenter}:${world.name}`), [
      '陸行鳥:伊弗利特',
      '陸行鳥:泰坦',
    ]);
    assert.equal(index.worlds[0].path, 'data/worlds/ifrit.json');
  });

  it('資料中心 helper 只列出繁中服群組', () => {
    const worlds = [
      { name: '伊弗利特', dataCenter: '陸行鳥' },
      { name: '泰坦', dataCenter: '陸行鳥' },
    ];

    assert.deepEqual(listDataCentersForWorlds(worlds), ['陸行鳥']);
    assert.deepEqual(listDataCenterGroupsForWorlds(worlds), [
      { key: 'traditionalChinese', dataCenters: ['陸行鳥'] },
    ]);
    assert.deepEqual(filterWorldsByDataCenter(worlds, '陸行鳥').map((world) => world.name), [
      '伊弗利特',
      '泰坦',
    ]);
  });
});

describe('sales periods and fallback index', () => {
  it('売上期間を重複なしで解決する', () => {
    assert.deepEqual(
      parseSalesPeriodList('1d, 7d\n30d,1d').map((period) => period.key),
      ['1d', '7d'],
    );
  });

  it('不完全な world index を補正する', () => {
    const normalized = normalizeWorldIndex({
      defaultWorld: '泰坦',
      worlds: [{ name: '泰坦', path: 'data/worlds/titan.json' }],
      periods: [{ key: '7d' }],
    });

    assert.equal(normalized.defaultWorld, '泰坦');
    assert.equal(normalized.worlds[0].dataCenter, '陸行鳥');
    assert.equal(normalized.worlds[0].periods['7d'], 'data/worlds/titan.json');
  });
});
