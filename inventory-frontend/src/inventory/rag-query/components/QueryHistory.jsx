/** @module inventory/rag-query/components/QueryHistory */

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
    <div data-testid="query-history" className="bg-white rounded-xl p-6 shadow-md max-h-[600px]">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 m-0">Query History</h3>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{queries.length}</span>
      </div>
      
      <div className="flex flex-col gap-4">
        {queries.length > 0 ? (
          queries.map((query) => (
            <div key={query.id} className="p-4 rounded-lg transition-colors cursor-pointer hover:bg-gray-50">
              <div className="flex flex-col gap-1">
                <p className="text-sm text-gray-900 m-0 leading-relaxed line-clamp-2">{query.query}</p>
                <span className="text-xs text-gray-400">{formatTime(query.timestamp)}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600">No queries yet</p>
        )}
      </div>
    </div>
  );
};

export default QueryHistory;
