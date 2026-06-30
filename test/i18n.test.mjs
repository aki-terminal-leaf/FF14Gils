import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_NAME,
  buildLanguagePreferenceCookie,
  normalizeLanguage,
  resolvePreferredLanguage,
  selectItemDisplayName,
  translate,
} from '../src/i18n.js';

describe('i18n language preference', () => {
  it('既定言語は繁體中文にする', () => {
    assert.equal(DEFAULT_LANGUAGE, 'zh');
    assert.equal(resolvePreferredLanguage('', ''), 'zh');
  });

  it('保存済みの英語設定を優先する', () => {
    assert.equal(resolvePreferredLanguage(`${LANGUAGE_COOKIE_NAME}=en`, 'ja-JP'), 'en');
  });

  it('保存がない場合はブラウザ言語から繁體中文、日本語、英語を解決する', () => {
    assert.equal(resolvePreferredLanguage('', 'en-US'), 'en');
    assert.equal(resolvePreferredLanguage('', 'ja-JP'), 'ja');
    assert.equal(resolvePreferredLanguage('', 'zh-TW'), 'zh');
    assert.equal(resolvePreferredLanguage('', 'fr-FR'), 'zh');
  });

  it('不正な言語値は繁體中文へフォールバックする', () => {
    assert.equal(normalizeLanguage('de'), 'zh');
    assert.equal(normalizeLanguage(''), 'zh');
  });

  it('選択した言語をCookieへ保存する文字列を作る', () => {
    assert.equal(
      buildLanguagePreferenceCookie('en'),
      `${LANGUAGE_COOKIE_NAME}=en; Max-Age=15552000; Path=/; SameSite=Lax`,
    );
  });
});

describe('translate', () => {
  it('繁體中文、日本語、英語のUI文言を返す', () => {
    assert.equal(translate('zh', 'ui.filterTitle'), '篩選');
    assert.equal(translate('ja', 'ui.filterTitle'), '絞り込み');
    assert.equal(translate('en', 'ui.filterTitle'), 'Filters');
    assert.equal(translate('ja', 'ui.dataCenterLabel'), 'データセンター');
    assert.equal(translate('en', 'ui.dataCenterLabel'), 'Data center');
    assert.equal(translate('ja', 'ui.dataCenterSelect'), 'DCを選択');
    assert.equal(translate('en', 'ui.dataCenterSelect'), 'Select data center');
    assert.equal(translate('zh', 'dataCenterRegions.northAmerica'), '北美資料中心');
    assert.equal(translate('ja', 'dataCenterRegions.northAmerica'), '北米データセンター');
    assert.equal(translate('en', 'dataCenterRegions.northAmerica'), 'North American Data Centers');
    assert.equal(translate('ja', 'dataCenterRegions.europe'), '欧州データセンター');
    assert.equal(translate('en', 'dataCenterRegions.europe'), 'European Data Centers');
    assert.equal(translate('ja', 'dataCenterRegions.japan'), '日本データセンター');
    assert.equal(translate('en', 'dataCenterRegions.japan'), 'Japanese Data Centers');
    assert.equal(translate('ja', 'dataCenterRegions.oceania'), 'オセアニアデータセンター');
    assert.equal(translate('en', 'dataCenterRegions.oceania'), 'Oceanic Data Centers');
    assert.equal(translate('en', 'table.marketValue'), 'Sales');
    assert.match(translate('zh', 'meta.description'), /繁體中文玩家/);
    assert.match(translate('ja', 'meta.description'), /全DC/);
    assert.match(translate('en', 'meta.description'), /all data centers/);
  });

  it('件数などの値を埋め込める', () => {
    assert.equal(translate('zh', 'results.count', { count: '12' }), '12 筆');
    assert.equal(translate('ja', 'results.count', { count: '12' }), '12 件');
    assert.equal(translate('en', 'results.count', { count: '12' }), '12 items');
  });
});

describe('selectItemDisplayName', () => {
  const item = {
    name: 'ガーデン・パーティライト',
    nameJa: 'ガーデン・パーティライト',
    nameEn: 'Garden Mood Lighting',
  };

  it('日本語表示では日本語名を優先する', () => {
    assert.equal(selectItemDisplayName(item, 'ja'), 'ガーデン・パーティライト');
  });

  it('英語と繁體中文表示では英語名を優先する', () => {
    assert.equal(selectItemDisplayName(item, 'zh'), 'Garden Mood Lighting');
    assert.equal(selectItemDisplayName(item, 'en'), 'Garden Mood Lighting');
  });
});
