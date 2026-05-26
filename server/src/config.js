import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  port: Number(process.env.PORT) || 3001,
  pokemonApiKey: process.env.POKEMON_TCG_API_KEY || '',
  databasePath:
    process.env.DATABASE_PATH ||
    path.join(__dirname, '../data/tracker.db'),
  mockPriceSeed: process.env.MOCK_PRICE_SEED || 'pokemon-tracker-mvp',
};
