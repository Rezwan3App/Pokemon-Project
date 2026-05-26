import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getWatchlist } from '../api.js';
import CardGrid from '../components/CardGrid.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function WatchlistPage() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function load() {
    setLoading(true);
    getWatchlist()
      .then((data) => setCards(data.cards || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Your watchlist</h1>
      <p className="text-white/60">
        Cards you star from detail pages appear here with live trend scores.
      </p>

      {loading && <LoadingSpinner />}
      {error && <p className="text-red-300">{error}</p>}
      {!loading && !error && (
        <CardGrid
          cards={cards}
          emptyMessage="Your watchlist is empty. Open a card and tap “Add to watchlist”."
        />
      )}
      {!loading && cards.length > 0 && (
        <p className="text-center text-sm text-white/40">
          <Link to="/search?q=mew" className="text-poke-yellow hover:underline">
            Find more cards to track →
          </Link>
        </p>
      )}
    </div>
  );
}
