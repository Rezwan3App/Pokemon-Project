/**
 * Pricing provider contract — implement fetchPrices() to add a new data source.
 *
 * @typedef {Object} PriceSnapshot
 * @property {number} marketPrice - Typical sale / market price (USD)
 * @property {number} lowPrice - Low end of observed range
 * @property {number} highPrice - High end of observed range
 * @property {number} [listingsCount] - Active listings (if available)
 * @property {string} source - Provider id, e.g. 'mock-tcgplayer', 'tcgplayer', 'ebay'
 * @property {string} recordedAt - YYYY-MM-DD date key
 * @property {boolean} [isMock] - True when data is simulated (MVP)
 *
 * @typedef {Object} PricingProvider
 * @property {string} id - Unique provider name
 * @property {boolean} [isLive] - False for mock/sample providers
 * @property {(product: object, dateKey?: string) => Promise<PriceSnapshot|null>} fetchPrices
 */

export const PROVIDER_IDS = {
  MOCK: 'mock',
  TCGPLAYER: 'tcgplayer',
  EBAY: 'ebay',
};
