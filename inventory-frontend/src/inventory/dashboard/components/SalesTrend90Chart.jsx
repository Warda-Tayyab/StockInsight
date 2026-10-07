/** @module inventory/dashboard/components/SalesTrend90Chart */

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

const SalesTrend90Chart = ({ data = [] }) => (
  <div data-testid="sales-trend-90-chart" className="card-padded h-full min-h-[320px]">
    <h3 className="text-sm font-semibold text-slate-900 m-0 mb-4">Sales Trend (90 days)</h3>

    {data.length === 0 ? (
      <p className="text-sm text-slate-400 m-0 py-16 text-center">No sales in the last 90 days</p>
    ) : (
      <div className="w-full h-[260px] min-w-0">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesTrend90Fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={28}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) =>
                value >= 1000000
                  ? `Rs ${(value / 1000000).toFixed(1)}M`
                  : value >= 1000
                  ? `Rs ${(value / 1000).toFixed(1)}K`
                  : `Rs ${value}`
              }
              width={56}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)'
              }}
              formatter={(value) => [
                `Rs ${Number(value || 0).toLocaleString('en-PK')}`,
                'Revenue'
              ]}
              labelFormatter={(label) => `Week of ${label}`}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#4f46e5"
              fill="url(#salesTrend90Fill)"
              strokeWidth={2.5}
              activeDot={{ r: 5, fill: '#4f46e5' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>
);

export default SalesTrend90Chart;
