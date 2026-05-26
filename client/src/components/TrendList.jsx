import { Link } from 'react-router-dom';

/** Compact top-5 list rendered next to news on the home page */
export default function TrendList({ title, items, accent = 'emerald', emptyMessage = '—' }) {
  const accentMap = {
    emerald: 'text-emerald-400',
    red: 'text-red-400',
    amber: 'text-amber-400',
    yellow: 'text-poke-yellow',
  };
  const color = accentMap[accent] || accentMap.emerald;

  return (
    <div className="surface p-4">
      <h3 className="label mb-3">{title}</h3>
      {!items?.length ? (
        <p className="text-sm text-zinc-500">{emptyMessage}</p>
      ) : (
        <ol className="space-y-2">
          {items.map((p, i) => {
            const change = p.trend?.change7d ?? 0;
            const positive = change >= 0;
            return (
              <li key={p.id}>
                <Link
                  to={`/product/${p.id}`}
                  className="-mx-2 flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-white/[0.04]"
                >
                  <span className={`w-4 text-xs num ${color}`}>{i + 1}</span>
                  {p.image ? (
                    <img
                      src={p.image}
                      alt=""
                      className="h-10 w-7 shrink-0 rounded object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <span className="flex h-10 w-7 shrink-0 items-center justify-center rounded bg-white/5 text-[9px] text-zinc-500">
                      {p.type === 'sealed' ? 'BOX' : 'CARD'}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-zinc-100">{p.name}</p>
                    <p className="truncate text-[11px] text-zinc-500">
                      {p.setName || '—'}
                    </p>
                  </div>
                  <div className="shrink-0 text-right num">
                    <p className="text-sm text-zinc-100">
                      ${p.price?.current?.toFixed(2) ?? '—'}
                    </p>
                    <p className={`text-[11px] ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {positive ? '+' : ''}{change}%
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
