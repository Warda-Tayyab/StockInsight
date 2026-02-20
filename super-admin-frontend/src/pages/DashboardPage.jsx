import { tenants, revenueSummary, systemAlerts } from '../data/mockData'

const totalTenants = tenants.length
const activeTenants = tenants.filter((t) => t.status === 'Active').length
const suspendedTenants = tenants.filter((t) => t.status === 'Suspended').length
const expiringSoon = tenants.filter((t) => t.expiringInDays <= 14).length

const recentTenants = [...tenants]
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  .slice(0, 4)

const recentAlerts = systemAlerts.slice(0, 3)

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function DashboardPage() {
  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="sa-card">
          <div className="sa-card-header">
            <div>
              <p className="sa-card-title">Total tenants</p>
              <p className="sa-card-subtitle">Across all regions</p>
            </div>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-100">
              {totalTenants}
            </span>
          </div>
          <div className="sa-card-body space-y-2">
            <p className="text-2xl font-semibold tracking-tight text-slate-900">
              {totalTenants}
            </p>
            <p className="text-xs text-slate-500">
              {activeTenants} active · {suspendedTenants} suspended
            </p>
          </div>
        </div>

        <div className="sa-card">
          <div className="sa-card-header">
            <div>
              <p className="sa-card-title">Active tenants</p>
              <p className="sa-card-subtitle">Using AI recommendations</p>
            </div>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
              {activeTenants}
            </span>
          </div>
          <div className="sa-card-body space-y-2">
            <p className="text-2xl font-semibold tracking-tight text-slate-900">
              {activeTenants}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              87% of active tenants have automated restocking enabled.
            </div>
          </div>
        </div>

        <div className="sa-card">
          <div className="sa-card-header">
            <div>
              <p className="sa-card-title">MRR (current month)</p>
              <p className="sa-card-subtitle">Subscription revenue</p>
            </div>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-semibold text-slate-50 ring-1 ring-slate-900/60">
              USD
            </span>
          </div>
          <div className="sa-card-body space-y-2">
            <p className="text-2xl font-semibold tracking-tight text-slate-900">
              {formatCurrency(revenueSummary.currentMonth)}
            </p>
            <p className="text-xs text-slate-500">
              {revenueSummary.activeSubscriptions} active subscriptions ·{' '}
              <span className="font-semibold text-emerald-600">
                +{revenueSummary.growthPercentage}% MoM
              </span>
            </p>
          </div>
        </div>

        <div className="sa-card">
          <div className="sa-card-header">
            <div>
              <p className="sa-card-title">Expiring subscriptions</p>
              <p className="sa-card-subtitle">Next 14 days</p>
            </div>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-100">
              {expiringSoon}
            </span>
          </div>
          <div className="sa-card-body space-y-3">
            <p className="text-2xl font-semibold tracking-tight text-slate-900">
              {expiringSoon}
            </p>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500"
                style={{
                  width: `${Math.min((expiringSoon / Math.max(totalTenants, 1)) * 100, 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-500">
              Prioritise outreach for high‑value Enterprise tenants to prevent churn.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="sa-card lg:col-span-2">
          <div className="sa-card-header">
            <div>
              <p className="sa-card-title">Recent tenant registrations</p>
              <p className="sa-card-subtitle">Last onboarded companies</p>
            </div>
            <span className="sa-badge bg-slate-100 text-[11px] text-slate-700">
              {recentTenants.length} tenants
            </span>
          </div>
          <div className="sa-card-body overflow-x-auto">
            <table className="sa-table min-w-full">
              <thead>
                <tr>
                  <th>Company</th>
                  <th className="hidden sm:table-cell">Owner</th>
                  <th className="hidden lg:table-cell">Region</th>
                  <th>Plan</th>
                  <th className="hidden md:table-cell">Status</th>
                  <th className="hidden sm:table-cell">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-50/60">
                    <td className="whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">
                          {tenant.companyName}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {tenant.email}
                        </span>
                      </div>
                    </td>
                    <td className="hidden whitespace-nowrap text-sm text-slate-700 sm:table-cell">
                      {tenant.ownerName}
                    </td>
                    <td className="hidden whitespace-nowrap text-xs text-slate-500 lg:table-cell">
                      {tenant.region}
                    </td>
                    <td className="whitespace-nowrap">
                      <span
                        className={`sa-badge ${
                          tenant.plan === 'Enterprise'
                            ? 'bg-violet-50 text-violet-700'
                            : tenant.plan === 'Pro'
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {tenant.plan}
                      </span>
                    </td>
                    <td className="hidden whitespace-nowrap md:table-cell">
                      <span
                        className={`sa-badge ${
                          tenant.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {tenant.status}
                      </span>
                    </td>
                    <td className="hidden whitespace-nowrap text-xs text-slate-500 sm:table-cell">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="sa-card">
            <div className="sa-card-header">
              <div>
                <p className="sa-card-title">System alerts</p>
                <p className="sa-card-subtitle">Across all tenants</p>
              </div>
              <span className="sa-badge bg-rose-50 text-[11px] text-rose-700">
                {recentAlerts.length} open
              </span>
            </div>
            <div className="sa-card-body space-y-3">
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5 text-xs"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={`sa-badge ${
                        alert.level === 'critical'
                          ? 'bg-rose-100 text-rose-700'
                          : alert.level === 'warning'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {alert.level.charAt(0).toUpperCase() + alert.level.slice(1)}
                    </span>
                    <span className="text-[11px] uppercase tracking-wide text-slate-500">
                      {alert.type}
                    </span>
                    <span className="ml-auto text-[10px] text-slate-400">
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="truncate-2 text-slate-700">{alert.message}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="sa-card">
            <div className="sa-card-header">
              <div>
                <p className="sa-card-title">AI pipeline health</p>
                <p className="sa-card-subtitle">Event ingestion & inference</p>
              </div>
              <span className="sa-badge bg-emerald-50 text-[11px] text-emerald-700">
                Healthy
              </span>
            </div>
            <div className="sa-card-body space-y-3 text-xs text-slate-600">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span>Event ingestion</span>
                  <span className="font-medium text-slate-800">98.4k / min</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span>Inference latency (p95)</span>
                  <span className="font-medium text-slate-800">142 ms</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500" />
                </div>
              </div>
              <p className="pt-1 text-[11px] text-slate-500">
                No abnormal spikes detected in the last 24 hours across tenant workloads.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

