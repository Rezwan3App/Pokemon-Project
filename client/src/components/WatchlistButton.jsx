import { useEffect, useState } from 'react';
import { addToWatchlist, removeFromWatchlist } from '../api.js';

export default function WatchlistButton({ productId, initial = false, onChange }) {
  const [watchlisted, setWatchlisted] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setWatchlisted(initial);
  }, [initial, productId]);

  async function toggle() {
    setLoading(true);
    setError(null);
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className={
          watchlisted
            ? 'btn-secondary ring-1 ring-poke-yellow/60'
            : 'btn-primary'
        }
      >
        {loading ? '…' : watchlisted ? '★ On watchlist' : '☆ Add to watchlist'}
      </button>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
