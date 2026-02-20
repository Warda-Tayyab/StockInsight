import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const navigate = useNavigate()
  const [stats] = useState({
    totalTenants: 1247,
    activeTenants: 1089,
    totalRevenue: 2458000,
    expiredPlans: 158
  })

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const statCards = [
    {
      title: 'Total Tenants',
      value: stats.totalTenants.toLocaleString(),
      icon: '👥',
      textColor: 'text-blue-600',
      bgLight: 'bg-blue-50'
    },
    {
      title: 'Active Tenants',
      value: stats.activeTenants.toLocaleString(),
      icon: '✅',
      textColor: 'text-green-600',
      bgLight: 'bg-green-50'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: '💰',
      textColor: 'text-purple-600',
      bgLight: 'bg-purple-50'
    },
    {
      title: 'Expired Plans',
      value: stats.expiredPlans.toLocaleString(),
      icon: '⚠️',
      textColor: 'text-rose-600',
      bgLight: 'bg-rose-50'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Overview of your inventory management system
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="sa-card flex items-start justify-between gap-4 hover:shadow-lg transition-shadow"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-500 mb-2">
                {card.title}
              </p>
              <p className={`text-2xl sm:text-3xl font-bold truncate ${card.textColor}`}>
                {card.value}
              </p>
            </div>
            <div className={`${card.bgLight} p-3 rounded-xl shrink-0`}>
              <span className="text-2xl" aria-hidden>{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="sa-card">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {[
              { action: 'New tenant registered', time: '2 hours ago', type: 'success' },
              { action: 'Plan upgraded', time: '5 hours ago', type: 'info' },
              { action: 'Payment received', time: '1 day ago', type: 'success' },
              { action: 'Tenant suspended', time: '2 days ago', type: 'warning' }
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0"
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    activity.type === 'success'
                      ? 'bg-green-500'
                      : activity.type === 'info'
                        ? 'bg-blue-500'
                        : 'bg-rose-500'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    {activity.action}
                  </p>
                  <p className="text-xs text-slate-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sa-card">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => navigate('/superadmin/tenants')}
              className="sa-btn-primary py-3"
            >
              Add Tenant
            </button>
            <button type="button" className="sa-btn-secondary py-3">
              View Reports
            </button>
            <button
              type="button"
              onClick={() => navigate('/superadmin/pricing')}
              className="sa-btn-secondary py-3"
            >
              Manage Plans
            </button>
            <button type="button" className="sa-btn-secondary py-3">
              Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
