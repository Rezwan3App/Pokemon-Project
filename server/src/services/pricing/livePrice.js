/**
 * Extract live TCGplayer prices embedded in Pokémon TCG API card data.
 * These match what TCGplayer publishes (market / low / mid / high per variant).
 */

const VARIANT_PRIORITY = [
  'holofoil',
  '1stEditionHolofoil',
  'unlimitedHolofoil',
  'reverseHolofoil',
  '1stEditionNormal',
  'normal',
  'unlimited',
];

export function pickPrimaryVariant(prices) {
  if (!prices || typeof prices !== 'object') return null;
  for (const key of VARIANT_PRIORITY) {
    if (prices[key]) return key;
  }
  return Object.keys(prices)[0] || null;
}

/** @returns {{ market, low, mid, high, directLow, variant, updatedAt, url } | null} */
export function extractLivePrice(product) {
  if (!product || product.type !== 'card') return null;
  const m = product.metadata || {};

  // Prefer full variant map when present
  const tcgPrices = m.tcgplayerPrices || {};
  const variant = m.primaryVariant || pickPrimaryVariant(tcgPrices);
  const tier = variant ? tcgPrices[variant] : null;

  const market =
    tier?.market ??
    tier?.mid ??
    m.apiMarket ??
    null;
  if (!market || market <= 0) return null;

  return {
    market: round(market),
    low: round(tier?.low ?? m.apiLow ?? market * 0.9),
    mid: round(tier?.mid ?? m.apiMid ?? market),
    high: round(tier?.high ?? m.apiHigh ?? market * 1.1),
    directLow: tier?.directLow ?? m.apiDirectLow ?? null,
    variant: variant || 'holofoil',
    updatedAt: m.tcgplayerUpdatedAt || null,
    url: m.tcgplayerUrl || null,
  };
}

export function hasLivePrice(product) {
  return extractLivePrice(product) !== null;
}

function round(n) {
  return Number(Number(n).toFixed(2));
}
