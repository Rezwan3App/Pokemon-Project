import DisclaimerBanner from '../components/DisclaimerBanner.jsx';

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">About</h1>
      <DisclaimerBanner />

      <Section title="What it does">
        <p>
          Search Pokémon TCG singles and sealed products (booster boxes, Elite
          Trainer Boxes), see current market prices, chart 60+ days of history,
          and check rule-based trend scores. Built for learning and exploration.
        </p>
      </Section>

      <Section title="Where prices come from">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong className="text-zinc-200">Best (recommended):</strong>{' '}
            <a href="https://pokewallet.io" className="text-poke-yellow hover:underline" target="_blank" rel="noreferrer">
              PokéWallet API
            </a>{' '}
            — TCGPlayer + CardMarket, refreshed often. Set <code>POKEWALLET_API_KEY</code> +{' '}
            <code>PRICING_MODE=auto</code>.
          </li>
          <li>
            <strong className="text-zinc-200">Alternative:</strong>{' '}
            <a href="https://tcgapi.dev" className="text-poke-yellow hover:underline" target="_blank" rel="noreferrer">
              TCG API
            </a>{' '}
            — daily TCGPlayer refresh, sealed products. Set <code>TCGAPI_KEY</code>.
          </li>
          <li>
            <strong className="text-zinc-200">Fallback:</strong> Pokémon TCG API embedded TCGplayer
            block (can lag days behind tcgplayer.com on new sets).
          </li>
          <li>
            <strong className="text-zinc-200">Sample data:</strong> used only when no live source
            returns a price (sealed catalog, missing API data).
          </li>
        </ul>
      </Section>

      <Section title="Daily updates">
        <p>
          A <code className="text-poke-yellow">node-cron</code> job runs at the
          schedule in <code className="text-poke-yellow">PRICE_UPDATE_CRON</code>{' '}
          (default 2:00 AM) and writes a new row to{' '}
          <code className="text-poke-yellow">price_history</code> per product.
          Trigger a manual run:
        </p>
        <pre className="surface mt-2 overflow-x-auto p-3 text-xs">
          POST http://localhost:3001/api/update-prices
        </pre>
      </Section>

      <Section title="Trend scoring">
        <p>
          0–100 score using recent % change, upward consistency, listing volume,
          and volatility. Labels: Rising, Stable, Falling, High volatility.
          Rule-based — not machine learning, not investment advice.
        </p>
      </Section>

      <Section title="Limitations">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Not every card has live TCGplayer data on the API.</li>
          <li>Sealed products use sample data.</li>
          <li>Watchlist is per-server, not user accounts.</li>
          <li>SQLite by default; PostgreSQL optional.</li>
        </ul>
      </Section>

      <Section title="Future improvements">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Direct TCGplayer / eBay Browse API integration</li>
          <li>User accounts + cloud watchlists</li>
          <li>Price alerts</li>
          <li>Graded card (PSA/BGS) tracking</li>
          <li>More sealed products</li>
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="surface space-y-2 p-5 text-sm text-zinc-400">
      <h2 className="text-base font-medium text-zinc-100">{title}</h2>
      {children}
    </section>
  );
}
