import type { PostMealOffset, MealEstimate } from './mealtypes';

/** A meal needs at least this many historical matches before an estimate is shown. */
export const MIN_SAMPLES = 3;

/** Meals are "similar" if their total carbs are within this fraction of each other. */
export const CARB_TOLERANCE = 0.2;

/** A reading counts toward an offset bucket if it falls within this many minutes of the target. */
const BUCKET_TARGETS: Record<PostMealOffset, number> = { plus1h: 60, plus2h: 120 };
const BUCKET_WINDOW_MIN = 20;

function elapsedMinutes(readingAt: number, mealAt: number): number {
  return (readingAt - mealAt) / 60_000;
}

function bucketFor(elapsedMin: number): PostMealOffset | null {
  for (const offset of Object.keys(BUCKET_TARGETS) as PostMealOffset[]) {
    if (Math.abs(elapsedMin - BUCKET_TARGETS[offset]) <= BUCKET_WINDOW_MIN) return offset;
  }
  return null;
}

export type HistoryEntry = {
  readingMgdl: number;
  readingTakenAt: number;
  mealTakenAt: number;
  mealCarbsG: number;
};

/**
 * Given every past reading linked to a meal, and the carb total of a *new*
 * meal being logged now, estimate what glucose has historically done 1h and
 * 2h after similarly-sized meals. This deliberately does not use a population
 * model - only the user's own past data - and refuses to answer below
 * MIN_SAMPLES rather than show a number built on too little.
 *
 * Matching is by total carbs rather than by specific foods: two meals get
 * described differently even when nutritionally similar, but carb load is
 * what drives the glucose response and is directly comparable across meals.
 */
export function estimatePostMeal(
  history: HistoryEntry[],
  newMealCarbsG: number,
  tolerance = CARB_TOLERANCE,
): MealEstimate[] {
  const lo = newMealCarbsG * (1 - tolerance);
  const hi = newMealCarbsG * (1 + tolerance);

  const buckets: Record<PostMealOffset, number[]> = { plus1h: [], plus2h: [] };
  for (const r of history) {
    if (r.mealCarbsG < lo || r.mealCarbsG > hi) continue;
    const bucket = bucketFor(elapsedMinutes(r.readingTakenAt, r.mealTakenAt));
    if (bucket) buckets[bucket].push(r.readingMgdl);
  }

  return (['plus1h', 'plus2h'] as PostMealOffset[]).map((offset) => summarize(offset, buckets[offset]));
}

function summarize(offset: PostMealOffset, values: number[]): MealEstimate {
  if (values.length < MIN_SAMPLES) {
    return { offset, sampleCount: values.length, avgMgdl: null, minMgdl: null, maxMgdl: null };
  }
  return {
    offset,
    sampleCount: values.length,
    avgMgdl: values.reduce((a, b) => a + b, 0) / values.length,
    minMgdl: Math.min(...values),
    maxMgdl: Math.max(...values),
  };
}
