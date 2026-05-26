/**
 * eBay Browse API integration (stub — connect when you have API approval).
 * @see https://developer.ebay.com/api-docs/buy/browse/overview.html
 *
 * Steps to go live:
 * 1. Create eBay developer app
 * 2. Set EBAY_CLIENT_ID and EBAY_CLIENT_SECRET in .env
 * 3. Set PRICING_MODE=auto or PRICING_MODE=ebay
 * 4. Implement OAuth client credentials + item search/summary below
 */
import { config } from '../../config.js';
import { PROVIDER_IDS } from './providerContract.js';

export const ebayProvider = {
  id: PROVIDER_IDS.EBAY,
  isLive: true,

  async fetchPrices(product) {
    if (!config.ebayClientId || !config.ebayClientSecret) {
      return null;
    }

    // const token = await getEbayAccessToken();
    // const q = encodeURIComponent(`${product.name} ${product.setName} pokemon`);
    // const res = await fetch(`https://api.ebay.com/buy/browse/v1/item_summary/search?q=${q}`, ...);

    console.warn(`[pricing:ebay] Keys present but integration not implemented for ${product.id}`);
    return null;
  },
};
