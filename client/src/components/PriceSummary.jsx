/** Displays market / low / high from TCGplayer (via Pokémon TCG API) */
export default function PriceSummary({ price }) {
  if (!price?.current) return null;
  const change = price.change7d ?? 0;
  const positive = change >= 0;

  return (
    <div className="surface p-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="label">Market price</span>
        {price?.isLive ? (
          <span className="text-[10px] uppercase tracking-wide text-emerald-400">
            Live · {price.source?.includes('pokewallet') ? 'PokéWallet' : price.source?.includes('tcgapi') ? 'TCG API' : 'TCGplayer'}
            {price.variant ? ` · ${formatVariant(price.variant)}` : ''}
          </span>
        ) : (
          <span className="text-[10px] uppercase tracking-wide text-amber-400">Sample estimate</span>
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

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm num sm:grid-cols-4">
        <Stat label="Low" value={price.low != null ? `$${price.low.toFixed(2)}` : '—'} />
        <Stat label="Mid" value={price.mid != null ? `$${price.mid.toFixed(2)}` : '—'} />
        <Stat label="High" value={price.high != null ? `$${price.high.toFixed(2)}` : '—'} />
        {price.directLow != null && (
          <Stat label="Direct low" value={`$${price.directLow.toFixed(2)}`} />
        )}
      </div>

      {price.lastUpdated && (
        <p className="mt-3 text-[11px] text-zinc-500">
          {price.isLive ? 'TCGplayer data via Pokémon TCG API' : 'Estimate only'} · updated{' '}
          {price.lastUpdated}
        </p>
      )}
      {price.note && <p className="mt-1 text-[11px] text-zinc-600">{price.note}</p>}
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

function formatVariant(v) {
  return v.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim();
}
