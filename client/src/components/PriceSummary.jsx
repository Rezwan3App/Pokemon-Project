import MockPriceBadge from './MockPriceBadge.jsx';

/** Displays market / low / high and change for list or detail views */
export default function PriceSummary({ price, compact = false, className = '' }) {
  if (!price?.current) return null;

  const change = price.change7d ?? 0;
  const positive = change >= 0;

  if (compact) {
    return (
      <div className={`flex items-center justify-between gap-2 text-sm ${className}`}>
        <span className="font-bold text-poke-yellow">${price.current.toFixed(2)}</span>
        <span className={positive ? 'text-emerald-400' : 'text-red-400'}>
          {positive ? '+' : ''}
          {change}% <span className="text-white/40">7d</span>
        </span>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 ${className}`}>
      <Stat label="Market" value={`$${price.current.toFixed(2)}`} highlight />
      <Stat label="Low" value={`$${price.low?.toFixed(2) ?? '—'}`} />
      <Stat label="High" value={`$${price.high?.toFixed(2) ?? '—'}`} />
      <Stat
        label="7d change"
        value={`${change > 0 ? '+' : ''}${change}%`}
        className={positive ? 'text-emerald-400' : 'text-red-400'}
      />
      <div className="col-span-full flex flex-wrap items-center gap-2">
        <MockPriceBadge price={price} />
        {price.lastUpdated && (
          <p className="text-xs text-white/40">
            Last updated: {price.lastUpdated} · {price.source}
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight, className = '' }) {
  return (
    <div className="rounded-lg bg-black/20 px-3 py-2">
      <p className="text-white/40">{label}</p>
      <p className={`font-medium ${highlight ? 'text-poke-yellow text-lg' : ''} ${className}`}>
        {value}
      </p>
    </div>
  );
}
