import { useEffect, useState } from 'react';
import { FiHome, FiTruck, FiActivity } from 'react-icons/fi';
import ReportPageLayout from '../components/common/ReportPageLayout';
import ReportCard, { ReportCardsGrid } from '../components/common/ReportCard';
import FilterBar, { FilterDateRange } from '../components/common/FilterBar';
import ExportButtons from '../components/common/ExportButtons';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import HorizontalBarChart from '../components/charts/HorizontalBarChart';
import { reportService } from '../../../shared/services/reportService';

const WarehousePerformance = () => {
  const [range, setRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [tenant, setTenant] = useState(null);
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await reportService.getWarehouseReport({ range });
        setReport(res.data);
        setTenant(res.data.tenant);
      } catch (err) {
        console.error('Warehouse report error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [range]);

  const warehouseStock = report?.warehouseStock || report?.locationStock || [];
  const warehouseTransfers = report?.warehouseTransfers || [];
  const stockTransfers = report?.stockTransfers || [];
  const fastMoving = report?.fastMoving || [];
  const stats = report?.stats;

  return (
    <ReportPageLayout
      title="Location Performance"
      description="Store & warehouse stock, stock transfers, and inventory movements (purchased products)"
      tenant={tenant}
      actions={
        <ExportButtons
        filename="Location-Report"
        sheets={[
          {
            name: 'Summary',
            data: [
              {
                Locations: stats?.locationCount ?? stats?.warehouseCount ?? 0,
                StockTransfers: stats?.transferCount ?? 0,
                Movements: stats?.movementCount ?? 0,
                TotalStockQty: stats?.totalStockQty ?? 0,
              },
            ],
          },
          {
            name: 'Locations',
            data: warehouseStock.map((w) => ({
              Location: w.name,
              Type: w.locationType || 'store',
              TotalStock: w.totalQty,
              SKUs: w.skus,
            })),
          },
          {
            name: 'StockTransfers',
            data: stockTransfers.map((t) => ({
              Transfer: t.transferNumber,
              From: t.from,
              To: t.to,
              Qty: t.qty,
              User: t.user,
              Date: t.date,
            })),
          },
          {
            name: 'Movements',
            data: warehouseTransfers.map((t) => ({
              Type: t.type,
              Product: t.product,
              Location: t.warehouse,
              Movement:
                t.type === 'adjust'
                  ? `${t.previousQuantity ?? 0} → ${t.newQuantity ?? 0} (${t.qty})`
                  : t.qty,
              User: t.user,
              Date: t.date,
            })),
          },
          {
            name: 'FastMoving',
            data: fastMoving.map((f) => ({
              Product: f.name,
              Sold: f.sold,
            })),
          },
        ]}
      />
      }
    >
      <FilterBar>
        <FilterDateRange value={range} onChange={setRange} />
      </FilterBar>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading location data...</p>
      ) : (
        <>
          <ReportCardsGrid>
            <ReportCard label="Locations" value={stats?.locationCount ?? stats?.warehouseCount ?? 0} icon={FiHome} tone="blue" />
            <ReportCard label="Stock Transfers" value={stats?.transferCount ?? 0} icon={FiTruck} tone="indigo" />
            <ReportCard
              label="Total Stock Qty"
              value={(stats?.totalStockQty ?? 0).toLocaleString()}
              icon={FiActivity}
              tone="purple"
            />
          </ReportCardsGrid>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DataTable
              columns={[
                { key: 'name', label: 'Location' },
                { key: 'locationType', label: 'Type' },
                { key: 'totalQty', label: 'Stock', sortable: true },
                { key: 'skus', label: 'SKUs' },
              ]}
              rows={warehouseStock}
            />
            <HorizontalBarChart data={fastMoving} title="Fast-moving products" />
          </div>

          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-4">Stock Transfers</h3>
          <DataTable
            columns={[
              { key: 'transferNumber', label: 'Transfer #' },
              { key: 'from', label: 'From' },
              { key: 'to', label: 'To' },
              { key: 'qty', label: 'Qty' },
              { key: 'user', label: 'User' },
              { key: 'date', label: 'Date' },
            ]}
            rows={stockTransfers}
            emptyMessage="No completed stock transfers in this period."
          />

          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-4">Inventory Movements</h3>
          <DataTable
            columns={[
              { key: 'type', label: 'Type', render: (r) => <StatusBadge status={r.type} /> },
              { key: 'product', label: 'Product' },
              { key: 'warehouse', label: 'Location' },
              {
                key: 'qty',
                label: 'Movement',
                render: (r) =>
                  r.type === 'adjust'
                    ? `${r.previousQuantity ?? 0} → ${r.newQuantity ?? 0} (${r.qty})`
                    : r.qty
              },
              { key: 'user', label: 'User' },
              { key: 'date', label: 'Date' },
            ]}
            rows={warehouseTransfers}
          />
        </>
      )}
    </ReportPageLayout>
  );
};

export default WarehousePerformance;
