/** @module inventory/rag-query/components/QueryHistory */

import { HiOutlineChatAlt2 } from 'react-icons/hi';

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
    <div data-testid="query-history" className="card-padded max-h-[600px] flex flex-col">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <HiOutlineChatAlt2 className="w-5 h-5 text-indigo-600" />
          <h3 className="card-title">Query History</h3>
        </div>
        <span className="badge-info">{queries.length}</span>
      </div>

      <div className="flex flex-col gap-2 flex-1 overflow-y-auto scrollbar-thin">
        {queries.length > 0 ? (
          queries.map((query) => (
            <div
              key={query.id}
              className="p-3.5 rounded-xl transition-all cursor-pointer hover:bg-indigo-50/60 border border-transparent hover:border-indigo-100"
            >
              <p className="text-sm text-slate-800 m-0 leading-relaxed line-clamp-2 font-medium">
                {query.query}
              </p>
              <span className="text-xs text-slate-400 mt-1 block">
                {formatTime(query.timestamp)}
              </span>
            </div>
          ))
        ) : (
          <p className="empty-state">No queries yet</p>
        )}
      </div>
    </div>
  );
};

export default QueryHistory;
