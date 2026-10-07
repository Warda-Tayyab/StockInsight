import { useEffect, useState } from 'react';
import {
  FiAlertTriangle,
  FiAlertCircle,
  FiTrendingUp,
  FiMapPin,
} from 'react-icons/fi';
import ReportPageLayout from '../components/common/ReportPageLayout';
import ReportCard, { ReportCardsGrid } from '../components/common/ReportCard';
import FilterBar from '../components/common/FilterBar';
import SearchBar from '../components/common/SearchBar';
import ExportButtons from '../components/common/ExportButtons';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import { reportService } from '../../../shared/services/reportService';

const LowStockReport = () => {
  const [search, setSearch] = useState('');
  const [locationId, setLocationId] = useState('');
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await reportService.getLowStockReport({
          search: search || undefined,
          locationId: locationId || undefined,
        });
        setReport(res.data);
        setTenant(res.data.tenant);
      } catch (err) {
        console.error('Low stock report error:', err);
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search, locationId]);

  const items = report?.items || [];
  const stats = report?.stats;
  const locationOptions = report?.filterOptions?.locations || [{ id: '', label: 'All Locations' }];

  const exportCols = [
    { key: 'name', label: 'Product' },
    { key: 'destination', label: 'Destination' },
    { key: 'current', label: 'Qty at Location' },
    { key: 'min', label: 'Reorder' },
    { key: 'suggested', label: 'Suggested Reorder' },
    { key: 'severity', label: 'Severity' },
  ];

  return (
    <ReportPageLayout
      title="Low Stock Report"
      description="Per-location low / out-of-stock for purchased products — filter by Store or Warehouse"
      tenant={tenant}
      actions={
        <ExportButtons
          filename="low-stock"
          sheets={[{ name: 'Low Stock Items', data: items }]}
        />
      }
    >
      <FilterBar>
        <div className="flex flex-col gap-1 min-w-[180px]">
          <label className="text-xs font-medium text-slate-500">Location</label>
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="input-field text-sm"
          >
            {locationOptions.map((loc) => (
              <option key={loc.id || 'all'} value={loc.id}>
                {loc.label}
              </option>
            ))}
          </select>
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search product, SKU, location..." />
      </FilterBar>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading low stock data...</p>
      ) : (
        <>
          <ReportCardsGrid>
            <ReportCard
              label="Total Alerts"
              value={stats?.total ?? 0}
              icon={FiAlertTriangle}
              tone="amber"
            />
            <ReportCard
              label="Critical"
              value={stats?.critical ?? 0}
              icon={FiAlertCircle}
              tone="red"
            />
            <ReportCard
              label="High"
              value={stats?.high ?? 0}
              icon={FiAlertTriangle}
              tone="orange"
            />
            <ReportCard
              label="Suggested Reorder Units"
              value={stats?.suggestedReorderUnits ?? 0}
              icon={FiTrendingUp}
              tone="blue"
            />
          </ReportCardsGrid>

          <DataTable
            columns={[
              { key: 'name', label: 'Product', sortable: true },
              { key: 'sku', label: 'SKU' },
              {
                key: 'destination',
                label: 'Destination',
                render: (r) => (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700">
                    <FiMapPin className="w-3.5 h-3.5 text-indigo-500" />
                    {r.destination || r.locationSummary || '—'}
                  </span>
                ),
              },
              { key: 'current', label: 'Qty at Location', sortable: true },
              { key: 'min', label: 'Reorder Level' },
              { key: 'suggested', label: 'Reorder Qty', sortable: true },
              {
                key: 'severity',
                label: 'Severity',
                render: (r) => <StatusBadge status={r.severity} />,
              },
            ]}
            rows={items}
          />
        </>
      )}
    </ReportPageLayout>
  );
};

export default LowStockReport;
