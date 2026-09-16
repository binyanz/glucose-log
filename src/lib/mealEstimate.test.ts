import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimatePostMeal, MIN_SAMPLES, CARB_TOLERANCE } from './mealEstimate.ts';
import type { HistoryEntry } from './mealEstimate.ts';

const HOUR = 60 * 60 * 1000;
const MEAL_AT = 1_780_000_000_000;

/** A reading `hoursAfter` a meal of `carbsG`, at glucose `mgdl`. */
const entry = (carbsG: number, hoursAfter: number, mgdl: number): HistoryEntry => ({
  readingMgdl: mgdl,
  readingTakenAt: MEAL_AT + hoursAfter * HOUR,
  mealTakenAt: MEAL_AT,
  mealCarbsG: carbsG,
});

test('refuses to estimate below MIN_SAMPLES, per offset independently', () => {
  // Only 2 matches at +1h - below MIN_SAMPLES (3) - so plus1h must stay null
  // even though plus2h will have enough once we add a third there.
  const history = [entry(50, 1, 140), entry(50, 1, 150), entry(50, 2, 130), entry(50, 2, 135), entry(50, 2, 145)];
  const [plus1h, plus2h] = estimatePostMeal(history, 50);
  assert.equal(plus1h.avgMgdl, null, 'must not estimate on 2 samples');
  assert.equal(plus1h.sampleCount, 2);
  assert.notEqual(plus2h.avgMgdl, null, '3 samples should be enough');
  assert.equal(plus2h.sampleCount, 3);
});

test('computes average, min, and max once MIN_SAMPLES is met', () => {
  const history = [entry(50, 2, 120), entry(50, 2, 140), entry(50, 2, 160)];
  const [, plus2h] = estimatePostMeal(history, 50);
  assert.equal(plus2h.avgMgdl, 140);
  assert.equal(plus2h.minMgdl, 120);
  assert.equal(plus2h.maxMgdl, 160);
});

test('excludes meals outside the carb tolerance band', () => {
  // newMealCarbsG=50, tolerance 0.2 -> matches are [40, 60]. 39 and 61 must be excluded.
  const history = [
    entry(39, 1, 999), entry(61, 1, 999),                 // outside the band
    entry(40, 1, 100), entry(50, 1, 110), entry(60, 1, 120), // inside the band
  ];
  const [plus1h] = estimatePostMeal(history, 50);
  assert.equal(plus1h.sampleCount, 3, 'only the 3 in-band readings should count');
  assert.equal(plus1h.avgMgdl, 110);
});

test('carb tolerance band is symmetric and matches the documented constant', () => {
  assert.equal(CARB_TOLERANCE, 0.2);
  const history = [entry(50 * 1.2, 1, 100), entry(50 * 1.2, 1, 100), entry(50 * 1.2, 1, 100)];
  const [plus1h] = estimatePostMeal(history, 50);
  assert.equal(plus1h.sampleCount, 3, 'exactly +20% must still be inside the inclusive band');
});

test('ignores readings that fall outside both time buckets', () => {
  // 30 minutes and 3.5 hours after the meal - neither is within 20min of 60 or 120.
  const history = [
    entry(50, 0.5, 200), entry(50, 3.5, 200),
    entry(50, 1, 100), entry(50, 1, 100), entry(50, 1, 100),
  ];
  const [plus1h, plus2h] = estimatePostMeal(history, 50);
  assert.equal(plus1h.sampleCount, 3);
  assert.equal(plus2h.sampleCount, 0);
});

test('bucket windows do not overlap at their boundary', () => {
  // 90 minutes is 30min from both targets - outside the 20min window for either.
  const history = [entry(50, 1.5, 999), entry(50, 1.5, 999), entry(50, 1.5, 999)];
  const [plus1h, plus2h] = estimatePostMeal(history, 50);
  assert.equal(plus1h.sampleCount, 0);
  assert.equal(plus2h.sampleCount, 0);
});

test('a meal with zero history returns nulls, not NaN or a crash', () => {
  const [plus1h, plus2h] = estimatePostMeal([], 50);
  assert.equal(plus1h.avgMgdl, null);
  assert.equal(plus2h.avgMgdl, null);
  assert.equal(MIN_SAMPLES, 3, 'sanity: the constant this test suite assumes');
});
