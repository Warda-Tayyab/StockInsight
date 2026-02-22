import { DollarSign, CreditCard } from 'lucide-react'
import RevenueTrendChart from '../../components/super-admin/RevenueTrendChart'
import {
  revenueData,
  revenueTrendFull,
  subscriptionsTable,
} from '../../data/dummyData'

function Revenue() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Revenue</h1>
        <p className="mt-1 text-slate-600">Revenue overview and subscription details.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Revenue</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                ${revenueData.totalRevenue.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-400">Last 6 months</p>
            </div>
            <div className="p-2.5 rounded-xl bg-primary-50 text-primary-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Active Subscriptions</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {revenueData.activeSubscriptions}
              </p>
              <p className="mt-1 text-xs text-slate-400">Paying tenants</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <RevenueTrendChart data={revenueTrendFull} />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Subscriptions</h3>
          <p className="text-sm text-slate-500">Recent subscription entries (mock data)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Tenant</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">MRR</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {subscriptionsTable.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{sub.tenant}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{sub.plan}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">${sub.mrr}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        sub.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Revenue
