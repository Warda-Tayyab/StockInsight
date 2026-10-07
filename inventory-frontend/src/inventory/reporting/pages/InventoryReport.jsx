import { useEffect, useState } from 'react';
import { FiPackage, FiCheckCircle, FiAlertCircle, FiXCircle } from 'react-icons/fi';
import ReportPageLayout from '../components/common/ReportPageLayout';
import ReportCard, { ReportCardsGrid } from '../components/common/ReportCard';
import FilterBar, { FilterSelect } from '../components/common/FilterBar';
import SearchBar from '../components/common/SearchBar';
import ExportButtons from '../components/common/ExportButtons';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import { reportService } from '../../../shared/services/reportService';
import { formatMoney } from '../utils/formatMoney';

const InventoryReport = () => {
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [tenant, setTenant] = useState(null);
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await reportService.getInventoryReport({
          status: status || undefined,
          category: category || undefined,
          search: search || undefined,
        });
        setReport(res.data);
        setTenant(res.data.tenant);
      } catch (err) {
        console.error('Inventory report error:', err);
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [status, category, search]);

  const summary = report?.summary;
  const filterOptions = report?.filterOptions || { categories: ['All'] };
  const filtered = report?.inventoryProducts || [];
  const locationStock = report?.locationStock || report?.warehouseStock || [];

  const exportCols = [
    { key: 'name', label: 'Product' },
    { key: 'sku', label: 'SKU' },
    { key: 'category', label: 'Category' },
    { key: 'qty', label: 'Qty' },
    { key: 'status', label: 'Status' },
    { key: 'value', label: 'Value' },
  ];

  return (
    <ReportPageLayout
      title="Inventory Report"
      description="Purchased products only — stock levels and batch-based inventory value"
      tenant={tenant}
      actions={<ExportButtons filename="inventory-report" columns={exportCols} rows={filtered} />}
    >
      <FilterBar>
        <FilterSelect label="Stock status" value={status} onChange={setStatus} options={['All', 'in_stock', 'low_stock', 'out_of_stock']} />
        <FilterSelect label="Category" value={category} onChange={setCategory} options={filterOptions.categories} />
        <SearchBar value={search} onChange={setSearch} placeholder="Search product or SKU..." />
      </FilterBar>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading inventory data...</p>
      ) : (
        <>
          <ReportCardsGrid>
            <ReportCard label="In Stock" value={summary?.inStock ?? 0} icon={FiCheckCircle} tone="green" />
            <ReportCard label="Low Stock" value={summary?.lowStock ?? 0} icon={FiAlertCircle} tone="amber" />
            <ReportCard label="Out of Stock" value={summary?.outOfStock ?? 0} icon={FiXCircle} tone="red" />
            <ReportCard label="Inventory Value" value={formatMoney(summary?.totalValue)} icon={FiPackage} tone="blue" />
          </ReportCardsGrid>

          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Location-wise Stock</h3>
          <DataTable
            columns={[
              { key: 'name', label: 'Location' },
              { key: 'locationType', label: 'Type' },
              { key: 'totalQty', label: 'Total Qty', sortable: true },
              { key: 'skus', label: 'SKUs' },
            ]}
            rows={locationStock}
            pageSize={5}
          />

          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-4">Product-wise Stock</h3>
          <DataTable
            columns={[
              { key: 'name', label: 'Product', sortable: true },
              { key: 'sku', label: 'SKU' },
              { key: 'category', label: 'Category' },
              { key: 'qty', label: 'Total Qty', sortable: true },
              {
                key: 'locationSummary',
                label: 'By Location',
                render: (r) => (
                  <span className="text-xs text-slate-600">{r.locationSummary || '—'}</span>
                ),
              },
              { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              { key: 'value', label: 'Value', render: (r) => formatMoney(r.value) },
            ]}
            rows={filtered}
          />
        </>
      )}
    </ReportPageLayout>
  );
};

export default InventoryReport;
