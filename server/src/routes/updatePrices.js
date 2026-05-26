import { Router } from 'express';
import { runPriceUpdateJob } from '../services/productService.js';

const router = Router();

/** Manual trigger for development / admin testing */
router.post('/', async (req, res, next) => {
  try {
    const result = await runPriceUpdateJob();
    res.json({
      ok: true,
      message: 'Price update completed',
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
