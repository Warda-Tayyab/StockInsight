import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import ChartCard from '../common/ChartCard';

const HorizontalBarChart = ({ data = [], dataKey = 'sold', title = 'Performance' }) => (
  <ChartCard title={title}>
 <div className="w-full min-w-0 h-[300px]">
  <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 48 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" width={48} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey={dataKey} fill="#8b5cf6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </ChartCard>
);

export default HorizontalBarChart;
