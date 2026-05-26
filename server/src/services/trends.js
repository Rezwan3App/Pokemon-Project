/**
 * Rule-based trend scoring (not ML).
 * Labels: Rising, Stable, Falling, High volatility
 *
 * NOT FINANCIAL ADVICE — educational estimate only.
 */

function percentChange(from, to) {
  if (!from || from === 0) return 0;
  return ((to - from) / from) * 100;
}

function priceAtOffset(history, daysBack) {
  if (!history.length) return null;
  const idx = Math.max(0, history.length - 1 - daysBack);
  return history[idx];
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

  // Upward consistency: fraction of positive daily moves in last 14 days
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

function round(n) {
  return Number(n.toFixed(2));
}

export function buildPriceSummary(history) {
  if (!history?.length) return null;
  const latest = history[history.length - 1];
  const week = priceAtOffset(history.map((h) => h.marketPrice), 7);
  const month = priceAtOffset(history.map((h) => h.marketPrice), 30);
  const first = history[0].marketPrice;

  const isMock =
    !latest.source ||
    latest.source.startsWith('mock') ||
    latest.source.includes('sample');

  return {
    current: latest.marketPrice,
    low: latest.lowPrice,
    high: latest.highPrice,
    listingsCount: latest.listingsCount ?? 0,
    lastUpdated: latest.recordedAt,
    source: latest.source,
    isMock,
    change7d: round(percentChange(week, latest.marketPrice)),
    change30d: round(percentChange(month, latest.marketPrice)),
    changeAllTime: round(percentChange(first, latest.marketPrice)),
    note: isMock
      ? 'Sample market data (MVP). Card images/metadata from Pokémon TCG API. Connect TCGplayer or eBay for live prices.'
      : `Live pricing from ${latest.source}.`,
  };
}

export function enrichProduct(product, history, watchlisted = false) {
  const price = buildPriceSummary(history);
  const trend = computeTrendScore(history);
  return { ...product, price, trend, watchlisted };
}
