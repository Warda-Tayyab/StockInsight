import { Pencil, Trash2, Check } from 'lucide-react'

function PlanCard({ plan, onEdit, onDelete }) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden flex flex-col ${
        plan.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60'
      }`}
      style={{ borderTopColor: plan.color, borderTopWidth: '4px' }}
    >
      <div className="p-6 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{plan.displayName}</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{plan.name}</p>
          </div>
          {!plan.isActive && (
            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
              Inactive
            </span>
          )}
        </div>

        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-3xl font-bold text-slate-900">
            ${plan.price}
          </span>
          <span className="text-slate-500 text-sm">/month</span>
        </div>

        {plan.description && (
          <p className="mt-3 text-sm text-slate-600">{plan.description}</p>
        )}

        {plan.features?.length > 0 && (
          <ul className="mt-4 space-y-2">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                {feature}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="px-6 py-4 border-t border-slate-100 flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(plan)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        >
          <Pencil className="w-4 h-4" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(plan)}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function PlanGrid({ plans, onEdit, onDelete }) {
  if (plans.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <p className="text-slate-500">No pricing plans yet. Create your first plan to get started.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <PlanCard
          key={plan._id}
          plan={plan}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

export default PlanGrid
