import cron from 'node-cron';
import { config } from '../config.js';
import { runPriceUpdateJob } from '../services/productService.js';

let scheduled = false;

/**
 * Schedule daily price snapshots via node-cron.
 * Default: 2:00 AM server local time (configurable via PRICE_UPDATE_CRON).
 */
export function startDailyPriceJob() {
  if (!config.enableCron || scheduled) return;

  if (!cron.validate(config.priceUpdateCron)) {
    console.warn('Invalid PRICE_UPDATE_CRON, using default 0 2 * * *');
    config.priceUpdateCron = '0 2 * * *';
  }

  cron.schedule(config.priceUpdateCron, async () => {
    console.log(`[cron] Starting daily price update at ${new Date().toISOString()}`);
    try {
      const result = await runPriceUpdateJob();
      console.log(`[cron] Updated ${result.updated}/${result.total} products`);
      if (result.errors.length) {
        console.warn('[cron] Errors:', result.errors.slice(0, 5));
      }
    } catch (err) {
      console.error('[cron] Price update failed:', err);
    }
  });

  scheduled = true;
  console.log(`Daily price job scheduled: ${config.priceUpdateCron}`);
}
