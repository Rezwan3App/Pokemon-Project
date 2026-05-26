import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTrending } from '../api.js';
import ProductGrid from '../components/ProductGrid.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import DisclaimerBanner from '../components/DisclaimerBanner.jsx';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getTrending()
      .then((data) => setProducts(data.products || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <section className="card-surface space-y-4 p-8 text-center">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          Pokémon cards & sealed product prices
        </h1>
        <p className="mx-auto max-w-2xl text-white/70">
          Search singles, booster boxes, and Elite Trainer Boxes. Track mock market prices, view
          history charts, and spot items with rising trend scores.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/search?q=charizard" className="btn-primary">
            Search Charizard
          </Link>
          <Link to="/search?q=elite+trainer+box" className="btn-secondary">
            Browse ETBs
          </Link>
          <Link to="/search?q=booster+box" className="btn-secondary">
            Booster boxes
          </Link>
        </div>
      </section>

      <DisclaimerBanner />

      <section>
        <h2 className="mb-4 text-xl font-semibold text-poke-yellow">Trending products</h2>
        {loading && <LoadingSpinner />}
        {error && (
          <p className="rounded-lg bg-red-500/20 p-4 text-red-200">
            {error}. Make sure the API is running on port 3001.
          </p>
        )}
        {!loading && !error && (
          <ProductGrid
            products={products}
            emptyMessage="Search for products to build price history and trends."
          />
        )}
      </section>
    </div>
  );
}
