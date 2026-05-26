import { Link } from 'react-router-dom';
import TrendBadge from './TrendBadge.jsx';
import PriceSummary from './PriceSummary.jsx';

export default function ProductTile({ product }) {
  const typeLabel = product.type === 'sealed' ? 'Sealed' : 'Card';

  return (
    <Link to={`/product/${product.id}`} className="card-surface group block overflow-hidden p-3">
      <div className="relative aspect-[2.5/3.5] overflow-hidden rounded-lg bg-black/40">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-contain transition group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-white/40">
            <span className="text-3xl">📦</span>
            <span className="text-xs">{typeLabel}</span>
          </div>
        )}
        {product.trend && (
          <div className="absolute right-2 top-2">
            <TrendBadge trend={product.trend} compact />
          </div>
        )}
      </div>
      <h3 className="mt-2 truncate font-semibold group-hover:text-poke-yellow">{product.name}</h3>
      <p className="truncate text-xs text-white/50">
        {product.setName || '—'} · {product.subtype || typeLabel}
      </p>
      {product.price && <PriceSummary price={product.price} compact className="mt-2" />}
    </Link>
  );
}
