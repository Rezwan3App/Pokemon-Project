import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Layout({ children }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  function handleSearch(e) {
    e.preventDefault();
    const q = query.trim();
    if (q.length >= 2) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }
  }

  const navClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive ? 'bg-poke-yellow text-poke-dark' : 'text-white/80 hover:bg-white/10'
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-poke-dark/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-4">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-poke-red text-sm">
              ◓
            </span>
            <span className="bg-gradient-to-r from-poke-yellow to-white bg-clip-text text-transparent">
              TCG Price Tracker
            </span>
          </Link>

          <form onSubmit={handleSearch} className="flex flex-1 min-w-[200px] max-w-md gap-2">
            <input
              type="search"
              className="input-field flex-1"
              placeholder="Search cards (e.g. Pikachu, Charizard)…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="btn-primary shrink-0">
              Search
            </button>
          </form>

          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={navClass}>
              Home
            </NavLink>
            <NavLink to="/watchlist" className={navClass}>
              Watchlist
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>

      <footer className="border-t border-white/10 py-6 text-center text-sm text-white/50">
        Card data © Pokémon TCG API · Market prices are mock samples for MVP
      </footer>
    </div>
  );
}
