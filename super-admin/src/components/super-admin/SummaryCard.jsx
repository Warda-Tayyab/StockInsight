function SummaryCard({ title, value, icon: Icon, subtitle }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-primary-50 text-primary-600">
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  )
}

export default SummaryCard
