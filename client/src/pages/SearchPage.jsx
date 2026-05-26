import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchProducts } from '../api.js';
import ProductGrid from '../components/ProductGrid.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const page = Number(params.get('page')) || 1;

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (q.length < 2) return;
    setLoading(true);
    setError(null);
    searchProducts(q, page)
      .then(setResult)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [q, page]);

  // cardTotal drives pagination since sealed catalog is small + local
  const totalPages = result
    ? Math.max(1, Math.ceil((result.cardTotal ?? 0) / (result.pageSize || 20)))
    : 1;

  function goPage(next) {
    const p = new URLSearchParams(params);
    p.set('page', String(next));
    setParams(p);
  }

  if (q.length < 2) {
    return <p className="text-center text-sm text-zinc-500">Enter at least 2 characters in the search bar.</p>;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-medium text-zinc-100">
            Results for <span className="text-poke-yellow">&ldquo;{q}&rdquo;</span>
          </h1>
          {result && (
            <p className="mt-1 text-xs text-zinc-500">
              {result.products?.length} on this page · {result.cardTotal ?? 0} cards ·{' '}
              {result.sealedTotal ?? 0} sealed
            </p>
          )}
        </div>
      </header>

      {loading && <LoadingSpinner label="Searching…" />}
      {error && (
        <p className="surface p-4 text-sm text-red-300">
          {error}
        </p>
      )}
      {!loading && result && (
        <>
          <ProductGrid products={result.products} />
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                className="btn-ghost disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => goPage(page - 1)}
              >
                ← Previous
              </button>
              <span className="text-xs text-zinc-500 num">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="btn-ghost disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() => goPage(page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
