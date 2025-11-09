import Database from 'better-sqlite3';
import { config } from '../config';
import { Rating } from '../types';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;
let isUpdating = false;
let isSeeding = false;
let lastUpdate: Date | null = null;

export function initDatabase(): Database.Database {
  // Ensure data directory exists
  const dbDir = path.dirname(config.databasePath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(config.databasePath);

  // Enable WAL mode for concurrent reads during writes
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -64000'); // 64MB cache

  // Create table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS ratings (
      tconst TEXT PRIMARY KEY,
      averageRating REAL NOT NULL,
      numVotes INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tconst ON ratings(tconst);
  `);

  console.log('Database initialized with WAL mode');
  return db;
}

export function getDatabase(): Database.Database {
  if (!db) {
    return initDatabase();
  }
  return db;
}

export function getRating(imdbId: string): Rating | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM ratings WHERE tconst = ?');
  const result = stmt.get(imdbId) as Rating | undefined;
  return result || null;
}

export function getBulkRatings(imdbIds: string[]): (Rating | null)[] {
  const db = getDatabase();
  const placeholders = imdbIds.map(() => '?').join(',');
  const stmt = db.prepare(`SELECT * FROM ratings WHERE tconst IN (${placeholders})`);
  const results = stmt.all(...imdbIds) as Rating[];

  // Map results to maintain order of input IDs
  const resultsMap = new Map(results.map(r => [r.tconst, r]));
  return imdbIds.map(id => resultsMap.get(id) || null);
}

export function getTotalRatings(): number {
  const db = getDatabase();
  const result = db.prepare('SELECT COUNT(*) as count FROM ratings').get() as { count: number };
  return result.count;
}

export function setUpdating(status: boolean): void {
  isUpdating = status;
  if (!status) {
    lastUpdate = new Date();
  }
}

export function getUpdatingStatus(): boolean {
  return isUpdating;
}

export function setSeeding(status: boolean): void {
  isSeeding = status;
  if (!status) {
    lastUpdate = new Date();
  }
}

export function getSeedingStatus(): boolean {
  return isSeeding;
}

export function getLastUpdate(): Date | null {
  return lastUpdate;
}

export function isDatabaseEmpty(): boolean {
  const count = getTotalRatings();
  return count === 0;
}

export function bulkInsertRatings(ratings: Rating[]): void {
  const db = getDatabase();

  // Use transaction for atomic updates
  const insert = db.prepare(`
    INSERT OR REPLACE INTO ratings (tconst, averageRating, numVotes)
    VALUES (?, ?, ?)
  `);

  const insertMany = db.transaction((ratings: Rating[]) => {
    for (const rating of ratings) {
      insert.run(rating.tconst, rating.averageRating, rating.numVotes);
    }
  });

  insertMany(ratings);
}

export function clearRatings(): void {
  const db = getDatabase();
  db.prepare('DELETE FROM ratings').run();
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
