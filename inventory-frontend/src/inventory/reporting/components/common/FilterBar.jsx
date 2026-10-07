const FilterBar = ({ children }) => (
  <div className="card-padded flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end print:hidden">
    {children}
  </div>
);

export const FilterSelect = ({ label, value, onChange, options = [] }) => (
  <label className="form-group w-full sm:w-auto min-w-0 sm:min-w-[140px]">
    <span className="form-label text-xs">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="select-field w-full"
    >
      {options.map((opt) => (
        <option key={opt} value={opt === 'All' ? '' : opt}>
          {opt}
        </option>
      ))}
    </select>
  </label>
);

export const FilterDateRange = ({ value, onChange }) => (
  <label className="form-group w-full sm:w-auto min-w-0 sm:min-w-[160px]">
    <span className="form-label text-xs">Date range</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="select-field w-full"
    >
      <option value="week">Last 7 days</option>
      <option value="month">Last 30 days</option>
      <option value="quarter">Last 3 months</option>
      <option value="year">Last year</option>
      <option value="all">All Time</option>
    </select>
  </label>
);

export default FilterBar;
