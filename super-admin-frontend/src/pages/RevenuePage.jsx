import { monthlyRevenue, revenueSummary } from '../data/mockData'

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function RevenuePage() {
  const maxValue = Math.max(...monthlyRevenue.map((m) => m.value), 1)

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Revenue & financial overview
          </h2>
          <p className="text-xs text-slate-500">
            Monitor MRR, growth and subscription activity across tenants.
          </p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="sa-card">
          <div className="sa-card-header">
            <div>
              <p className="sa-card-title">Current month MRR</p>
              <p className="sa-card-subtitle">All tenants</p>
            </div>
          </div>
          <div className="sa-card-body space-y-1.5">
            <p className="text-2xl font-semibold tracking-tight text-slate-900">
              {formatCurrency(revenueSummary.currentMonth)}
            </p>
            <p className="text-xs text-slate-500">
              {revenueSummary.activeSubscriptions} active subscriptions
            </p>
          </div>
        </div>

        <div className="sa-card">
          <div className="sa-card-header">
            <div>
              <p className="sa-card-title">MoM growth</p>
              <p className="sa-card-subtitle">vs last month</p>
            </div>
          </div>
          <div className="sa-card-body space-y-1.5">
            <p className="text-2xl font-semibold tracking-tight text-emerald-600">
              +{revenueSummary.growthPercentage}%
            </p>
            <p className="text-xs text-slate-500">
              Prev: {formatCurrency(revenueSummary.previousMonth)}
            </p>
          </div>
        </div>

        <div className="sa-card">
          <div className="sa-card-header">
            <div>
              <p className="sa-card-title">Churn rate</p>
              <p className="sa-card-subtitle">Rolling 30 days</p>
            </div>
          </div>
          <div className="sa-card-body space-y-1.5">
            <p className="text-2xl font-semibold tracking-tight text-rose-600">
              {revenueSummary.churnRate}%
            </p>
            <p className="text-xs text-slate-500">
              Healthy for current growth profile.
            </p>
          </div>
        </div>

        <div className="sa-card">
          <div className="sa-card-header">
            <div>
              <p className="sa-card-title">ARPU (est.)</p>
              <p className="sa-card-subtitle">Per active tenant</p>
            </div>
          </div>
          <div className="sa-card-body space-y-1.5">
            <p className="text-2xl font-semibold tracking-tight text-slate-900">
              {formatCurrency(
                revenueSummary.currentMonth / Math.max(revenueSummary.activeSubscriptions, 1),
              )}
            </p>
            <p className="text-xs text-slate-500">
              Updated whenever a plan is reassigned.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="sa-card lg:col-span-2">
          <div className="sa-card-header">
            <div>
              <p className="sa-card-title">Monthly recurring revenue</p>
              <p className="sa-card-subtitle">Last 6 months</p>
            </div>
          </div>
          <div className="sa-card-body h-64">
            <div className="flex h-full items-end gap-3">
              {monthlyRevenue.map((entry) => (
                <div
                  key={entry.month}
                  className="flex-1 space-y-2 text-center text-xs text-slate-500"
                >
                  <div className="relative mx-auto flex h-40 w-9 items-end rounded-full bg-slate-100">
                    <div
                      className="mx-auto w-9 rounded-full bg-gradient-to-t from-indigo-600 via-sky-500 to-cyan-400 shadow-sm shadow-indigo-300"
                      style={{
                        height: `${(entry.value / maxValue) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="font-medium text-slate-700">{entry.month}</div>
                  <div className="text-[11px] text-slate-400">
                    {formatCurrency(entry.value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="sa-card">
          <div className="sa-card-header">
            <div>
              <p className="sa-card-title">Billing signals</p>
              <p className="sa-card-subtitle">Subscription health indicators</p>
            </div>
          </div>
          <div className="sa-card-body space-y-3 text-xs text-slate-600">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span>On‑time renewals</span>
                <span className="font-medium text-emerald-600">94%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span>Failed payment retries</span>
                <span className="font-medium text-amber-600">6%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[40%] rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span>Discounted contracts</span>
                <span className="font-medium text-slate-700">18%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[18%] rounded-full bg-gradient-to-r from-slate-400 to-slate-700" />
              </div>
            </div>
            <p className="pt-1 text-[11px] text-slate-500">
              Numbers above are generated from dummy data but illustrate how real‑world KPIs would
              surface in the Super Admin console.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

