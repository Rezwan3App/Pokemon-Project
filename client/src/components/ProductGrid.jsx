import ProductTile from './ProductTile.jsx';

export default function ProductGrid({ products, emptyMessage = 'No products found.', cols = 4 }) {
  if (!products?.length) {
    return (
      <p className="rounded-md border border-dashed border-white/10 py-12 text-center text-sm text-zinc-500">
        {emptyMessage}
      </p>
    );
  }

  const gridCls =
    cols === 5
      ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5'
      : 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4';

  return (
    <div className={gridCls}>
      {products.map((p) => (
        <ProductTile key={p.id} product={p} />
      ))}
    </div>
  );
}
