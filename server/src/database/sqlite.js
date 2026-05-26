import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let db;

function getDb() {
  if (db) return db;
  const dbDir = path.dirname(config.databasePath);
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  db = new Database(config.databasePath);
  db.pragma('journal_mode = WAL');
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
  migrateLegacyTables();
  return db;
}

/** Migrate from v1 schema (card_id columns) if present */
function migrateLegacyTables() {
  const conn = getDb();
  const tables = conn.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const names = new Set(tables.map((t) => t.name));

  try {
    if (names.has('watchlist')) {
      const cols = conn.prepare('PRAGMA table_info(watchlist)').all();
      if (cols.some((c) => c.name === 'card_id')) {
        conn.exec(`
          CREATE TABLE watchlist_new (product_id TEXT PRIMARY KEY, added_at TEXT);
          INSERT OR IGNORE INTO watchlist_new SELECT card_id, added_at FROM watchlist;
          DROP TABLE watchlist;
          ALTER TABLE watchlist_new RENAME TO watchlist;
        `);
      }
    }

    if (names.has('price_history')) {
      const cols = conn.prepare('PRAGMA table_info(price_history)').all();
      if (cols.some((c) => c.name === 'card_id') && !cols.some((c) => c.name === 'product_id')) {
        conn.exec(`
          CREATE TABLE price_history_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id TEXT NOT NULL,
            market_price REAL NOT NULL,
            low_price REAL NOT NULL,
            high_price REAL NOT NULL,
            listings_count INTEGER DEFAULT 0,
            source TEXT NOT NULL DEFAULT 'mock',
            recorded_at TEXT NOT NULL,
            UNIQUE(product_id, recorded_at)
          );
          INSERT INTO price_history_new (product_id, market_price, low_price, high_price, source, recorded_at)
          SELECT card_id, price, price * 0.92, price * 1.08, source, recorded_at FROM price_history;
          DROP TABLE price_history;
          ALTER TABLE price_history_new RENAME TO price_history;
        `);
      }
    }
  } catch (err) {
    console.warn('Legacy DB migration skipped:', err.message);
  }
}

function rowToProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    setName: row.set_name,
    image: row.image_url,
    subtype: row.subtype,
    metadata: row.metadata ? JSON.parse(row.metadata) : {},
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const sqliteAdapter = {
  init() {
    getDb();
  },

  upsertProduct(product) {
    getDb()
      .prepare(
        `INSERT INTO products (id, type, name, set_name, image_url, subtype, metadata, source, updated_at)
         VALUES (@id, @type, @name, @setName, @image, @subtype, @metadata, @source, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           set_name = excluded.set_name,
           image_url = excluded.image_url,
           subtype = excluded.subtype,
           metadata = excluded.metadata,
           updated_at = datetime('now')`
      )
      .run({
        id: product.id,
        type: product.type,
        name: product.name,
        setName: product.setName || null,
        image: product.image || null,
        subtype: product.subtype || null,
        metadata: JSON.stringify(product.metadata || {}),
        source: product.source || 'pokemon-tcg',
      });
    return this.getProduct(product.id);
  },

  getProduct(id) {
    const row = getDb().prepare('SELECT * FROM products WHERE id = ?').get(id);
    return rowToProduct(row);
  },

  getAllProductIds() {
    return getDb().prepare('SELECT id FROM products').all().map((r) => r.id);
  },

  insertPriceSnapshot({ productId, marketPrice, lowPrice, highPrice, listingsCount, source, recordedAt }) {
    getDb()
      .prepare(
        `INSERT OR REPLACE INTO price_history
         (product_id, market_price, low_price, high_price, listings_count, source, recorded_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(productId, marketPrice, lowPrice, highPrice, listingsCount ?? 0, source, recordedAt);
  },

  /** Bulk insert wrapped in a single transaction — ~10x faster for backfills */
  bulkInsertPriceSnapshots(snapshots) {
    if (!snapshots || !snapshots.length) return;
    const conn = getDb();
    const stmt = conn.prepare(
      `INSERT OR REPLACE INTO price_history
       (product_id, market_price, low_price, high_price, listings_count, source, recorded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    const insertMany = conn.transaction((rows) => {
      for (const r of rows) {
        stmt.run(
          r.productId,
          r.marketPrice,
          r.lowPrice,
          r.highPrice,
          r.listingsCount ?? 0,
          r.source,
          r.recordedAt
        );
      }
    });
    insertMany(snapshots);
  },

  bulkUpsertProducts(products) {
    if (!products || !products.length) return;
    const conn = getDb();
    const stmt = conn.prepare(
      `INSERT INTO products (id, type, name, set_name, image_url, subtype, metadata, source, updated_at)
       VALUES (@id, @type, @name, @setName, @image, @subtype, @metadata, @source, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         set_name = excluded.set_name,
         image_url = excluded.image_url,
         subtype = excluded.subtype,
         metadata = excluded.metadata,
         updated_at = datetime('now')`
    );
    const insertMany = conn.transaction((rows) => {
      for (const p of rows) {
        stmt.run({
          id: p.id,
          type: p.type,
          name: p.name,
          setName: p.setName || null,
          image: p.image || null,
          subtype: p.subtype || null,
          metadata: JSON.stringify(p.metadata || {}),
          source: p.source || 'pokemon-tcg',
        });
      }
    });
    insertMany(products);
  },

  /** Fetch latest snapshot per product in one query */
  getLatestPrices(productIds) {
    if (!productIds.length) return new Map();
    const placeholders = productIds.map(() => '?').join(',');
    const rows = getDb()
      .prepare(
        `SELECT product_id AS productId, market_price AS marketPrice,
                low_price AS lowPrice, high_price AS highPrice,
                listings_count AS listingsCount, source, recorded_at AS recordedAt
         FROM price_history
         WHERE product_id IN (${placeholders})
         AND recorded_at = (
           SELECT MAX(recorded_at) FROM price_history ph2 WHERE ph2.product_id = price_history.product_id
         )`
      )
      .all(...productIds);
    return new Map(rows.map((r) => [r.productId, r]));
  },

  getPriceHistory(productId, limit = 365) {
    return getDb()
      .prepare(
        `SELECT market_price AS marketPrice, low_price AS lowPrice, high_price AS highPrice,
                listings_count AS listingsCount, source, recorded_at AS recordedAt
         FROM price_history WHERE product_id = ?
         ORDER BY recorded_at ASC LIMIT ?`
      )
      .all(productId, limit);
  },

  getLatestPrice(productId) {
    return getDb()
      .prepare(
        `SELECT market_price AS marketPrice, low_price AS lowPrice, high_price AS highPrice,
                listings_count AS listingsCount, source, recorded_at AS recordedAt
         FROM price_history WHERE product_id = ?
         ORDER BY recorded_at DESC LIMIT 1`
      )
      .get(productId);
  },

  getWatchlist() {
    return getDb()
      .prepare('SELECT product_id AS productId, added_at AS addedAt FROM watchlist ORDER BY added_at DESC')
      .all();
  },

  addToWatchlist(productId) {
    getDb().prepare('INSERT OR IGNORE INTO watchlist (product_id) VALUES (?)').run(productId);
  },

  removeFromWatchlist(productId) {
    return getDb().prepare('DELETE FROM watchlist WHERE product_id = ?').run(productId).changes > 0;
  },

  isOnWatchlist(productId) {
    return Boolean(
      getDb().prepare('SELECT 1 FROM watchlist WHERE product_id = ?').get(productId)
    );
  },

  getTrendingProductIds(limit = 12) {
    return getDb()
      .prepare(
        `SELECT product_id AS productId,
                COUNT(*) AS pointCount,
                MIN(market_price) AS minPrice,
                MAX(market_price) AS maxPrice
         FROM price_history
         GROUP BY product_id
         HAVING pointCount >= 7
         ORDER BY (maxPrice - minPrice) / NULLIF(minPrice, 0) DESC
         LIMIT ?`
      )
      .all(limit);
  },

  /** All products with at least N price history rows, ordered for trend analysis */
  getProductsWithHistory(minPoints = 7) {
    return getDb()
      .prepare(
        `SELECT p.id, p.type, p.name, p.set_name, p.image_url, p.subtype, p.metadata, p.source
         FROM products p
         WHERE (SELECT COUNT(*) FROM price_history h WHERE h.product_id = p.id) >= ?`
      )
      .all(minPoints)
      .map(rowToProduct);
  },

  searchProductsLocal(query, limit = 20) {
    const q = `%${query}%`;
    return getDb()
      .prepare(
        `SELECT * FROM products
         WHERE type = 'sealed' AND (name LIKE ? OR set_name LIKE ?)
         LIMIT ?`
      )
      .all(q, q, limit)
      .map(rowToProduct);
  },
};
