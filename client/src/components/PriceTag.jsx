export default function PriceTag({ price, className = '' }) {
  if (!price?.current) return null;
  const change = price.change7d ?? 0;
  const positive = change >= 0;

  return (
    <div className={`flex items-center justify-between gap-2 text-sm ${className}`}>
      <span className="font-bold text-poke-yellow">${price.current.toFixed(2)}</span>
      <span className={positive ? 'text-emerald-400' : 'text-red-400'}>
        {positive ? '+' : ''}
        {change}% <span className="text-white/40">7d</span>
      </span>
    </div>
  );
}
