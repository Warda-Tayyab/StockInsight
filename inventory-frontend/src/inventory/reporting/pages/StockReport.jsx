/** @module inventory/reporting/pages/StockReport */

import { useState } from 'react';

const StockReport = () => {
  const [filter, setFilter] = useState('all');

  const stockData = [
    { category: 'Electronics', totalProducts: 45, totalStock: 1234, lowStock: 5, value: 125000 },
    { category: 'Hardware', totalProducts: 32, totalStock: 890, lowStock: 2, value: 45000 },
    { category: 'Accessories', totalProducts: 28, totalStock: 567, lowStock: 1, value: 28000 },
    { category: 'Software', totalProducts: 15, totalStock: 234, lowStock: 0, value: 15000 },
  ];

  const filteredData = filter === 'all' 
    ? stockData 
    : stockData.filter(item => item.category.toLowerCase() === filter.toLowerCase());

  const totals = {
    totalProducts: stockData.reduce((sum, d) => sum + d.totalProducts, 0),
    totalStock: stockData.reduce((sum, d) => sum + d.totalStock, 0),
    totalLowStock: stockData.reduce((sum, d) => sum + d.lowStock, 0),
    totalValue: stockData.reduce((sum, d) => sum + d.value, 0),
  };

  return (
    <div data-testid="stock-report-page" className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Stock Report</h1>
          <p className="text-gray-600 text-sm m-0">Inventory levels and stock analysis</p>
        </div>
        <div className="flex gap-4">
          <select className="px-3.5 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm transition-all focus:outline-none focus:border-blue-600">
            <option>All Locations</option>
            <option>Warehouse A</option>
            <option>Warehouse B</option>
            <option>Warehouse C</option>
          </select>
          <button className="bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Export PDF</button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Export Excel</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-md flex flex-col gap-2 text-center">
          <span className="text-sm text-gray-600">Total Products</span>
          <span className="text-3xl font-bold text-gray-900">{totals.totalProducts}</span>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md flex flex-col gap-2 text-center">
          <span className="text-sm text-gray-600">Total Stock Units</span>
          <span className="text-3xl font-bold text-gray-900">{totals.totalStock.toLocaleString()}</span>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md flex flex-col gap-2 text-center">
          <span className="text-sm text-gray-600">Low Stock Items</span>
          <span className="text-3xl font-bold text-gray-900">{totals.totalLowStock}</span>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md flex flex-col gap-2 text-center">
          <span className="text-sm text-gray-600">Total Inventory Value</span>
          <span className="text-3xl font-bold text-gray-900">${totals.totalValue.toLocaleString()}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-md">
        <div className="flex gap-2 flex-wrap">
          <button
            className={`px-6 py-2 border-none rounded-lg text-sm font-medium cursor-pointer transition-colors ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            }`}
            onClick={() => setFilter('all')}
          >
            All Categories
          </button>
          {stockData.map((item) => (
            <button
              key={item.category}
              className={`px-6 py-2 border-none rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                filter === item.category.toLowerCase() ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
              onClick={() => setFilter(item.category.toLowerCase())}
            >
              {item.category}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 m-0">Stock by Category</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Category</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Products</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Total Stock</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Low Stock</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Inventory Value</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr key={index} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-4 border-b border-gray-200 text-sm text-gray-900">
                    <span className="font-semibold">{item.category}</span>
                  </td>
                  <td className="px-4 py-4 border-b border-gray-200 text-sm text-gray-900">{item.totalProducts}</td>
                  <td className="px-4 py-4 border-b border-gray-200 text-sm text-gray-900">{item.totalStock.toLocaleString()}</td>
                  <td className="px-4 py-4 border-b border-gray-200 text-sm">
                    {item.lowStock > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">{item.lowStock}</span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">0</span>
                    )}
                  </td>
                  <td className="px-4 py-4 border-b border-gray-200 text-sm text-gray-900">${item.value.toLocaleString()}</td>
                  <td className="px-4 py-4 border-b border-gray-200 text-sm">
                    {item.lowStock === 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Healthy</span>
                    ) : item.lowStock < 3 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Attention Needed</span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Critical</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockReport;
