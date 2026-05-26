import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTrending } from '../api.js';
import CardGrid from '../components/CardGrid.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function HomePage() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getTrending()
      .then((data) => setCards(data.cards || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-10">
      <section className="card-surface p-8 text-center">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          Track Pokémon TCG prices & trends
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-white/70">
          Search cards from the official Pokémon TCG API, view mock market prices with 60-day
          history, trend scores, and build your watchlist.
        </p>
        <Link to="/search?q=charizard" className="btn-primary mt-6 inline-block">
          Browse Charizard cards
        </Link>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-poke-yellow">Trending & movers</h2>
        {loading && <LoadingSpinner />}
        {error && (
          <p className="rounded-lg bg-red-500/20 p-4 text-red-200">
            {error}. Is the API server running on port 3001?
          </p>
        )}
        {!loading && !error && (
          <CardGrid cards={cards} emptyMessage="Search for cards to start building price history." />
        )}
      </section>
    </div>
  );
}
