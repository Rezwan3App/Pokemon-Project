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
      <h1 className="text-2xl font-bold">Watchlist</h1>
      <p className="text-white/60">
        Saved locally on this device&apos;s server database. Add items from any product page.
      </p>

      {loading && <LoadingSpinner />}
      {error && <p className="text-red-300">{error}</p>}
      {!loading && !error && (
        <ProductGrid
          products={products}
          emptyMessage='Your watchlist is empty. Open a product and tap "Add to watchlist".'
        />
      )}
      {!loading && products.length > 0 && (
        <p className="text-center text-sm">
          <Link to="/search?q=evolving+skies" className="text-poke-yellow hover:underline">
            Discover more products →
          </Link>
        </p>
      )}
    </div>
  );
}
