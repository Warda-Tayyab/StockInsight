import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import ChartCard from '../common/ChartCard';

const SalesTrendChart = ({ data = [] }) => (
  <ChartCard title="Sales Trend" subtitle="Revenue and order volume over time">
   <div className="w-full min-w-0 h-[320px]">
   <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-40" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} name="Revenue (Rs.)" dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#22c55e" strokeWidth={2} name="Orders" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </ChartCard>
);

export default SalesTrendChart;
