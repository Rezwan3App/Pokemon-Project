import DisclaimerBanner from '../components/DisclaimerBanner.jsx';

export default function AboutPage() {
  return (
    <div className="prose prose-invert max-w-none space-y-8">
      <h1 className="text-3xl font-bold text-poke-yellow">About this app</h1>

      <DisclaimerBanner />

      <section className="card-surface space-y-3 p-6">
        <h2 className="text-xl font-semibold">What it does</h2>
        <p className="text-white/80">
          This MVP helps collectors search Pokémon TCG singles and sealed products (booster boxes,
          Elite Trainer Boxes), view estimated market prices, inspect price history, and review a
          simple trend score. It is built for learning and exploration—not trading advice.
        </p>
      </section>

      <section className="card-surface space-y-3 p-6">
        <h2 className="text-xl font-semibold">Data sources</h2>
        <ul className="list-disc space-y-2 pl-6 text-white/80">
          <li>
            <strong>Pokémon TCG API</strong> — card metadata, images, set names (
            <a href="https://pokemontcg.io/" className="text-poke-yellow hover:underline">
              pokemontcg.io
            </a>
            ). Optional API key for higher rate limits.
          </li>
          <li>
            <strong>Sealed catalog</strong> — curated list of booster boxes and ETBs stored locally
            until a commercial product API is connected.
          </li>
          <li>
            <strong>Mock pricing (MVP)</strong> — with <code>PRICING_MODE=mock</code>, sample
            market/low/high prices are generated locally. Card data still comes from the Pokémon TCG
            API.
          </li>
          <li>
            <strong>TCGplayer / eBay (planned)</strong> — provider stubs in{' '}
            <code className="text-poke-yellow">server/src/services/pricing/</code>. Add keys in{' '}
            <code className="text-poke-yellow">.env</code> when approved.
          </li>
        </ul>
        <p className="text-sm text-white/50">
          We do not scrape websites that prohibit it in their Terms of Service.
        </p>
      </section>

      <section className="card-surface space-y-3 p-6">
        <h2 className="text-xl font-semibold">Daily updates</h2>
        <p className="text-white/80">
          A <code className="text-poke-yellow">node-cron</code> job runs on the schedule set by{' '}
          <code className="text-poke-yellow">PRICE_UPDATE_CRON</code> (default 2:00 AM). It appends
          new rows to <code className="text-poke-yellow">price_history</code> for every tracked
          product. Developers can trigger a manual run:
        </p>
        <pre className="overflow-x-auto rounded-lg bg-black/40 p-4 text-sm">
          POST http://localhost:3001/api/update-prices
        </pre>
      </section>

      <section className="card-surface space-y-3 p-6">
        <h2 className="text-xl font-semibold">Trend scoring</h2>
        <p className="text-white/80">
          Scores (0–100) use rule-based logic: recent % change, upward consistency, listing volume,
          and volatility. Labels include <em>Rising</em>, <em>Stable</em>, <em>Falling</em>, and{' '}
          <em>High volatility</em>. This is not machine learning and not investment advice.
        </p>
      </section>

      <section className="card-surface space-y-3 p-6">
        <h2 className="text-xl font-semibold">Limitations</h2>
        <ul className="list-disc space-y-2 pl-6 text-white/80">
          <li>Mock prices until real marketplace APIs are connected.</li>
          <li>Watchlist is per-server database, not cloud-synced user accounts.</li>
          <li>Sealed catalog is a starter set—not exhaustive.</li>
          <li>SQLite by default; PostgreSQL optional via <code>DATABASE_DRIVER=postgres</code>.</li>
        </ul>
      </section>

      <section className="card-surface space-y-3 p-6">
        <h2 className="text-xl font-semibold">Future improvements</h2>
        <ul className="list-disc space-y-2 pl-6 text-white/80">
          <li>Live TCGplayer and eBay Browse API integration</li>
          <li>User accounts and cloud watchlists</li>
          <li>Price alerts and email notifications</li>
          <li>Graded card (PSA/BGS) price tracking</li>
          <li>Expanded sealed product database</li>
        </ul>
      </section>
    </div>
  );
}
