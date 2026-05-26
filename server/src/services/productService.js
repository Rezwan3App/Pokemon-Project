import { db } from '../database/index.js';
import { searchCards, getCardProduct, getProductsByIds, getPopularCards } from './pokemonApi.js';
import { searchSealed, getSealedById, getAllSealedProducts } from './sealedCatalog.js';
import { updateProductPrices } from './pricing/index.js';
import { mockProvider, refreshTodayPrice, enrichWithExternalPrice } from './pricing/mockProvider.js';
import { hasLivePrice } from './pricing/livePrice.js';
import { enrichProduct, computeTrendScore, buildPriceSummary } from './trends.js';
import { toDateKey } from '../utils/dates.js';

/** Persist product row and ensure price history exists (single item) */
export async function syncProduct(product) {
  await db.upsertProduct(product);
  await mockProvider.ensureHistory(product);
  if (hasLivePrice(product)) {
    await refreshTodayPrice(product);
  }
  return db.getProduct(product.id);
}

/** Persist many products in two batched transactions + parallel history fills */
async function syncProductsBatch(products) {
  if (!products.length) return [];
  await db.bulkUpsertProducts(products);
  await Promise.all(
    products.map(async (p) => {
      await mockProvider.ensureHistory(p);
      if (hasLivePrice(p)) await refreshTodayPrice(p);
    })
  );
  return products;
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
  } else if (!productId.startsWith('sealed:')) {
    // Always re-fetch card from API so tcgplayer prices are fresh
    const fresh = await getCardProduct(productId);
    if (fresh) {
      await db.upsertProduct(fresh);
      product = await enrichWithExternalPrice(fresh);
      await mockProvider.ensureHistory(product);
    }
  }

  // Live cards: always overwrite today's DB row with latest prices
  if (hasLivePrice(product) || product.metadata?.externalProvider) {
    await refreshTodayPrice(product);
  } else {
    const latest = await db.getLatestPrice(productId);
    if (!latest || latest.recordedAt !== toDateKey()) {
      await updateProductPrices(product);
    }
  }

  const history = await db.getPriceHistory(productId);
  const watchlisted = await db.isOnWatchlist(productId);
  return { product: enrichProduct(product, history, watchlisted), history };
}

export async function searchAll(query, page = 1) {
  const [cardResult, sealedHits] = await Promise.all([
    searchCards(query, page, 20),
    Promise.resolve(searchSealed(query, 12)),
  ]);

  const all = [...cardResult.products, ...sealedHits];
  // Batch DB writes in background-friendly way but don't block on price refresh
  await db.bulkUpsertProducts(all);
  await Promise.all(all.map((p) => mockProvider.ensureHistory(p)));

  const watchlistIds = new Set((await db.getWatchlist()).map((e) => e.productId));

  // buildPriceSummary reads live prices from product.metadata directly
  const enriched = await Promise.all(
    all.map(async (p) => {
      const fresh = await enrichWithExternalPrice(p);
      const history = await db.getPriceHistory(p.id);
      return enrichProduct(fresh, history, watchlistIds.has(p.id));
    })
  );

  return {
    products: enriched,
    page: cardResult.page,
    pageSize: cardResult.pageSize,
    totalCount: enriched.length,
    cardTotal: cardResult.totalCount,
    sealedTotal: sealedHits.length,
  };
}

export async function getTrendingProducts({ limit = 5 } = {}) {
  let products = await db.getProductsWithHistory(7);

  if (products.length < limit * 2) {
    const sealed = getAllSealedProducts();
    const popular = await getPopularCards(4).catch((err) => {
      console.warn('[trending] getPopularCards failed:', err.message);
      return [];
    });
    await syncProductsBatch([...popular, ...sealed]);
    products = await db.getProductsWithHistory(7);
  }

  const watchlistIds = new Set((await db.getWatchlist()).map((e) => e.productId));

  const scored = await Promise.all(
    products.map(async (p) => {
      const history = await db.getPriceHistory(p.id);
      const enriched = enrichProduct(p, history, watchlistIds.has(p.id));
      return enriched;
    })
  );

  const byChange = [...scored].filter((s) => s.trend);
  const rising = [...byChange]
    .sort((a, b) => (b.trend.change7d ?? 0) - (a.trend.change7d ?? 0))
    .slice(0, limit);
  const falling = [...byChange]
    .sort((a, b) => (a.trend.change7d ?? 0) - (b.trend.change7d ?? 0))
    .slice(0, limit);
  const mostActive = [...byChange]
    .sort((a, b) => (b.trend.volatility ?? 0) - (a.trend.volatility ?? 0))
    .slice(0, limit);
  const topScore = [...byChange]
    .sort((a, b) => (b.trend.score ?? 0) - (a.trend.score ?? 0))
    .slice(0, limit);

  return { rising, falling, mostActive, topScore };
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

export async function runPriceUpdateJob() {
  const ids = await db.getAllProductIds();
  let updated = 0;
  const errors = [];

  for (let i = 0; i < ids.length; i += 10) {
    const chunk = ids.slice(i, i + 10);
    const results = await Promise.allSettled(
      chunk.map(async (id) => {
        const product = await db.getProduct(id);
        if (product) await updateProductPrices(product);
      })
    );
    for (let j = 0; j < results.length; j++) {
      if (results[j].status === 'fulfilled') updated++;
      else errors.push({ id: chunk[j], message: results[j].reason?.message });
    }
  }

  return { updated, total: ids.length, errors };
}
