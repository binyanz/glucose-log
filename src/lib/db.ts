import * as SQLite from 'expo-sqlite';
import type { Reading, Tag, TargetRange } from './types';
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
  `);
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

export async function addReading(
  mgdl: number, takenAt: number, tag: Tag, note?: string | null,
): Promise<number> {
  const db = await getDb();
  const res = await db.runAsync(
    'INSERT INTO readings (mgdl, taken_at, tag, note) VALUES (?, ?, ?, ?)',
    mgdl, takenAt, tag, note ?? null,
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
