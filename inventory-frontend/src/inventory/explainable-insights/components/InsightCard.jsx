/** @module inventory/explainable-insights/components/InsightCard */

import {
  HiOutlineChartBar,
  HiOutlineCube,
  HiOutlineClock,
  HiOutlineLightBulb,
  HiOutlineRefresh,
  HiOutlineExclamation,
} from 'react-icons/hi';

const typeIcon = {
  sales: HiOutlineChartBar,
  inventory: HiOutlineCube,
  batch: HiOutlineClock,
  returns: HiOutlineRefresh,
  anomaly: HiOutlineExclamation,
  analysis: HiOutlineLightBulb,
  forecast: HiOutlineChartBar,
  supplier: HiOutlineCube,
};

const impactStyles = {
  high: 'bg-rose-50 text-rose-700 border-rose-100',
  medium: 'bg-amber-50 text-amber-700 border-amber-100',
  low: 'bg-slate-50 text-slate-600 border-slate-100',
};

const InsightCard = ({ insight, isSelected, onClick }) => {
  const Icon = typeIcon[insight.type] || HiOutlineLightBulb;

  return (
    <button
      type="button"
      data-testid="insight-card"
      onClick={onClick}
      className={`w-full text-left rounded-2xl border bg-white px-4 py-4 transition-all duration-200 ${
        isSelected
          ? 'border-indigo-300 shadow-md ring-1 ring-indigo-100'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <h3 className="text-[15px] font-semibold text-slate-900 m-0 leading-snug">
              {insight.title}
            </h3>
            <span
              className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                impactStyles[insight.impact] || impactStyles.medium
              }`}
            >
              {insight.impact || 'medium'}
            </span>
          </div>

          <p className="text-sm text-slate-600 m-0 leading-relaxed line-clamp-2">
            {insight.summary}
          </p>

          <div className="flex items-center gap-2 mt-3">
            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full"
                style={{ width: `${insight.confidence || 0}%` }}
              />
            </div>
            <span className="text-[11px] font-medium text-slate-500 tabular-nums">
              {insight.confidence}%
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};

export default InsightCard;
