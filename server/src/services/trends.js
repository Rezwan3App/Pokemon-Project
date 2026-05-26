import { extractLivePrice } from './pricing/livePrice.js';

function percentChange(from, to) {
  if (!from || from === 0) return 0;
  return ((to - from) / from) * 100;
}

function priceAtOffset(prices, daysBack) {
  if (!prices?.length) return null;
  const idx = Math.max(0, prices.length - 1 - daysBack);
  return prices[idx];
}

function round(n) {
  return Number(n.toFixed(2));
}

/**
 * Build display price summary.
 * When product has live TCGplayer data from the Pokémon TCG API, that ALWAYS
 * wins for current/low/high — even if DB history has stale mock rows.
 */
export function buildPriceSummary(history, product = null) {
  const live = extractLivePrice(product);
  const latest = history?.length ? history[history.length - 1] : null;

  if (!live && !latest) return null;

  const marketPrices = (history || []).map((h) => h.marketPrice);
  const current = live?.market ?? latest?.marketPrice;
  const low = live?.low ?? latest?.lowPrice;
  const high = live?.high ?? latest?.highPrice;

  const week = priceAtOffset(marketPrices, 7);
  const month = priceAtOffset(marketPrices, 30);
  const first = marketPrices[0];

  const isLive = Boolean(live);
  const isMock = !isLive;

  let note;
  if (isLive) {
    note = `TCGplayer market price via Pokémon TCG API (${live.variant}). Chart history is estimated until daily snapshots build up.`;
  } else {
    note = 'No TCGplayer price on the Pokémon TCG API for this item — showing sample estimate only.';
  }

  return {
    current,
    low,
    high,
    mid: live?.mid ?? null,
    directLow: live?.directLow ?? null,
    variant: live?.variant ?? null,
    tcgplayerUpdatedAt: live?.updatedAt ?? null,
    listingsCount: latest?.listingsCount ?? 0,
    lastUpdated: live?.updatedAt?.slice(0, 10) || latest?.recordedAt || toDateKey(),
    source: isLive ? 'tcgplayer-via-pokemontcg-api' : latest?.source || 'mock',
    isMock,
    isLive,
    change7d: round(percentChange(week, current)),
    change30d: round(percentChange(month, current)),
    changeAllTime: first ? round(percentChange(first, current)) : 0,
    note,
  };
}

function toDateKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function computeTrendScore(history) {
  const disclaimer =
    'Trend scores are rule-based estimates for educational purposes only. Not financial advice.';

  if (!history || history.length < 3) {
    return {
      score: 50,
      label: 'Stable',
      direction: 'stable',
      change7d: 0,
      change30d: 0,
      changeAllTime: 0,
      volatility: 0,
      disclaimer,
    };
  }

  const markets = history.map((h) => h.marketPrice ?? h.price);
  const current = markets[markets.length - 1];
  const week = priceAtOffset(markets, 7) ?? markets[0];
  const month = priceAtOffset(markets, 30) ?? markets[0];
  const first = markets[0];

  const change7d = percentChange(week, current);
  const change30d = percentChange(month, current);
  const changeAllTime = percentChange(first, current);

  const returns = [];
  for (let i = 1; i < markets.length; i++) {
    if (markets[i - 1] > 0) returns.push((markets[i] - markets[i - 1]) / markets[i - 1]);
  }
  const avgReturn = returns.length ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const volatility =
    returns.length > 1
      ? Math.sqrt(returns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / (returns.length - 1))
      : 0;

  const recent = returns.slice(-14);
  const upRatio = recent.length ? recent.filter((r) => r > 0).length / recent.length : 0.5;
  const listings = history[history.length - 1]?.listingsCount ?? 0;
  const liquidityBoost = Math.min(10, listings / 20);

  let score = 50 + change7d * 2 + change30d * 0.6 + upRatio * 15 + liquidityBoost;
  score -= volatility * 100;
  score = Math.max(0, Math.min(100, Math.round(score)));

  let label = 'Stable';
  let direction = 'stable';
  const highVolatility = volatility > 0.04;

  if (highVolatility && Math.abs(change7d) > 8) {
    label = 'High volatility';
    direction = 'volatile';
  } else if (score >= 62 && change7d > 2) {
    label = 'Rising';
    direction = 'rising';
  } else if (score <= 38 && change7d < -2) {
    label = 'Falling';
    direction = 'falling';
  }

  return {
    score,
    label,
    direction,
    change7d: round(change7d),
    change30d: round(change30d),
    changeAllTime: round(changeAllTime),
    volatility: round(volatility * 100),
    disclaimer,
  };
}

export function enrichProduct(product, history, watchlisted = false) {
  const price = buildPriceSummary(history, product);
  const trend = computeTrendScore(history);
  return { ...product, price, trend, watchlisted };
}
