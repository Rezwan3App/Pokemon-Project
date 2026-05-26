import { config } from '../../config.js';
import { hashString, seededRandom } from '../../utils/hash.js';
import { toDateKey } from '../../utils/dates.js';
import { db } from '../../database/index.js';
import { PROVIDER_IDS } from './providerContract.js';

/**
 * Pricing provider that prefers REAL TCGplayer prices (fetched via the Pokémon
 * TCG API, which aggregates TCGplayer data) when present on a card, and falls
 * back to deterministic sample prices for sealed products or cards without
 * marketplace data. This means cards with TCGplayer data on the API show the
 * same current market price you'd see on TCGplayer.
 */
export const mockProvider = {
  id: PROVIDER_IDS.MOCK,
  isLive: false,

  async fetchPrices(product, dateKey = toDateKey()) {
    await ensureHistory(product);

    const real = realPriceFromProduct(product);
    let snapshot;

    if (real) {
      // Card has real TCGplayer data — use it verbatim for today's snapshot
      snapshot = {
        productId: product.id,
        marketPrice: real.market,
        lowPrice: real.low,
        highPrice: real.high,
        listingsCount: 0,
        source: 'tcgplayer-via-pokemontcg-api',
        recordedAt: dateKey,
      };
    } else {
      // No real data — generate today's value with the simulated walk
      const base = baseMarket(product);
      const history = await db.getPriceHistory(product.id);
      const dayOffset = history.length ? -1 : 0;
      const market = marketOnDay(base, product.id, dayOffset);
      const { low, high, listings } = spread(market, product.id, dayOffset);
      snapshot = {
        productId: product.id,
        marketPrice: market,
        lowPrice: low,
        highPrice: high,
        listingsCount: listings,
        source: 'mock-tcgplayer',
        recordedAt: dateKey,
      };
    }

    await db.insertPriceSnapshot(snapshot);
    return {
      ...snapshot,
      isMock: snapshot.source.startsWith('mock'),
    };
  },
};

function realPriceFromProduct(product) {
  if (product.type !== 'card') return null;
  const m = product.metadata || {};
  const market = m.apiMarket ?? null;
  if (!market || market <= 0) return null;
  const low = m.apiLow ?? Number((market * 0.85).toFixed(2));
  const high = m.apiHigh ?? Number((market * 1.15).toFixed(2));
  return { market: round(market), low: round(low), high: round(high) };
}

const RARITY_BASE = {
  Common: 0.35,
  Uncommon: 0.85,
  Rare: 4.5,
  'Rare Holo': 12,
  'Rare Holo V': 18,
  'Rare Holo VMAX': 35,
  'Rare Ultra': 45,
  'Rare Secret': 120,
  'Illustration Rare': 55,
  'Special Illustration Rare': 95,
  Promo: 5,
};

function baseMarket(product) {
  if (product.type === 'sealed') {
    return product.metadata?.basePrice ?? 50;
  }
  // Prefer real TCGplayer market price as the historical anchor
  const apiMarket = product.metadata?.apiMarket;
  if (apiMarket && apiMarket > 0) return Number(apiMarket);

  const rarity = product.metadata?.rarity || 'Rare';
  const base = RARITY_BASE[rarity] ?? 8;
  const seed = hashString(`${config.mockPriceSeed}:${product.id}`);
  const jitter = 0.75 + seededRandom(seed) * 0.6;
  return Number((base * jitter).toFixed(2));
}

function marketOnDay(base, productId, dayOffset) {
  const seed = hashString(`${config.mockPriceSeed}:${productId}:${dayOffset}`);
  const wave = Math.sin(dayOffset / 5 + seededRandom(seed) * 6) * 0.04;
  const drift = (dayOffset / 60) * (seededRandom(seed + 2) > 0.5 ? 0.05 : -0.03);
  const noise = (seededRandom(seed + 3) - 0.5) * 0.02;
  return Number(Math.max(0.1, base * (1 + wave + drift + noise)).toFixed(2));
}

function spread(market, productId, dayOffset) {
  const seed = hashString(`${productId}:spread:${dayOffset}`);
  const pct = 0.06 + seededRandom(seed) * 0.12;
  return {
    low: Number((market * (1 - pct)).toFixed(2)),
    high: Number((market * (1 + pct)).toFixed(2)),
    listings: Math.floor(15 + seededRandom(seed + 1) * 120),
  };
}

function round(n) {
  return Number(Number(n).toFixed(2));
}

/** Backfill ~60 days of history in a single transaction (fast) */
async function ensureHistory(product, days = 60) {
  const existing = await db.getPriceHistory(product.id, 1);
  if (existing.length > 0) return;

  const base = baseMarket(product);
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const rows = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const market = marketOnDay(base, product.id, -i);
    const { low, high, listings } = spread(market, product.id, -i);
    rows.push({
      productId: product.id,
      marketPrice: market,
      lowPrice: low,
      highPrice: high,
      listingsCount: listings,
      source: 'mock-history',
      recordedAt: toDateKey(d),
    });
  }
  await db.bulkInsertPriceSnapshots(rows);
}

mockProvider.ensureHistory = ensureHistory;
