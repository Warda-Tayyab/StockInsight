/** @module inventory/dashboard/components/AnalyticsChart */

import './AnalyticsChart.css';

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
    <div data-testid="analytics-chart" className="analytics-chart card">
      <div className="card-header">
        <h3 className="card-title">Analytics Overview</h3>
        <select className="form-select" style={{ fontSize: '0.875rem', padding: '0.5rem' }}>
          <option>Last 6 months</option>
          <option>Last year</option>
          <option>Last 3 months</option>
        </select>
      </div>
      
      <div className="chart-container">
        <div className="chart-bars">
          {chartData.map((item, index) => (
            <div key={index} className="chart-bar-group">
              <div className="chart-bar-wrapper">
                <div 
                  className="chart-bar chart-bar-sales"
                  style={{ height: `${(item.sales / maxSales) * 100}%` }}
                  title={`Sales: $${item.sales.toLocaleString()}`}
                ></div>
                <div 
                  className="chart-bar chart-bar-stock"
                  style={{ height: `${(item.stock / maxStock) * 100}%` }}
                  title={`Stock: ${item.stock}`}
                ></div>
              </div>
              <span className="chart-label">{item.month}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="chart-legend">
        <div className="chart-legend-item">
          <span className="chart-legend-color" style={{ backgroundColor: 'var(--primary)' }}></span>
          <span>Sales ($)</span>
        </div>
        <div className="chart-legend-item">
          <span className="chart-legend-color" style={{ backgroundColor: 'var(--success)' }}></span>
          <span>Stock Count</span>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsChart;
