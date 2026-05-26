import ProductTile from './ProductTile.jsx';

export default function ProductGrid({ products, emptyMessage = 'No products found.' }) {
  if (!products?.length) {
    return (
      <p className="rounded-xl border border-dashed border-white/20 py-12 text-center text-white/60">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductTile key={p.id} product={p} />
      ))}
    </div>
  );
}
