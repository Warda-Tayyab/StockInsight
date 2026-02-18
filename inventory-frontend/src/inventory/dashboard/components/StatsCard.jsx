/** @module inventory/dashboard/components/StatsCard */

const StatsCard = ({ title, value, subtitle, icon, trend, trendValue, color }) => {
  const colorClasses = {
    'var(--primary)': 'border-t-blue-600',
    'var(--warning)': 'border-t-yellow-500',
    'var(--success)': 'border-t-green-500',
    'var(--error)': 'border-t-red-500',
  };

  const iconBgClasses = {
    'var(--primary)': 'bg-blue-100 text-blue-600',
    'var(--warning)': 'bg-yellow-100 text-yellow-600',
    'var(--success)': 'bg-green-100 text-green-600',
    'var(--error)': 'bg-red-100 text-red-600',
  };

  const trendClasses = {
    up: 'text-green-600 bg-green-100',
    down: 'text-red-600 bg-red-100',
    neutral: 'text-gray-600 bg-gray-100',
  };

  return (
    <div data-testid="stats-card" className={`bg-white rounded-xl p-6 shadow-md border-t-4 transition-all hover:shadow-lg hover:-translate-y-0.5 ${colorClasses[color] || 'border-t-blue-600'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${iconBgClasses[color] || 'bg-blue-100 text-blue-600'}`}>
          {icon}
        </div>
        <div className={`text-xs font-semibold px-2 py-1 rounded-lg ${trendClasses[trend] || trendClasses.neutral}`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
        </div>
      </div>
      <div className="flex flex-col">
        <h3 className="text-3xl font-bold text-gray-900 m-0 mb-1 leading-none">{value}</h3>
        <p className="text-sm text-gray-600 m-0 mb-1 font-medium">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 m-0">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatsCard;
