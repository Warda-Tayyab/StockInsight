/** @module inventory/dashboard/components/RecentQueries */

import './RecentQueries.css';

const RecentQueries = () => {
  const queries = [
    { id: 1, query: 'What products are running low on stock?', timestamp: '2 hours ago', type: 'stock' },
    { id: 2, query: 'Show me sales trends for last quarter', timestamp: '5 hours ago', type: 'sales' },
    { id: 3, query: 'Which batch has the highest turnover rate?', timestamp: '1 day ago', type: 'batch' },
    { id: 4, query: 'Compare inventory levels across categories', timestamp: '2 days ago', type: 'analysis' },
  ];

  return (
    <div data-testid="recent-queries" className="recent-queries card">
      <div className="card-header">
        <h3 className="card-title">Recent AI Queries</h3>
        <a href="/ai-query" className="text-sm" style={{ color: 'var(--primary)' }}>View all</a>
      </div>
      
      <div className="queries-list">
        {queries.map((query) => (
          <div key={query.id} className="query-item">
            <div className="query-icon">
              {query.type === 'stock' && '📦'}
              {query.type === 'sales' && '📈'}
              {query.type === 'batch' && '🔍'}
              {query.type === 'analysis' && '💡'}
            </div>
            <div className="query-content">
              <p className="query-text">{query.query}</p>
              <span className="query-timestamp">{query.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentQueries;
