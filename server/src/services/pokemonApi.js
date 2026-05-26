import { config } from '../config.js';

const BASE_URL = 'https://api.pokemontcg.io/v2';

function headers() {
  const h = { Accept: 'application/json' };
  if (config.pokemonApiKey) h['X-Api-Key'] = config.pokemonApiKey;
  return h;
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Pokémon TCG API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

/** Normalize API card into unified product shape */
export function cardToProduct(card) {
  const market = card.tcgplayer?.prices || {};
  const tcgMarket =
    market.holofoil?.market ??
    market.reverseHolofoil?.market ??
    market.normal?.market ??
    market['1stEditionHolofoil']?.market ??
    null;

  return {
    id: card.id,
    type: 'card',
    name: card.name,
    setName: card.set?.name || null,
    image: card.images?.large || card.images?.small || null,
    subtype: (card.subtypes || []).join(', ') || card.supertype,
    metadata: {
      supertype: card.supertype,
      rarity: card.rarity,
      number: card.number,
      artist: card.artist,
      types: card.types || [],
      tcgplayerUrl: card.tcgplayer?.url || null,
      apiMarketPrice: tcgMarket,
    },
    source: 'pokemon-tcg',
  };
}

export async function searchCards(query, page = 1, pageSize = 24) {
  const safe = query.replace(/"/g, '');
  const q = encodeURIComponent(`name:${safe}*`);
  const url = `${BASE_URL}/cards?q=${q}&page=${page}&pageSize=${pageSize}&orderBy=-set.releaseDate`;
  const data = await fetchJson(url);
  return {
    products: (data.data || []).map(cardToProduct),
    page: data.page || page,
    pageSize: data.pageSize || pageSize,
    totalCount: data.totalCount || 0,
  };
}

export async function searchCardsBySet(query, page = 1, pageSize = 12) {
  const safe = query.replace(/"/g, '');
  const q = encodeURIComponent(`set.name:${safe}*`);
  const url = `${BASE_URL}/cards?q=${q}&page=${page}&pageSize=${pageSize}`;
  const data = await fetchJson(url);
  return (data.data || []).map(cardToProduct);
}

export async function getCardProduct(cardId) {
  const url = `${BASE_URL}/cards/${encodeURIComponent(cardId)}`;
  const data = await fetchJson(url);
  return cardToProduct(data.data);
}

export async function getProductsByIds(ids) {
  const cardIds = ids.filter((id) => !id.startsWith('sealed:'));
  if (!cardIds.length) return [];
  const q = encodeURIComponent(`id:${cardIds.join(' OR id:')}`);
  const url = `${BASE_URL}/cards?q=${q}&pageSize=${Math.min(cardIds.length, 250)}`;
  const data = await fetchJson(url);
  const byId = new Map((data.data || []).map((c) => [c.id, cardToProduct(c)]));
  return cardIds.map((id) => byId.get(id)).filter(Boolean);
}
