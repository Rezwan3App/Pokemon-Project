import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getWatchlist } from '../api.js';
import ProductGrid from '../components/ProductGrid.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function WatchlistPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getWatchlist()
      .then((data) => setProducts(data.products || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-medium text-zinc-100">Watchlist</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Products you&apos;ve starred. Saved on the server database.
        </p>
      </header>

      {loading && <LoadingSpinner />}
      {error && <p className="surface p-4 text-sm text-red-300">{error}</p>}
      {!loading && !error && (
        <ProductGrid
          products={products}
          emptyMessage='Your watchlist is empty. Open a product and tap "Add to watchlist".'
        />
      )}
      {!loading && products.length > 0 && (
        <p className="text-center text-sm">
          <Link to="/" className="text-zinc-400 hover:text-poke-yellow">
            ← Back to home
          </Link>
        </p>
      )}
    </div>
  );
}
