import { useEffect, useState } from 'react';
import {
  FiUsers,
  FiShoppingCart,
  FiTruck,
  FiRefreshCw,
  FiArrowRight,
  FiAlertOctagon,
  FiLogIn,
} from 'react-icons/fi';
import ReportPageLayout from '../components/common/ReportPageLayout';
import ReportCard, { ReportCardsGrid } from '../components/common/ReportCard';
import FilterBar, { FilterDateRange } from '../components/common/FilterBar';
import ExportButtons from '../components/common/ExportButtons';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import { reportService } from '../../../shared/services/reportService';
import { formatMoney } from '../utils/formatMoney';

const UserActivityReport = () => {
  const [range, setRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await reportService.getUserActivityReport({ range });
        setReport(res.data);
        setTenant(res.data.tenant);
      } catch (err) {
        console.error('User activity report error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [range]);

  const users = report?.users || [];
  const activityTimeline = report?.activityTimeline || [];
  const stats = report?.stats;

  return (
    <ReportPageLayout
      title="Activity Report"
      description="Sales, purchase receive/returns, stock transfers, write-offs, POS returns & logins"
      tenant={tenant}
      actions={
        <ExportButtons
          filename="user-activity"
          sheets={[
            {
              name: 'Summary',
              data: [
                {
                  Staff: stats?.staffCount ?? 0,
                  Sales: stats?.sales ?? 0,
                  PurchaseReceives: stats?.purchaseReceives ?? 0,
                  PurchaseReturns: stats?.purchaseReturns ?? 0,
                  Transfers: stats?.transfers ?? 0,
                  WriteOffs: stats?.writeOffs ?? 0,
                  CustomerReturns: stats?.customerReturns ?? 0,
                  Logins: stats?.logins ?? 0,
                },
              ],
            },
            {
              name: 'Users',
              data: users.map((u) => ({
                User: u.name,
                Email: u.email,
                Role: u.role,
                Status: u.status,
                LastActive: u.lastLogin,
              })),
            },
            {
              name: 'Activity',
              data: activityTimeline.map((a) => ({
                Time: a.time,
                User: a.user,
                Type: a.type,
                Action: a.action,
                Product: a.product,
                Qty: a.qty,
                Destination: a.destination,
                Amount: a.amount,
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
        <p className="text-slate-500 text-sm">Loading activity...</p>
      ) : (
        <>
          <ReportCardsGrid className="grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">
            <ReportCard label="Staff" value={stats?.staffCount ?? 0} icon={FiUsers} tone="blue" />
            <ReportCard label="Sales" value={stats?.sales ?? 0} icon={FiShoppingCart} tone="green" />
            <ReportCard label="Purchase Receives" value={stats?.purchaseReceives ?? 0} icon={FiTruck} tone="indigo" />
            <ReportCard label="Purchase Returns" value={stats?.purchaseReturns ?? 0} icon={FiRefreshCw} tone="amber" />
            <ReportCard label="Transfers" value={stats?.transfers ?? 0} icon={FiArrowRight} tone="blue" />
            <ReportCard label="Write-offs" value={stats?.writeOffs ?? 0} icon={FiAlertOctagon} tone="rose" />
            <ReportCard label="Customer Returns" value={stats?.customerReturns ?? 0} icon={FiRefreshCw} tone="amber" />
            <ReportCard label="Logins" value={stats?.logins ?? 0} icon={FiLogIn} tone="purple" />
          </ReportCardsGrid>

          <h3 className="text-sm font-semibold text-slate-700 mt-6 mb-2">Staff</h3>
          <DataTable
            columns={[
              { key: 'name', label: 'User', sortable: true },
              { key: 'email', label: 'Email' },
              { key: 'role', label: 'Role' },
              {
                key: 'status',
                label: 'Status',
                render: (r) => <StatusBadge status={r.status} />,
              },
              { key: 'lastLogin', label: 'Last Login' },
            ]}
            rows={users}
            pageSize={6}
          />

          <h3 className="text-sm font-semibold text-slate-700 mt-6 mb-2">Activity Timeline</h3>
          <DataTable
            columns={[
              { key: 'time', label: 'Time', sortable: true },
              { key: 'user', label: 'User' },
              {
                key: 'type',
                label: 'Type',
                render: (r) => (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {r.type}
                  </span>
                ),
              },
              { key: 'action', label: 'Action' },
              { key: 'product', label: 'Product / Detail' },
              { key: 'qty', label: 'Qty' },
              { key: 'destination', label: 'Destination' },
              {
                key: 'amount',
                label: 'Amount',
                render: (r) => (r.amount != null ? formatMoney(r.amount) : '—'),
              },
            ]}
            rows={activityTimeline}
            pageSize={12}
            emptyMessage="No activity in this period."
          />
        </>
      )}
    </ReportPageLayout>
  );
};

export default UserActivityReport;
