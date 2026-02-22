import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const COLORS = { users: '#0ea5e9', orders: '#8b5cf6' }

function GrowthChart({ data }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-80">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">Growth Trends</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#64748b" />
          <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
          <Tooltip
            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
            formatter={(value) => [value, '']}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="users" name="Users" fill={COLORS.users} radius={[4, 4, 0, 0]} />
          <Bar dataKey="orders" name="Orders" fill={COLORS.orders} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default GrowthChart
