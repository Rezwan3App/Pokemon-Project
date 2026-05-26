-- SQLite schema (PostgreSQL variant in postgres.js)

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('card', 'sealed')),
  name TEXT NOT NULL,
  set_name TEXT,
  image_url TEXT,
  subtype TEXT,
  metadata TEXT,
  source TEXT NOT NULL DEFAULT 'pokemon-tcg',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL,
  market_price REAL NOT NULL,
  low_price REAL NOT NULL,
  high_price REAL NOT NULL,
  listings_count INTEGER DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'mock',
  recorded_at TEXT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id),
  UNIQUE(product_id, recorded_at)
);

CREATE INDEX IF NOT EXISTS idx_price_history_product
  ON price_history(product_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS watchlist (
  product_id TEXT PRIMARY KEY,
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
