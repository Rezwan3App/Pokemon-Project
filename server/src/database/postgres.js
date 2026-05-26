/**
 * Optional PostgreSQL adapter.
 * Enable with DATABASE_DRIVER=postgres and DATABASE_URL in .env
 * Requires: npm install pg (included as optionalDependency)
 */
import { config } from '../config.js';

let pool;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('card', 'sealed')),
  name TEXT NOT NULL,
  set_name TEXT,
  image_url TEXT,
  subtype TEXT,
  metadata JSONB DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'pokemon-tcg',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS price_history (
  id SERIAL PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  market_price DOUBLE PRECISION NOT NULL,
  low_price DOUBLE PRECISION NOT NULL,
  high_price DOUBLE PRECISION NOT NULL,
  listings_count INTEGER DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'mock',
  recorded_at DATE NOT NULL,
  UNIQUE(product_id, recorded_at)
);
CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id, recorded_at DESC);
CREATE TABLE IF NOT EXISTS watchlist (
  product_id TEXT PRIMARY KEY REFERENCES products(id),
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

function rowToProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    setName: row.set_name,
    image: row.image_url,
    subtype: row.subtype,
    metadata: typeof row.metadata === 'object' ? row.metadata : {},
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getPool() {
  if (pool) return pool;
  const { default: pg } = await import('pg');
  pool = new pg.Pool({ connectionString: config.databaseUrl });
  await pool.query(SCHEMA);
  return pool;
}

export const postgresAdapter = {
  async init() {
    if (!config.databaseUrl) {
      throw new Error('DATABASE_URL is required when DATABASE_DRIVER=postgres');
    }
    await getPool();
  },

  async upsertProduct(product) {
    const p = await getPool();
    await p.query(
      `INSERT INTO products (id, type, name, set_name, image_url, subtype, metadata, source, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name, set_name = EXCLUDED.set_name, image_url = EXCLUDED.image_url,
         subtype = EXCLUDED.subtype, metadata = EXCLUDED.metadata, updated_at = NOW()`,
      [
        product.id,
        product.type,
        product.name,
        product.setName || null,
        product.image || null,
        product.subtype || null,
        JSON.stringify(product.metadata || {}),
        product.source || 'pokemon-tcg',
      ]
    );
    return this.getProduct(product.id);
  },

  async getProduct(id) {
    const p = await getPool();
    const { rows } = await p.query('SELECT * FROM products WHERE id = $1', [id]);
    return rowToProduct(rows[0]);
  },

  async getAllProductIds() {
    const p = await getPool();
    const { rows } = await p.query('SELECT id FROM products');
    return rows.map((r) => r.id);
  },

  async bulkInsertPriceSnapshots(snapshots) {
    if (!snapshots?.length) return;
    const p = await getPool();
    const client = await p.connect();
    try {
      await client.query('BEGIN');
      const stmt = `INSERT INTO price_history (product_id, market_price, low_price, high_price, listings_count, source, recorded_at)
                    VALUES ($1,$2,$3,$4,$5,$6,$7)
                    ON CONFLICT (product_id, recorded_at) DO UPDATE SET
                      market_price=EXCLUDED.market_price, low_price=EXCLUDED.low_price,
                      high_price=EXCLUDED.high_price, listings_count=EXCLUDED.listings_count`;
      for (const r of snapshots) {
        await client.query(stmt, [
          r.productId, r.marketPrice, r.lowPrice, r.highPrice,
          r.listingsCount ?? 0, r.source, r.recordedAt,
        ]);
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  async bulkUpsertProducts(products) {
    if (!products?.length) return;
    for (const product of products) {
      await this.upsertProduct(product);
    }
  },

  async getLatestPrices(productIds) {
    if (!productIds.length) return new Map();
    const p = await getPool();
    const { rows } = await p.query(
      `SELECT DISTINCT ON (product_id) product_id AS "productId", market_price AS "marketPrice",
              low_price AS "lowPrice", high_price AS "highPrice",
              listings_count AS "listingsCount", source, recorded_at::text AS "recordedAt"
       FROM price_history WHERE product_id = ANY($1)
       ORDER BY product_id, recorded_at DESC`,
      [productIds]
    );
    return new Map(rows.map((r) => [r.productId, r]));
  },

  async getProductsWithHistory(minPoints = 7) {
    const p = await getPool();
    const { rows } = await p.query(
      `SELECT p.* FROM products p
       WHERE (SELECT COUNT(*) FROM price_history h WHERE h.product_id = p.id) >= $1`,
      [minPoints]
    );
    return rows.map(rowToProduct);
  },

  async insertPriceSnapshot(snapshot) {
    const p = await getPool();
    await p.query(
      `INSERT INTO price_history (product_id, market_price, low_price, high_price, listings_count, source, recorded_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (product_id, recorded_at) DO UPDATE SET
         market_price = EXCLUDED.market_price, low_price = EXCLUDED.low_price,
         high_price = EXCLUDED.high_price, listings_count = EXCLUDED.listings_count`,
      [
        snapshot.productId,
        snapshot.marketPrice,
        snapshot.lowPrice,
        snapshot.highPrice,
        snapshot.listingsCount ?? 0,
        snapshot.source,
        snapshot.recordedAt,
      ]
    );
  },

  async getPriceHistory(productId, limit = 365) {
    const p = await getPool();
    const { rows } = await p.query(
      `SELECT market_price AS "marketPrice", low_price AS "lowPrice", high_price AS "highPrice",
              listings_count AS "listingsCount", source, recorded_at::text AS "recordedAt"
       FROM price_history WHERE product_id = $1 ORDER BY recorded_at ASC LIMIT $2`,
      [productId, limit]
    );
    return rows;
  },

  async getLatestPrice(productId) {
    const p = await getPool();
    const { rows } = await p.query(
      `SELECT market_price AS "marketPrice", low_price AS "lowPrice", high_price AS "highPrice",
              listings_count AS "listingsCount", source, recorded_at::text AS "recordedAt"
       FROM price_history WHERE product_id = $1 ORDER BY recorded_at DESC LIMIT 1`,
      [productId]
    );
    return rows[0] || null;
  },

  async getWatchlist() {
    const p = await getPool();
    const { rows } = await p.query(
      'SELECT product_id AS "productId", added_at AS "addedAt" FROM watchlist ORDER BY added_at DESC'
    );
    return rows;
  },

  async addToWatchlist(productId) {
    const p = await getPool();
    await p.query('INSERT INTO watchlist (product_id) VALUES ($1) ON CONFLICT DO NOTHING', [productId]);
  },

  async removeFromWatchlist(productId) {
    const p = await getPool();
    const { rowCount } = await p.query('DELETE FROM watchlist WHERE product_id = $1', [productId]);
    return rowCount > 0;
  },

  async isOnWatchlist(productId) {
    const p = await getPool();
    const { rows } = await p.query('SELECT 1 FROM watchlist WHERE product_id = $1', [productId]);
    return rows.length > 0;
  },

  async getTrendingProductIds(limit = 12) {
    const p = await getPool();
    const { rows } = await p.query(
      `SELECT product_id AS "productId", COUNT(*) AS "pointCount",
              MIN(market_price) AS "minPrice", MAX(market_price) AS "maxPrice"
       FROM price_history GROUP BY product_id HAVING COUNT(*) >= 7
       ORDER BY (MAX(market_price) - MIN(market_price)) / NULLIF(MIN(market_price), 0) DESC
       LIMIT $1`,
      [limit]
    );
    return rows;
  },

  async searchProductsLocal(query, limit = 20) {
    const p = await getPool();
    const { rows } = await p.query(
      `SELECT * FROM products WHERE type = 'sealed' AND (name ILIKE $1 OR set_name ILIKE $1) LIMIT $2`,
      [`%${query}%`, limit]
    );
    return rows.map(rowToProduct);
  },
};
