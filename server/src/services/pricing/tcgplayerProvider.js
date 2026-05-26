/**
 * TCGplayer API integration (stub — connect when you have API approval).
 * @see https://docs.tcgplayer.com/
 *
 * Steps to go live:
 * 1. Register at TCGplayer developer portal
 * 2. Set TCGPLAYER_PUBLIC_KEY and TCGPLAYER_PRIVATE_KEY in .env
 * 3. Set PRICING_MODE=auto or PRICING_MODE=tcgplayer
 * 4. Implement OAuth + GET /pricing/product/{productId} below
 */
import { config } from '../../config.js';
import { PROVIDER_IDS } from './providerContract.js';

export const tcgplayerProvider = {
  id: PROVIDER_IDS.TCGPLAYER,
  isLive: true,

  async fetchPrices(product) {
    if (!config.tcgplayerPublicKey || !config.tcgplayerPrivateKey) {
      return null; // not configured — chain falls through to mock
    }

    // const token = await getTcgplayerBearerToken();
    // const productId = product.metadata?.tcgplayerProductId;
    // if (!productId) return null;
    // const res = await fetch(`https://api.tcgplayer.com/pricing/product/${productId}`, ...);

    console.warn(
      `[pricing:tcgplayer] Keys present but integration not implemented for ${product.id}`
    );
    return null;
  },
};
