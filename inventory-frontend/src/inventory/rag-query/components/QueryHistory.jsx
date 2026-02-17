/** @module inventory/rag-query/components/QueryHistory */

import './QueryHistory.css';

const QueryHistory = ({ queries }) => {
  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div data-testid="query-history" className="query-history card">
      <div className="card-header">
        <h3 className="card-title">Query History</h3>
        <span className="badge badge-primary">{queries.length}</span>
      </div>
      
      <div className="history-list">
        {queries.length > 0 ? (
          queries.map((query) => (
            <div key={query.id} className="history-item">
              <div className="history-query">
                <p className="history-text">{query.query}</p>
                <span className="history-time">{formatTime(query.timestamp)}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-secondary">No queries yet</p>
        )}
      </div>
    </div>
  );
};

export default QueryHistory;
