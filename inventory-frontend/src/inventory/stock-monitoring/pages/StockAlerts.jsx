/** @module inventory/stock-monitoring/pages/StockAlerts */

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
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Critical</span>;
      case 'high':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">High</span>;
      case 'medium':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Medium</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Low</span>;
    }
  };

  const alertBgClasses = {
    critical: 'bg-red-50 border-l-red-500',
    high: 'bg-yellow-50 border-l-yellow-500',
    medium: 'bg-blue-50 border-l-blue-500',
  };

  return (
    <div data-testid="stock-alerts-page" className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Stock Alerts</h1>
          <p className="text-gray-600 text-sm m-0">Monitor and manage inventory alerts</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Mark All Read</button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Configure Alerts</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center gap-4">
            <span className="text-3xl">🚨</span>
            <div>
              <span className="block text-2xl font-bold text-gray-900">1</span>
              <span className="block text-sm text-gray-600">Critical</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center gap-4">
            <span className="text-3xl">⚠️</span>
            <div>
              <span className="block text-2xl font-bold text-gray-900">3</span>
              <span className="block text-sm text-gray-600">High Priority</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center gap-4">
            <span className="text-3xl">📢</span>
            <div>
              <span className="block text-2xl font-bold text-gray-900">2</span>
              <span className="block text-sm text-gray-600">Medium Priority</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {alerts.map((alert) => (
          <div key={alert.id} className={`bg-white rounded-xl p-6 shadow-md border-l-4 transition-all hover:shadow-lg hover:-translate-y-0.5 ${alertBgClasses[alert.priority] || 'bg-gray-50 border-l-gray-500'}`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-2xl flex-shrink-0">{getAlertIcon(alert.type)}</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 m-0 mb-1">{alert.product}</h3>
                <span className="text-xs text-gray-400">{alert.timestamp}</span>
              </div>
              {getPriorityBadge(alert.priority)}
            </div>
            
            <div className="mb-4">
              {alert.type === 'low-stock' && (
                <div className="flex flex-col gap-2">
                  <p className="m-0 text-sm text-gray-900">Current stock: <strong>{alert.currentStock} units</strong></p>
                  <p className="m-0 text-sm text-gray-900">Reorder point: <strong>{alert.reorderPoint} units</strong></p>
                  <p className="m-0 text-sm text-gray-600 italic mt-2 p-2 bg-gray-100 rounded-lg">Stock is below the reorder point. Consider restocking soon.</p>
                </div>
              )}
              
              {alert.type === 'expiring' && (
                <div className="flex flex-col gap-2">
                  <p className="m-0 text-sm text-gray-900">Batch: <strong>{alert.batch}</strong></p>
                  <p className="m-0 text-sm text-gray-900">Expires in: <strong>{alert.daysUntilExpiry} days</strong></p>
                  <p className="m-0 text-sm text-gray-600 italic mt-2 p-2 bg-gray-100 rounded-lg">This batch will expire soon. Consider using it first or discounting.</p>
                </div>
              )}
              
              {alert.type === 'out-of-stock' && (
                <div className="flex flex-col gap-2">
                  <p className="m-0 text-sm text-gray-900">Current stock: <strong>0 units</strong></p>
                  <p className="m-0 text-sm text-gray-600 italic mt-2 p-2 bg-gray-100 rounded-lg">Product is out of stock. Immediate action required.</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <button className="bg-white text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">View Product</button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">Take Action</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockAlerts;
