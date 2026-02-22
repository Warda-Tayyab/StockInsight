import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const STROKE = '#0ea5e9'

function RevenueTrendChart({ data }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-80">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">Revenue Trend</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#64748b" />
          <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
          <Tooltip
            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
            formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke={STROKE}
            strokeWidth={2}
            dot={{ fill: STROKE, strokeWidth: 0 }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default RevenueTrendChart
