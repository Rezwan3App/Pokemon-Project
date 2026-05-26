import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCard } from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import TrendBadge from '../components/TrendBadge.jsx';
import PriceChart from '../components/PriceChart.jsx';
import WatchlistButton from '../components/WatchlistButton.jsx';

export default function CardDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getCard(id)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner label="Loading card…" />;
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

  const { card, history } = data;
  const price = card.price;

  return (
    <div className="space-y-8">
      <Link to="/search?q=pikachu" className="text-sm text-poke-yellow hover:underline">
        ← Back to search
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="card-surface flex items-center justify-center p-6">
          {card.image ? (
            <img src={card.image} alt={card.name} className="max-h-[480px] object-contain" />
          ) : (
            <span className="text-white/40">No image</span>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{card.name}</h1>
            <p className="mt-1 text-white/60">
              {card.set?.name} · #{card.number} · {card.rarity}
            </p>
            {card.artist && <p className="text-sm text-white/40">Art by {card.artist}</p>}
          </div>

          <div className="flex flex-wrap items-start gap-4">
            <div className="card-surface px-6 py-4">
              <p className="text-sm text-white/50">Mock market price</p>
              <p className="text-4xl font-bold text-poke-yellow">
                ${price?.current?.toFixed(2)}
              </p>
              <p className="mt-1 text-sm text-white/50">{price?.note}</p>
            </div>
            <TrendBadge trend={card.trend} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Stat label="7d change" value={`${price?.change7d > 0 ? '+' : ''}${price?.change7d}%`} />
            <Stat label="30d change" value={`${price?.change30d > 0 ? '+' : ''}${price?.change30d}%`} />
            <Stat label="Supertype" value={card.supertype} />
            <Stat label="Types" value={(card.types || []).join(', ') || '—'} />
          </div>

          <WatchlistButton cardId={card.id} initial={card.watchlisted} />

          {card.tcgplayerUrl && (
            <a
              href={card.tcgplayerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary inline-block"
            >
              View on TCGplayer ↗
            </a>
          )}
        </div>
      </div>

      <section className="card-surface p-6">
        <h2 className="mb-4 text-lg font-semibold">Price history (60 days)</h2>
        <PriceChart history={history} />
        <p className="mt-2 text-xs text-white/40">Source: {price?.source}</p>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-black/20 px-3 py-2">
      <p className="text-white/40">{label}</p>
      <p className="font-medium">{value ?? '—'}</p>
    </div>
  );
}
