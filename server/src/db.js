import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { config } from './config.js';

const dbDir = path.dirname(config.databasePath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(config.databasePath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS watchlist (
    card_id TEXT PRIMARY KEY,
    added_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id TEXT NOT NULL,
    price REAL NOT NULL,
    source TEXT NOT NULL DEFAULT 'mock',
    recorded_at TEXT NOT NULL,
    UNIQUE(card_id, recorded_at)
  );

  CREATE INDEX IF NOT EXISTS idx_price_history_card
    ON price_history(card_id, recorded_at DESC);

  CREATE TABLE IF NOT EXISTS card_cache (
    card_id TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export function getWatchlist() {
  return db.prepare('SELECT card_id, added_at FROM watchlist ORDER BY added_at DESC').all();
}

export function addToWatchlist(cardId) {
  db.prepare('INSERT OR IGNORE INTO watchlist (card_id) VALUES (?)').run(cardId);
  return getWatchlistEntry(cardId);
}

export function removeFromWatchlist(cardId) {
  const result = db.prepare('DELETE FROM watchlist WHERE card_id = ?').run(cardId);
  return result.changes > 0;
}

export function getWatchlistEntry(cardId) {
  return db.prepare('SELECT card_id, added_at FROM watchlist WHERE card_id = ?').get(cardId);
}

export function isOnWatchlist(cardId) {
  return Boolean(getWatchlistEntry(cardId));
}

export function insertPriceSnapshot(cardId, price, recordedAt, source = 'mock') {
  db.prepare(
    `INSERT OR IGNORE INTO price_history (card_id, price, source, recorded_at)
     VALUES (?, ?, ?, ?)`
  ).run(cardId, price, source, recordedAt);
}

export function getPriceHistory(cardId, limit = 90) {
  return db
    .prepare(
      `SELECT price, source, recorded_at AS recordedAt
       FROM price_history
       WHERE card_id = ?
       ORDER BY recorded_at ASC
       LIMIT ?`
    )
    .all(cardId, limit);
}

export function getLatestPrice(cardId) {
  return db
    .prepare(
      `SELECT price, recorded_at AS recordedAt
       FROM price_history
       WHERE card_id = ?
       ORDER BY recorded_at DESC
       LIMIT 1`
    )
    .get(cardId);
}

export function cacheCard(cardId, payload) {
  db.prepare(
    `INSERT INTO card_cache (card_id, payload, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(card_id) DO UPDATE SET
       payload = excluded.payload,
       updated_at = datetime('now')`
  ).run(cardId, JSON.stringify(payload));
}

export function getCachedCard(cardId) {
  const row = db.prepare('SELECT payload FROM card_cache WHERE card_id = ?').get(cardId);
  return row ? JSON.parse(row.payload) : null;
}

export function getTrendingCardIds(limit = 12) {
  const rows = db
    .prepare(
      `SELECT card_id AS cardId,
              COUNT(*) AS pointCount,
              MIN(price) AS minPrice,
              MAX(price) AS maxPrice
       FROM price_history
       GROUP BY card_id
       HAVING pointCount >= 7
       ORDER BY (maxPrice - minPrice) / NULLIF(minPrice, 0) DESC
       LIMIT ?`
    )
    .all(limit);
  return rows;
}

export default db;
