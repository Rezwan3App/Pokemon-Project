import { useState } from 'react';
import { addToWatchlist, removeFromWatchlist } from '../api.js';

export default function WatchlistButton({ productId, initial = false, onChange }) {
  const [watchlisted, setWatchlisted] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      if (watchlisted) {
        await removeFromWatchlist(productId);
        setWatchlisted(false);
        onChange?.(false);
      } else {
        await addToWatchlist(productId);
        setWatchlisted(true);
        onChange?.(true);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={watchlisted ? 'btn-secondary ring-2 ring-poke-yellow' : 'btn-primary'}
    >
      {loading ? '…' : watchlisted ? '★ On watchlist' : '☆ Add to watchlist'}
    </button>
  );
}
