import { config } from '../config.js';

const BASE_URL = 'https://api.pokemontcg.io/v2';

function headers() {
  const h = { Accept: 'application/json' };
  if (config.pokemonApiKey) {
    h['X-Api-Key'] = config.pokemonApiKey;
  }
  return h;
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Pokémon TCG API error ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export function normalizeCard(card) {
  if (!card) return null;
  const market = card.tcgplayer?.prices || {};
  const marketPrice =
    market.holofoil?.market ??
    market.reverseHolofoil?.market ??
    market.normal?.market ??
    market['1stEditionHolofoil']?.market ??
    null;

  return {
    id: card.id,
    name: card.name,
    supertype: card.supertype,
    subtypes: card.subtypes || [],
    rarity: card.rarity,
    set: card.set
      ? { id: card.set.id, name: card.set.name, series: card.set.series }
      : null,
    number: card.number,
    artist: card.artist,
    hp: card.hp,
    types: card.types || [],
    image: card.images?.large || card.images?.small || null,
    imageSmall: card.images?.small || null,
    tcgplayerUrl: card.tcgplayer?.url || null,
    apiMarketPrice: marketPrice,
  };
}

export async function searchCards(query, page = 1, pageSize = 24) {
  const q = encodeURIComponent(`name:${query}*`);
  const url = `${BASE_URL}/cards?q=${q}&page=${page}&pageSize=${pageSize}&orderBy=-set.releaseDate`;
  const data = await fetchJson(url);
  return {
    cards: (data.data || []).map(normalizeCard),
    page: data.page || page,
    pageSize: data.pageSize || pageSize,
    totalCount: data.totalCount || 0,
  };
}

export async function getCardById(cardId) {
  const url = `${BASE_URL}/cards/${encodeURIComponent(cardId)}`;
  const data = await fetchJson(url);
  return normalizeCard(data.data);
}

export async function getCardsByIds(cardIds) {
  if (!cardIds.length) return [];
  const q = encodeURIComponent(`id:${cardIds.join(' OR id:')}`);
  const url = `${BASE_URL}/cards?q=${q}&pageSize=${Math.min(cardIds.length, 250)}`;
  const data = await fetchJson(url);
  const byId = new Map((data.data || []).map((c) => [c.id, normalizeCard(c)]));
  return cardIds.map((id) => byId.get(id)).filter(Boolean);
}
