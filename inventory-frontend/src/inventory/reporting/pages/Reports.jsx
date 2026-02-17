/** @module inventory/reporting/pages/Reports */

import { Link } from 'react-router-dom';
import './Reports.css';

const Reports = () => {
  const reportTypes = [
    {
      id: 1,
      title: 'Sales Report',
      description: 'View sales trends, revenue, and performance metrics',
      icon: '📈',
      link: '/reports/sales',
      color: 'var(--success)',
    },
    {
      id: 2,
      title: 'Stock Report',
      description: 'Analyze inventory levels, turnover rates, and stock movements',
      icon: '📦',
      link: '/reports/stock',
      color: 'var(--primary)',
    },
    {
      id: 3,
      title: 'Product Performance',
      description: 'Track product sales, popularity, and profitability',
      icon: '⭐',
      link: '/reports',
      color: 'var(--warning)',
    },
    {
      id: 4,
      title: 'Batch Analysis',
      description: 'Monitor batch usage, expiry dates, and turnover',
      icon: '🔍',
      link: '/reports',
      color: 'var(--info)',
    },
  ];

  const recentReports = [
    { id: 1, name: 'Monthly Sales Report - March 2024', type: 'Sales', date: '2024-03-31', status: 'completed' },
    { id: 2, name: 'Stock Level Report - Q1 2024', type: 'Stock', date: '2024-03-31', status: 'completed' },
    { id: 3, name: 'Low Stock Alert Report', type: 'Alerts', date: '2024-04-01', status: 'completed' },
  ];

  return (
    <div data-testid="reports-page" className="reports-page">
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p className="page-subtitle">Generate and view inventory reports</p>
        </div>
        <button className="btn btn-primary">Generate Custom Report</button>
      </div>

      <div className="reports-grid">
        {reportTypes.map((report) => (
          <Link key={report.id} to={report.link} className="report-card card">
            <div className="report-card-icon" style={{ backgroundColor: `${report.color}20`, color: report.color }}>
              {report.icon}
            </div>
            <h3 className="report-card-title">{report.title}</h3>
            <p className="report-card-description">{report.description}</p>
            <span className="report-card-link">View Report →</span>
          </Link>
        ))}
      </div>

      <div className="recent-reports card">
        <div className="card-header">
          <h3 className="card-title">Recent Reports</h3>
          <a href="#" className="text-sm" style={{ color: 'var(--primary)' }}>View all</a>
        </div>
        
        <div className="reports-list">
          {recentReports.map((report) => (
            <div key={report.id} className="report-item">
              <div className="report-item-info">
                <h4 className="report-item-name">{report.name}</h4>
                <div className="report-item-meta">
                  <span className="badge badge-primary">{report.type}</span>
                  <span className="report-item-date">{report.date}</span>
                </div>
              </div>
              <div className="report-item-actions">
                <button className="btn btn-secondary btn-sm">View</button>
                <button className="btn btn-secondary btn-sm">Download</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;
