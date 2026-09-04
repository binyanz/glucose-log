import { addReading, countReadings } from './db';
import { DAY_MS } from './stats';
import type { Tag } from './types';

/**
 * Development helper. The 3-month overview cannot be tested by waiting three
 * months, so this fabricates a plausible history: 4-5 readings a day, tagged
 * by time of day, with fasting values lower than post-meal ones and enough
 * day-to-day noise that the chart and averages have something real to show.
 *
 * Never call this from a shipping code path.
 */
export async function seedDemoData(days = 90): Promise<number> {
  const now = Date.now();
  let inserted = 0;

  // hour of day -> tag and a plausible baseline in mg/dL
  const slots: { hour: number; tag: Tag; base: number; spread: number }[] = [
    { hour: 7, tag: 'fasting', base: 98, spread: 18 },
    { hour: 12, tag: 'pre_meal', base: 110, spread: 22 },
    { hour: 14, tag: 'post_meal', base: 155, spread: 38 },
    { hour: 19, tag: 'pre_meal', base: 108, spread: 20 },
    { hour: 22, tag: 'bedtime', base: 125, spread: 26 },
  ];

  for (let d = days - 1; d >= 0; d--) {
    const dayStart = now - d * DAY_MS;
    const date = new Date(dayStart);
    // A slow upward drift across the window so the trend line is not flat noise.
    const drift = ((days - d) / days) * 8;
    for (const slot of slots) {
      if (Math.random() < 0.12) continue; // some readings simply get missed
      const at = new Date(date);
      at.setHours(slot.hour, Math.floor(Math.random() * 50), 0, 0);
      if (at.getTime() > now) continue;
      const jitter = (Math.random() + Math.random() - 1) * slot.spread;
      const mgdl = Math.max(45, Math.min(360, Math.round(slot.base + drift + jitter)));
      await addReading(mgdl, at.getTime(), slot.tag, null);
      inserted++;
    }
  }
  return inserted;
}

export async function isDatabaseEmpty(): Promise<boolean> {
  return (await countReadings()) === 0;
}
