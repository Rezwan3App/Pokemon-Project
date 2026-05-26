import { config } from '../config.js';

const BASE_URL = 'https://api.pokemontcg.io/v2';

/** In-memory cache: { url -> { data, at } } */
const apiCache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours
const STALE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days for stale-on-error

function headers() {
  const h = { Accept: 'application/json' };
  if (config.pokemonApiKey) h['X-Api-Key'] = config.pokemonApiKey;
  return h;
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * fetchJson with retry, exponential backoff, in-memory cache, and
 * stale-while-error fallback. Handles 504 Gateway Timeout gracefully.
 */
async function fetchJson(url, { retries = 3, timeoutMs = 10000 } = {}) {
  const cached = apiCache.get(url);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data;

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, { headers: headers(), signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        apiCache.set(url, { data, at: Date.now() });
        return data;
      }

      // Cloudflare 5xx / rate-limit → backoff and retry
      if ((res.status >= 500 || res.status === 429) && attempt < retries) {
        const wait = Math.min(2000 * 2 ** attempt, 8000);
        await delay(wait);
        continue;
      }

      const text = await res.text().catch(() => '');
      throw new Error(`Pokémon TCG API ${res.status}: ${truncate(text || res.statusText)}`);
    } catch (err) {
      lastError = err;
      if (attempt < retries && isRetryable(err)) {
        const wait = Math.min(2000 * 2 ** attempt, 8000);
        await delay(wait);
        continue;
      }
      break;
    }
  }

  // Final fallback: serve stale cache if it's not too old, instead of failing
  if (cached && Date.now() - cached.at < STALE_TTL_MS) {
    console.warn('[pokemon-tcg] Upstream failed, serving stale cache:', lastError?.message);
    return cached.data;
  }
  throw lastError || new Error('Pokémon TCG API unreachable');
}

function isRetryable(err) {
  const msg = String(err?.message || '');
  return (
    err?.name === 'AbortError' ||
    /504|503|502|520|521|522|524|429|ETIMEDOUT|ECONNRESET|UND_ERR/i.test(msg)
  );
}

function truncate(s, max = 160) {
  return s && s.length > max ? `${s.slice(0, max)}…` : s;
}

/** Variant priority — pick the most relevant pricing tier for "default" view */
const VARIANT_PRIORITY = [
  'holofoil',
  '1stEditionHolofoil',
  'unlimitedHolofoil',
  'reverseHolofoil',
  '1stEditionNormal',
  'normal',
  'unlimited',
];

function pickPrimaryVariant(prices) {
  if (!prices) return null;
  for (const key of VARIANT_PRIORITY) {
    if (prices[key]) return key;
  }
  const keys = Object.keys(prices);
  return keys[0] || null;
}

/** Normalize Pokémon TCG API card → unified product shape (with real TCG prices) */
export function cardToProduct(card) {
  if (!card || !card.id) return null;
  const tcgPrices = card.tcgplayer?.prices || {};
  const cmPrices = card.cardmarket?.prices || {};
  const primaryVariant = pickPrimaryVariant(tcgPrices);
  const primary = primaryVariant ? tcgPrices[primaryVariant] : null;

  return {
    id: card.id,
    type: 'card',
    name: card.name,
    setName: card.set?.name || null,
    image: card.images?.large || card.images?.small || null,
    subtype: (card.subtypes || []).join(', ') || card.supertype,
    metadata: {
      supertype: card.supertype,
      rarity: card.rarity,
      number: card.number,
      artist: card.artist,
      types: card.types || [],
      setReleaseDate: card.set?.releaseDate || null,
      // Real TCGplayer prices (sourced via Pokémon TCG API which aggregates them)
      tcgplayerUrl: card.tcgplayer?.url || null,
      tcgplayerUpdatedAt: card.tcgplayer?.updatedAt || null,
      tcgplayerPrices: tcgPrices,
      primaryVariant,
      apiMarket: primary?.market ?? primary?.mid ?? null,
      apiLow: primary?.low ?? null,
      apiMid: primary?.mid ?? null,
      apiHigh: primary?.high ?? null,
      apiDirectLow: primary?.directLow ?? null,
      // Cardmarket (EU) — useful cross-reference
      cardmarketUrl: card.cardmarket?.url || null,
      cardmarketAvgSell: cmPrices?.averageSellPrice ?? null,
      cardmarketTrendPrice: cmPrices?.trendPrice ?? null,
    },
    source: 'pokemon-tcg',
  };
}

export async function searchCards(query, page = 1, pageSize = 24) {
  const safe = query.replace(/["\\]/g, '').trim();
  if (!safe) return { products: [], page, pageSize, totalCount: 0 };
  // Quoted exact match for multi-word, wildcard prefix for single words
  const term = safe.includes(' ') ? `"${safe}"` : `${safe}*`;
  const q = encodeURIComponent(`name:${term}`);
  const url = `${BASE_URL}/cards?q=${q}&page=${page}&pageSize=${pageSize}&orderBy=-set.releaseDate`;
  const data = await fetchJson(url);
  return {
    products: (data.data || []).map(cardToProduct).filter(Boolean),
    page: data.page || page,
    pageSize: data.pageSize || pageSize,
    totalCount: data.totalCount || 0,
  };
}

export async function getCardProduct(cardId) {
  const url = `${BASE_URL}/cards/${encodeURIComponent(cardId)}`;
  try {
    const data = await fetchJson(url);
    return cardToProduct(data?.data);
  } catch (err) {
    if (/\b404\b/.test(err.message)) return null;
    throw err;
  }
}

export async function getProductsByIds(ids) {
  const cardIds = ids.filter((id) => !id.startsWith('sealed:'));
  if (!cardIds.length) return [];
  // Chunk to avoid query length limits
  const chunks = [];
  for (let i = 0; i < cardIds.length; i += 50) chunks.push(cardIds.slice(i, i + 50));
  const all = [];
  for (const chunk of chunks) {
    const q = encodeURIComponent(`id:${chunk.join(' OR id:')}`);
    const url = `${BASE_URL}/cards?q=${q}&pageSize=${chunk.length}`;
    try {
      const data = await fetchJson(url);
      all.push(...(data.data || []).map(cardToProduct).filter(Boolean));
    } catch (err) {
      console.warn('[pokemon-tcg] getProductsByIds chunk failed:', err.message);
    }
  }
  const byId = new Map(all.map((p) => [p.id, p]));
  return cardIds.map((id) => byId.get(id)).filter(Boolean);
}

/** Curated set of "popular" cards used as a fallback for trending when DB is empty */
const POPULAR_QUERIES = [
  'charizard',
  'pikachu',
  'mew',
  'lugia',
  'rayquaza',
  'umbreon',
];

export async function getPopularCards(perQuery = 4) {
  const results = await Promise.allSettled(
    POPULAR_QUERIES.map((q) => searchCards(q, 1, perQuery))
  );
  const products = [];
  for (const r of results) {
    if (r.status === 'fulfilled') products.push(...r.value.products);
  }
  return products;
}

/** Test-only: clear cache */
export function _clearCache() {
  apiCache.clear();
}
