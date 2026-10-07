import { useNavigate } from 'react-router-dom'
import { Eye } from 'lucide-react'

function StatusBadge({ status }) {
  const styles = {
    active: 'bg-emerald-100 text-emerald-700',
    trial: 'bg-amber-100 text-amber-700',
    suspended: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  )
}

function TenantTable({ tenants, plans = [], onView }) {
  const navigate = useNavigate()

  const getPlanLabel = (planSlug) => {
    if (!planSlug) return '-'
    const plan = plans.find((p) => p.name === planSlug)
    return plan ? plan.displayName : planSlug
  }

  const handleView = (tenant) => {
    if (onView) onView(tenant)
    else navigate(`/super-admin/tenants/${tenant._id}`, { state: { tenant } })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Company</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Timezone</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Plan</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Created Date</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {tenants.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-sm">
                  No tenants match your filters.
                </td>
              </tr>
            ) : (
              tenants.map((tenant) => (
                <tr key={tenant._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                     <span className="text-sm font-medium text-slate-900">{tenant.name}</span>
                     <span className="text-xs text-slate-400">{tenant.ownerEmail}</span>
                    </div>
                 </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={tenant.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{tenant.primaryContact?.timezone || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{getPlanLabel(tenant.plan)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{new Date(tenant.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleView(tenant)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TenantTable
