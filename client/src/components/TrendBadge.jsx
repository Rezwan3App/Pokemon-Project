const styles = {
  rising: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  falling: 'bg-red-500/20 text-red-300 border-red-500/40',
  stable: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  volatile: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
};

export default function TrendBadge({ trend, compact = false }) {
  if (!trend) return null;
  const dir = trend.direction || 'stable';
  const cls = styles[dir] || styles.stable;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${cls}`}
        title={`${trend.label} (${trend.score})`}
      >
        {trend.score}
      </span>
    );
  }

  return (
    <div className={`inline-flex flex-col rounded-lg border px-3 py-2 ${cls}`}>
      <span className="text-xs uppercase tracking-wide opacity-80">{trend.label}</span>
      <span className="text-lg font-bold">Score {trend.score}</span>
      <span className="text-xs">
        7d {trend.change7d > 0 ? '+' : ''}
        {trend.change7d}% · 30d {trend.change30d > 0 ? '+' : ''}
        {trend.change30d}%
      </span>
      <p className="mt-2 max-w-xs text-[10px] leading-tight opacity-70">{trend.disclaimer}</p>
    </div>
  );
}
