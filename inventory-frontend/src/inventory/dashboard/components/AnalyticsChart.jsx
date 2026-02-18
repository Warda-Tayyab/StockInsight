/** @module inventory/dashboard/components/AnalyticsChart */

const AnalyticsChart = () => {
  // Dummy chart data
  const chartData = [
    { month: 'Jan', sales: 45000, stock: 120 },
    { month: 'Feb', sales: 52000, stock: 135 },
    { month: 'Mar', sales: 48000, stock: 110 },
    { month: 'Apr', sales: 61000, stock: 145 },
    { month: 'May', sales: 55000, stock: 130 },
    { month: 'Jun', sales: 67000, stock: 150 },
  ];

  const maxSales = Math.max(...chartData.map(d => d.sales));
  const maxStock = Math.max(...chartData.map(d => d.stock));

  return (
    <div data-testid="analytics-chart" className="bg-white rounded-xl p-6 shadow-md min-h-[400px]">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 m-0">Analytics Overview</h3>
        <select className="text-sm px-2 py-1 border border-gray-200 rounded-lg bg-white text-gray-900 transition-all focus:outline-none focus:border-blue-600">
          <option>Last 6 months</option>
          <option>Last year</option>
          <option>Last 3 months</option>
        </select>
      </div>
      
      <div className="my-6 py-6">
        <div className="flex items-end justify-around h-[250px] gap-4">
          {chartData.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full h-full flex items-end justify-center gap-1">
                <div 
                  className="flex-1 min-h-[4px] rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400 transition-all cursor-pointer hover:opacity-80 hover:scale-y-105"
                  style={{ height: `${(item.sales / maxSales) * 100}%` }}
                  title={`Sales: $${item.sales.toLocaleString()}`}
                ></div>
                <div 
                  className="flex-1 min-h-[4px] rounded-t-lg bg-gradient-to-t from-green-500 to-green-400 transition-all cursor-pointer hover:opacity-80 hover:scale-y-105"
                  style={{ height: `${(item.stock / maxStock) * 100}%` }}
                  title={`Stock: ${item.stock}`}
                ></div>
              </div>
              <span className="text-xs text-gray-600 font-medium">{item.month}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex gap-8 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-blue-600"></span>
          <span className="text-sm text-gray-600">Sales ($)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-green-500"></span>
          <span className="text-sm text-gray-600">Stock Count</span>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsChart;
