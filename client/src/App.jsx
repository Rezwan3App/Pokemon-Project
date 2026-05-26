import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import CardDetailPage from './pages/CardDetailPage.jsx';
import WatchlistPage from './pages/WatchlistPage.jsx';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/card/:id" element={<CardDetailPage />} />
        <Route path="/watchlist" element={<WatchlistPage />} />
      </Routes>
    </Layout>
  );
}
