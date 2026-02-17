/** @module inventory/explainable-insights/components/DataExplanation */

import './DataExplanation.css';

const DataExplanation = ({ insight }) => {
  return (
    <div data-testid="data-explanation" className="data-explanation card">
      <div className="card-header">
        <h3 className="card-title">Detailed Explanation</h3>
      </div>
      
      <div className="explanation-content">
        <div className="explanation-section">
          <h4 className="explanation-section-title">Summary</h4>
          <p className="explanation-text">{insight.summary}</p>
        </div>
        
        <div className="explanation-section">
          <h4 className="explanation-section-title">Explanation</h4>
          <p className="explanation-text">{insight.explanation}</p>
        </div>
        
        <div className="explanation-section">
          <h4 className="explanation-section-title">Key Data Points</h4>
          <div className="data-points">
            {Object.entries(insight.data).map(([key, value]) => (
              <div key={key} className="data-point">
                <span className="data-point-label">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                <span className="data-point-value">
                  {Array.isArray(value) ? value.join(', ') : typeof value === 'number' ? value.toLocaleString() : value}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="explanation-section">
          <h4 className="explanation-section-title">Confidence & Impact</h4>
          <div className="metrics-grid">
            <div className="metric-item">
              <span className="metric-label">Confidence Level</span>
              <span className="metric-value">{insight.confidence}%</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Impact Level</span>
              <span className={`metric-value badge badge-${insight.impact === 'high' ? 'error' : insight.impact === 'medium' ? 'warning' : 'info'}`}>
                {insight.impact}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExplanation;
