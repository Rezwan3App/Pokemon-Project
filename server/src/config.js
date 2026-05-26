import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  databaseDriver: (process.env.DATABASE_DRIVER || 'sqlite').toLowerCase(),
  databasePath:
    process.env.DATABASE_PATH ||
    path.join(__dirname, '../data/tracker.db'),
  databaseUrl: process.env.DATABASE_URL || '',

  pokemonApiKey: process.env.POKEMON_TCG_API_KEY || '',
  tcgplayerPublicKey: process.env.TCGPLAYER_PUBLIC_KEY || '',
  tcgplayerPrivateKey: process.env.TCGPLAYER_PRIVATE_KEY || '',
  ebayClientId: process.env.EBAY_CLIENT_ID || '',
  ebayClientSecret: process.env.EBAY_CLIENT_SECRET || '',

  /** Recommended: PokéWallet — https://pokewallet.io (free tier, TCGPlayer + CardMarket) */
  pokewalletApiKey: process.env.POKEWALLET_API_KEY || '',
  /** Alternative: TCG API — https://tcgapi.dev (100 req/day free, daily TCGPlayer refresh) */
  tcgApiKey: process.env.TCGAPI_KEY || '',

  /** mock = sample only | auto = external APIs → Pokémon TCG embed → mock */
  pricingMode: (process.env.PRICING_MODE || 'mock').toLowerCase(),

  mockPriceSeed: process.env.MOCK_PRICE_SEED || 'pokemon-tracker-mvp',
  priceUpdateCron: process.env.PRICE_UPDATE_CRON || '0 2 * * *',
  enableCron: process.env.ENABLE_CRON !== 'false',
};
