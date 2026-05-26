import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export default function PriceChart({ history }) {
  if (!history?.length) {
    return (
      <p className="py-8 text-center text-white/50">No price history yet.</p>
    );
  }

  const data = history.map((h) => ({
    date: h.recordedAt,
    price: h.price,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="date"
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
            tickFormatter={(v) => v.slice(5)}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
            tickFormatter={(v) => `$${v}`}
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: '#16213e',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8,
            }}
            formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Price']}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#FFCB05"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#EE1515' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
