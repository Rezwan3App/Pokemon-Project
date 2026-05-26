import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { initDatabase } from './database/index.js';
import { startDailyPriceJob } from './jobs/dailyPriceUpdate.js';
import { getPricingStatus } from './services/pricing/index.js';
import searchRouter from './routes/search.js';
import productsRouter from './routes/products.js';
import trendingRouter from './routes/trending.js';
import updatePricesRouter from './routes/updatePrices.js';
import watchlistRouter from './routes/watchlist.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'pokemon-tcg-price-tracker',
    version: '2.0.0',
    database: config.databaseDriver,
    cronEnabled: config.enableCron,
    cardDataSource: 'pokemon-tcg-api',
    pricing: getPricingStatus(),
  });
});

app.use('/api/search', searchRouter);
app.use('/api/products', productsRouter);
app.use('/api/trending', trendingRouter);
app.use('/api/update-prices', updatePricesRouter);
app.use('/api/watchlist', watchlistRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

async function main() {
  await initDatabase();
  startDailyPriceJob();

  app.listen(config.port, () => {
    console.log(`API http://localhost:${config.port}`);
    console.log('Routes: /api/search, /api/products/:id, /api/trending, /api/update-prices');
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
