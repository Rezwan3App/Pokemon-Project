import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import WatchlistPage from './pages/WatchlistPage.jsx';
import AboutPage from './pages/AboutPage.jsx';

function LegacyCardRedirect() {
  const { id } = useParams();
  return <Navigate to={`/product/${id}`} replace />;
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/card/:id" element={<LegacyCardRedirect />} />
        <Route path="/watchlist" element={<WatchlistPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </Layout>
  );
}
