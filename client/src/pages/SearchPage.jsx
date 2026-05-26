import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchCards } from '../api.js';
import CardGrid from '../components/CardGrid.jsx';
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
    searchCards(q, page)
      .then(setResult)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [q, page]);

  const totalPages = result
    ? Math.max(1, Math.ceil(result.totalCount / (result.pageSize || 24)))
    : 1;

  function goPage(next) {
    const p = new URLSearchParams(params);
    p.set('page', String(next));
    setParams(p);
  }

  if (q.length < 2) {
    return (
      <p className="text-center text-white/60">
        Enter at least 2 characters in the search bar above.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Results for <span className="text-poke-yellow">&ldquo;{q}&rdquo;</span>
        {result && (
          <span className="ml-2 text-base font-normal text-white/50">
            ({result.totalCount} cards)
          </span>
        )}
      </h1>

      {loading && <LoadingSpinner />}
      {error && <p className="text-red-300">{error}</p>}
      {!loading && result && (
        <>
          <CardGrid cards={result.cards} />
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                className="btn-secondary disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => goPage(page - 1)}
              >
                Previous
              </button>
              <span className="text-white/60">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="btn-secondary disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() => goPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
