import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import {
  WORLD_COOKIE_NAME,
  buildWorldPreferenceCookie,
  readCookieValue,
  resolvePreferredWorld,
} from '../src/preferences.js';

const worldIndex = {
  defaultWorld: '伊弗利特',
  worlds: [
    { name: '伊弗利特', path: 'data/worlds/ifrit.json' },
    { name: '泰坦', path: 'data/worlds/titan.json' },
  ],
};

describe('readCookieValue', () => {
  it('Cookie文字列からワールド名を取り出す', () => {
    assert.equal(
      readCookieValue(`theme=dark; ${WORLD_COOKIE_NAME}=Chocobo`, WORLD_COOKIE_NAME),
      'Chocobo',
    );
  });
});

describe('resolvePreferredWorld', () => {
  it('保存済みワールドが有効ならそれを優先する', () => {
    assert.equal(resolvePreferredWorld(worldIndex, `${WORLD_COOKIE_NAME}=泰坦`), '泰坦');
  });

  it('保存済みワールドがない場合は伊弗利特を初期表示にする', () => {
    assert.equal(resolvePreferredWorld(worldIndex, ''), '伊弗利特');
  });

  it('存在しない保存済みワールドは無視する', () => {
    assert.equal(resolvePreferredWorld(worldIndex, `${WORLD_COOKIE_NAME}=Missing`), '伊弗利特');
  });
});

describe('buildWorldPreferenceCookie', () => {
  it('選択したワールドをCookieへ保存する文字列を作る', () => {
    assert.equal(
      buildWorldPreferenceCookie('泰坦'),
      `${WORLD_COOKIE_NAME}=%E6%B3%B0%E5%9D%A6; Max-Age=15552000; Path=/; SameSite=Lax`,
    );
  });
});
