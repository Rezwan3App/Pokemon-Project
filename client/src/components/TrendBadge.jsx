const styles = {
  rising: 'text-emerald-400',
  falling: 'text-red-400',
  stable: 'text-zinc-400',
  volatile: 'text-amber-400',
};

const dot = {
  rising: 'bg-emerald-400',
  falling: 'bg-red-400',
  stable: 'bg-zinc-500',
  volatile: 'bg-amber-400',
};

export default function TrendBadge({ trend, compact = false }) {
  if (!trend) return null;
  const dir = trend.direction || 'stable';

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs ${styles[dir]}`}>
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${dot[dir]}`} />
        {trend.label}
      </span>
    );
  }

  return (
    <div className="surface flex flex-col gap-1 px-4 py-3">
      <span className="label">Trend</span>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold num">{trend.score}</span>
        <span className={`text-sm ${styles[dir]}`}>{trend.label}</span>
      </div>
      <p className="text-xs text-zinc-500 num">
        7d {trend.change7d > 0 ? '+' : ''}{trend.change7d}% · 30d {trend.change30d > 0 ? '+' : ''}{trend.change30d}%
      </p>
    </div>
  );
}
