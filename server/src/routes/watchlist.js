import { Router } from 'express';
import { db } from '../database/index.js';
import { getWatchlistProducts } from '../services/productService.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const products = await getWatchlistProducts();
    res.json({ products });
  } catch (err) {
    next(err);
  }
});

router.post('/:productId', async (req, res, next) => {
  try {
    await db.addToWatchlist(req.params.productId);
    res.status(201).json({ watchlisted: true, productId: req.params.productId });
  } catch (err) {
    next(err);
  }
});

router.delete('/:productId', async (req, res, next) => {
  try {
    const removed = await db.removeFromWatchlist(req.params.productId);
    res.json({ watchlisted: false, removed });
  } catch (err) {
    next(err);
  }
});

export default router;
