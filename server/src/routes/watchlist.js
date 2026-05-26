import { Router } from 'express';
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from '../db.js';
import { getCardsByIds } from '../services/pokemonApi.js';
import { getMockPriceSummary, ensurePriceHistory } from '../services/mockPrices.js';
import { computeTrendScore, enrichCardWithTrend } from '../services/trends.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const entries = getWatchlist();
    if (!entries.length) {
      return res.json({ cards: [] });
    }
    const ids = entries.map((e) => e.card_id);
    const cards = await getCardsByIds(ids);
    const enriched = cards.map((card) => {
      ensurePriceHistory(card);
      const price = getMockPriceSummary(card);
      const trend = computeTrendScore(card.id);
      return enrichCardWithTrend({ ...card, watchlisted: true }, price, trend);
    });
    res.json({ cards: enriched });
  } catch (err) {
    next(err);
  }
});

router.post('/:cardId', (req, res) => {
  const entry = addToWatchlist(req.params.cardId);
  res.status(201).json({ watchlisted: true, entry });
});

router.delete('/:cardId', (req, res) => {
  const removed = removeFromWatchlist(req.params.cardId);
  res.json({ watchlisted: false, removed });
});

export default router;
