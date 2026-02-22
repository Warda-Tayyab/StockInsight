import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Play, Pause, Trash2 } from 'lucide-react'
import { tenantsList } from '../../data/dummyData'

function StatusBadge({ status }) {
  const styles = {
    Active: 'bg-emerald-100 text-emerald-700',
    Trial: 'bg-amber-100 text-amber-700',
    Suspended: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  )
}

function TenantDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state } = useLocation()
  const tenant = state?.tenant || tenantsList.find((t) => t.id === id)

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Tenant not found.</p>
        <button
          type="button"
          onClick={() => navigate('/super-admin/tenants')}
          className="mt-4 text-primary-600 hover:underline"
        >
          Back to Tenants
        </button>
      </div>
    )
  }

  const handleActivate = () => {}
  const handleSuspend = () => {}
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this tenant?')) {
      navigate('/super-admin/tenants')
    }
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate('/super-admin/tenants')}
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Tenants
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-900">{tenant.companyName}</h1>
            <StatusBadge status={tenant.status} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleActivate}
              className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
            >
              <Play className="w-4 h-4" />
              Activate
            </button>
            <button
              type="button"
              onClick={handleSuspend}
              className="inline-flex items-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700"
            >
              <Pause className="w-4 h-4" />
              Suspend
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Contact & Account</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-slate-500">Owner Email</dt>
                <dd className="text-slate-900 font-medium">{tenant.ownerEmail}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Slug</dt>
                <dd className="text-slate-900 font-mono text-sm">{tenant.slug}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Created Date</dt>
                <dd className="text-slate-900">{tenant.createdAt}</dd>
              </div>
            </dl>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Business Info</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-slate-500">Region</dt>
                <dd className="text-slate-900">{tenant.region}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Plan</dt>
                <dd className="text-slate-900">{tenant.plan}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Business Vertical</dt>
                <dd className="text-slate-900">{tenant.businessVertical}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Use Case</dt>
                <dd className="text-slate-900">{tenant.useCase}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TenantDetails
