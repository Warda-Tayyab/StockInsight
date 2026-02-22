import { Users, Building2, DollarSign } from 'lucide-react'
import SummaryCard from '../../components/super-admin/SummaryCard'
import GrowthChart from '../../components/super-admin/GrowthChart'
import PlanDistributionChart from '../../components/super-admin/PlanDistributionChart'
import RevenueTrendChart from '../../components/super-admin/RevenueTrendChart'
import {
  dashboardSummary,
  growthTrends,
  planDistribution,
  revenueTrend,
} from '../../data/dummyData'

function Dashboard() {
  const { totalTenants, totalUsers, totalRevenue } = dashboardSummary

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-600">Overview of your multi-tenant inventory platform.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <SummaryCard
          title="Total Tenants"
          value={totalTenants}
          icon={Building2}
        />
        <SummaryCard
          title="Total Users"
          value={totalUsers.toLocaleString()}
          icon={Users}
        />
        <SummaryCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          subtitle="Last 6 months"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GrowthChart data={growthTrends} />
        <PlanDistributionChart data={planDistribution} />
      </div>

      <div>
        <RevenueTrendChart data={revenueTrend} />
      </div>
    </div>
  )
}

export default Dashboard
