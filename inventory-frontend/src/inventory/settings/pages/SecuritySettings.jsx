/** @module inventory/settings/pages/SecuritySettings */

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import settingsService from '../../../shared/services/settingsService';

const formatDeviceValue = (row) => {
  return row.deviceName || 'Unknown Device';
};

const SecuritySettings = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ lastLoginAt: null, accountCreatedAt: null, history: [] });

  useEffect(() => {
    settingsService.getLoginHistory()
      .then((res) => setData(res.data.data))
      .catch(() => toast.error('Failed to load security info'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-12 text-center text-slate-500">Loading…</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="card-padded grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Last login</p>
          <p className="text-sm font-medium text-slate-900 mt-1">
            {data.lastLoginAt ? new Date(data.lastLoginAt).toLocaleString() : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Account created</p>
          <p className="text-sm font-medium text-slate-900 mt-1">
            {data.accountCreatedAt ? new Date(data.accountCreatedAt).toLocaleString() : '—'}
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Login history</h2>
          <p className="text-sm text-slate-500">Recent successful sign-ins</p>
        </div>
        {data.history?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">When</th>
                  <th className="px-4 py-3 font-semibold">Method</th>
                  <th className="px-4 py-3 font-semibold">IP</th>
                  <th className="px-4 py-3 font-semibold">Device</th>
                </tr>
              </thead>
              <tbody>
                {data.history.map((row) => (
                  <tr key={row._id} className="border-t border-slate-100">
                    <td className="px-4 py-3">{new Date(row.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 capitalize">{row.method}</td>
                    <td className="px-4 py-3 text-slate-500">{row.ip || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={formatDeviceValue(row)}>
                      {formatDeviceValue(row)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-10 text-center text-slate-500 text-sm">
            No login history yet. It will appear after your next sign-in.
          </p>
        )}
      </div>
    </div>
  );
};

export default SecuritySettings;
