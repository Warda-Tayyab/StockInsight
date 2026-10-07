import { useEffect, useState } from 'react';
import {
  FiShoppingCart,
  FiRotateCcw,
  FiDollarSign,
  FiPackage,
  FiTruck,
  FiTrendingUp,
} from 'react-icons/fi';
import ReportPageLayout from '../components/common/ReportPageLayout';
import ReportCard, { ReportCardsGrid } from '../components/common/ReportCard';
import FilterBar, { FilterDateRange } from '../components/common/FilterBar';
import SearchBar from '../components/common/SearchBar';
import ExportButtons from '../components/common/ExportButtons';
import DataTable from '../components/common/DataTable';
import RevenueCostChart from '../components/charts/RevenueCostChart';
import { reportService } from '../../../shared/services/reportService';
import { formatMoney } from '../utils/formatMoney';

const PurchaseReport = () => {
  const [range, setRange] = useState('month');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await reportService.getPurchaseReport({
          range,
          search: search || undefined,
        });
        setReport(res.data);
        setTenant(res.data.tenant);
      } catch (err) {
        console.error('Purchase report error:', err);
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [range, search]);

  const summary = report?.summary;
  const activity = report?.activity || [];
  const topProducts = report?.topProducts || [];
  const vendorBreakdown = report?.vendorBreakdown || [];

  const activityColumns = [
    {
      key: 'type',
      label: 'Type',
      render: (row) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            row.type === 'return'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          {row.type === 'return' ? 'Return' : 'Receive'}
        </span>
      ),
    },
    { key: 'reference', label: 'Reference' },
    { key: 'date', label: 'Date' },
    { key: 'vendor', label: 'Vendor' },
    { key: 'product', label: 'Product' },
    { key: 'batchNumber', label: 'Batch' },
    { key: 'quantity', label: 'Qty' },
    {
      key: 'total',
      label: 'Amount',
      render: (row) => (
        <span className={row.type === 'return' ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-semibold'}>
          {row.type === 'return' ? '-' : ''}
          {formatMoney(row.total)}
        </span>
      ),
    },
  ];

  const vendorColumns = [
    { key: 'name', label: 'Vendor' },
    { key: 'receipts', label: 'Receipts' },
    { key: 'qty', label: 'Qty Received' },
    {
      key: 'spend',
      label: 'Total Spend',
      render: (row) => formatMoney(row.spend),
    },
  ];

  const topProductColumns = [
    { key: 'rank', label: '#' },
    { key: 'name', label: 'Product' },
    { key: 'sku', label: 'SKU' },
    { key: 'qty', label: 'Qty Purchased' },
    {
      key: 'spend',
      label: 'Purchase Value',
      render: (row) => formatMoney(row.spend),
    },
  ];

  return (
    <ReportPageLayout
      title="Purchasing Report"
      description="Purchase receives, supplier returns, vendor spend & purchased inventory value"
      tenant={tenant}
      actions={<ExportButtons filename="purchasing-report" rows={activity} columns={activityColumns} />}
    >
      <FilterBar>
        <FilterDateRange value={range} onChange={setRange} />
        <SearchBar value={search} onChange={setSearch} placeholder="Search product, vendor, GRN..." />
      </FilterBar>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading purchasing analytics...</p>
      ) : (
        <>
          <p className="text-xs text-slate-500 mb-4">
            Reports include only products received through Purchase Orders (posted GRNs). Manual products are excluded.
          </p>

          <ReportCardsGrid className="grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <ReportCard
              label="Purchase Spend"
              value={formatMoney(summary?.purchaseSpend)}
              icon={FiShoppingCart}
              tone="green"
              hint={`${summary?.receiptCount ?? 0} receipts · ${summary?.purchaseQty ?? 0} units`}
            />
            <ReportCard
              label="Supplier Returns"
              value={formatMoney(summary?.returnCredit)}
              icon={FiRotateCcw}
              tone="amber"
              hint={`${summary?.returnCount ?? 0} returns · ${summary?.returnQty ?? 0} units`}
            />
            <ReportCard
              label="Net Purchase Spend"
              value={formatMoney(summary?.netPurchaseSpend)}
              icon={FiDollarSign}
              tone="blue"
            />
            <ReportCard
              label="Inventory Value (Purchased)"
              value={formatMoney(summary?.inventoryValue)}
              icon={FiPackage}
              tone="indigo"
              hint={`${summary?.productCount ?? 0} products · ${summary?.batchCount ?? 0} batches`}
            />
          </ReportCardsGrid>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
            <RevenueCostChart
              data={report?.purchaseChart || []}
              title="Purchase vs Returns vs Inventory"
            />
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 m-0 mb-4">
                <FiTruck className="w-4 h-4" />
                Vendor Spend Breakdown
              </h3>
              <DataTable
                columns={vendorColumns}
                rows={vendorBreakdown}
                pageSize={6}
                emptyMessage="No vendor purchases in this period."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 m-0 mb-4">
                <FiTrendingUp className="w-4 h-4" />
                Top Purchased Products
              </h3>
              <DataTable
                columns={topProductColumns}
                rows={topProducts}
                pageSize={8}
                emptyMessage="No purchase data for this period."
              />
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm xl:col-span-1">
              <h3 className="text-sm font-semibold text-slate-700 m-0 mb-4">
                Receive & Return Activity
              </h3>
              <DataTable
                columns={activityColumns}
                rows={activity}
                pageSize={8}
                emptyMessage="No purchase activity in this period."
              />
            </div>
          </div>
        </>
      )}
    </ReportPageLayout>
  );
};

export default PurchaseReport;
