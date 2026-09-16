import * as SQLite from 'expo-sqlite';
import type { Reading, Tag, TargetRange } from './types';
import type { FoodItem, Meal } from './mealtypes';
import type { HistoryEntry } from './mealEstimate';
import { DEFAULT_TARGET } from './types';

const DB_NAME = 'glucose.db';
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Readings are stored in mg/dL with an epoch-millisecond timestamp. Storing the
 * meter's own unit keeps one source of truth; mmol/L is derived at display time.
 * Never store a formatted date string - it breaks range queries and timezones.
 */
async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS readings (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      mgdl     REAL    NOT NULL,
      taken_at INTEGER NOT NULL,
      tag      TEXT    NOT NULL,
      note     TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_readings_taken_at ON readings (taken_at DESC);
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS meals (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      taken_at       INTEGER NOT NULL,
      photo_uri      TEXT,
      items_json     TEXT    NOT NULL,
      total_carbs_g  REAL    NOT NULL,
      total_sugar_g  REAL    NOT NULL,
      note           TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_meals_taken_at ON meals (taken_at DESC);
  `);

  // meal_id links a reading back to the meal it likely followed, so the app can
  // compare "meals like this one" against what glucose actually did afterward.
  // Added after the readings table already existed on real devices, so it's
  // guarded rather than assumed - SQLite has no ADD COLUMN IF NOT EXISTS.
  const cols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(readings)');
  if (!cols.some((c) => c.name === 'meal_id')) {
    await db.execAsync('ALTER TABLE readings ADD COLUMN meal_id INTEGER REFERENCES meals(id)');
  }
}

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME).then(async (db) => {
      await migrate(db);
      return db;
    });
  }
  return dbPromise;
}

type Row = { id: number; mgdl: number; taken_at: number; tag: string; note: string | null };
const toReading = (r: Row): Reading => ({
  id: r.id, mgdl: r.mgdl, takenAt: r.taken_at, tag: r.tag as Tag, note: r.note,
});

/** A reading taken within this long after a meal is assumed to be a response to it. */
const MEAL_LOOKBACK_MS = 2.5 * 60 * 60 * 1000;

export async function addReading(
  mgdl: number, takenAt: number, tag: Tag, note?: string | null, explicitMealId?: number,
): Promise<number> {
  const db = await getDb();

  // A meal attached by hand while logging this reading always wins. Otherwise,
  // fall back to silently linking the most recent meal within the lookback
  // window, so post-meal comparisons still work without the user having to
  // attach one every time.
  let mealId: number | null = explicitMealId ?? null;
  if (mealId === null) {
    const recentMeal = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM meals WHERE taken_at <= ? AND taken_at >= ? ORDER BY taken_at DESC LIMIT 1',
      takenAt, takenAt - MEAL_LOOKBACK_MS,
    );
    mealId = recentMeal?.id ?? null;
  }

  const res = await db.runAsync(
    'INSERT INTO readings (mgdl, taken_at, tag, note, meal_id) VALUES (?, ?, ?, ?, ?)',
    mgdl, takenAt, tag, note ?? null, mealId,
  );
  return res.lastInsertRowId;
}

/** Newest first, for the history list. */
export async function listReadings(limit = 500): Promise<Reading[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>(
    'SELECT * FROM readings ORDER BY taken_at DESC LIMIT ?', limit,
  );
  return rows.map(toReading);
}

/** Oldest first, for charting a date range. */
export async function readingsSince(sinceMs: number): Promise<Reading[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>(
    'SELECT * FROM readings WHERE taken_at >= ? ORDER BY taken_at ASC', sinceMs,
  );
  return rows.map(toReading);
}

export async function deleteReading(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM readings WHERE id = ?', id);
}

export async function countReadings(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM readings');
  return row?.n ?? 0;
}

export async function getTarget(): Promise<TargetRange> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'target'",
  );
  if (!row) return DEFAULT_TARGET;
  try {
    const parsed = JSON.parse(row.value) as TargetRange;
    return typeof parsed.lowMgdl === 'number' && typeof parsed.highMgdl === 'number'
      ? parsed
      : DEFAULT_TARGET;
  } catch {
    return DEFAULT_TARGET;
  }
}

export async function setTarget(target: TargetRange): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "INSERT INTO settings (key, value) VALUES ('target', ?) " +
    'ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    JSON.stringify(target),
  );
}

type MealRow = {
  id: number; taken_at: number; photo_uri: string | null;
  items_json: string; total_carbs_g: number; total_sugar_g: number; note: string | null;
};

const toMeal = (r: MealRow): Meal => ({
  id: r.id,
  takenAt: r.taken_at,
  photoUri: r.photo_uri,
  items: JSON.parse(r.items_json) as FoodItem[],
  totalCarbsG: r.total_carbs_g,
  totalSugarG: r.total_sugar_g,
  note: r.note,
});

function sumItems(items: FoodItem[]): { carbsG: number; sugarG: number } {
  return items.reduce(
    (acc, it) => ({ carbsG: acc.carbsG + it.carbsG, sugarG: acc.sugarG + it.sugarG }),
    { carbsG: 0, sugarG: 0 },
  );
}

export async function addMeal(
  takenAt: number, photoUri: string | null, items: FoodItem[], note?: string | null,
): Promise<number> {
  const db = await getDb();
  const { carbsG, sugarG } = sumItems(items);
  const res = await db.runAsync(
    'INSERT INTO meals (taken_at, photo_uri, items_json, total_carbs_g, total_sugar_g, note) VALUES (?, ?, ?, ?, ?, ?)',
    takenAt, photoUri, JSON.stringify(items), carbsG, sugarG, note ?? null,
  );
  return res.lastInsertRowId;
}

/** Re-save an edited item list (the user correcting the AI's guess) and refresh the cached totals. */
export async function updateMealItems(mealId: number, items: FoodItem[]): Promise<void> {
  const db = await getDb();
  const { carbsG, sugarG } = sumItems(items);
  await db.runAsync(
    'UPDATE meals SET items_json = ?, total_carbs_g = ?, total_sugar_g = ? WHERE id = ?',
    JSON.stringify(items), carbsG, sugarG, mealId,
  );
}

export async function listMeals(limit = 200): Promise<Meal[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<MealRow>('SELECT * FROM meals ORDER BY taken_at DESC LIMIT ?', limit);
  return rows.map(toMeal);
}

export async function deleteMeal(id: number): Promise<void> {
  const db = await getDb();
  // Readings that pointed at this meal keep their glucose data, they just lose the link.
  await db.runAsync('UPDATE readings SET meal_id = NULL WHERE meal_id = ?', id);
  await db.runAsync('DELETE FROM meals WHERE id = ?', id);
}

/**
 * Every reading that has a linked meal, joined with that meal's carb total, for
 * the historical-comparison algorithm in mealEstimate.ts. That module does the
 * matching/bucketing in plain JS so it stays unit-testable without a database.
 */
export async function listReadingsWithMeals(): Promise<HistoryEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    mgdl: number; taken_at: number; meal_taken_at: number; total_carbs_g: number;
  }>(`
    SELECT r.mgdl AS mgdl, r.taken_at AS taken_at, m.taken_at AS meal_taken_at, m.total_carbs_g AS total_carbs_g
    FROM readings r JOIN meals m ON r.meal_id = m.id
  `);
  return rows.map((r) => ({
    readingMgdl: r.mgdl, readingTakenAt: r.taken_at, mealTakenAt: r.meal_taken_at, mealCarbsG: r.total_carbs_g,
  }));
}
