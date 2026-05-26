import { config } from '../../config.js';
import { mockProvider } from './mockProvider.js';
import { tcgplayerProvider } from './tcgplayerProvider.js';
import { ebayProvider } from './ebayProvider.js';
import { getExternalPricingStatus } from './externalPricing.js';
import { PROVIDER_IDS } from './providerContract.js';

/** Registry — add new providers here */
const REGISTRY = {
  [PROVIDER_IDS.MOCK]: mockProvider,
  [PROVIDER_IDS.TCGPLAYER]: tcgplayerProvider,
  [PROVIDER_IDS.EBAY]: ebayProvider,
};

/**
 * Resolve which providers to try based on PRICING_MODE:
 * - mock (default MVP): sample data only
 * - auto: try configured live APIs, then fall back to mock
 * - tcgplayer | ebay: force a single provider (for testing integrations)
 */
function resolveProviderChain() {
  const mode = config.pricingMode;

  if (mode === PROVIDER_IDS.MOCK) {
    return [mockProvider];
  }
  if (mode === PROVIDER_IDS.TCGPLAYER) {
    return [tcgplayerProvider, mockProvider];
  }
  if (mode === PROVIDER_IDS.EBAY) {
    return [ebayProvider, mockProvider];
  }

  // auto — live providers when keys exist, always end with mock for MVP safety
  const chain = [];
  if (config.tcgplayerPublicKey && config.tcgplayerPrivateKey) {
    chain.push(tcgplayerProvider);
  }
  if (config.ebayClientId && config.ebayClientSecret) {
    chain.push(ebayProvider);
  }
  chain.push(mockProvider);
  return chain;
}

/**
 * Update prices for one product. Persists to price_history via each provider.
 * MVP default: mock provider only (PRICING_MODE=mock).
 */
export async function updateProductPrices(product, dateKey) {
  const chain = resolveProviderChain();

  for (const provider of chain) {
    try {
      const result = await provider.fetchPrices(product, dateKey);
      if (result) return result;
    } catch (err) {
      const isLastMock = provider.id === PROVIDER_IDS.MOCK;
      if (isLastMock) throw err;
      console.warn(`[pricing:${provider.id}] ${product.id}: ${err.message}`);
    }
  }

  return mockProvider.fetchPrices(product, dateKey);
}

/** Metadata for /api/health and debugging */
export function getPricingStatus() {
  const mode = config.pricingMode;
  const chain = resolveProviderChain().map((p) => ({
    id: p.id,
    isLive: p.isLive ?? false,
  }));
  return {
    mode,
    activeChain: chain,
    mvpUsesMockOnly: mode === PROVIDER_IDS.MOCK,
    tcgplayerConfigured: Boolean(config.tcgplayerPublicKey && config.tcgplayerPrivateKey),
    ebayConfigured: Boolean(config.ebayClientId && config.ebayClientSecret),
    ...getExternalPricingStatus(),
  };
}

export { mockProvider };
