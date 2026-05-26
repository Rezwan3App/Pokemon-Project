/**
 * External pricing APIs — fresher TCGplayer data than the Pokémon TCG API embed.
 *
 * Priority when PRICING_MODE=auto:
 *   1. PokéWallet  (pokewallet.io) — Pokemon-specific, TCGPlayer + CardMarket
 *   2. TCG API     (tcgapi.dev)     — daily TCGPlayer refresh, sealed products
 *   3. Pokémon TCG API embed        — via extractLivePrice() in mockProvider
 *   4. Mock sample data
 */

import { config } from '../../config.js';
import { toDateKey } from '../../utils/dates.js';

const POKEWALLET_BASE = 'https://api.pokewallet.io';
const TCGAPI_BASE = 'https://api.tcgapi.dev/v1';

/** productId -> { data, at } */
const cache = new Map();
const CACHE_MS = 15 * 60 * 1000; // 15 min — conserve free-tier quotas

function cached(key, fetcher) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return Promise.resolve(hit.data);
  return fetcher().then((data) => {
    if (data) cache.set(key, { data, at: Date.now() });
    return data;
  });
}

function headers(apiKey, style = 'x-api-key') {
  if (style === 'bearer') return { Accept: 'application/json', Authorization: `Bearer ${apiKey}` };
  return { Accept: 'application/json', 'X-API-Key': apiKey };
}

/** @returns {import('./providerContract.js').PriceSnapshot|null} */
export async function lookupExternalPrice(product, dateKey = toDateKey()) {
  if (config.pokewalletApiKey) {
    const pw = await cached(`pw:${product.id}`, () => fetchPokewallet(product));
    if (pw) return { ...pw, recordedAt: dateKey };
  }
  if (config.tcgApiKey) {
    const tcg = await cached(`tcg:${product.id}`, () => fetchTcgApi(product));
    if (tcg) return { ...tcg, recordedAt: dateKey };
  }
  return null;
}

async function fetchPokewallet(product) {
  const q = buildSearchQuery(product);
  const url = `${POKEWALLET_BASE}/search?q=${encodeURIComponent(q)}&limit=10`;
  try {
    const res = await fetch(url, { headers: headers(config.pokewalletApiKey) });
    if (!res.ok) {
      console.warn(`[pokewallet] ${res.status} for ${q}`);
      return null;
    }
    const data = await res.json();
    const match = pickBestPokewalletResult(data.results || [], product);
    if (!match) return null;

    const tier = match.tcgplayer?.prices?.[0];
    if (!tier?.market_price && !tier?.mid_price) return null;

    return {
      productId: product.id,
      marketPrice: round(tier.market_price ?? tier.mid_price),
      lowPrice: round(tier.low_price ?? tier.market_price),
      highPrice: round(tier.high_price ?? tier.market_price),
      listingsCount: 0,
      source: 'pokewallet-tcgplayer',
      isMock: false,
      externalMeta: {
        provider: 'pokewallet',
        pokewalletId: match.id,
        variant: tier.sub_type_name,
        mid: tier.mid_price,
        directLow: tier.direct_low_price,
        updatedAt: tier.updated_at,
        tcgplayerUrl: match.tcgplayer?.url,
        cardmarket: match.cardmarket?.prices?.[0] ?? null,
      },
    };
  } catch (err) {
    console.warn('[pokewallet]', err.message);
    return null;
  }
}

async function fetchTcgApi(product) {
  const q = product.name;
  const url = `${TCGAPI_BASE}/search?q=${encodeURIComponent(q)}&game=pokemon&per_page=10`;
  try {
    const res = await fetch(url, { headers: headers(config.tcgApiKey, 'x-api-key') });
    if (!res.ok) {
      console.warn(`[tcgapi] ${res.status} for ${q}`);
      return null;
    }
    const data = await res.json();
    const match = pickBestTcgApiResult(data.data || [], product);
    if (!match?.market_price) return null;

    return {
      productId: product.id,
      marketPrice: round(match.market_price),
      lowPrice: round(match.low_price ?? match.market_price),
      highPrice: round(match.median_price ?? match.market_price * 1.1),
      listingsCount: match.total_listings ?? 0,
      source: 'tcgapi-tcgplayer',
      isMock: false,
      externalMeta: {
        provider: 'tcgapi',
        tcgapiId: match.id,
        tcgplayerId: match.tcgplayer_id,
        printing: match.printing,
        updatedAt: match.price_updated_at,
        change7d: match.price_change_7d,
      },
    };
  } catch (err) {
    console.warn('[tcgapi]', err.message);
    return null;
  }
}

function buildSearchQuery(product) {
  const num = (product.metadata?.number || '').split('/')[0].trim();
  const set = product.setName || '';
  if (num && set) return `${product.name} ${num} ${set}`;
  if (set) return `${product.name} ${set}`;
  return product.name;
}

function norm(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function pickBestPokewalletResult(results, product) {
  if (!results.length) return null;
  const targetName = norm(product.name);
  const targetSet = norm(product.setName);
  const targetNum = norm((product.metadata?.number || '').split('/')[0]);

  let best = null;
  let bestScore = -1;
  for (const r of results) {
    const info = r.card_info || {};
    let score = 0;
    if (norm(info.name).includes(targetName) || targetName.includes(norm(info.name))) score += 3;
    if (targetSet && norm(info.set_name).includes(targetSet)) score += 3;
    if (targetNum && norm(info.card_number) === targetNum) score += 4;
    if (r.tcgplayer?.prices?.length) score += 2;
    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  }
  return bestScore >= 3 ? best : results.find((r) => r.tcgplayer?.prices?.length) || null;
}

function pickBestTcgApiResult(results, product) {
  if (!results.length) return null;
  const targetName = norm(product.name);
  const targetSet = norm(product.setName);
  const targetNum = norm((product.metadata?.number || '').split('/')[0]);

  let best = null;
  let bestScore = -1;
  for (const r of results) {
    let score = 0;
    if (norm(r.clean_name || r.name).includes(targetName)) score += 3;
    if (targetSet && norm(r.set_name).includes(targetSet)) score += 3;
    if (targetNum && norm(r.number) === targetNum) score += 4;
    if (r.market_price) score += 1;
    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  }
  return bestScore >= 3 ? best : results[0];
}

function round(n) {
  return Number(Number(n).toFixed(2));
}

/** Merge external lookup into product.metadata for display layer */
export function applyExternalMeta(product, snapshot) {
  if (!snapshot?.externalMeta) return product;
  const m = snapshot.externalMeta;
  return {
    ...product,
    metadata: {
      ...product.metadata,
      externalProvider: m.provider,
      apiMarket: snapshot.marketPrice,
      apiLow: snapshot.lowPrice,
      apiHigh: snapshot.highPrice,
      apiMid: m.mid ?? product.metadata?.apiMid,
      apiDirectLow: m.directLow ?? product.metadata?.apiDirectLow,
      tcgplayerUpdatedAt: m.updatedAt ?? product.metadata?.tcgplayerUpdatedAt,
      tcgplayerUrl: m.tcgplayerUrl ?? product.metadata?.tcgplayerUrl,
      primaryVariant: m.variant ?? product.metadata?.primaryVariant,
    },
  };
}

export function getExternalPricingStatus() {
  return {
    pokewalletConfigured: Boolean(config.pokewalletApiKey),
    tcgApiConfigured: Boolean(config.tcgApiKey),
    recommended: 'Set POKEWALLET_API_KEY (free tier) + PRICING_MODE=auto for best accuracy',
  };
}
