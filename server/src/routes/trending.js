import { Router } from 'express';
import { getTrendingProducts } from '../services/productService.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 5, 3), 10);
    const data = await getTrendingProducts({ limit });
    // Keep legacy { products } key for older clients
    res.json({
      ...data,
      products: [...data.rising, ...data.topScore].slice(0, limit * 2),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
