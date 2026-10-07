import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import ChartCard from '../common/ChartCard';

const COLORS = ['#ef4444', '#f59e0b', '#8b5cf6'];

const LossBreakdownChart = ({ data = [], title = 'Loss Breakdown by Category' }) => {
  const chartData = (data || []).filter((d) => d.value > 0);
  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <ChartCard title={title}>
      <div className="w-full min-w-0 h-[300px] flex items-center justify-center relative">
        {chartData.length === 0 ? (
          <p className="text-slate-400 text-sm italic">No inventory or sales losses reported in this period.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `Rs. ${Number(value).toLocaleString()}`} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center label, positioned to match cy="45%" */}
            <div
              className="absolute flex flex-col items-center justify-center pointer-events-none"
              style={{ top: '38%', left: '50%', transform: 'translate(-50%, -50%)' }}
            >
              <span className="text-lg font-bold text-slate-800">
                Rs. {total.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400">Total Loss</span>
            </div>
          </>
        )}
      </div>
    </ChartCard>
  );
};

export default LossBreakdownChart;