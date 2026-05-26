import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTrending, getNews } from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import DisclaimerBanner from '../components/DisclaimerBanner.jsx';
import TrendList from '../components/TrendList.jsx';
import NewsList from '../components/NewsList.jsx';
import ProductGrid from '../components/ProductGrid.jsx';

export default function HomePage() {
  const [trends, setTrends] = useState(null);
  const [news, setNews] = useState({ items: [], loading: true, error: null });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrending()
      .then(setTrends)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    getNews()
      .then((d) => setNews({ items: d.items, loading: false, error: null }))
      .catch((e) => setNews({ items: [], loading: false, error: e.message }));
  }, []);

  const rising = trends?.rising || [];
  const falling = trends?.falling || [];
  const topScore = trends?.topScore || [];

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          Pokémon TCG prices, trends & news
        </h1>
        <p className="max-w-2xl text-sm text-zinc-400">
          Real TCGplayer market prices when available (via the Pokémon TCG API),
          sample data otherwise. Track 60+ days of history, see which cards are
          moving, and check the latest Pokémon news.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link to="/search?q=charizard" className="btn-secondary">
            Charizard
          </Link>
          <Link to="/search?q=pikachu" className="btn-secondary">
            Pikachu
          </Link>
          <Link to="/search?q=elite+trainer+box" className="btn-secondary">
            Elite Trainer Boxes
          </Link>
          <Link to="/search?q=booster+box" className="btn-secondary">
            Booster Boxes
          </Link>
        </div>
      </section>

      <DisclaimerBanner />

      {loading && <LoadingSpinner />}
      {error && (
        <p className="surface p-4 text-sm text-red-300">
          {error} — make sure the API is running on port 3001.
        </p>
      )}

      {!loading && !error && (
        <>
          <section className="grid gap-4 lg:grid-cols-3">
            <TrendList
              title="Top 5 rising · 7d"
              items={rising}
              accent="emerald"
              emptyMessage="Not enough data yet."
            />
            <TrendList
              title="Top 5 falling · 7d"
              items={falling}
              accent="red"
              emptyMessage="Not enough data yet."
            />
            <NewsList
              items={news.items}
              loading={news.loading}
              error={news.error}
            />
          </section>

          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-medium text-zinc-100">
                Highest trend scores
              </h2>
              <Link to="/search?q=pokemon" className="text-sm text-zinc-400 hover:text-poke-yellow">
                Browse all →
              </Link>
            </div>
            <ProductGrid
              products={topScore}
              cols={5}
              emptyMessage="Run a few searches to populate trends."
            />
          </section>
        </>
      )}
    </div>
  );
}
