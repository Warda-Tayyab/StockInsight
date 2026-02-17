/** @module inventory/dashboard/components/AlertsPanel */

import './AlertsPanel.css';

const AlertsPanel = () => {
  const alerts = [
    { id: 1, type: 'warning', message: 'Product "Widget A" is below reorder point', time: '5 min ago' },
    { id: 2, type: 'error', message: 'Batch #12345 expires in 3 days', time: '1 hour ago' },
    { id: 3, type: 'info', message: 'New inventory received: 50 units', time: '2 hours ago' },
    { id: 4, type: 'success', message: 'Monthly report generated successfully', time: '1 day ago' },
  ];

  const getAlertIcon = (type) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'error': return '🚨';
      case 'info': return 'ℹ️';
      case 'success': return '✅';
      default: return '📢';
    }
  };

  return (
    <div data-testid="alerts-panel" className="alerts-panel card">
      <div className="card-header">
        <h3 className="card-title">Recent Alerts</h3>
        <span className="badge badge-error">4</span>
      </div>
      
      <div className="alerts-list">
        {alerts.map((alert) => (
          <div key={alert.id} className={`alert-item alert-${alert.type}`}>
            <div className="alert-icon">{getAlertIcon(alert.type)}</div>
            <div className="alert-content">
              <p className="alert-message">{alert.message}</p>
              <span className="alert-time">{alert.time}</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="alerts-footer">
        <a href="/stock-alerts" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
          View All Alerts
        </a>
      </div>
    </div>
  );
};

export default AlertsPanel;
