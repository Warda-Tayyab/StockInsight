import {
  Building2,
  LogIn,
  Shield,
  RefreshCw,
  UserPlus,
  Trash2,
  CreditCard,
  Activity
} from 'lucide-react'

const iconByType = {
  super_admin_login: Shield,
  tenant_user_login: LogIn,
  tenant_created: Building2,
  tenant_status: RefreshCw,
  tenant_deleted: Trash2,
  user_invited: UserPlus,
  plan_created: CreditCard,
  plan_updated: CreditCard,
  plan_deleted: Trash2
}

const colorByType = {
  super_admin_login: 'bg-indigo-100 text-indigo-700',
  tenant_user_login: 'bg-emerald-100 text-emerald-700',
  tenant_created: 'bg-blue-100 text-blue-700',
  tenant_status: 'bg-amber-100 text-amber-700',
  tenant_deleted: 'bg-red-100 text-red-700',
  user_invited: 'bg-violet-100 text-violet-700',
  plan_created: 'bg-teal-100 text-teal-700',
  plan_updated: 'bg-cyan-100 text-cyan-700',
  plan_deleted: 'bg-red-100 text-red-700'
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return ''

  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: diffDays >= 365 ? 'numeric' : undefined
  })
}

function RecentActivityCard({ activities = [], loading = false }) {
  return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-[420px] flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-primary-50 text-primary-600">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Recent Activity</h3>
          <p className="text-xs text-slate-500">Logins, tenants, plans & access</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 py-8 text-center">Loading activity...</p>
      ) : activities.length === 0 ? (
        <p className="text-sm text-slate-500 py-8 text-center">No recent activity yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 flex-1 overflow-y-auto pr-2">
          {activities.map((activity) => {
            const Icon = iconByType[activity.type] || Activity
            const colorClass = colorByType[activity.type] || 'bg-slate-100 text-slate-700'

            return (
              <li key={activity.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <div className={`p-2 rounded-lg shrink-0 ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                  {activity.description && (
                    <p className="text-sm text-slate-500 mt-0.5 truncate">{activity.description}</p>
                  )}
                  {/* {activity.type === 'super_admin_login' && activity.metadata?.userAgent && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {activity.metadata.userAgent}
                    </p>
                  )} */}
                </div>
                <span className="text-xs text-slate-400 shrink-0 pt-0.5">
                  {formatRelativeTime(activity.timestamp)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default RecentActivityCard
