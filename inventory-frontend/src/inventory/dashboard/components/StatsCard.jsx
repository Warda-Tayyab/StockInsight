/** @module inventory/dashboard/components/StatsCard */

import {
  HiOutlineCube,
  HiOutlineExclamation,
  HiOutlineCurrencyDollar,
  HiOutlineBell,
  HiTrendingUp,
  HiTrendingDown,
  HiMinus,
} from 'react-icons/hi';

const iconMap = {
  products: HiOutlineCube,
  warning: HiOutlineExclamation,
  sales: HiOutlineCurrencyDollar,
  alerts: HiOutlineBell,
};

const StatsCard = ({
  title,
  value,
  subtitle,
  icon,
  iconType,
  trend,
  trendValue,
  color,
  onClick,
  className = '',
}) => {
  const borderClasses = {
    'var(--primary)': 'border-t-indigo-500',
    'var(--warning)': 'border-t-amber-500',
    'var(--success)': 'border-t-emerald-500',
    'var(--error)': 'border-t-red-500',
  };

  const iconBgClasses = {
    'var(--primary)': 'bg-indigo-50 text-indigo-600 ring-indigo-100',
    'var(--warning)': 'bg-amber-50 text-amber-600 ring-amber-100',
    'var(--success)': 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    'var(--error)': 'bg-red-50 text-red-600 ring-red-100',
  };

  const trendClasses = {
    up: 'text-emerald-700 bg-emerald-50 ring-emerald-100',
    down: 'text-red-700 bg-red-50 ring-red-100',
    neutral: 'text-slate-600 bg-slate-100 ring-slate-200',
  };

  const IconComponent = iconType ? iconMap[iconType] : null;

  const TrendIcon = trend === 'up' ? HiTrendingUp : trend === 'down' ? HiTrendingDown : HiMinus;

  return (
    <div
      data-testid="stats-card"
      onClick={onClick}
      className={`card-padded border-t-4 cursor-pointer transition-all duration-300
        hover:shadow-card-hover hover:-translate-y-0.5
        ${borderClasses[color] || 'border-t-indigo-500'} ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ring-1 ${
            iconBgClasses[color] || iconBgClasses['var(--primary)']
          }`}
        >
          {IconComponent ? (
            <IconComponent className="w-5 h-5" />
          ) : (
            <span className="text-xl">{icon}</span>
          )}
        </div>
        {trendValue && (
          <div
            className={`text-xs font-semibold px-2 py-1 rounded-lg flex items-center gap-0.5 ring-1 ${
              trendClasses[trend] || trendClasses.neutral
            }`}
          >
            <TrendIcon className="w-3.5 h-3.5" />
            {trendValue}
          </div>
        )}
      </div>
      <div className="flex flex-col">
        <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 m-0 mb-1 leading-none tracking-tight">
          {value}
        </h3>
        <p className="text-sm text-slate-600 m-0 mb-0.5 font-medium">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 m-0">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatsCard;
