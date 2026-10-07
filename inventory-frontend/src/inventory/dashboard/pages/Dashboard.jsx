/** @module inventory/dashboard/pages/Dashboard */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineSparkles, HiOutlineLightBulb } from 'react-icons/hi';
import StatsCard from '../components/StatsCard';
import AlertsPanel from '../components/AlertsPanel';
import RecentQueries from '../components/RecentQueries';
import AnalyticsChart from '../components/AnalyticsChart';
import SalesTrend90Chart from '../components/SalesTrend90Chart';
import StockHealthMixChart from '../components/StockHealthMixChart';
import TopProducts from '../components/TopProducts';
import api from '../../../shared/utils/api';
import { useAuthContext } from '../../../shared/context/AuthContext';
import { canAccessSettings } from '../../../shared/utils/roles';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const showSettings = canAccessSettings(user?.role);

  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    totalSales: 0,
    activeAlerts: 0,
    analyticsData: [],
    salesTrend90: [],
    stockHealth: {}
  });

  const [range, setRange] = useState('6months');

  useEffect(() => {
    fetchStats(range);
  }, [range]);

  const fetchStats = async (selectedRange = range) => {
    try {
      const res = await api.get(`/api/dashboard?range=${selectedRange}`);
      setStats(res.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    }
  };

  return (
    <div data-testid="dashboard-page" className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back! Here&apos;s what&apos;s happening with your inventory.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate('/ai-query')} 
            className="btn-primary"
          >
            <HiOutlineSparkles className="w-4 h-4" />
            AI Query
          </button>

          <button
            type="button"
            onClick={() => navigate('/insights')}
            className="btn-secondary"
          >
            <HiOutlineLightBulb className="w-4 h-4" />
            Quick Insights
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="Total Products"
          value={stats.totalProducts}
          subtitle="Across all categories"
          iconType="products"
          trend={
            stats.productTrend > 0
              ? 'up'
              : stats.productTrend < 0
              ? 'down'
              : 'neutral'
          }
          trendValue={`${Math.abs(stats.productTrend || 0)}%`}
          color="var(--primary)"
          onClick={() => navigate('/products')}
          className="cursor-pointer"
        />

        <StatsCard
          title="Low Stock Items"
          value={stats.lowStockCount}
          subtitle="Need immediate attention"
          iconType="warning"
          trend={
            stats.lowStockTrend > 0
              ? 'up'
              : stats.lowStockTrend < 0
              ? 'down'
              : 'neutral'
          }
          trendValue={`${Math.abs(stats.lowStockTrend || 0)}%`}
          color="var(--warning)"
          onClick={() => navigate('/low-stock')}
          className="cursor-pointer"
        />

        <StatsCard
          title="Total Sales"
          value={`Rs.${(stats.totalSales || 0).toLocaleString()}`}
          subtitle={`Net Sales (Rs.${(stats.netSales || 0).toLocaleString()}) + Tax (Rs.${(stats.totalTax || 0).toLocaleString()})`}
          iconType="sales"
          trend="up"
          trendValue=""
          color="var(--success)"
          onClick={() => navigate('/reports/sales')}
          className="cursor-pointer"
        />

        <StatsCard
          title="Active Alerts"
          value={stats.activeAlerts}
          subtitle="Requiring action"
          iconType="alerts"
          trend="neutral"
          trendValue="0%"
          color="var(--error)"
          onClick={() => navigate('/stock-alerts')}
          className="cursor-pointer"
        />
      </div>

      {/* Sales Trend + Stock Health Mix — same row as design */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <SalesTrend90Chart data={stats.salesTrend90 || []} />
        <StockHealthMixChart stockHealth={stats.stockHealth || {}} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <AnalyticsChart
            chartData={stats.analyticsData || []}
            range={range}
            setRange={setRange}
          />
        </div>
        <div className="flex flex-col gap-4 sm:gap-6">
          <AlertsPanel />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="xl:col-span-2">
          <TopProducts />
        </div>
        <div>
          <RecentQueries />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
