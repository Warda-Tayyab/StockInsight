/** @module inventory/dashboard/components/AnalyticsChart */

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { HiOutlineChartBar } from 'react-icons/hi';

const AnalyticsChart = ({ chartData, range, setRange }) => {
  return (
    <div data-testid="analytics-chart" className="card-padded min-h-[360px] sm:min-h-[400px]">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <HiOutlineChartBar className="w-5 h-5 text-indigo-600" />
          <h3 className="card-title">Analytics Overview</h3>
        </div>

        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="select-field w-full sm:!w-auto !py-2 text-xs sm:text-sm"
        >
          <option value="3months">Last 3 months</option>
          <option value="6months">Last 6 months</option>
          <option value="12months">Last year</option>
        </select>
      </div>

      <div className="w-full min-w-0 h-[280px] sm:h-[420px]">
  <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis
              yAxisId="left"
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(value) =>
                value >= 1000000
                  ? `${(value / 1000000).toFixed(1)}M`
                  : value >= 1000
                  ? `${(value / 1000).toFixed(1)}K`
                  : value
              }
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(value) =>
                value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value
              }
            />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)',
              }}
              formatter={(value, name) => [
                name === 'Sales (Rs)'
                  ? `Rs${Number(value).toLocaleString()}`
                  : Number(value).toLocaleString(),
                name,
              ]}
            />
            <Legend wrapperStyle={{ fontSize: '13px' }} />
            <Bar
              yAxisId="left"
              dataKey="sales"
              fill="#4f46e5"
              radius={[6, 6, 0, 0]}
              name="Sales (Rs)"
            />
            <Bar
              yAxisId="right"
              dataKey="stock"
              fill="#10b981"
              radius={[6, 6, 0, 0]}
              name="Stock Count"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsChart;
