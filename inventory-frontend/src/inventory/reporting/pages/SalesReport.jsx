/** @module inventory/reporting/pages/SalesReport */

import { useState } from 'react';
import './SalesReport.css';

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
    <div data-testid="sales-report-page" className="sales-report-page">
      <div className="page-header">
        <div>
          <h1>Sales Report</h1>
          <p className="page-subtitle">Track sales performance and trends</p>
        </div>
        <div className="report-actions">
          <select
            className="form-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          <button className="btn btn-secondary">Export PDF</button>
          <button className="btn btn-primary">Export Excel</button>
        </div>
      </div>

      <div className="sales-summary">
        <div className="summary-card card">
          <div className="summary-card-icon" style={{ backgroundColor: '#d1fae5', color: 'var(--success)' }}>
            💰
          </div>
          <div>
            <span className="summary-card-label">Total Sales</span>
            <span className="summary-card-value">${summary.totalSales.toLocaleString()}</span>
          </div>
        </div>
        <div className="summary-card card">
          <div className="summary-card-icon" style={{ backgroundColor: '#dbeafe', color: 'var(--info)' }}>
            📦
          </div>
          <div>
            <span className="summary-card-label">Total Orders</span>
            <span className="summary-card-value">{summary.totalOrders}</span>
          </div>
        </div>
        <div className="summary-card card">
          <div className="summary-card-icon" style={{ backgroundColor: '#e0e7ff', color: 'var(--primary)' }}>
            📊
          </div>
          <div>
            <span className="summary-card-label">Avg Order Value</span>
            <span className="summary-card-value">${summary.avgOrderValue.toFixed(2)}</span>
          </div>
        </div>
        <div className="summary-card card">
          <div className="summary-card-icon" style={{ backgroundColor: '#fef3c7', color: 'var(--warning)' }}>
            📈
          </div>
          <div>
            <span className="summary-card-label">Growth</span>
            <span className="summary-card-value">{summary.growth}</span>
          </div>
        </div>
      </div>

      <div className="sales-chart card">
        <div className="card-header">
          <h3 className="card-title">Sales Trend</h3>
        </div>
        <div className="chart-container">
          <div className="chart-bars">
            {salesData.map((item, index) => (
              <div key={index} className="chart-bar-group">
                <div className="chart-bar-wrapper">
                  <div
                    className="chart-bar chart-bar-sales"
                    style={{ height: `${(item.sales / maxSales) * 100}%` }}
                    title={`$${item.sales.toLocaleString()}`}
                  ></div>
                </div>
                <span className="chart-label">{new Date(item.date).toLocaleDateString('en-US', { month: 'short' })}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sales-table card">
        <div className="card-header">
          <h3 className="card-title">Detailed Sales Data</h3>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Sales</th>
                <th>Orders</th>
                <th>Avg Order Value</th>
              </tr>
            </thead>
            <tbody>
              {salesData.map((item, index) => (
                <tr key={index}>
                  <td>{new Date(item.date).toLocaleDateString()}</td>
                  <td>${item.sales.toLocaleString()}</td>
                  <td>{item.orders}</td>
                  <td>${item.avgOrder.toFixed(2)}</td>
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
