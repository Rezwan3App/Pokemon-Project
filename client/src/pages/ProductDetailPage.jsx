import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProduct } from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import TrendBadge from '../components/TrendBadge.jsx';
import PriceChart from '../components/PriceChart.jsx';
import PriceSummary from '../components/PriceSummary.jsx';
import WatchlistButton from '../components/WatchlistButton.jsx';
import DisclaimerBanner from '../components/DisclaimerBanner.jsx';
import MockPriceBadge from '../components/MockPriceBadge.jsx';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getProduct(id)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner label="Loading product…" />;
  if (error) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-red-300">{error}</p>
        <Link to="/" className="btn-secondary inline-block">
          Back home
        </Link>
      </div>
    );
  }

  const product = data.product;
  const { history } = data;
  const price = product.price;
  const trend = product.trend;

  return (
    <div className="space-y-8">
      <Link to="/search?q=pokemon" className="text-sm text-poke-yellow hover:underline">
        ← Back to search
      </Link>

      <DisclaimerBanner />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="card-surface flex min-h-[320px] items-center justify-center p-6">
          {product.image ? (
            <img src={product.image} alt={product.name} className="max-h-[480px] object-contain" />
          ) : (
            <div className="text-center text-white/40">
              <span className="text-5xl">📦</span>
              <p className="mt-2">{product.type === 'sealed' ? 'Sealed product' : 'No image'}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs uppercase">
              {product.type === 'sealed' ? 'Sealed' : 'Card'}
            </span>
            <h1 className="mt-2 text-3xl font-bold">{product.name}</h1>
            <p className="text-white/60">
              {product.setName} · {product.subtype || product.metadata?.rarity || '—'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <PriceSummary price={price} />
            <MockPriceBadge price={price} />
          </div>
          <TrendBadge trend={trend} />

          <div className="grid grid-cols-3 gap-2 text-sm">
            <ChangeBox label="7-day" value={price?.change7d} />
            <ChangeBox label="30-day" value={price?.change30d} />
            <ChangeBox label="All-time" value={price?.changeAllTime} />
          </div>

          {price?.listingsCount > 0 && price?.isMock && (
            <p className="text-sm text-white/50">~{price.listingsCount} simulated listings</p>
          )}

          <WatchlistButton productId={product.id} initial={product.watchlisted} />

          {product.metadata?.tcgplayerUrl && (
            <a
              href={product.metadata.tcgplayerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary inline-block"
            >
              TCGplayer listing ↗
            </a>
          )}
        </div>
      </div>

      <section className="card-surface p-6">
        <h2 className="mb-4 text-lg font-semibold">Price history</h2>
        <PriceChart history={history} />
        <p className="mt-2 text-xs text-white/40">{price?.note}</p>
      </section>
    </div>
  );
}

function ChangeBox({ label, value }) {
  if (value == null) return null;
  const positive = value >= 0;
  return (
    <div className="rounded-lg bg-black/20 p-3 text-center">
      <p className="text-white/40">{label}</p>
      <p className={`text-lg font-bold ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
        {positive ? '+' : ''}
        {value}%
      </p>
    </div>
  );
}
