/** @module inventory/reporting/pages/SalesReport */

import { useState } from 'react';

const SalesReport = () => {
  const [dateRange, setDateRange] = useState('month');

  const salesData = [
    { date: '2024-01-01', sales: 45000, orders: 120, avgOrder: 375 },
    { date: '2024-02-01', sales: 52000, orders: 135, avgOrder: 385 },
    { date: '2024-03-01', sales: 48000, orders: 110, avgOrder: 436 },
    { date: '2024-04-01', sales: 61000, orders: 145, avgOrder: 421 },
    { date: '2024-05-01', sales: 55000, orders: 130, avgOrder: 423 },
    { date: '2024-06-01', sales: 67000, orders: 150, avgOrder: 447 },
  ];

  const maxSales = Math.max(...salesData.map(d => d.sales));

  const summary = {
    totalSales: salesData.reduce((sum, d) => sum + d.sales, 0),
    totalOrders: salesData.reduce((sum, d) => sum + d.orders, 0),
    avgOrderValue: salesData.reduce((sum, d) => sum + d.avgOrder, 0) / salesData.length,
    growth: '+18.5%',
  };

  return (
    <div data-testid="sales-report-page" className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Sales Report</h1>
          <p className="text-gray-600 text-sm m-0">Track sales performance and trends</p>
        </div>
        <div className="flex gap-4">
          <select
            className="px-3.5 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm transition-all focus:outline-none focus:border-blue-600"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          <button className="bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Export PDF</button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Export Excel</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-green-100 text-green-600 flex-shrink-0">💰</div>
          <div>
            <span className="block text-xs text-gray-400 mb-1">Total Sales</span>
            <span className="block text-2xl font-bold text-gray-900">${summary.totalSales.toLocaleString()}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-blue-100 text-blue-600 flex-shrink-0">📦</div>
          <div>
            <span className="block text-xs text-gray-400 mb-1">Total Orders</span>
            <span className="block text-2xl font-bold text-gray-900">{summary.totalOrders}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-purple-100 text-purple-600 flex-shrink-0">📊</div>
          <div>
            <span className="block text-xs text-gray-400 mb-1">Avg Order Value</span>
            <span className="block text-2xl font-bold text-gray-900">${summary.avgOrderValue.toFixed(2)}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-yellow-100 text-yellow-600 flex-shrink-0">📈</div>
          <div>
            <span className="block text-xs text-gray-400 mb-1">Growth</span>
            <span className="block text-2xl font-bold text-gray-900">{summary.growth}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md min-h-[400px]">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 m-0">Sales Trend</h3>
        </div>
        <div className="my-6 py-6">
          <div className="flex items-end justify-around h-[300px] gap-4">
            {salesData.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full h-full flex items-end justify-center">
                  <div
                    className="w-full min-h-[4px] rounded-t-lg bg-gradient-to-t from-green-500 to-green-400 transition-all cursor-pointer hover:opacity-80 hover:scale-y-105"
                    style={{ height: `${(item.sales / maxSales) * 100}%` }}
                    title={`$${item.sales.toLocaleString()}`}
                  ></div>
                </div>
                <span className="text-xs text-gray-600 font-medium">{new Date(item.date).toLocaleDateString('en-US', { month: 'short' })}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 m-0">Detailed Sales Data</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Date</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Sales</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Orders</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Avg Order Value</th>
              </tr>
            </thead>
            <tbody>
              {salesData.map((item, index) => (
                <tr key={index} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-4 border-b border-gray-200 text-sm text-gray-900">{new Date(item.date).toLocaleDateString()}</td>
                  <td className="px-4 py-4 border-b border-gray-200 text-sm text-gray-900">${item.sales.toLocaleString()}</td>
                  <td className="px-4 py-4 border-b border-gray-200 text-sm text-gray-900">{item.orders}</td>
                  <td className="px-4 py-4 border-b border-gray-200 text-sm text-gray-900">${item.avgOrder.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesReport;
