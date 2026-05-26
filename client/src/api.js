const API = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { Accept: 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export function searchProducts(q, page = 1) {
  return request(`/search?q=${encodeURIComponent(q)}&page=${page}`);
}

export function getProduct(id) {
  return request(`/products/${encodeURIComponent(id)}`);
}

export function getProductHistory(id) {
  return request(`/products/${encodeURIComponent(id)}/history`);
}

export function getTrending() {
  return request('/trending');
}

export function getWatchlist() {
  return request('/watchlist');
}

export function addToWatchlist(productId) {
  return request(`/watchlist/${encodeURIComponent(productId)}`, { method: 'POST' });
}

export function removeFromWatchlist(productId) {
  return request(`/watchlist/${encodeURIComponent(productId)}`, { method: 'DELETE' });
}

export function triggerPriceUpdate() {
  return request('/update-prices', { method: 'POST' });
}

export function healthCheck() {
  return request('/health');
}

export function getNews() {
  return request('/news');
}
