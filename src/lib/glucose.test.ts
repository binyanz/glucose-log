import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mgdlToMmol, mmolToMgdl, formatMmol, formatMgdl, parseMgdl, MG_PER_MMOL,
} from './glucose.ts';

test('matches published clinical conversion tables', () => {
  const table: [number, string][] = [
    [70, '3.9'], [100, '5.6'], [126, '7.0'], [140, '7.8'], [180, '10.0'], [200, '11.1'],
  ];
  for (const [mgdl, expected] of table) {
    assert.equal(formatMmol(mgdlToMmol(mgdl)), expected, `${mgdl} mg/dL`);
  }
});

test('round-trips both directions within rounding tolerance', () => {
  for (let mgdl = 20; mgdl <= 400; mgdl += 7) {
    const back = mmolToMgdl(mgdlToMmol(mgdl));
    assert.ok(Math.abs(back - mgdl) < 1e-9, `${mgdl} round-trip drifted to ${back}`);
  }
});

test('formats to the conventional precision', () => {
  assert.equal(formatMmol(5.5499), '5.5');
  assert.equal(formatMgdl(99.6), '100');
  assert.equal(mmolToMgdl(10), 180);
  assert.equal(MG_PER_MMOL, 18);
});

test('rejects input that is not a plausible reading', () => {
  const bad = ['', '   ', 'abc', '12a', '1.2.3', '-5', '0', '19', '601', '1e5', '999'];
  for (const input of bad) {
    assert.equal(parseMgdl(input).ok, false, `should reject ${JSON.stringify(input)}`);
  }
});

test('accepts real readings including decimals', () => {
  for (const input of ['20', '100', ' 145 ', '145.5', '600']) {
    const r = parseMgdl(input);
    assert.equal(r.ok, true, `should accept ${JSON.stringify(input)}`);
  }
  const r = parseMgdl('145.5');
  assert.ok(r.ok && r.mgdl === 145.5);
});

test('a mmol/L value typed by mistake is caught, not silently stored', () => {
  const r = parseMgdl('5.6');
  assert.equal(r.ok, false);
  assert.match(r.ok === false ? r.error : '', /mmol/);
});
