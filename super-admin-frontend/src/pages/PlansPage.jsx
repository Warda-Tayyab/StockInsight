import { useState } from 'react'
import { plans as seedPlans, tenants } from '../data/mockData'

export default function PlansPage() {
  const [plans, setPlans] = useState(seedPlans)

  const handlePriceChange = (id, value) => {
    const num = Number(value) || 0
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, price: num } : p)))
  }

  const tenantsPerPlan = plans.map((plan) => ({
    plan: plan.name,
    count: tenants.filter((t) => t.plan === plan.name).length,
  }))

  const maxCount = Math.max(...tenantsPerPlan.map((p) => p.count), 1)

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Subscription plans</h2>
          <p className="text-xs text-slate-500">
            Curate pricing for Basic, Pro and Enterprise tenants.
          </p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`sa-card flex flex-col border-2 ${
              plan.recommended ? 'border-indigo-500/60 shadow-md shadow-indigo-200/80' : ''
            }`}
          >
            <div className="sa-card-header">
              <div>
                <p className="sa-card-title">{plan.name}</p>
                <p className="sa-card-subtitle">{plan.description}</p>
              </div>
              {plan.recommended && (
                <span className="sa-badge bg-indigo-600 text-[11px] text-white">
                  Recommended
                </span>
              )}
            </div>
            <div className="sa-card-body flex flex-1 flex-col gap-4">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-semibold tracking-tight text-slate-900">
                  ${plan.price}
                </span>
                <span className="text-xs text-slate-500">/ {plan.billing}</span>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto space-y-2 pt-2 text-xs">
                <label className="sa-label">Adjust price (demo only)</label>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                    USD
                  </span>
                  <input
                    type="number"
                    min={0}
                    className="sa-input"
                    value={plan.price}
                    onChange={(e) => handlePriceChange(plan.id, e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="sa-card">
        <div className="sa-card-header">
          <div>
            <p className="sa-card-title">Plan adoption by tenants</p>
            <p className="sa-card-subtitle">
              Quickly see which plans are most popular.
            </p>
          </div>
        </div>
        <div className="sa-card-body space-y-3 text-xs">
          {tenantsPerPlan.map((row) => (
            <div key={row.plan} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-800">{row.plan}</span>
                <span className="text-slate-500">
                  {row.count} tenant{row.count === 1 ? '' : 's'}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${
                    row.plan === 'Enterprise'
                      ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                      : row.plan === 'Pro'
                        ? 'bg-gradient-to-r from-indigo-500 to-sky-500'
                        : 'bg-gradient-to-r from-slate-400 to-slate-600'
                  }`}
                  style={{ width: `${(row.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

