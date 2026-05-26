/** Used on the detail page — market / low / high / changes + source */
export default function PriceSummary({ price }) {
  if (!price?.current) return null;
  const change = price.change7d ?? 0;
  const positive = change >= 0;

  return (
    <div className="surface p-4">
      <div className="flex items-baseline justify-between">
        <span className="label">Market</span>
        {price.isLive ? (
          <span className="text-[10px] uppercase tracking-wide text-emerald-400">
            Live · TCGplayer
          </span>
        ) : (
          <span className="text-[10px] uppercase tracking-wide text-amber-400">
            Sample
          </span>
        )}
      </div>
      <div className="mt-1 flex items-baseline gap-3 num">
        <span className="text-3xl font-semibold text-zinc-100">
          ${price.current.toFixed(2)}
        </span>
        <span className={`text-sm ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
          {positive ? '+' : ''}
          {change}% 7d
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm num">
        <Stat label="Low" value={`$${price.low?.toFixed(2) ?? '—'}`} />
        <Stat label="High" value={`$${price.high?.toFixed(2) ?? '—'}`} />
      </div>
      {price.lastUpdated && (
        <p className="mt-3 text-[11px] text-zinc-500">
          Last snapshot {price.lastUpdated}
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="label">{label}</p>
      <p className="text-zinc-100">{value}</p>
    </div>
  );
}
