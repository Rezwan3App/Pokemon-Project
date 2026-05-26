import { getPriceHistory } from '../db.js';

/**
 * Trend score 0–100 from recent price momentum and volatility.
 * Higher = stronger upward trend.
 */
export function computeTrendScore(cardId) {
  const history = getPriceHistory(cardId, 60);
  if (history.length < 7) {
    return { score: 50, label: 'Stable', direction: 'flat', change7d: 0, change30d: 0 };
  }

  const prices = history.map((h) => h.price);
  const current = prices[prices.length - 1];
  const weekAgo = prices[Math.max(0, prices.length - 8)];
  const monthAgo = prices[0];

  const change7d = percentChange(weekAgo, current);
  const change30d = percentChange(monthAgo, current);

  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] > 0) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
  }
  const avgReturn = returns.length
    ? returns.reduce((a, b) => a + b, 0) / returns.length
    : 0;
  const volatility =
    returns.length > 1
      ? Math.sqrt(
          returns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / (returns.length - 1)
        )
      : 0;

  let score = 50 + change7d * 2.5 + change30d * 0.8 + avgReturn * 400;
  score -= volatility * 120;
  score = Math.max(0, Math.min(100, Math.round(score)));

  let direction = 'flat';
  let label = 'Stable';
  if (score >= 65) {
    direction = 'up';
    label = 'Bullish';
  } else if (score <= 35) {
    direction = 'down';
    label = 'Bearish';
  }

  return {
    score,
    label,
    direction,
    change7d: round(change7d),
    change30d: round(change30d),
  };
}

function percentChange(from, to) {
  if (!from || from === 0) return 0;
  return ((to - from) / from) * 100;
}

function round(n) {
  return Number(n.toFixed(2));
}

export function enrichCardWithTrend(card, priceSummary, trend) {
  return {
    ...card,
    price: priceSummary,
    trend,
  };
}
