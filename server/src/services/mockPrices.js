import { config } from '../config.js';
import {
  getPriceHistory,
  insertPriceSnapshot,
  getLatestPrice,
} from '../db.js';

/** Simple deterministic hash for stable mock prices per card */
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const RARITY_BASE = {
  'Common': 0.35,
  'Uncommon': 0.85,
  'Rare': 4.5,
  'Rare Holo': 12,
  'Rare Holo EX': 28,
  'Rare Holo GX': 22,
  'Rare Holo V': 18,
  'Rare Holo VMAX': 35,
  'Rare Ultra': 45,
  'Rare Secret': 120,
  'Amazing Rare': 15,
  'Radiant Rare': 8,
  'Illustration Rare': 55,
  'Special Illustration Rare': 95,
  'Hyper Rare': 150,
  'Promo': 5,
};

function basePriceForCard(card) {
  const rarity = card?.rarity || 'Rare';
  const base = RARITY_BASE[rarity] ?? 8;
  const seed = hashString(`${config.mockPriceSeed}:${card?.id || 'unknown'}`);
  const jitter = 0.75 + seededRandom(seed) * 0.6;
  if (card?.apiMarketPrice && card.apiMarketPrice > 0) {
    return Number((card.apiMarketPrice * (0.92 + seededRandom(seed + 1) * 0.16)).toFixed(2));
  }
  return Number((base * jitter).toFixed(2));
}

function priceOnDay(base, cardId, dayOffset) {
  const seed = hashString(`${config.mockPriceSeed}:${cardId}:${dayOffset}`);
  const wave = Math.sin(dayOffset / 5 + seededRandom(seed) * 6) * 0.04;
  const drift = (dayOffset / 60) * (seededRandom(seed + 2) > 0.5 ? 0.08 : -0.05);
  const noise = (seededRandom(seed + 3) - 0.5) * 0.03;
  const mult = 1 + wave + drift + noise;
  return Number(Math.max(0.1, base * mult).toFixed(2));
}

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

/** Backfill ~60 days of mock TCGplayer-style prices on first access */
export function ensurePriceHistory(card) {
  const existing = getPriceHistory(card.id, 1);
  if (existing.length > 0) {
    return getPriceHistory(card.id);
  }

  const base = basePriceForCard(card);
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  for (let i = 59; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const price = priceOnDay(base, card.id, -i);
    insertPriceSnapshot(card.id, price, formatDate(d), 'mock-tcgplayer');
  }

  return getPriceHistory(card.id);
}

export function recordTodayPrice(card) {
  const base = basePriceForCard(card);
  const today = formatDate(new Date());
  const latest = getLatestPrice(card.id);
  if (latest?.recordedAt === today) {
    return latest.price;
  }
  const history = getPriceHistory(card.id);
  const dayOffset = history.length ? -1 : 0;
  const price = priceOnDay(base, card.id, dayOffset);
  insertPriceSnapshot(card.id, price, today, 'mock-tcgplayer');
  return price;
}

export function getCurrentMockPrice(card) {
  ensurePriceHistory(card);
  return recordTodayPrice(card);
}

export function getMockPriceSummary(card) {
  const history = ensurePriceHistory(card);
  const current = history[history.length - 1]?.price ?? basePriceForCard(card);
  const weekAgo = history[Math.max(0, history.length - 8)]?.price ?? current;
  const monthAgo = history[0]?.price ?? current;

  return {
    current,
    weekAgo,
    monthAgo,
    change7d: percentChange(weekAgo, current),
    change30d: percentChange(monthAgo, current),
    source: 'mock-tcgplayer',
    note: 'Sample market data for MVP. Replace with TCGplayer/eBay APIs when approved.',
  };
}

function percentChange(from, to) {
  if (!from || from === 0) return 0;
  return Number((((to - from) / from) * 100).toFixed(2));
}
