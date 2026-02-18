/** @module inventory/dashboard/components/AlertsPanel */

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

  const alertBgClasses = {
    warning: 'bg-yellow-50 border-l-yellow-500',
    error: 'bg-red-50 border-l-red-500',
    info: 'bg-blue-50 border-l-blue-500',
    success: 'bg-green-50 border-l-green-500',
  };

  return (
    <div data-testid="alerts-panel" className="bg-white rounded-xl p-6 shadow-md max-h-[500px]">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 m-0">Recent Alerts</h3>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">4</span>
      </div>
      
      <div className="flex flex-col gap-4 mb-6">
        {alerts.map((alert) => (
          <div key={alert.id} className={`flex gap-4 p-4 rounded-lg border-l-4 ${alertBgClasses[alert.type] || alertBgClasses.info}`}>
            <div className="text-xl flex-shrink-0">{getAlertIcon(alert.type)}</div>
            <div className="flex-1 flex flex-col gap-1">
              <p className="text-sm text-gray-900 m-0 leading-relaxed">{alert.message}</p>
              <span className="text-xs text-gray-400">{alert.time}</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="pt-4 border-t border-gray-200">
        <a href="/stock-alerts" className="w-full bg-gray-100 text-gray-900 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors inline-block text-center">
          View All Alerts
        </a>
      </div>
    </div>
  );
};

export default AlertsPanel;
