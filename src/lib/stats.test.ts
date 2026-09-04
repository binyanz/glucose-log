import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withinDays, summarize, averagesByTag, DAY_MS } from './stats.ts';
import { DEFAULT_TARGET } from './types.ts';
import type { Reading, Tag } from './types.ts';

const NOW = 1_780_000_000_000;
const make = (id: number, mgdl: number, daysAgo: number, tag: Tag = 'random'): Reading =>
  ({ id, mgdl, takenAt: NOW - daysAgo * DAY_MS, tag });

test('withinDays keeps only the window, oldest first', () => {
  const readings = [make(1, 100, 100), make(2, 110, 45), make(3, 120, 2), make(4, 130, 0)];
  const w90 = withinDays(readings, 90, NOW);
  assert.deepEqual(w90.map((r) => r.id), [2, 3, 4], '100 days ago must fall outside 90');
  const w7 = withinDays(readings, 7, NOW);
  assert.deepEqual(w7.map((r) => r.id), [3, 4]);
});

test('withinDays excludes readings dated in the future', () => {
  const readings = [make(1, 100, 1), { id: 2, mgdl: 200, takenAt: NOW + DAY_MS, tag: 'random' as Tag }];
  assert.deepEqual(withinDays(readings, 30, NOW).map((r) => r.id), [1]);
});

test('summarize computes average, extremes and time-in-range', () => {
  // 60 and 200 sit outside the default 70-180 target; 100 and 120 are inside.
  const s = summarize([make(1, 60, 1), make(2, 100, 1), make(3, 120, 1), make(4, 200, 1)], DEFAULT_TARGET);
  assert.equal(s.count, 4);
  assert.equal(s.avgMgdl, 120);
  assert.equal(s.minMgdl, 60);
  assert.equal(s.maxMgdl, 200);
  assert.equal(s.inRangePct, 50);
});

test('summarize returns nulls rather than NaN when there is nothing in range', () => {
  const s = summarize([], DEFAULT_TARGET);
  assert.deepEqual(s, { count: 0, avgMgdl: null, minMgdl: null, maxMgdl: null, inRangePct: null });
});

test('target range boundaries count as in range', () => {
  const s = summarize([make(1, 70, 1), make(2, 180, 1)], DEFAULT_TARGET);
  assert.equal(s.inRangePct, 100);
});

test('averagesByTag separates fasting from post-meal', () => {
  const a = averagesByTag([
    make(1, 90, 1, 'fasting'), make(2, 110, 1, 'fasting'), make(3, 200, 1, 'post_meal'),
  ]);
  assert.equal(a.fasting.avgMgdl, 100);
  assert.equal(a.fasting.count, 2);
  assert.equal(a.post_meal.avgMgdl, 200);
  assert.equal(a.bedtime.avgMgdl, null, 'a tag with no readings must be null, not 0');
  assert.equal(a.bedtime.count, 0);
});
