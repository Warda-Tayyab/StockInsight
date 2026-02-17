/** @module inventory/dashboard/pages/Dashboard */

import StatsCard from '../components/StatsCard';
import AlertsPanel from '../components/AlertsPanel';
import RecentQueries from '../components/RecentQueries';
import AnalyticsChart from '../components/AnalyticsChart';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div data-testid="dashboard-page" className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back! Here's what's happening with your inventory.</p>
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-secondary">Export Report</button>
          <button className="btn btn-primary">New Query</button>
        </div>
      </div>

      <div className="dashboard-stats">
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

      <div className="dashboard-content">
        <div className="dashboard-main">
          <AnalyticsChart />
        </div>
        
        <div className="dashboard-sidebar">
          <RecentQueries />
          <AlertsPanel />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
