import type { Reading, Tag, TargetRange } from './types';
import { TAGS } from './types.ts';

export type Summary = {
  count: number;
  avgMgdl: number | null;
  minMgdl: number | null;
  maxMgdl: number | null;
  /** Percentage of readings inside the user's own target range, 0-100. */
  inRangePct: number | null;
};

export const DAY_MS = 86_400_000;

/** Readings from the last `days` days, oldest first. */
export function withinDays(readings: Reading[], days: number, now: number): Reading[] {
  const cutoff = now - days * DAY_MS;
  return readings
    .filter((r) => r.takenAt >= cutoff && r.takenAt <= now)
    .sort((a, b) => a.takenAt - b.takenAt);
}

export function summarize(readings: Reading[], target: TargetRange): Summary {
  if (readings.length === 0) {
    return { count: 0, avgMgdl: null, minMgdl: null, maxMgdl: null, inRangePct: null };
  }
  let sum = 0;
  let min = Infinity;
  let max = -Infinity;
  let inRange = 0;
  for (const r of readings) {
    sum += r.mgdl;
    if (r.mgdl < min) min = r.mgdl;
    if (r.mgdl > max) max = r.mgdl;
    if (r.mgdl >= target.lowMgdl && r.mgdl <= target.highMgdl) inRange++;
  }
  return {
    count: readings.length,
    avgMgdl: sum / readings.length,
    minMgdl: min,
    maxMgdl: max,
    inRangePct: (inRange / readings.length) * 100,
  };
}

/**
 * Average per tag. A fasting 110 and a post-meal 110 mean different things,
 * so a single overall average hides the signal this app exists to show.
 */
export function averagesByTag(readings: Reading[]): Record<Tag, { count: number; avgMgdl: number | null }> {
  const out = {} as Record<Tag, { count: number; avgMgdl: number | null }>;
  for (const tag of TAGS) {
    const subset = readings.filter((r) => r.tag === tag);
    out[tag] = subset.length
      ? { count: subset.length, avgMgdl: subset.reduce((s, r) => s + r.mgdl, 0) / subset.length }
      : { count: 0, avgMgdl: null };
  }
  return out;
}
