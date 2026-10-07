/** @module inventory/explainable-insights/components/RecommendationPanel */

const priorityDot = {
  high: 'bg-rose-500',
  medium: 'bg-amber-500',
  low: 'bg-slate-400'
};

const RecommendationPanel = ({ recommendations = [] }) => (
  <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-slate-900 m-0">Priority actions</h3>
      <span className="text-xs text-slate-400">{recommendations.length}</span>
    </div>

    {recommendations.length === 0 ? (
      <p className="text-sm text-slate-400 m-0 px-5 py-6">
        Actions will appear after AI analysis.
      </p>
    ) : (
      <ol className="m-0 p-0 list-none divide-y divide-slate-100">
        {recommendations.map((rec, idx) => (
          <li key={rec.id || idx} className="px-5 py-3.5">
            <div className="flex items-start gap-3">
              <span className="text-xs font-bold text-slate-400 mt-0.5 tabular-nums w-4">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      priorityDot[rec.priority] || priorityDot.medium
                    }`}
                  />
                  <p className="text-sm font-semibold text-slate-900 m-0 truncate">
                    {rec.title}
                  </p>
                </div>
                <p className="text-sm text-slate-600 m-0 leading-relaxed">
                  {rec.action}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    )}
  </div>
);

export default RecommendationPanel;
