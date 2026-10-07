/** @module inventory/dashboard/components/StockHealthMixChart */

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = {
  healthy: '#14b8a6',
  low: '#f59e0b',
  out: '#ef4444',
  overstock: '#6366f1'
};

const LABELS = {
  healthy: 'Healthy',
  low: 'Low',
  out: 'Out',
  overstock: 'Overstock'
};

const StockHealthMixChart = ({ stockHealth = {} }) => {
  const pieData = ['healthy', 'low', 'out', 'overstock']
    .map((key) => ({
      key,
      name: LABELS[key],
      value: Number(stockHealth[key] || 0)
    }))
    .filter((d) => d.value > 0);

  const total = pieData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div data-testid="stock-health-mix-chart" className="card-padded h-full min-h-[320px]">
      <h3 className="text-sm font-semibold text-slate-900 m-0 mb-4">Stock Health Mix</h3>

      {pieData.length === 0 ? (
        <p className="text-sm text-slate-400 m-0 py-16 text-center">No stock data yet</p>
      ) : (
        <div className="w-full h-[260px] min-w-0">
         <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="46%"
                innerRadius={58}
                outerRadius={90}
                paddingAngle={2}
                stroke="#fff"
                strokeWidth={2}
              >
                {pieData.map((entry) => (
                  <Cell key={entry.key} fill={COLORS[entry.key]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)'
                }}
                formatter={(value, name) => [
                  `${value} products (${total ? Math.round((value / total) * 100) : 0}%)`,
                  name
                ]}
              />
              <Legend
                verticalAlign="bottom"
                iconType="square"
                iconSize={10}
                wrapperStyle={{ fontSize: '12px', color: '#64748b' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default StockHealthMixChart;
