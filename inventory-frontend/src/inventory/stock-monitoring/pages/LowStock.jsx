/** @module inventory/stock-monitoring/pages/LowStock */

import { useState } from 'react';

const LowStock = () => {
  const [filter, setFilter] = useState('all');

  const lowStockItems = [
    { id: 1, name: 'Widget A', category: 'Electronics', currentStock: 12, reorderPoint: 20, price: 29.99, sku: 'WID-A-001' },
    { id: 2, name: 'Gadget B', category: 'Electronics', stock: 8, reorderPoint: 15, price: 49.99, sku: 'GAD-B-002' },
    { id: 3, name: 'Component D', category: 'Electronics', currentStock: 5, reorderPoint: 10, price: 15.99, sku: 'COM-D-004' },
    { id: 4, name: 'Part G', category: 'Hardware', currentStock: 5, reorderPoint: 10, price: 7.99, sku: 'PRT-G-007' },
    { id: 5, name: 'Gadget K', category: 'Electronics', currentStock: 3, reorderPoint: 10, price: 149.99, sku: 'GAD-K-011' },
  ];

  const filteredItems = filter === 'all' 
    ? lowStockItems 
    : lowStockItems.filter(item => item.category.toLowerCase() === filter.toLowerCase());

  const getStockPercentage = (current, reorder) => {
    return Math.round((current / reorder) * 100);
  };

  const getStockStatus = (percentage) => {
    if (percentage < 50) return 'critical';
    if (percentage < 75) return 'warning';
    return 'info';
  };

  return (
    <div data-testid="low-stock-page" className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Low Stock Items</h1>
          <p className="text-gray-600 text-sm m-0">Products that need restocking</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Bulk Reorder</button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-md">
        <div className="flex gap-2 flex-wrap">
          <button
            className={`px-6 py-2 border-none rounded-lg text-sm font-medium cursor-pointer transition-colors ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            }`}
            onClick={() => setFilter('all')}
          >
            All ({lowStockItems.length})
          </button>
          <button
            className={`px-6 py-2 border-none rounded-lg text-sm font-medium cursor-pointer transition-colors ${
              filter === 'electronics' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            }`}
            onClick={() => setFilter('electronics')}
          >
            Electronics ({lowStockItems.filter(i => i.category === 'Electronics').length})
          </button>
          <button
            className={`px-6 py-2 border-none rounded-lg text-sm font-medium cursor-pointer transition-colors ${
              filter === 'hardware' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            }`}
            onClick={() => setFilter('hardware')}
          >
            Hardware ({lowStockItems.filter(i => i.category === 'Hardware').length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const percentage = getStockPercentage(item.currentStock, item.reorderPoint);
          const status = getStockStatus(percentage);
          
          return (
            <div key={item.id} className="bg-white rounded-xl p-6 shadow-md flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-semibold text-gray-900 m-0">{item.name}</h3>
                  <span className="text-xs text-gray-400">{item.sku}</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    status === 'critical' ? 'bg-red-100 text-red-800' : 
                    status === 'warning' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {item.category}
                  </span>
                </div>
                <div className="text-xl font-bold text-blue-600">${item.price.toFixed(2)}</div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-400">Current Stock</span>
                  <span className="text-base font-semibold text-gray-900">{item.currentStock}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-400">Reorder Point</span>
                  <span className="text-base font-semibold text-gray-900">{item.reorderPoint}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-400">Stock Level</span>
                  <span className="text-base font-semibold text-gray-900">{percentage}%</span>
                </div>
              </div>
              
              <div className="mt-2">
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      status === 'critical' ? 'bg-red-500' : 
                      status === 'warning' ? 'bg-yellow-500' : 
                      'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button className="bg-white text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">View Details</button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">Reorder Now</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LowStock;
