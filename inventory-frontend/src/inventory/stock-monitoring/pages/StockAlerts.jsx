/** @module inventory/stock-monitoring/pages/StockAlerts */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../../../socket';
import api from '../../../shared/utils/api';
import { useAuthContext } from '../../../shared/context/AuthContext';
import {
  HiOutlineBell,
  HiOutlineExclamation,
  HiOutlineExclamationCircle,
  HiOutlineClock,
  HiOutlineSpeakerphone,
  HiOutlineLocationMarker,
} from 'react-icons/hi';

const StockAlerts = () => {
  const { user } = useAuthContext();
  const tenantId = user?.tenant?.id ? String(user.tenant.id) : null;

  const [alerts, setAlerts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  useEffect(() => {
    if (!tenantId) return;

    fetchAlerts();

    const joinRoom = () => {
      socket.emit('join-tenant', tenantId);
    };

    socket.on('connect', joinRoom);
    if (socket.connected) {
      joinRoom();
    } else {
      socket.connect();
    }

    const handleAlert = (data) => {
      if (data?.tenantId && String(data.tenantId) !== tenantId) {
        return;
      }
      fetchAlerts();
    };

    socket.on('new-alert', handleAlert);

    return () => {
      socket.off('connect', joinRoom);
      socket.off('new-alert', handleAlert);
    };
  }, [tenantId]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/inventory/alerts');
      const payload = res.data;
      const list = Array.isArray(payload) ? payload : payload?.alerts || [];
      setAlerts(list);
      setLocations(payload?.locations || []);
    } catch (err) {
      console.error('Alerts fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchType = typeFilter === 'all' || alert.type === typeFilter;
      const matchLocation =
        locationFilter === 'all' ||
        (alert.locationId && String(alert.locationId) === String(locationFilter));
      return matchType && matchLocation;
    });
  }, [alerts, typeFilter, locationFilter]);

  const countsForFilter = useMemo(() => {
    const base =
      locationFilter === 'all'
        ? alerts
        : alerts.filter(
            (a) => a.locationId && String(a.locationId) === String(locationFilter)
          );
    return {
      all: base.length,
      'out-of-stock': base.filter((a) => a.type === 'out-of-stock').length,
      'low-stock': base.filter((a) => a.type === 'low-stock').length,
      expired: base.filter((a) => a.type === 'expired').length,
      expiring: base.filter((a) => a.type === 'expiring').length,
    };
  }, [alerts, locationFilter]);

  const getAlertIcon = (type) => {
    const iconClass = 'w-7 h-7';
    switch (type) {
      case 'out-of-stock':
        return <HiOutlineExclamation className={`${iconClass} text-red-500`} />;
      case 'low-stock':
        return <HiOutlineExclamationCircle className={`${iconClass} text-amber-500`} />;
      case 'expired':
        return <HiOutlineClock className={`${iconClass} text-red-500`} />;
      case 'expiring':
        return <HiOutlineClock className={`${iconClass} text-orange-500`} />;
      default:
        return <HiOutlineBell className={`${iconClass} text-slate-500`} />;
    }
  };

  const getAlertBadge = (type) => {
    switch (type) {
      case 'out-of-stock':
        return <span className="badge-danger">Out of Stock</span>;
      case 'low-stock':
        return <span className="badge-warning">Low Stock</span>;
      case 'expired':
        return <span className="badge-danger">Expired</span>;
      case 'expiring':
        return <span className="badge-warning">Expiring Soon</span>;
      default:
        return null;
    }
  };

  const alertBgClasses = {
    'out-of-stock': 'bg-red-50/80 border-l-red-500',
    'low-stock': 'bg-amber-50/80 border-l-amber-500',
    expired: 'bg-red-50/80 border-l-red-500',
    expiring: 'bg-orange-50/80 border-l-orange-500',
  };

  const typeCards = [
    { key: 'all', label: 'All Alerts', count: countsForFilter.all, icon: HiOutlineBell, ring: 'ring-indigo-500', iconColor: 'text-indigo-600' },
    { key: 'out-of-stock', label: 'Out of Stock', count: countsForFilter['out-of-stock'], icon: HiOutlineExclamation, ring: 'ring-red-500', iconColor: 'text-red-500' },
    { key: 'low-stock', label: 'Low Stock', count: countsForFilter['low-stock'], icon: HiOutlineExclamationCircle, ring: 'ring-amber-500', iconColor: 'text-amber-500' },
    { key: 'expired', label: 'Expired', count: countsForFilter.expired, icon: HiOutlineClock, ring: 'ring-red-500', iconColor: 'text-red-500' },
    { key: 'expiring', label: 'Expiring Soon', count: countsForFilter.expiring, icon: HiOutlineClock, ring: 'ring-orange-500', iconColor: 'text-orange-500' },
  ];

  return (
    <div data-testid="stock-alerts-page" className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Alerts</h1>
          <p className="page-subtitle">
            Per-location alerts for purchased products — filter by Store / Warehouse
          </p>
        </div>
      </div>

      <div className="card-padded mb-4">
        <label className="block text-xs font-semibold text-slate-500 mb-2">
          Filter by location
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setLocationFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              locationFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Locations
          </button>
          {locations.map((loc) => (
            <button
              key={loc.id}
              type="button"
              onClick={() => setLocationFilter(loc.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
                String(locationFilter) === String(loc.id)
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <HiOutlineLocationMarker className="w-3.5 h-3.5" />
              {loc.label || loc.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        {typeCards.map((card) => (
          <div
            key={card.key}
            className={`card-padded cursor-pointer hover:shadow-card-hover transition-all ${
              typeFilter === card.key ? `ring-2 ${card.ring}` : ''
            }`}
            onClick={() => setTypeFilter(card.key)}
          >
            <div className="flex items-center gap-3">
              <card.icon className={`w-8 h-8 ${card.iconColor}`} />
              <div>
                <span className="block text-2xl font-bold text-slate-900">{card.count}</span>
                <span className="block text-sm text-slate-500">{card.label}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Loading alerts...</div>
      ) : (
        <div className="flex flex-col gap-4 sm:gap-6">
          {filteredAlerts.length === 0 ? (
            <div className="card-padded text-center py-10 text-slate-500 text-sm">
              No alerts for the selected filters.
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id || alert._id}
                className={`card-padded border-l-4 transition-all hover:shadow-card-hover ${
                  alertBgClasses[alert.type] || 'bg-slate-50 border-l-slate-400'
                }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="shrink-0">{getAlertIcon(alert.type)}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 m-0 mb-1">
                      {alert.productId?.name || 'No Product'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/80 border border-slate-200 text-slate-700 font-medium">
                        <HiOutlineLocationMarker className="w-3.5 h-3.5 text-indigo-500" />
                        {alert.destination || alert.locationName || alert.location || '—'}
                      </span>
                      <span>
                        {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : ''}
                      </span>
                    </div>
                  </div>
                  {getAlertBadge(alert.type)}
                </div>

                <div className="mb-4">
                  {alert.type === 'low-stock' && (
                    <div className="flex flex-col gap-2">
                      <p className="m-0 text-sm text-slate-900">
                        Stock at destination: <strong>{alert.quantity} units</strong>
                      </p>
                      <p className="m-0 text-sm text-slate-900">
                        Reorder point:{' '}
                        <strong>{alert.reorderPoint ?? alert.productId?.reorderLevel} units</strong>
                      </p>
                      <p className="m-0 text-sm text-slate-600 italic mt-2 p-2 bg-slate-100 rounded-lg">
                        Stock is below the reorder point at this location. Consider restocking or transferring.
                      </p>
                    </div>
                  )}

                  {alert.type === 'out-of-stock' && (
                    <div className="flex flex-col gap-2">
                      <p className="m-0 text-sm text-slate-900">
                        Stock at destination: <strong>0 units</strong>
                      </p>
                      <p className="m-0 text-sm text-slate-900">
                        Reorder point:{' '}
                        <strong>{alert.reorderPoint ?? alert.productId?.reorderLevel} units</strong>
                      </p>
                      <p className="m-0 text-sm text-slate-600 italic mt-2 p-2 bg-slate-100 rounded-lg">
                        Product is out of stock at this location. Immediate action required.
                      </p>
                    </div>
                  )}

                  {(alert.type === 'expiring' || alert.type === 'expired') && (
                    <div className="flex flex-col gap-2">
                      <p className="m-0 text-sm text-slate-900">
                        Batch: <strong>{alert.batchNumber}</strong>
                      </p>
                      <p className="m-0 text-sm text-slate-900">
                        Destination:{' '}
                        <strong>{alert.destination || alert.locationName || alert.location}</strong>
                      </p>
                      <p className="m-0 text-sm text-slate-900">
                        Remaining Qty: <strong>{alert.quantity}</strong>
                      </p>
                      <p className="m-0 text-sm text-slate-900">
                        Expiry Date:{' '}
                        <strong>{new Date(alert.expiryDate).toLocaleDateString()}</strong>
                      </p>
                      <p className="m-0 text-sm text-slate-600 italic mt-2 p-2 bg-slate-100 rounded-lg">
                        {alert.type === 'expired'
                          ? 'This batch has expired. Immediate action required.'
                          : 'This batch is expiring soon. Plan stock rotation.'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    className="btn-secondary !py-1.5 !px-3 !text-xs"
                    onClick={() => navigate(`/products/${alert.productId?._id}`)}
                  >
                    View Product
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default StockAlerts;
