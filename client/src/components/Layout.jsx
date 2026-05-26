import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Layout({ children }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  function handleSearch(e) {
    e.preventDefault();
    const q = query.trim();
    if (q.length >= 2) navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  const navClass = ({ isActive }) =>
    `px-2.5 py-1.5 rounded-md text-sm transition ${
      isActive ? 'text-poke-yellow' : 'text-zinc-400 hover:text-zinc-100'
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-ink/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <span className="inline-block h-2 w-2 rounded-full bg-poke-yellow" />
            <span>TCG Tracker</span>
          </Link>

          <form onSubmit={handleSearch} className="flex flex-1 min-w-[180px] max-w-md gap-2">
            <input
              type="search"
              className="input-field flex-1"
              placeholder="Search cards or sealed products…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search products"
            />
            <button type="submit" className="btn-primary shrink-0">
              Search
            </button>
          </form>

          <nav className="flex items-center gap-0.5">
            <NavLink to="/" end className={navClass}>
              Home
            </NavLink>
            <NavLink to="/watchlist" className={navClass}>
              Watchlist
            </NavLink>
            <NavLink to="/about" className={navClass}>
              About
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">{children}</main>

      <footer className="border-t border-white/5 py-5 text-center text-xs text-zinc-500">
        Card data: Pokémon TCG API · Prices may include sample data ·{' '}
        <Link to="/about" className="text-zinc-300 hover:text-poke-yellow">
          About & disclaimers
        </Link>
      </footer>
    </div>
  );
}
