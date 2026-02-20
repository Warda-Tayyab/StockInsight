/** @module inventory/explainable-insights/components/InsightCard */

const InsightCard = ({ insight, isSelected, onClick }) => {
  const getTypeIcon = (type) => {
    switch (type) {
      case 'sales': return '📈';
      case 'inventory': return '📦';
      case 'batch': return '🔍';
      case 'analysis': return '💡';
      default: return '📊';
    }
  };

  const getImpactBadge = (impact) => {
    switch (impact) {
      case 'high':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">High Impact</span>;
      case 'medium':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Medium Impact</span>;
      case 'low':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Low Impact</span>;
      default:
        return null;
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div
      data-testid="insight-card"
      className={`bg-white rounded-xl p-6 shadow-md cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${
        isSelected ? 'border-2 border-blue-600 shadow-md' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="text-2xl flex-shrink-0">{getTypeIcon(insight.type)}</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 m-0 mb-1">{insight.title}</h3>
          <span className="text-xs text-gray-400">{formatTime(insight.timestamp)}</span>
        </div>
        {getImpactBadge(insight.impact)}
      </div>
      
      <p className="text-sm text-gray-600 m-0 mb-4 leading-relaxed">{insight.summary}</p>
      
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Confidence:</span>
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-blue-600 transition-all"
              style={{ width: `${insight.confidence}%` }}
            ></div>
          </div>
          <span className="text-xs font-semibold text-gray-900 min-w-[40px] text-right">{insight.confidence}%</span>
        </div>
      </div>
    </div>
  );
};

export default InsightCard;
