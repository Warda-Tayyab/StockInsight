/** @module inventory/explainable-insights/components/InsightCard */

import './InsightCard.css';

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
        return <span className="badge badge-error">High Impact</span>;
      case 'medium':
        return <span className="badge badge-warning">Medium Impact</span>;
      case 'low':
        return <span className="badge badge-info">Low Impact</span>;
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
      className={`insight-card card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="insight-card-header">
        <div className="insight-card-icon">{getTypeIcon(insight.type)}</div>
        <div className="insight-card-info">
          <h3 className="insight-card-title">{insight.title}</h3>
          <span className="insight-card-time">{formatTime(insight.timestamp)}</span>
        </div>
        {getImpactBadge(insight.impact)}
      </div>
      
      <p className="insight-card-summary">{insight.summary}</p>
      
      <div className="insight-card-footer">
        <div className="insight-confidence">
          <span className="confidence-label">Confidence:</span>
          <div className="confidence-bar">
            <div
              className="confidence-fill"
              style={{ width: `${insight.confidence}%` }}
            ></div>
          </div>
          <span className="confidence-value">{insight.confidence}%</span>
        </div>
      </div>
    </div>
  );
};

export default InsightCard;
