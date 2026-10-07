/** @module inventory/explainable-insights/components/DataExplanation */

const formatValue = (value) => {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'number') return value.toLocaleString();
  return value;
};

const DataExplanation = ({ insight }) => {
  if (!insight) return null;

  const points = insight.dataPoints?.length
    ? insight.dataPoints
    : Object.entries(insight.data || {}).map(([key, value]) => ({
        label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
        value: formatValue(value)
      }));

  return (
    <div data-testid="data-explanation" className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 m-0 mb-1">
          Insight detail
        </p>
        <h3 className="text-base font-semibold text-slate-900 m-0 leading-snug">
          {insight.title}
        </h3>
      </div>

      <div className="px-5 py-5 flex flex-col gap-5">
        <section>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 m-0 mb-2">
            Why it matters
          </h4>
          <p className="text-sm text-slate-700 m-0 leading-relaxed">
            {insight.explanation || insight.summary}
          </p>
        </section>

        {insight.recommendation && (
          <section className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-indigo-600 m-0 mb-1.5">
              Recommended action
            </h4>
            <p className="text-sm text-slate-800 m-0 leading-relaxed">
              {insight.recommendation}
            </p>
          </section>
        )}

        {points.length > 0 && (
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 m-0 mb-2">
              Supporting data
            </h4>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
              {points.slice(0, 6).map((point, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-3 px-3.5 py-2.5 bg-white"
                >
                  <span className="text-sm text-slate-500">{point.label}</span>
                  <span className="text-sm font-semibold text-slate-900 text-right">
                    {formatValue(point.value)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex items-center gap-4 pt-1">
          <div>
            <p className="text-[11px] text-slate-400 m-0 mb-0.5">Confidence</p>
            <p className="text-sm font-semibold text-slate-900 m-0">{insight.confidence}%</p>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div>
            <p className="text-[11px] text-slate-400 m-0 mb-0.5">Impact</p>
            <p className="text-sm font-semibold text-slate-900 m-0 capitalize">
              {insight.impact}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExplanation;
