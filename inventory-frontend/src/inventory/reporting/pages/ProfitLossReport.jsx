import { useEffect, useState, useMemo } from 'react';
import {
  FiDollarSign,
  FiTrendingDown,
  FiPercent,
  FiPieChart,
  FiAlertOctagon,
  FiShoppingBag,
  FiSearch
} from 'react-icons/fi';
import ReportPageLayout from '../components/common/ReportPageLayout';
import ReportCard, { ReportCardsGrid } from '../components/common/ReportCard';
import FilterBar, { FilterDateRange } from '../components/common/FilterBar';
import ExportButtons from '../components/common/ExportButtons';
import DataTable from '../components/common/DataTable';
import RevenueCostChart from '../components/charts/RevenueCostChart';
import MonthlyProfitChart from '../components/charts/MonthlyProfitChart';
import LossBreakdownChart from '../components/charts/LossBreakdownChart';
import { reportService } from '../../../shared/services/reportService';
import { formatMoney } from '../utils/formatMoney';

const ProfitLossReport = () => {
  const [range, setRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await reportService.getProfitLossReport({ range });
        setReport(res.data);
        setTenant(res.data.tenant);
      } catch (err) {
        console.error('Profit loss report error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [range]);

  const profitLoss = report?.profitLoss;
  const rawLossProducts = report?.lossProducts || [];

  const filteredLossProducts = useMemo(() => {
    return rawLossProducts.filter((item) => {
      const matchCat =
        selectedCategory === 'all' || item.categoryKey === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.product.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.reference.toLowerCase().includes(q) ||
        item.reason.toLowerCase().includes(q);

      return matchCat && matchSearch;
    });
  }, [rawLossProducts, selectedCategory, searchQuery]);

  const totalFilteredLoss = useMemo(() => {
    return filteredLossProducts.reduce((sum, item) => {
      if (item.categoryKey === 'purchase_return') {
        return sum + (item.totalLoss || 0);
      }
      return sum + (item.totalLoss || 0);
    }, 0);
  }, [filteredLossProducts]);

  const lossTableColumns = [
    {
      key: 'product',
      label: 'Product Details',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium text-slate-900">{row.product}</div>
          <div className="text-xs text-slate-400 font-mono">SKU: {row.sku}</div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Loss Category',
      sortable: true,
      render: (row) => {
        let badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
        if (row.categoryKey === 'expired') {
          badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
        } else if (row.categoryKey === 'below_cost_sale') {
          badgeStyle = 'bg-purple-50 text-purple-700 border-purple-200';
        } else if (row.categoryKey === 'purchase_return') {
          badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        }
        return (
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${badgeStyle}`}>
            {row.category}
          </span>
        );
      },
    },
    {
      key: 'reference',
      label: 'Reference / Ref ID',
      sortable: true,
      render: (row) => <span className="font-mono text-xs text-slate-600">{row.reference}</span>,
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (row) => <span className="text-xs text-slate-500">{row.date}</span>,
    },
    {
      key: 'quantity',
      label: 'Qty Lost',
      sortable: true,
      render: (row) => (
        <span className="font-medium text-slate-800">
          {row.quantity} units
        </span>
      ),
    },
    {
      key: 'unitCost',
      label: 'Unit Cost',
      sortable: true,
      render: (row) => (
        <div className="text-xs">
          <div>Cost: {formatMoney(row.unitCost)}</div>
          {row.salePrice !== undefined && (
            <div className="text-slate-400">Sale: {formatMoney(row.salePrice)}</div>
          )}
        </div>
      ),
    },
    {
      key: 'totalLoss',
      label: 'Financial Impact',
      sortable: true,
      render: (row) => {
        if (row.categoryKey === 'purchase_return') {
          return (
            <span className="font-bold text-rose-600">
              {formatMoney(row.totalLoss || 0)}
            </span>
          );
        }
        return (
          <span className="font-bold text-rose-600">
            {formatMoney(row.totalLoss)}
          </span>
        );
      },
    },
    {
      key: 'reason',
      label: 'Reason / Notes',
      render: (row) => <span className="text-xs text-slate-600 italic">{row.reason || '—'}</span>,
    },
  ];

  return (
    <ReportPageLayout
      title="Profit & Loss Report"
            description="Net Sales − COGS = Gross Profit; − Write-offs − Expired − Purchase Return Loss = Net Profit. Net Purchases = GRN − Supplier Returns."
      tenant={tenant}
      actions={<ExportButtons filename="profit-loss" />}
    >
      <FilterBar>
        <FilterDateRange value={range} onChange={setRange} />
      </FilterBar>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading profit, loss & inventory analytics...</p>
      ) : (
        <>
          <ReportCardsGrid className="grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <ReportCard
              label="Net Sales"
              value={formatMoney(profitLoss?.netSales ?? profitLoss?.revenue)}
              icon={FiDollarSign}
              tone="green"
              hint="After customer returns (ex-tax)"
            />
            <ReportCard
              label="COGS"
              value={formatMoney(profitLoss?.cogs ?? profitLoss?.cost)}
              icon={FiShoppingBag}
              tone="blue"
              hint="Batch / catalog cost × sold qty"
            />
            <ReportCard
              label="Gross Profit"
              value={formatMoney(profitLoss?.grossProfit)}
              icon={FiPieChart}
              tone="green"
              hint="Net Sales − COGS"
            />
            <ReportCard
              label="Net Purchases"
              value={formatMoney(profitLoss?.netPurchases)}
              icon={FiShoppingBag}
              tone="indigo"
              hint={`GRN ${formatMoney(profitLoss?.purchaseSpend)} − Returns ${formatMoney(profitLoss?.purchaseReturnRecovery)}`}
            />
            <ReportCard
              label="Operating Loss"
              value={formatMoney(profitLoss?.totalLoss)}
              icon={FiAlertOctagon}
              tone="rose"
              hint={
                profitLoss
                  ? `Write-offs ${formatMoney(profitLoss.writeOffLoss || 0)} · Expired ${formatMoney(profitLoss.expiredLoss || 0)} · Returns ${formatMoney(profitLoss.purchaseReturnLoss || 0)}`
                  : undefined
              }
            />
            <ReportCard
              label="Inventory Value"
              value={formatMoney(profitLoss?.inventoryValue)}
              icon={FiPieChart}
              tone="blue"
              hint="Purchased remaining stock"
            />
            <ReportCard
              label="Net Profit"
              value={formatMoney(profitLoss?.netProfit)}
              icon={FiTrendingDown}
              tone={profitLoss?.netProfit >= 0 ? 'purple' : 'rose'}
              hint="Gross Profit − Operating Loss"
            />
            <ReportCard
              label="Net Margin"
              value={`${profitLoss?.margin ?? 0}%`}
              icon={FiPercent}
              tone="indigo"
            />
          </ReportCardsGrid>

          <p className="text-xs text-slate-500 mt-3 mb-0">
            Below-cost sales are already reflected in Gross Profit (not added again as loss).
            Supplier returns reduce Net Purchases and inventory value; returning below original cost adds the difference to loss.
          </p>

          {/* Visual Analytics Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
            <div className="xl:col-span-1">
              <RevenueCostChart
                data={report?.profitLossChart || []}
                title="Financial Overview Breakdown"
              />
            </div>
            <div className="xl:col-span-1">
              <LossBreakdownChart
                data={report?.lossBreakdown || []}
                title="Inventory & Operating Losses"
              />
            </div>
            <div className="xl:col-span-1">
              <MonthlyProfitChart
                data={report?.monthlyProfit || []}
                title="Monthly Net Profit Trend"
              />
            </div>
          </div>

          {/* Detailed Loss Products & Written-Off Items Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mt-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 m-0">
                  <FiAlertOctagon className="text-rose-600 w-5 h-5" />
                  Loss Products & Written-Off Items Detail
                </h3>
                <p className="text-sm text-slate-500 mt-1 m-0">
                  Damaged/defective write-offs (only remaining qty), expired stock, below-cost sales & supplier returns.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-medium">
                  Showing {filteredLossProducts.length} items
                </span>
                <span className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg font-bold">
                  Net Impact: {formatMoney(totalFilteredLoss)}
                </span>
              </div>
            </div>

            {/* Category Filter Tabs & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 my-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All Items' },
                  { key: 'write_off', label: 'Write-Offs (Damaged/Defective)' },
                  { key: 'expired', label: 'Expired Stock' },
                  { key: 'below_cost_sale', label: 'Below-Cost Sales' },
                  { key: 'purchase_return', label: 'Purchase Returns' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setSelectedCategory(tab.key)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      selectedCategory === tab.key
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-64">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search loss item, SKU, ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Data Table */}
            <DataTable
              columns={lossTableColumns}
              rows={filteredLossProducts}
              pageSize={8}
              emptyMessage="No loss products found for the selected category or period."
            />
          </div>
        </>
      )}
    </ReportPageLayout>
  );
};

export default ProfitLossReport;
