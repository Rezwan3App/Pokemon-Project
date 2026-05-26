import { Router } from 'express';
import { searchAll } from '../services/productService.js';
import { httpError } from '../utils/errors.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) {
      throw httpError('Query must be at least 2 characters', 400);
    }
    const page = Number(req.query.page) || 1;
    const result = await searchAll(q, page);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
