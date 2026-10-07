import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function PlanDistributionChart({ data }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 h-80">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">Plan Distribution</h3>
      <ResponsiveContainer width="100%" height="100%" mb-4>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="42%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            label={({ name, value }) => `${name} ${value}`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
            formatter={(value) => [`${value} tenants`, '']}
          />
          <Legend
  align="right"
  verticalAlign="top"
  wrapperStyle={{
    fontSize: 12,
    top: 0,
    right: 0,
  }}
/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PlanDistributionChart
