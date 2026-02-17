/** @module inventory/stock-monitoring/pages/StockAlerts */

import './StockAlerts.css';

const StockAlerts = () => {
  const alerts = [
    { id: 1, type: 'low-stock', product: 'Widget A', currentStock: 12, reorderPoint: 20, priority: 'high', timestamp: '5 minutes ago' },
    { id: 2, type: 'expiring', product: 'Component D', batch: 'BATCH-2023-045', daysUntilExpiry: 3, priority: 'high', timestamp: '1 hour ago' },
    { id: 3, type: 'low-stock', product: 'Gadget B', currentStock: 8, reorderPoint: 15, priority: 'high', timestamp: '2 hours ago' },
    { id: 4, type: 'low-stock', product: 'Part G', currentStock: 5, reorderPoint: 10, priority: 'medium', timestamp: '3 hours ago' },
    { id: 5, type: 'expiring', product: 'Accessory E', batch: 'BATCH-2024-001', daysUntilExpiry: 7, priority: 'medium', timestamp: '5 hours ago' },
    { id: 6, type: 'out-of-stock', product: 'Item X', currentStock: 0, priority: 'critical', timestamp: '1 day ago' },
  ];

  const getAlertIcon = (type) => {
    switch (type) {
      case 'low-stock': return '⚠️';
      case 'expiring': return '⏰';
      case 'out-of-stock': return '🚨';
      default: return '📢';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'critical':
        return <span className="badge badge-error">Critical</span>;
      case 'high':
        return <span className="badge badge-warning">High</span>;
      case 'medium':
        return <span className="badge badge-info">Medium</span>;
      default:
        return <span className="badge badge-primary">Low</span>;
    }
  };

  return (
    <div data-testid="stock-alerts-page" className="stock-alerts-page">
      <div className="page-header">
        <div>
          <h1>Stock Alerts</h1>
          <p className="page-subtitle">Monitor and manage inventory alerts</p>
        </div>
        <div className="alerts-actions">
          <button className="btn btn-secondary">Mark All Read</button>
          <button className="btn btn-primary">Configure Alerts</button>
        </div>
      </div>

      <div className="alerts-summary">
        <div className="card">
          <div className="summary-item">
            <span className="summary-icon">🚨</span>
            <div>
              <span className="summary-value">1</span>
              <span className="summary-label">Critical</span>
            </div>
          </div>
          <div className="summary-item">
            <span className="summary-icon">⚠️</span>
            <div>
              <span className="summary-value">3</span>
              <span className="summary-label">High Priority</span>
            </div>
          </div>
          <div className="summary-item">
            <span className="summary-icon">📢</span>
            <div>
              <span className="summary-value">2</span>
              <span className="summary-label">Medium Priority</span>
            </div>
          </div>
        </div>
      </div>

      <div className="alerts-list">
        {alerts.map((alert) => (
          <div key={alert.id} className={`alert-card card alert-${alert.priority}`}>
            <div className="alert-card-header">
              <div className="alert-card-icon">{getAlertIcon(alert.type)}</div>
              <div className="alert-card-info">
                <h3 className="alert-card-title">{alert.product}</h3>
                <span className="alert-card-time">{alert.timestamp}</span>
              </div>
              {getPriorityBadge(alert.priority)}
            </div>
            
            <div className="alert-card-body">
              {alert.type === 'low-stock' && (
                <div className="alert-details">
                  <p>Current stock: <strong>{alert.currentStock} units</strong></p>
                  <p>Reorder point: <strong>{alert.reorderPoint} units</strong></p>
                  <p className="alert-message">Stock is below the reorder point. Consider restocking soon.</p>
                </div>
              )}
              
              {alert.type === 'expiring' && (
                <div className="alert-details">
                  <p>Batch: <strong>{alert.batch}</strong></p>
                  <p>Expires in: <strong>{alert.daysUntilExpiry} days</strong></p>
                  <p className="alert-message">This batch will expire soon. Consider using it first or discounting.</p>
                </div>
              )}
              
              {alert.type === 'out-of-stock' && (
                <div className="alert-details">
                  <p>Current stock: <strong>0 units</strong></p>
                  <p className="alert-message">Product is out of stock. Immediate action required.</p>
                </div>
              )}
            </div>
            
            <div className="alert-card-actions">
              <button className="btn btn-secondary btn-sm">View Product</button>
              <button className="btn btn-primary btn-sm">Take Action</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockAlerts;
