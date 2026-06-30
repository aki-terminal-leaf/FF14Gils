import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import {
  extractUniversalisItemData,
  fetchItemNames,
  normalizeItemDataLanguage,
  resolveUniversalisAppChunkUrl,
} from '../scripts/item-name-api.mjs';

const tcItemBundle =
  "rV:function(){return ae},x=JSON.parse('{\"2\":{\"id\":2,\"name\":\"火之碎晶\",\"description\":\"簡中\"}}'),R=JSON.parse('{\"2\":{\"id\":2,\"name\":\"火之碎晶\",\"description\":\"繁中\"},\"3\":{\"id\":3,\"name\":\"冰之碎晶\",\"description\":\"繁中\"}}');function ae(e,i){return re(e,i)}";

describe('Universalis item data', () => {
  it('首頁 HTML から Universalis _app chunk URL を解決する', async () => {
    const url = await resolveUniversalisAppChunkUrl({
      homeUrl: 'https://universalis.app/',
      fetchImpl: async () => ({
        ok: true,
        text: async () =>
          '<script src="/_next/static/chunks/pages/_app-1234567890abcdef.js"></script>',
      }),
    });

    assert.equal(
      url,
      'https://universalis.app/_next/static/chunks/pages/_app-1234567890abcdef.js',
    );
  });

  it('Universalis 前端資料包から tc 道具名を取り出す', () => {
    const data = extractUniversalisItemData(tcItemBundle, 'zh-TW');

    assert.equal(data['2'].name, '火之碎晶');
    assert.equal(data['2'].description, '繁中');
    assert.equal(normalizeItemDataLanguage('zh-TW'), 'tc');
  });

  it('重複IDをまとめ、繁中道具名をID別に返す', async () => {
    const names = await fetchItemNames(['2', '3', '2'], {
      itemData: extractUniversalisItemData(tcItemBundle, 'tc'),
      language: 'tc',
    });

    assert.deepEqual(names, {
      2: '火之碎晶',
      3: '冰之碎晶',
    });
  });
});
