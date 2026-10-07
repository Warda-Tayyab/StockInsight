import { useEffect, useState } from 'react';
import { FiClock, FiAlertCircle } from 'react-icons/fi';
import ReportPageLayout from '../components/common/ReportPageLayout';
import ReportCard, { ReportCardsGrid } from '../components/common/ReportCard';
import FilterBar, { FilterSelect } from '../components/common/FilterBar';
import ExportButtons from '../components/common/ExportButtons';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import { reportService } from '../../../shared/services/reportService';

const ExpiryReport = () => {
  const [days, setDays] = useState('30');
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [tenant, setTenant] = useState(null);
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await reportService.getExpiryReport({
          days,
          filter: filter || undefined,
        });
        setReport(res.data);
        setTenant(res.data.tenant);
      } catch (err) {
        console.error('Expiry report error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [days, filter]);

  const batches = report?.batches || [];
  const stats = report?.stats;

  const exportCols = [
    { key: 'batch', label: 'Batch' },
    { key: 'product', label: 'Product' },
    { key: 'location', label: 'Location' },
    { key: 'qty', label: 'Qty' },
    { key: 'expiry', label: 'Expiry' },
    { key: 'daysLeft', label: 'Days Left' },
    { key: 'status', label: 'Status' },
  ];

  return (
    <ReportPageLayout
      title="Expiry Report"
      description="Batch expiry tracking & FIFO alerts"
      tenant={tenant}
      actions={<ExportButtons
        filename="expiry-report"
        sheets={[
          {
            name: 'Summary',
            data: [
              {
                total: stats?.total ?? 0,
                expiring: stats?.expiring ?? 0,
                expired: stats?.expired ?? 0,
              },
            ],
          },
          {
            name: 'Batches',
            data: batches.map((r) => ({
              batch: r.batch,
              product: r.product,
              location: r.location || r.warehouse,
              qty: r.qty,
              expiry: r.expiry,
              daysLeft:
                r.daysLeft < 0
                  ? `${Math.abs(r.daysLeft)} days ago`
                  : `${r.daysLeft} days left`,
              status: r.status,
            })),
          },
        ]}
      />}
    >
      <FilterBar>
        <FilterSelect label="Time Range" value={days} onChange={setDays} options={['7', '15', '30']} />
        <FilterSelect label="Filter" value={filter} onChange={setFilter} options={['All', 'expiring', 'expired']} />
      </FilterBar>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading expiry data...</p>
      ) : (
        <>
          <ReportCardsGrid>
            <ReportCard label="Total Batches" value={stats?.total ?? 0} icon={FiClock} tone="blue" />
            <ReportCard label="Expiring Soon" value={stats?.expiring ?? 0} icon={FiAlertCircle} tone="amber" />
            <ReportCard label="Expired" value={stats?.expired ?? 0} icon={FiAlertCircle} tone="red" />
            <ReportCard label="FIFO Tracking" value="Active" icon={FiClock} tone="green" hint="Oldest batches consumed first" />
          </ReportCardsGrid>

          <DataTable
            columns={[
              { key: 'batch', label: 'Batch #' },
              { key: 'product', label: 'Product' },
              { key: 'location', label: 'Location' },
              { key: 'qty', label: 'Qty' },
              { key: 'expiry', label: 'Expiry Date' },
              {
                key: 'daysLeft',
                label: 'Days Left',
                render: (r) => {
                  const isExpired = r.daysLeft < 0;
                  const absDays = Math.abs(r.daysLeft);
              
                  const label = (days, type) =>
                    days === 1 ? `1 ${type}` : `${days} ${type}s`;
              
                  return (
                    <span
                      className={
                        isExpired
                          ? 'text-red-600'
                          : r.daysLeft <= 7
                          ? 'text-amber-600 '
                          : 'text-slate-700'
                      }
                    >
                      {isExpired
                        ? `${label(absDays, 'day')} ago`
                        : `${label(r.daysLeft, 'day')} left`}
                    </span>
                  );
                },
              },
              { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            ]}
            rows={batches}
          />
        </>
      )}
    </ReportPageLayout>
  );
};

export default ExpiryReport;
