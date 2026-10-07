import { useEffect, useMemo, useState } from 'react';
import { FiDollarSign, FiShoppingCart, FiCalendar, FiTrendingUp, FiFileText, FiTag, FiPercent, FiShoppingBag, FiRotateCcw } from 'react-icons/fi';
import ReportPageLayout from '../components/common/ReportPageLayout';
import ReportCard, { ReportCardsGrid } from '../components/common/ReportCard';
import FilterBar, { FilterDateRange, FilterSelect } from '../components/common/FilterBar';
import SearchBar from '../components/common/SearchBar';
import ExportButtons from '../components/common/ExportButtons';
import DataTable from '../components/common/DataTable';
import SalesTrendChart from '../components/charts/SalesTrendChart';
import { reportService } from '../../../shared/services/reportService';
import { formatMoney } from '../utils/formatMoney';
const SalesReport = () => {
  const [range, setRange] = useState('month');
  const [customer, setCustomer] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [tenant, setTenant] = useState(null);
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await reportService.getSalesReport({ range, search: search || undefined });
        setReport(res.data);
        setTenant(res.data.tenant);
      } catch (err) {
        console.error('Sales report error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [range, search]);
   
  const summary = report?.summary;
  const filterOptions = report?.filterOptions || { customers: ['All'], products: ['All'], warehouses: ['All'] };

  const filteredTx = useMemo(() => {
    const rows = report?.transactions || [];
    if (!customer) return rows;
    return rows.filter((t) => t.customer.includes(customer.replace(' Payments', '').replace(' Sales', '')));
  }, [report?.transactions, customer]);

  const exportCols = [
    { key: 'id', label: 'Invoice' },
    { key: 'date', label: 'Date' },
    { key: 'customer', label: 'Customer' },
    { key: 'items', label: 'Items' },
    { key: 'payment', label: 'Payment' },
    { key: 'total', label: 'Total' },
  ];

  return (
    <ReportPageLayout
      title="Sales Report"
      description="Revenue performance from POS sales"
      tenant={tenant}
      actions={<ExportButtons filename="sales-report" columns={exportCols} rows={filteredTx}   />}
    >
      <FilterBar>
        <FilterDateRange value={range} onChange={setRange} />
        <FilterSelect label="Customer" value={customer} onChange={setCustomer} options={filterOptions.customers} />
        <SearchBar value={search} onChange={setSearch} placeholder="Search invoice or product..." />
      </FilterBar>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading sales data...</p>
      ) : (
        <>
          <ReportCardsGrid>
            <ReportCard
              label="Total Sales"
              value={formatMoney(summary?.totalSales)}
              hint="Total Sales = Net Sales + Tax Gathered"
              icon={FiDollarSign}
              tone="green"
              trend={summary?.growth}
            />
            <ReportCard
              label="Net Sales"
              value={formatMoney(summary?.netSales)}
              hint="Sales after discounts/returns, before tax"
              icon={FiPercent}
              tone="blue"
            />
            <ReportCard
              label="Total Tax Gathered"
              value={formatMoney(summary?.totalTax)}
              hint="Tax collected after returns"
              icon={FiFileText}
              tone="purple"
            />
            <ReportCard
              label="Customer Returns"
              value={formatMoney(summary?.totalCustomerReturns)}
              hint="Total refund amount given for returned items"
              icon={FiRotateCcw}
              tone="rose"
            />
            <ReportCard
              label="Product Discounts"
              value={formatMoney(summary?.totalProductDiscounts)}
              hint="Total product & store level discount given"
              icon={FiShoppingBag}
              tone="indigo"
            />
            <ReportCard
              label="Coupons Discount"
              value={formatMoney(summary?.totalCouponDiscounts)}
              hint="Total coupon discount given"
              icon={FiTag}
              tone="amber"
            />
            <ReportCard
              label="Daily Revenue"
              value={formatMoney(summary?.dailyRevenue)}
              icon={FiCalendar}
              tone="indigo"
            />
            <ReportCard
              label="Monthly Revenue"
              value={formatMoney(summary?.monthlyRevenue)}
              icon={FiShoppingCart}
              tone="rose"
            />
          </ReportCardsGrid>

          <SalesTrendChart data={report?.salesTrend || []} />

          <div className="grid grid-cols-1 gap-6">
            {/*
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Top Customers</h3>
              <DataTable
                columns={[
                  { key: 'name', label: 'Customer', sortable: true },
                  { key: 'orders', label: 'Orders', sortable: true },
                  { key: 'totalSpent', label: 'Spent', render: (r) => formatMoney(r.totalSpent) },
                ]}
                rows={report?.topCustomers || []}
                pageSize={5}
              />
            </div>*/}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Top Selling Products</h3>
              <DataTable
                columns={[
                  { key: 'name', label: 'Product', sortable: true },
                  { key: 'sold', label: 'Sold', sortable: true },
                  { key: 'revenue', label: 'Revenue', render: (r) => formatMoney(r.revenue) },
                ]}
                rows={report?.topSellingProducts || []}
                pageSize={5}
              />
            </div>
          </div>
           <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-0">
  Sales Transactions
</h3>
          <DataTable
            columns={[
              { key: 'id', label: 'Invoice', sortable: true },
              { key: 'date', label: 'Date' },
              
             // { key: 'customer', label: 'Customer' },
              { key: 'items', label: 'Items' },
              { key: 'payment', label: 'Payment' },
              { key: 'total', label: 'Total', render: (r) => formatMoney(r.total, 2) },
            ]}
            rows={filteredTx}
          />
        </>
      )}
    </ReportPageLayout>
  );
};

export default SalesReport;
