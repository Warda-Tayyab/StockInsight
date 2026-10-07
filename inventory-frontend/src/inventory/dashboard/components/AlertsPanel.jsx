/** @module inventory/dashboard/components/AlertsPanel */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineBell,
  HiOutlineExclamation,
  HiOutlineExclamationCircle,
  HiOutlineClock,
  HiOutlineSpeakerphone,
  HiOutlineArrowRight,
  HiOutlineLocationMarker,
} from 'react-icons/hi';
import api from '../../../shared/utils/api';

const AlertsPanel = () => {
  const [alerts, setAlerts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      fetchAlerts();
    }
  }, [token]);

  const fetchAlerts = async () => {
    try {
      // Combined = all locations in one list (with destination on each alert)
      const res = await api.get('/api/inventory/alerts', {
        params: { mode: 'byLocation' },
      });

      const payload = res.data;
      const data = Array.isArray(payload) ? payload : payload?.alerts || [];
      setTotalCount(data.length);

      const stockAlerts = data
        .filter((alert) => alert.type === 'low-stock' || alert.type === 'out-of-stock')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 2);

      const batchAlerts = data
        .filter((alert) => alert.type === 'expiring' || alert.type === 'expired')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 2);

      setAlerts([...stockAlerts, ...batchAlerts]);
    } catch (err) {
      console.error('Alerts fetch error:', err);
    }
  };

  const getAlertIcon = (alert) => {
    if (alert.type === 'expiring' || alert.type === 'expired') {
      return <HiOutlineClock className="w-5 h-5 text-orange-500" />;
    }
    if (alert.type === 'out-of-stock' || alert.severity === 'critical') {
      return <HiOutlineExclamation className="w-5 h-5 text-red-500" />;
    }
    if (alert.type === 'low-stock' || alert.severity === 'high') {
      return <HiOutlineExclamationCircle className="w-5 h-5 text-amber-500" />;
    }
    return <HiOutlineSpeakerphone className="w-5 h-5 text-indigo-500" />;
  };

  const alertBgClasses = {
    critical: 'bg-red-50/80 border-l-red-500',
    high: 'bg-amber-50/80 border-l-amber-500',
    medium: 'bg-indigo-50/80 border-l-indigo-500',
    'out-of-stock': 'bg-red-50/80 border-l-red-500',
    'low-stock': 'bg-amber-50/80 border-l-amber-500',
    expired: 'bg-red-50/80 border-l-red-500',
    expiring: 'bg-orange-50/80 border-l-orange-500',
  };

  const alertMessage = (alert) => {
    const dest = alert.destination || alert.locationName || alert.location;
    if (alert.type === 'low-stock') {
      return `${alert.productId?.name} is below reorder at ${dest}`;
    }
    if (alert.type === 'out-of-stock') {
      return `${alert.productId?.name} is out of stock at ${dest}`;
    }
    if (alert.type === 'expiring') {
      return `${alert.productId?.name} batch expires soon at ${dest}`;
    }
    if (alert.type === 'expired') {
      return `${alert.productId?.name} batch expired at ${dest}`;
    }
    return alert.productId?.name || 'Alert';
  };

  return (
    <div className="card-padded max-h-[530px] flex flex-col">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <HiOutlineBell className="w-5 h-5 text-indigo-600" />
          <h3 className="card-title">Recent Alerts</h3>
        </div>
        <span className="badge-danger">{totalCount || alerts.length}</span>
      </div>

      <p className="text-xs text-slate-500 m-0 mb-3">
        All locations combined — open Stock Alerts to filter by Store / Warehouse
      </p>

      <div className="flex flex-col gap-3 mb-5 flex-1 overflow-y-auto scrollbar-thin">
        {alerts.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No alerts found</p>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id || alert._id}
              className={`flex gap-3 p-3.5 rounded-xl border-l-4 ${
                alertBgClasses[alert.severity] ||
                alertBgClasses[alert.type] ||
                'bg-slate-50 border-l-slate-400'
              }`}
            >
              <div className="shrink-0 mt-0.5">{getAlertIcon(alert)}</div>

              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <p className="text-sm text-slate-800 m-0 leading-relaxed">{alertMessage(alert)}</p>
                <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                  <HiOutlineLocationMarker className="w-3.5 h-3.5 text-indigo-500" />
                  {alert.destination || alert.locationName || alert.location || '—'}
                </span>
                <span className="text-xs text-slate-400">
                  {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : ''}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-4 border-t border-slate-100">
        <Link to="/stock-alerts" className="btn-secondary w-full text-center">
          View All Alerts
          <HiOutlineArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default AlertsPanel;
