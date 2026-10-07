import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const tones = {
  blue: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  red: 'bg-red-50 text-red-600 border-red-100',
  rose: 'bg-rose-50 text-rose-600 border-rose-100',
  purple: 'bg-purple-50 text-purple-600 border-purple-100',
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
};

const ReportCard = ({ label, value, hint, icon: Icon, tone = 'blue', trend }) => (
  <div className="card-padded hover:shadow-card-hover transition-shadow duration-300">
    <div className="flex items-start justify-between gap-3">
      <div
        className={`w-11 h-11 rounded-xl border flex items-center justify-center ${tones[tone]}`}
      >
        {Icon ? <Icon className="w-5 h-5" /> : null}
      </div>
      {trend && (
        <span
          className={`text-xs font-semibold flex items-center gap-0.5 ${
            trend.startsWith('+') ? 'text-emerald-600' : 'text-red-500'
          }`}
        >
          {trend.startsWith('+') ? <FiTrendingUp /> : <FiTrendingDown />}
          {trend}
        </span>
      )}
    </div>
    <p className="text-xs text-slate-500 mt-4 mb-1">{label}</p>
    <p className="text-2xl font-bold text-slate-900 m-0 tracking-tight">{value}</p>
    {hint && <p className="text-[11px] text-slate-400 mt-1 m-0">{hint}</p>}
  </div>
);

export const ReportCardsGrid = ({ children }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
);

export default ReportCard;
