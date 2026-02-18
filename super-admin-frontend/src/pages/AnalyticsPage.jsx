import { tenants, plans } from '../data/mockData'

const totalTenants = tenants.length
const active = tenants.filter((t) => t.status === 'Active').length
const inactive = tenants.filter((t) => t.status !== 'Active').length

const planCounts = plans.map((plan) => ({
  name: plan.name,
  count: tenants.filter((t) => t.plan === plan.name).length,
}))

const maxPlanCount = Math.max(...planCounts.map((p) => p.count), 1)

export default function AnalyticsPage() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">System analytics</h2>
          <p className="text-xs text-slate-500">
            High‑level tenant, plan and growth metrics from the control plane.
          </p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="sa-card">
          <div className="sa-card-header">
            <p className="sa-card-title">Total tenants</p>
          </div>
          <div className="sa-card-body">
            <p className="text-2xl font-semibold tracking-tight text-slate-900">
              {totalTenants}
            </p>
            <p className="text-xs text-slate-500">
              {active} active · {inactive} inactive
            </p>
          </div>
        </div>

        <div className="sa-card">
          <div className="sa-card-header">
            <p className="sa-card-title">Active ratio</p>
          </div>
          <div className="sa-card-body space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Active</span>
              <span className="font-semibold text-emerald-600">
                {Math.round((active / Math.max(totalTenants, 1)) * 100)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                style={{
                  width: `${(active / Math.max(totalTenants, 1)) * 100}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              High active ratio indicates healthy tenant engagement.
            </p>
          </div>
        </div>

        <div className="sa-card">
          <div className="sa-card-header">
            <p className="sa-card-title">Average AI utilisation</p>
          </div>
          <div className="sa-card-body space-y-2">
            <p className="text-2xl font-semibold tracking-tight text-slate-900">78%</p>
            <p className="text-xs text-slate-500">
              Based on tenants enabling anomaly detection and demand sensing.
            </p>
          </div>
        </div>

        <div className="sa-card">
          <div className="sa-card-header">
            <p className="sa-card-title">Projected tenant growth</p>
          </div>
          <div className="sa-card-body space-y-2">
            <p className="text-2xl font-semibold tracking-tight text-slate-900">
              +23%
            </p>
            <p className="text-xs text-slate-500">
              Next 90 days, modelled from current pipeline (dummy data).
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="sa-card">
          <div className="sa-card-header">
            <div>
              <p className="sa-card-title">Plan distribution</p>
              <p className="sa-card-subtitle">
                Shows which subscription tiers are most popular.
              </p>
            </div>
          </div>
          <div className="sa-card-body space-y-4 text-xs">
            {planCounts.map((row) => (
              <div key={row.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        row.name === 'Enterprise'
                          ? 'bg-violet-500'
                          : row.name === 'Pro'
                            ? 'bg-indigo-500'
                            : 'bg-slate-500'
                      }`}
                    />
                    <span className="font-medium text-slate-800">
                      {row.name}
                    </span>
                  </div>
                  <span className="text-slate-500">
                    {row.count} tenant{row.count === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${
                      row.name === 'Enterprise'
                        ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                        : row.name === 'Pro'
                          ? 'bg-gradient-to-r from-indigo-500 to-sky-500'
                          : 'bg-gradient-to-r from-slate-400 to-slate-700'
                    }`}
                    style={{
                      width: `${(row.count / maxPlanCount) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sa-card">
          <div className="sa-card-header">
            <div>
              <p className="sa-card-title">Growth funnel (dummy)</p>
              <p className="sa-card-subtitle">
                Illustrative conversion funnel for your FYP presentation.
              </p>
            </div>
          </div>
          <div className="sa-card-body space-y-4 text-xs text-slate-600">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span>Trial sign‑ups</span>
                <span className="font-medium text-slate-800">100%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span>Converted to paid</span>
                <span className="font-medium text-emerald-700">62%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span>Upgraded to Pro / Ent</span>
                <span className="font-medium text-indigo-700">31%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[31%] rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
              </div>
            </div>
            <p className="pt-1 text-[11px] text-slate-500">
              Values above are static dummy numbers but demonstrate how analytics can be surfaced in
              a SaaS admin panel without requiring a backend for this project.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

