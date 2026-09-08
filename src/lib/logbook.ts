import type { Reading, Tag } from './types';
import { TAGS } from './types';
import { DAY_MS } from './stats';

export type Cell = { avg: number | null; count: number };
export type Row = { key: string; label: string; sublabel?: string; cells: Record<Tag, Cell> };

const empty = (): Record<Tag, Cell> => {
  const o = {} as Record<Tag, Cell>;
  for (const t of TAGS) o[t] = { avg: null, count: 0 };
  return o;
};

function fold(rows: Map<string, { sum: Record<Tag, number>; n: Record<Tag, number> }>, key: string) {
  if (!rows.has(key)) {
    const sum = {} as Record<Tag, number>, n = {} as Record<Tag, number>;
    for (const t of TAGS) { sum[t] = 0; n[t] = 0; }
    rows.set(key, { sum, n });
  }
  return rows.get(key)!;
}

/**
 * One row per day. Used for the 7- and 30-day views, where a row per day is
 * still legible.
 */
export function dailyRows(readings: Reading[], days: number, now: number): Row[] {
  const acc = new Map<string, { sum: Record<Tag, number>; n: Record<Tag, number> }>();
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const out: Row[] = [];

  for (const r of readings) {
    const d = new Date(r.takenAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const b = fold(acc, key);
    b.sum[r.tag] += r.mgdl; b.n[r.tag] += 1;
  }

  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() - i * DAY_MS);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const b = acc.get(key);
    const cells = empty();
    if (b) for (const t of TAGS) if (b.n[t] > 0) cells[t] = { avg: b.sum[t] / b.n[t], count: b.n[t] };
    out.push({
      key,
      label: `${d.getMonth() + 1}/${String(d.getDate()).padStart(2, '0')}`,
      sublabel: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()],
      cells,
    });
  }
  return out;
}

/**
 * One row per week. At 90 days a row per day would be ~90 rows of 6px cells,
 * which stops being readable, so the long view aggregates by week instead.
 */
export function weeklyRows(readings: Reading[], weeks: number, now: number): Row[] {
  const acc = new Map<string, { sum: Record<Tag, number>; n: Record<Tag, number> }>();
  const anchor = new Date(now); anchor.setHours(0, 0, 0, 0);
  anchor.setDate(anchor.getDate() - anchor.getDay()); // start of this week

  const weekKey = (ts: number) => {
    const d = new Date(ts); d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  };

  for (const r of readings) {
    const b = fold(acc, weekKey(r.takenAt));
    b.sum[r.tag] += r.mgdl; b.n[r.tag] += 1;
  }

  const out: Row[] = [];
  for (let i = 0; i < weeks; i++) {
    const d = new Date(anchor.getTime() - i * 7 * DAY_MS);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const b = acc.get(key);
    const cells = empty();
    if (b) for (const t of TAGS) if (b.n[t] > 0) cells[t] = { avg: b.sum[t] / b.n[t], count: b.n[t] };
    const end = new Date(d.getTime() + 6 * DAY_MS);
    out.push({
      key,
      label: `${d.getMonth() + 1}/${String(d.getDate()).padStart(2, '0')}`,
      sublabel: `–${end.getMonth() + 1}/${String(end.getDate()).padStart(2, '0')}`,
      cells,
    });
  }
  return out;
}

/** Column averages - the payoff of the grid, shown under each column. */
export function columnAverages(rows: Row[]): Record<Tag, number | null> {
  const out = {} as Record<Tag, number | null>;
  for (const t of TAGS) {
    let sum = 0, n = 0;
    for (const r of rows) {
      const c = r.cells[t];
      if (c.avg !== null) { sum += c.avg * c.count; n += c.count; }
    }
    out[t] = n ? sum / n : null;
  }
  return out;
}
