import { Router } from 'express';
import {
  searchCards,
  getCardById,
  getCardsByIds,
} from '../services/pokemonApi.js';
import {
  getMockPriceSummary,
  getCurrentMockPrice,
  ensurePriceHistory,
} from '../services/mockPrices.js';
import { computeTrendScore, enrichCardWithTrend } from '../services/trends.js';
import {
  cacheCard,
  getCachedCard,
  isOnWatchlist,
  getTrendingCardIds,
  getPriceHistory,
} from '../db.js';

const router = Router();

router.get('/search', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }
    const page = Number(req.query.page) || 1;
    const result = await searchCards(q, page);
    const enriched = await Promise.all(
      result.cards.map(async (card) => {
        const price = getMockPriceSummary(card);
        const trend = computeTrendScore(card.id);
        return enrichCardWithTrend(card, price, trend);
      })
    );
    res.json({ ...result, cards: enriched });
  } catch (err) {
    next(err);
  }
});

router.get('/trending', async (req, res, next) => {
  try {
    const trending = getTrendingCardIds(12);
    const ids = trending.map((t) => t.cardId);
    if (!ids.length) {
      const fallback = await searchCards('charizard', 1, 8);
      const cards = await Promise.all(
        fallback.cards.map(async (card) => {
          ensurePriceHistory(card);
          const price = getMockPriceSummary(card);
          const trend = computeTrendScore(card.id);
          return enrichCardWithTrend(
            { ...card, watchlisted: isOnWatchlist(card.id) },
            price,
            trend
          );
        })
      );
      return res.json({ cards });
    }
    const cards = await getCardsByIds(ids);
    const enriched = cards.map((card) => {
      const price = getMockPriceSummary(card);
      const trend = computeTrendScore(card.id);
      return enrichCardWithTrend(
        { ...card, watchlisted: isOnWatchlist(card.id) },
        price,
        trend
      );
    });
    res.json({ cards: enriched });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    let card = getCachedCard(id);
    if (!card) {
      card = await getCardById(id);
      if (card) cacheCard(id, card);
    }
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }
    ensurePriceHistory(card);
    getCurrentMockPrice(card);
    const price = getMockPriceSummary(card);
    const trend = computeTrendScore(id);
    const history = getPriceHistory(id);
    res.json({
      card: enrichCardWithTrend(
        { ...card, watchlisted: isOnWatchlist(id) },
        price,
        trend
      ),
      history,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/history', (req, res) => {
  const history = getPriceHistory(req.params.id);
  res.json({ history });
});

export default router;
