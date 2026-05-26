import { db } from '../database/index.js';
import { searchCards, getCardProduct, getProductsByIds } from './pokemonApi.js';
import { searchSealed, getSealedById } from './sealedCatalog.js';
import { updateProductPrices } from './pricing/index.js';
import { mockProvider } from './pricing/mockProvider.js';
import { enrichProduct } from './trends.js';

/** Persist product row and ensure price history exists */
export async function syncProduct(product) {
  await db.upsertProduct(product);
  await mockProvider.ensureHistory(product);
  return db.getProduct(product.id);
}

export async function getEnrichedProduct(productId) {
  let product = await db.getProduct(productId);

  if (!product) {
    if (productId.startsWith('sealed:')) {
      product = getSealedById(productId);
    } else {
      product = await getCardProduct(productId);
    }
    if (!product) return null;
    await syncProduct(product);
  }

  await updateProductPrices(product);
  const history = await db.getPriceHistory(productId);
  const watchlisted = await db.isOnWatchlist(productId);
  return { product: enrichProduct(product, history, watchlisted), history };
}

export async function searchAll(query, page = 1) {
  const [cardResult, sealedHits] = await Promise.all([
    searchCards(query, page, 20),
    Promise.resolve(searchSealed(query, 12)),
  ]);

  const sealedSynced = await Promise.all(sealedHits.map((p) => syncProduct(p)));
  const cardsSynced = await Promise.all(cardResult.products.map((p) => syncProduct(p)));

  const all = [...cardsSynced, ...sealedSynced];
  const enriched = await Promise.all(
    all.map(async (p) => {
      const history = await db.getPriceHistory(p.id);
      if (!history.length) await mockProvider.ensureHistory(p);
      const h = await db.getPriceHistory(p.id);
      return enrichProduct(p, h, await db.isOnWatchlist(p.id));
    })
  );

  return {
    products: enriched,
    page: cardResult.page,
    pageSize: cardResult.pageSize,
    totalCount: cardResult.totalCount + sealedHits.length,
  };
}

export async function getTrendingProducts() {
  const trending = await db.getTrendingProductIds(12);
  let ids = trending.map((t) => t.productId);

  if (!ids.length) {
    const fallback = await searchCards('charizard', 1, 8);
    ids = fallback.products.map((p) => p.id);
  }

  const products = [];
  for (const id of ids) {
    if (id.startsWith('sealed:')) {
      const s = getSealedById(id);
      if (s) products.push(s);
    }
  }
  const cardProducts = await getProductsByIds(ids.filter((id) => !id.startsWith('sealed:')));
  const combined = [...cardProducts, ...products];

  const enriched = [];
  for (const p of combined) {
    await syncProduct(p);
    const history = await db.getPriceHistory(p.id);
    enriched.push(enrichProduct(p, history, await db.isOnWatchlist(p.id)));
  }
  return enriched;
}

export async function getWatchlistProducts() {
  const entries = await db.getWatchlist();
  const ids = entries.map((e) => e.productId);
  if (!ids.length) return [];

  const result = [];
  for (const id of ids) {
    const data = await getEnrichedProduct(id);
    if (data) result.push(data.product);
  }
  return result;
}

/** Run price update for all known products (cron + manual) */
export async function runPriceUpdateJob() {
  const ids = await db.getAllProductIds();
  let updated = 0;
  const errors = [];

  for (const id of ids) {
    try {
      const product = await db.getProduct(id);
      if (product) {
        await updateProductPrices(product);
        updated++;
      }
    } catch (err) {
      errors.push({ id, message: err.message });
    }
  }

  return { updated, total: ids.length, errors };
}
