import { Link } from 'react-router-dom';

export default function ProductTile({ product }) {
  const typeLabel = product.type === 'sealed' ? 'Sealed' : 'Card';
  const price = product.price;
  const change = price?.change7d ?? 0;
  const positive = change >= 0;
  const isLive = price?.isLive;

  return (
    <Link
      to={`/product/${product.id}`}
      className="surface surface-hover group block p-2.5"
    >
      <div className="relative aspect-[2.5/3.5] overflow-hidden rounded bg-black/40">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-contain transition group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-500">
            {typeLabel}
          </div>
        )}
      </div>

      <div className="mt-2 space-y-0.5">
        <h3 className="truncate text-sm font-medium text-zinc-100">{product.name}</h3>
        <p className="truncate text-[11px] text-zinc-500">
          {product.setName || '—'}
        </p>
      </div>

      {price?.current != null && (
        <div className="mt-2 flex items-center justify-between text-sm num">
          <span className="font-semibold text-zinc-100">
            ${price.current.toFixed(2)}
          </span>
          <span className={positive ? 'text-emerald-400' : 'text-red-400'}>
            {positive ? '+' : ''}
            {change}%
          </span>
        </div>
      )}
      {price && !isLive && (
        <p className="mt-0.5 text-[10px] text-zinc-600">sample price</p>
      )}
    </Link>
  );
}
