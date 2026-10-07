import { ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import ChartCard from '../common/ChartCard';

const MonthlyProfitChart = ({ data = [] }) => (
  <ChartCard title="Monthly Analytics" subtitle="Revenue, cost and profit by month">
    <div className="w-full min-w-0 h-[300px]">
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(v) => `Rs.${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(v) => `Rs.${Number(v).toLocaleString()}`} />
          <Legend />
          <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[4, 4, 0, 0]} />
          <Bar dataKey="cost" fill="#f97316" name="Cost" radius={[4, 4, 0, 0]} />
          <Bar dataKey="profit" fill="#22c55e" name="Profit" radius={[4, 4, 0, 0]} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  </ChartCard>
);

export default MonthlyProfitChart;