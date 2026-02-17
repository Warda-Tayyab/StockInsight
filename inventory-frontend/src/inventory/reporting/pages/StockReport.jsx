/** @module inventory/reporting/pages/StockReport */

import { useState } from 'react';
import './StockReport.css';

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
    <div data-testid="stock-report-page" className="stock-report-page">
      <div className="page-header">
        <div>
          <h1>Stock Report</h1>
          <p className="page-subtitle">Inventory levels and stock analysis</p>
        </div>
        <div className="report-actions">
          <select className="form-select">
            <option>All Locations</option>
            <option>Warehouse A</option>
            <option>Warehouse B</option>
            <option>Warehouse C</option>
          </select>
          <button className="btn btn-secondary">Export PDF</button>
          <button className="btn btn-primary">Export Excel</button>
        </div>
      </div>

      <div className="stock-summary">
        <div className="summary-card card">
          <span className="summary-card-label">Total Products</span>
          <span className="summary-card-value">{totals.totalProducts}</span>
        </div>
        <div className="summary-card card">
          <span className="summary-card-label">Total Stock Units</span>
          <span className="summary-card-value">{totals.totalStock.toLocaleString()}</span>
        </div>
        <div className="summary-card card">
          <span className="summary-card-label">Low Stock Items</span>
          <span className="summary-card-value">{totals.totalLowStock}</span>
        </div>
        <div className="summary-card card">
          <span className="summary-card-label">Total Inventory Value</span>
          <span className="summary-card-value">${totals.totalValue.toLocaleString()}</span>
        </div>
      </div>

      <div className="stock-filters card">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Categories
          </button>
          {stockData.map((item) => (
            <button
              key={item.category}
              className={`filter-tab ${filter === item.category.toLowerCase() ? 'active' : ''}`}
              onClick={() => setFilter(item.category.toLowerCase())}
            >
              {item.category}
            </button>
          ))}
        </div>
      </div>

      <div className="stock-table card">
        <div className="card-header">
          <h3 className="card-title">Stock by Category</h3>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Products</th>
                <th>Total Stock</th>
                <th>Low Stock</th>
                <th>Inventory Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr key={index}>
                  <td>
                    <span className="font-semibold">{item.category}</span>
                  </td>
                  <td>{item.totalProducts}</td>
                  <td>{item.totalStock.toLocaleString()}</td>
                  <td>
                    {item.lowStock > 0 ? (
                      <span className="badge badge-warning">{item.lowStock}</span>
                    ) : (
                      <span className="badge badge-success">0</span>
                    )}
                  </td>
                  <td>${item.value.toLocaleString()}</td>
                  <td>
                    {item.lowStock === 0 ? (
                      <span className="badge badge-success">Healthy</span>
                    ) : item.lowStock < 3 ? (
                      <span className="badge badge-warning">Attention Needed</span>
                    ) : (
                      <span className="badge badge-error">Critical</span>
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
