/** @module inventory/dashboard/components/RecentQueries */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineChatAlt2, HiOutlineSparkles, HiOutlineArrowRight } from 'react-icons/hi';
import ragService from '../../../shared/services/ragService';

const formatTime = (date) => {
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const RecentQueries = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecent = async () => {
      try {
        const res = await ragService.getRecentQueries(5);
        setQueries(res.data.queries || []);
      } catch (err) {
        console.error('Recent queries fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRecent();
  }, []);

  return (
    <div data-testid="recent-queries" className="card-padded max-h-[500px] flex flex-col">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <HiOutlineSparkles className="w-5 h-5 text-indigo-600" />
          <h3 className="card-title">Recent AI Chats</h3>
        </div>
        <Link to="/ai-query" className="link-primary text-sm flex items-center gap-1">
          View all
          <HiOutlineArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex flex-col gap-2 flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-slate-500 gap-2 text-sm">
            <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <span>Loading...</span>
          </div>
        ) : queries.length > 0 ? (
          queries.map((query) => (
            <Link
              key={query.id}
              to="/ai-query"
              state={{ chatId: query.chatId || query.id }}
              className="flex gap-3 p-3.5 rounded-xl transition-all hover:bg-indigo-50/60 no-underline text-inherit group"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0
                group-hover:bg-indigo-100 transition-colors">
                <HiOutlineChatAlt2 className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                <p className="text-sm text-slate-800 m-0 leading-relaxed line-clamp-2 font-medium">
                  {query.title || query.query}
                </p>
                <span className="text-xs text-slate-400">{formatTime(query.timestamp)}</span>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-8">
            <HiOutlineSparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm m-0 mb-3">No AI queries yet</p>
            <Link to="/ai-query" className="link-primary text-sm inline-flex items-center gap-1">
              Ask your first question
              <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentQueries;
