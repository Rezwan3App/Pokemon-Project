export default function NewsList({ items, loading, error }) {
  return (
    <aside className="surface p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="label">Pokémon news</h3>
        <span className="text-[10px] text-zinc-600">PokéBeach RSS</span>
      </div>

      {loading && <p className="text-sm text-zinc-500">Loading…</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && !error && (
        <ul className="space-y-3">
          {items?.length ? (
            items.map((n, i) => (
              <li key={`${n.link}-${i}`}>
                <a
                  href={n.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <p className="text-sm leading-snug text-zinc-100 group-hover:text-poke-yellow">
                    {n.title}
                  </p>
                  {n.description && (
                    <p className="mt-1 line-clamp-2 text-[11px] text-zinc-500">
                      {n.description}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-zinc-600">
                    {formatDate(n.pubDate)} · {n.source}
                  </p>
                </a>
              </li>
            ))
          ) : (
            <li className="text-sm text-zinc-500">No news right now.</li>
          )}
        </ul>
      )}
      <p className="mt-4 text-[10px] leading-relaxed text-zinc-600">
        News reflects general Pokémon TCG topics — useful for spotting hyped
        sets or releases. Not a buy/sell recommendation.
      </p>
    </aside>
  );
}

function formatDate(s) {
  if (!s) return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
