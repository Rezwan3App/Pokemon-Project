import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

const RANGES = [
  { key: '7d', label: '7 days', days: 7 },
  { key: '30d', label: '30 days', days: 30 },
  { key: 'all', label: 'All time', days: null },
];

export default function PriceChart({ history, livePrice }) {
  const [range, setRange] = useState('30d');

  const filtered = useMemo(() => {
    if (!history?.length) return [];
    const cfg = RANGES.find((r) => r.key === range);
    let rows = cfg?.days ? history.slice(-cfg.days) : [...history];

    // Ensure chart ends at live TCGplayer market price when available
    if (livePrice?.isLive && livePrice.current != null && rows.length) {
      const today = new Date().toISOString().slice(0, 10);
      const last = rows[rows.length - 1];
      if (last.recordedAt === today) {
        rows = [
          ...rows.slice(0, -1),
          {
            ...last,
            marketPrice: livePrice.current,
            lowPrice: livePrice.low ?? last.lowPrice,
            highPrice: livePrice.high ?? last.highPrice,
            source: 'tcgplayer-via-pokemontcg-api',
          },
        ];
      } else {
        rows = [
          ...rows,
          {
            recordedAt: today,
            marketPrice: livePrice.current,
            lowPrice: livePrice.low,
            highPrice: livePrice.high,
            source: 'tcgplayer-via-pokemontcg-api',
          },
        ];
      }
    }
    return rows;
  }, [history, range, livePrice]);

  if (!history?.length) {
    return <p className="py-8 text-center text-sm text-zinc-500">No price history yet.</p>;
  }

  const data = filtered.map((h) => ({
    date: h.recordedAt,
    market: h.marketPrice,
    low: h.lowPrice,
    high: h.highPrice,
  }));

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRange(r.key)}
            className={`rounded-md px-2.5 py-1 text-xs transition ${
              range === r.key
                ? 'bg-white/10 text-poke-yellow'
                : 'text-zinc-500 hover:text-zinc-200'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              tickFormatter={(v) => v.slice(5)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              tickFormatter={(v) => `$${v}`}
              width={42}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: '#111316',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                fontSize: 12,
              }}
              formatter={(v, name) => [`$${Number(v).toFixed(2)}`, name]}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="market" name="Market" stroke="#FFCB05" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="low" name="Low" stroke="#60a5fa" strokeWidth={1} dot={false} strokeDasharray="3 3" />
            <Line type="monotone" dataKey="high" name="High" stroke="#f87171" strokeWidth={1} dot={false} strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
