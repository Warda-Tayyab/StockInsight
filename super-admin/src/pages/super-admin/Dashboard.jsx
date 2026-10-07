import { Users, Building2, DollarSign } from 'lucide-react'
import SummaryCard from '../../components/super-admin/SummaryCard'
import GrowthChart from '../../components/super-admin/GrowthChart'
import PlanDistributionChart from '../../components/super-admin/PlanDistributionChart'
import RevenueTrendChart from '../../components/super-admin/RevenueTrendChart'
import RecentActivityCard from '../../components/super-admin/RecentActivityCard'
import { useEffect, useState } from 'react'
import api from '../../utils/api'

function Dashboard() {
  const [dashboardSummary, setDashboardSummary] = useState({
    totalTenants: 0,
    totalUsers: 0,
    totalRevenue: 0
  })
  const [growthTrends, setGrowthTrends] = useState([])
  const [planDistribution, setPlanDistribution] = useState([])
  const [revenueTrend, setRevenueTrend] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/api/admin/dashboard')
        const data = res.data

        setDashboardSummary(data.dashboardSummary || {
          totalTenants: 0,
          totalUsers: 0,
          totalRevenue: 0
        })
        setGrowthTrends(data.growthTrends || [])
        setPlanDistribution(data.planDistribution || [])
        setRevenueTrend(data.revenueTrend || [])
        setRecentActivities(data.recentActivities || [])
      } catch (error) {
        console.error('Failed to fetch admin dashboard', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-600">Overview of your multi-tenant inventory platform.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <SummaryCard
          title="Total Tenants"
          value={dashboardSummary.totalTenants}
          icon={Building2}
        />
        <SummaryCard
          title="Total Users"
          value={dashboardSummary.totalUsers.toLocaleString()}
          icon={Users}
        />
        <SummaryCard
          title="Total Revenue"
          value={`$${dashboardSummary.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          subtitle="Last 6 months"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GrowthChart data={growthTrends} />
        <PlanDistributionChart data={planDistribution} />
      </div>

     
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <RevenueTrendChart data={revenueTrend} />

  <RecentActivityCard
    activities={recentActivities}
    loading={loading}
  />
</div>
    </div>
  )
}

export default Dashboard
