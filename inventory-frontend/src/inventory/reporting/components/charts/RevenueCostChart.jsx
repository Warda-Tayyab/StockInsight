import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import ChartCard from '../common/ChartCard';

const RevenueCostChart = ({ data = [], title = 'Revenue vs Cost' }) => (
  <ChartCard title={title}>
<div className="w-full min-w-0 h-[300px]">
  <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(v) => `Rs.${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(v) => `Rs.${Number(v).toLocaleString()}`} />
          <Legend />
          <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} name="Amount" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </ChartCard>
);

export default RevenueCostChart;
