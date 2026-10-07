import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiBarChart2,
  FiPackage,
  //FiAlertTriangle,
  FiDollarSign,
  FiHome,
  FiStar,
  FiClock,
  FiUsers,
  FiAlertOctagon,
  FiShoppingCart,
  FiTrendingUp,
  FiTrendingDown,
} from 'react-icons/fi';
import ReportPageLayout from '../components/common/ReportPageLayout';
import ReportCard, { ReportCardsGrid } from '../components/common/ReportCard';
import FilterBar, { FilterDateRange } from '../components/common/FilterBar';
import { reportService } from '../../../shared/services/reportService';
import { formatMoney } from '../utils/formatMoney';

const tiles = [
  { title: 'Sales Report', desc: 'Net sales after returns, trends & top products', path: '/reports/sales', icon: FiBarChart2, tone: 'green' },
  { title: 'Purchasing Report', desc: 'GRN spend, supplier returns & net purchases', path: '/reports/purchasing', icon: FiShoppingCart, tone: 'green' },
  { title: 'Inventory Report', desc: 'Purchased stock & batch-based inventory value', path: '/reports/inventory', icon: FiPackage, tone: 'blue' },
 // { title: 'Low Stock', desc: 'Per-location reorder & out-of-stock alerts', path: '/reports/low-stock', icon: FiAlertTriangle, tone: 'amber' },
  { title: 'Profit & Loss', desc: 'Net sales, COGS, losses, net purchases & profit', path: '/reports/profit-loss', icon: FiDollarSign, tone: 'rose' },
  { title: 'Locations', desc: 'Store / warehouse stock & transfers', path: '/reports/warehouse', icon: FiHome, tone: 'indigo' },
  { title: 'Product Performance', desc: 'Best, slow & dead purchased products', path: '/reports/product-performance', icon: FiStar, tone: 'purple' },
  { title: 'Expiry Report', desc: 'Batch expiry by location', path: '/reports/expiry', icon: FiClock, tone: 'amber' },
  { title: 'Activity', desc: 'Sales, purchases, transfers, write-offs & logins', path: '/reports/user-activity', icon: FiUsers, tone: 'blue' },
];

const ReportsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [range, setRange] = useState('month');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await reportService.getOverview({ range });
        setData(res.data);
      } catch (err) {
        console.error('Reports overview error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [range]);

  const sales = data?.salesSummary;
  const inventory = data?.inventorySummary;
  const profit = data?.profitLoss;
  const purchasing = data?.purchasingSummary;
  const kpis = data?.kpis;

  return (
    <ReportPageLayout
      title="Reports Dashboard"
      description="Net sales, net purchases, inventory value & profit — one period for all KPIs"
    >
      <FilterBar>
        <FilterDateRange value={range} onChange={setRange} />
      </FilterBar>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading report summary...</p>
      ) : (
        <>
          <ReportCardsGrid className="grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <ReportCard
              label="Net Sales"
              value={formatMoney(kpis?.netSales ?? sales?.totalSales)}
              icon={FiTrendingUp}
              tone="green"
              trend={sales?.growth}
              hint={`${sales?.orderCount ?? 0} orders · after customer returns`}
            />
            <ReportCard
              label="Net Purchases"
              value={formatMoney(kpis?.netPurchases ?? purchasing?.netPurchaseSpend)}
              icon={FiShoppingCart}
              tone="blue"
              trend={purchasing?.growth}
              hint={`Spend ${formatMoney(purchasing?.purchaseSpend ?? purchasing?.purchasesThisMonth)} − Returns ${formatMoney(purchasing?.purchaseReturns ?? purchasing?.returnsThisMonth)}`}
            />
            <ReportCard
              label="Inventory Value"
              value={formatMoney(kpis?.inventoryValue ?? inventory?.totalValue)}
              icon={FiPackage}
              tone="indigo"
              hint="Purchased batches · remaining × receive cost"
            />
            <ReportCard
              label="Gross Profit"
              value={formatMoney(kpis?.grossProfit ?? profit?.grossProfit)}
              icon={FiDollarSign}
              tone="green"
              hint="Net Sales − COGS"
            />
            <ReportCard
              label="Operating Loss"
              value={formatMoney(kpis?.totalLoss ?? profit?.totalLoss)}
              icon={FiAlertOctagon}
              tone="rose"
              hint={`Write-offs ${formatMoney(profit?.writeOffLoss || 0)} · Expired ${formatMoney(profit?.expiredLoss || 0)}`}
            />
            <ReportCard
              label="Net Profit"
              value={formatMoney(kpis?.netProfit ?? profit?.netProfit)}
              icon={FiTrendingDown}
              tone={ (kpis?.netProfit ?? profit?.netProfit) >= 0 ? 'purple' : 'rose' }
              hint={profit ? `${profit.margin}% margin · GP − Loss` : undefined}
            />
          </ReportCardsGrid>

          <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100">
              Low stock alerts: <strong>{data?.lowStockCount ?? 0}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100">
              Products in stock / low / out: {inventory?.inStock ?? 0} / {inventory?.lowStock ?? 0} / {inventory?.outOfStock ?? 0}
            </span>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
        {tiles.map((t) => (
          <Link
            key={t.path}
            to={t.path}
            className="group card-padded no-underline text-inherit hover:shadow-card-hover hover:border-indigo-100 transition-all duration-300"
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                t.tone === 'green'
                  ? 'bg-emerald-50 text-emerald-600'
                  : t.tone === 'blue'
                  ? 'bg-indigo-50 text-indigo-600'
                  : t.tone === 'amber'
                  ? 'bg-amber-50 text-amber-600'
                  : t.tone === 'purple'
                  ? 'bg-purple-50 text-purple-600'
                  : t.tone === 'rose'
                  ? 'bg-rose-50 text-rose-600'
                  : t.tone === 'indigo'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <t.icon className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-900 m-0 group-hover:text-indigo-600 transition-colors">
              {t.title}
            </h3>
            <p className="text-sm text-slate-500 mt-2 m-0">{t.desc}</p>
            <span className="text-sm text-indigo-600 font-medium mt-3 inline-block">
              Open report →
            </span>
          </Link>
        ))}
      </div>
    </ReportPageLayout>
  );
};

export default ReportsDashboard;
