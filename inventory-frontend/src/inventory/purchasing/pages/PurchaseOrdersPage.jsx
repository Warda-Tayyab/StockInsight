/** @module inventory/purchasing/pages/PurchaseOrdersPage */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { HiOutlinePlus } from 'react-icons/hi';
import purchaseService from '../../../shared/services/purchaseService';

const statusClass = {
  draft: 'bg-slate-100 text-slate-700',
  ordered: 'bg-blue-50 text-blue-700',
  partial: 'bg-amber-50 text-amber-700',
  received: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-rose-50 text-rose-700',
};

const PurchaseOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await purchaseService.listOrders();
      setOrders(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load POs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markOrdered = async (id) => {
    try {
      await purchaseService.markOrdered(id);
      toast.success('PO marked as ordered');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="page-subtitle">Order from suppliers into a Store or Warehouse</p>
        </div>
        <Link to="/purchasing/orders/new" className="btn-primary inline-flex items-center gap-2 no-underline">
          <HiOutlinePlus className="w-4 h-4" />
          New PO
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>PO #</th>
                <th>Supplier</th>
                <th>Destination</th>
                <th>Items</th>
                <th>Subtotal</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    No purchase orders yet.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o._id}>
                    <td className="font-medium">
                      <Link to={`/purchasing/orders/${o._id}`} className="text-indigo-600 no-underline">
                        {o.poNumber}
                      </Link>
                    </td>
                    <td>{o.vendorId?.name || '—'}</td>
                    <td>
                      {o.locationId?.name || '—'}
                      {o.locationId?.locationType && (
                        <span className="ml-1 text-xs text-slate-400">
                          ({o.locationId.locationType})
                        </span>
                      )}
                    </td>
                    <td>{o.items?.length || 0}</td>
                    <td>Rs {Number(o.subtotal || 0).toLocaleString()}</td>
                    <td>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                          statusClass[o.status] || 'bg-slate-100'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">
                      {o.status === 'draft' && (
                        <button
                          type="button"
                          className="text-sm text-indigo-600 hover:underline mr-2"
                          onClick={() => markOrdered(o._id)}
                        >
                          Mark ordered
                        </button>
                      )}
                      {['ordered', 'partial'].includes(o.status) && (
                        <Link
                          to={`/purchasing/receive/new?po=${o._id}`}
                          className="text-sm text-emerald-600 hover:underline no-underline"
                        >
                          Receive
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrdersPage;
