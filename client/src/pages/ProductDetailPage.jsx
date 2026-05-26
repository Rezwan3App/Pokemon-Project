import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProduct } from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import TrendBadge from '../components/TrendBadge.jsx';
import PriceChart from '../components/PriceChart.jsx';
import PriceSummary from '../components/PriceSummary.jsx';
import WatchlistButton from '../components/WatchlistButton.jsx';
import MockPriceBadge from '../components/MockPriceBadge.jsx';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
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

  const { product, history } = data;
  const price = product.price;
  const trend = product.trend;
  const variant = product.metadata?.primaryVariant;

  return (
    <div className="space-y-8">
      <Link to="/" className="text-sm text-zinc-400 hover:text-poke-yellow">
        ← Back home
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="surface flex items-center justify-center p-6 lg:min-h-[420px]">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="max-h-[460px] object-contain"
            />
          ) : (
            <div className="text-center text-sm text-zinc-500">
              <p>{product.type === 'sealed' ? 'Sealed product' : 'No image'}</p>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                {product.type === 'sealed' ? 'Sealed' : 'Card'}
              </span>
              <MockPriceBadge price={price} />
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              {product.name}
            </h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              {product.setName}
              {product.metadata?.number && ` · #${product.metadata.number}`}
              {product.metadata?.rarity && ` · ${product.metadata.rarity}`}
              {variant && ` · ${formatVariant(variant)}`}
            </p>
          </div>

          <PriceSummary price={price} />

          <TrendBadge trend={trend} />

          <div className="grid grid-cols-3 gap-2 text-sm num">
            <ChangeBox label="7d" value={price?.change7d} />
            <ChangeBox label="30d" value={price?.change30d} />
            <ChangeBox label="All-time" value={price?.changeAllTime} />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <WatchlistButton productId={product.id} initial={product.watchlisted} />
            {product.metadata?.tcgplayerUrl && (
              <a
                href={product.metadata.tcgplayerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                View on TCGplayer ↗
              </a>
            )}
            {product.metadata?.cardmarketUrl && (
              <a
                href={product.metadata.cardmarketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                Cardmarket ↗
              </a>
            )}
          </div>
        </div>
      </div>

      <section className="surface p-5">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h2 className="text-base font-medium text-zinc-100">Price history</h2>
          {price?.isLive && (
            <span className="text-[11px] text-emerald-400/80">
              Today matches TCGplayer market · past days estimated
            </span>
          )}
        </div>
        <PriceChart history={history} livePrice={price} />
      </section>
    </div>
  );
}

function formatVariant(v) {
  return v
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function ChangeBox({ label, value }) {
  if (value == null) return null;
  const positive = value >= 0;
  return (
    <div className="surface px-3 py-2">
      <p className="label">{label}</p>
      <p className={`text-base font-semibold ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
        {positive ? '+' : ''}{value}%
      </p>
    </div>
  );
}
