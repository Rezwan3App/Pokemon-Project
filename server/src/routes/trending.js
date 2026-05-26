import { Router } from 'express';
import { getTrendingProducts } from '../services/productService.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const products = await getTrendingProducts();
    res.json({ products });
  } catch (err) {
    next(err);
  }
});

export default router;
