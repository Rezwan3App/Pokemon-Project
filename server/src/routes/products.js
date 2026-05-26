import { Router } from 'express';
import { getEnrichedProduct } from '../services/productService.js';
import { db } from '../database/index.js';
import { httpError } from '../utils/errors.js';

const router = Router();

router.get('/:id/history', async (req, res, next) => {
  try {
    const history = await db.getPriceHistory(req.params.id);
    if (!history.length) throw httpError('No price history for this product', 404);
    res.json({ history });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const data = await getEnrichedProduct(req.params.id);
    if (!data) throw httpError('Product not found', 404);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
