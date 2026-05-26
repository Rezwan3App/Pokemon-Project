import { Router } from 'express';
import { getNews } from '../services/news.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const items = await getNews(8);
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

export default router;
