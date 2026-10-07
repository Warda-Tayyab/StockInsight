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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-80 p-3">
  <h3 className="text-sm font-semibold text-slate-800 mb-4">
    Growth Trends
  </h3>

  <ResponsiveContainer width="100%" height="85%">
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Legend verticalAlign="top" height={36} />
      <Bar dataKey="users" fill="#0ea5e9" />
      <Bar dataKey="orders" fill="#8b5cf6" />
    </BarChart>
  </ResponsiveContainer>
</div>
  )
}

export default GrowthChart
