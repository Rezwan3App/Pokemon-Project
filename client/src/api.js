const API = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { Accept: 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export function searchCards(q, page = 1) {
  return request(`/cards/search?q=${encodeURIComponent(q)}&page=${page}`);
}

export function getCard(id) {
  return request(`/cards/${encodeURIComponent(id)}`);
}

export function getTrending() {
  return request('/cards/trending');
}

export function getWatchlist() {
  return request('/watchlist');
}

export function addToWatchlist(cardId) {
  return request(`/watchlist/${encodeURIComponent(cardId)}`, { method: 'POST' });
}

export function removeFromWatchlist(cardId) {
  return request(`/watchlist/${encodeURIComponent(cardId)}`, { method: 'DELETE' });
}
