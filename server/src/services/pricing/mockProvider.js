import { config } from '../../config.js';
import { hashString, seededRandom } from '../../utils/hash.js';
import { toDateKey } from '../../utils/dates.js';
import { db } from '../../database/index.js';
import { PROVIDER_IDS } from './providerContract.js';
import { extractLivePrice } from './livePrice.js';

/**
 * Pricing provider: uses REAL TCGplayer data from the Pokémon TCG API when
 * available. Mock/simulated data is only used for sealed products or cards
 * with no tcgplayer block on the API response.
 */
export const mockProvider = {
  id: PROVIDER_IDS.MOCK,
  isLive: false,

  async fetchPrices(product, dateKey = toDateKey()) {
    // Backfill past days only — never pre-fill today with mock data
    await ensureHistory(product);

    const live = extractLivePrice(product);
    let snapshot;

    if (live) {
      snapshot = {
        productId: product.id,
        marketPrice: live.market,
        lowPrice: live.low,
        highPrice: live.high,
        listingsCount: 0,
        source: 'tcgplayer-via-pokemontcg-api',
        recordedAt: dateKey,
      };
    } else {
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
    return { ...snapshot, isMock: snapshot.source.startsWith('mock') };
  },
};

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
  if (product.type === 'sealed') return product.metadata?.basePrice ?? 50;
  const live = extractLivePrice(product);
  if (live) return live.market;
  const rarity = product.metadata?.rarity || 'Rare';
  const base = RARITY_BASE[rarity] ?? 8;
  const seed = hashString(`${config.mockPriceSeed}:${product.id}`);
  return Number((base * (0.75 + seededRandom(seed) * 0.6)).toFixed(2));
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

/**
 * Backfill past days only (excludes today).
 * Today is always written by fetchPrices with live or mock snapshot.
 */
async function ensureHistory(product, days = 60) {
  const existing = await db.getPriceHistory(product.id, 1);
  if (existing.length > 0) return;

  const base = baseMarket(product);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const todayKey = toDateKey(today);

  const rows = [];
  // i = days-1 .. 1 (skip i=0 which is today)
  for (let i = days - 1; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateKey = toDateKey(d);
    if (dateKey === todayKey) continue;

    const market = marketOnDay(base, product.id, -i);
    const { low, high, listings } = spread(market, product.id, -i);
    rows.push({
      productId: product.id,
      marketPrice: market,
      lowPrice: low,
      highPrice: high,
      listingsCount: listings,
      source: 'mock-history',
      recordedAt: dateKey,
    });
  }
  if (rows.length) await db.bulkInsertPriceSnapshots(rows);
}

mockProvider.ensureHistory = ensureHistory;

/** Force today's row to match latest API/TCGplayer data (overwrites mock) */
export async function refreshTodayPrice(product) {
  return mockProvider.fetchPrices(product, toDateKey());
}
