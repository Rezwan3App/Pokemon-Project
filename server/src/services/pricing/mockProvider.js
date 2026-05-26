import { config } from '../../config.js';
import { hashString, seededRandom } from '../../utils/hash.js';
import { toDateKey } from '../../utils/dates.js';
import { db } from '../../database/index.js';
import { PROVIDER_IDS } from './providerContract.js';

/** MVP sample pricing — deterministic, no external marketplace API required */
export const mockProvider = {
  id: PROVIDER_IDS.MOCK,
  isLive: false,

  async fetchPrices(product, dateKey = toDateKey()) {
    await ensureHistory(product);
    const base = baseMarket(product);
    const history = await db.getPriceHistory(product.id);
    const dayOffset = history.length ? -1 : 0;
    const market = marketOnDay(base, product.id, dayOffset);
    const { low, high, listings } = spread(market, product.id, dayOffset);

    const snapshot = {
      marketPrice: market,
      lowPrice: low,
      highPrice: high,
      listingsCount: listings,
      source: 'mock-tcgplayer',
      recordedAt: dateKey,
      isMock: true,
    };

    await db.insertPriceSnapshot({
      productId: product.id,
      marketPrice: snapshot.marketPrice,
      lowPrice: snapshot.lowPrice,
      highPrice: snapshot.highPrice,
      listingsCount: snapshot.listingsCount,
      source: snapshot.source,
      recordedAt: snapshot.recordedAt,
    });

    return snapshot;
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
  if (product.type === 'sealed') {
    return product.metadata?.basePrice ?? 50;
  }
  const rarity = product.metadata?.rarity || 'Rare';
  const base = RARITY_BASE[rarity] ?? 8;
  const seed = hashString(`${config.mockPriceSeed}:${product.id}`);
  const jitter = 0.75 + seededRandom(seed) * 0.6;
  const apiPrice = product.metadata?.apiMarketPrice;
  if (apiPrice && apiPrice > 0) {
    return Number((apiPrice * (0.92 + seededRandom(seed + 1) * 0.16)).toFixed(2));
  }
  return Number((base * jitter).toFixed(2));
}

function marketOnDay(base, productId, dayOffset) {
  const seed = hashString(`${config.mockPriceSeed}:${productId}:${dayOffset}`);
  const wave = Math.sin(dayOffset / 5 + seededRandom(seed) * 6) * 0.04;
  const drift = (dayOffset / 60) * (seededRandom(seed + 2) > 0.5 ? 0.08 : -0.05);
  const noise = (seededRandom(seed + 3) - 0.5) * 0.03;
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

async function ensureHistory(product, days = 60) {
  const existing = await db.getPriceHistory(product.id, 1);
  if (existing.length > 0) return;

  const base = baseMarket(product);
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const market = marketOnDay(base, product.id, -i);
    const { low, high, listings } = spread(market, product.id, -i);
    await db.insertPriceSnapshot({
      productId: product.id,
      marketPrice: market,
      lowPrice: low,
      highPrice: high,
      listingsCount: listings,
      source: 'mock-tcgplayer',
      recordedAt: toDateKey(d),
    });
  }
}

mockProvider.ensureHistory = ensureHistory;
