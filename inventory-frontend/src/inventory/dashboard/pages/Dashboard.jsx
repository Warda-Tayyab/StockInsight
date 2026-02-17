/** @module inventory/dashboard/pages/Dashboard */

import StatsCard from '../components/StatsCard';
import AlertsPanel from '../components/AlertsPanel';
import RecentQueries from '../components/RecentQueries';
import AnalyticsChart from '../components/AnalyticsChart';

const Dashboard = () => {
  return (
    <div data-testid="dashboard-page" className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600 text-sm m-0">Welcome back! Here's what's happening with your inventory.</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Export Report</button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">New Query</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Products"
          value="1,234"
          subtitle="Across 12 categories"
          icon="📦"
          trend="up"
          trendValue="+12%"
          color="var(--primary)"
        />
        <StatsCard
          title="Low Stock Items"
          value="23"
          subtitle="Need immediate attention"
          icon="⚠️"
          trend="down"
          trendValue="-5%"
          color="var(--warning)"
        />
        <StatsCard
          title="Total Sales"
          value="$45.2K"
          subtitle="This month"
          icon="💰"
          trend="up"
          trendValue="+18%"
          color="var(--success)"
        />
        <StatsCard
          title="Active Alerts"
          value="7"
          subtitle="Requiring action"
          icon="🔔"
          trend="neutral"
          trendValue="0%"
          color="var(--error)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AnalyticsChart />
        </div>
        
        <div className="flex flex-col gap-6">
          <RecentQueries />
          <AlertsPanel />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
