/** @module inventory/dashboard/components/RecentQueries */

const RecentQueries = () => {
  const queries = [
    { id: 1, query: 'What products are running low on stock?', timestamp: '2 hours ago', type: 'stock' },
    { id: 2, query: 'Show me sales trends for last quarter', timestamp: '5 hours ago', type: 'sales' },
    { id: 3, query: 'Which batch has the highest turnover rate?', timestamp: '1 day ago', type: 'batch' },
    { id: 4, query: 'Compare inventory levels across categories', timestamp: '2 days ago', type: 'analysis' },
  ];

  return (
    <div data-testid="recent-queries" className="bg-white rounded-xl p-6 shadow-md max-h-[500px]">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 m-0">Recent AI Queries</h3>
        <a href="/ai-query" className="text-sm text-blue-600 hover:text-blue-700">View all</a>
      </div>
      
      <div className="flex flex-col gap-4">
        {queries.map((query) => (
          <div key={query.id} className="flex gap-4 p-4 rounded-lg transition-colors cursor-pointer hover:bg-gray-50">
            <div className="text-2xl flex-shrink-0">
              {query.type === 'stock' && '📦'}
              {query.type === 'sales' && '📈'}
              {query.type === 'batch' && '🔍'}
              {query.type === 'analysis' && '💡'}
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <p className="text-sm text-gray-900 m-0 leading-relaxed line-clamp-2">{query.query}</p>
              <span className="text-xs text-gray-400">{query.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentQueries;
