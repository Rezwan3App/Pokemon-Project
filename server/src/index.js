import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import cardsRouter from './routes/cards.js';
import watchlistRouter from './routes/watchlist.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'pokemon-tcg-price-tracker' });
});

app.use('/api/cards', cardsRouter);
app.use('/api/watchlist', watchlistRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(config.port, () => {
  console.log(`API running at http://localhost:${config.port}`);
});
