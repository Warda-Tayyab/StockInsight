/** @module inventory/stock-monitoring/pages/LowStock */

import { useState } from 'react';
import './LowStock.css';

const LowStock = () => {
  const [filter, setFilter] = useState('all');

  const lowStockItems = [
    { id: 1, name: 'Widget A', category: 'Electronics', currentStock: 12, reorderPoint: 20, price: 29.99, sku: 'WID-A-001' },
    { id: 2, name: 'Gadget B', category: 'Electronics', currentStock: 8, reorderPoint: 15, price: 49.99, sku: 'GAD-B-002' },
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
    <div data-testid="low-stock-page" className="low-stock-page">
      <div className="page-header">
        <div>
          <h1>Low Stock Items</h1>
          <p className="page-subtitle">Products that need restocking</p>
        </div>
        <button className="btn btn-primary">Bulk Reorder</button>
      </div>

      <div className="low-stock-filters card">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({lowStockItems.length})
          </button>
          <button
            className={`filter-tab ${filter === 'electronics' ? 'active' : ''}`}
            onClick={() => setFilter('electronics')}
          >
            Electronics ({lowStockItems.filter(i => i.category === 'Electronics').length})
          </button>
          <button
            className={`filter-tab ${filter === 'hardware' ? 'active' : ''}`}
            onClick={() => setFilter('hardware')}
          >
            Hardware ({lowStockItems.filter(i => i.category === 'Hardware').length})
          </button>
        </div>
      </div>

      <div className="low-stock-list">
        {filteredItems.map((item) => {
          const percentage = getStockPercentage(item.currentStock, item.reorderPoint);
          const status = getStockStatus(percentage);
          
          return (
            <div key={item.id} className="low-stock-card card">
              <div className="low-stock-header">
                <div className="low-stock-info">
                  <h3 className="low-stock-name">{item.name}</h3>
                  <span className="low-stock-sku">{item.sku}</span>
                  <span className={`badge badge-${status === 'critical' ? 'error' : status === 'warning' ? 'warning' : 'info'}`}>
                    {item.category}
                  </span>
                </div>
                <div className="low-stock-price">${item.price.toFixed(2)}</div>
              </div>
              
              <div className="low-stock-stats">
                <div className="stock-stat">
                  <span className="stat-label">Current Stock</span>
                  <span className="stat-value">{item.currentStock} units</span>
                </div>
                <div className="stock-stat">
                  <span className="stat-label">Reorder Point</span>
                  <span className="stat-value">{item.reorderPoint} units</span>
                </div>
                <div className="stock-stat">
                  <span className="stat-label">Stock Level</span>
                  <span className="stat-value">{percentage}%</span>
                </div>
              </div>
              
              <div className="stock-progress">
                <div className="progress-bar">
                  <div
                    className={`progress-fill progress-${status}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="low-stock-actions">
                <button className="btn btn-secondary btn-sm">View Details</button>
                <button className="btn btn-primary btn-sm">Reorder Now</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LowStock;
