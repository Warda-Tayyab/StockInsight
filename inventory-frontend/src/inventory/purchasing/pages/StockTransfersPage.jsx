/** @module inventory/purchasing/pages/StockTransfersPage */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { HiOutlinePlus } from 'react-icons/hi';
import purchaseService from '../../../shared/services/purchaseService';

const StockTransfersPage = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    purchaseService
      .listTransfers()
      .then((res) => setTransfers(res.data.data || []))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load transfers'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Transfer</h1>
          <p className="page-subtitle">
  Warehouse → Store (optional). Small shops do not need this — receiving stock at the Store is sufficient.
</p>
        </div>
        <Link
          to="/purchasing/transfers/new"
          className="btn-primary inline-flex items-center gap-2 no-underline"
        >
          <HiOutlinePlus className="w-4 h-4" />
          New Transfer
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Transfer #</th>
                <th>From</th>
                <th>To</th>
                <th>Items</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    No transfers yet.
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t._id}>
                    <td className="font-medium">{t.transferNumber}</td>
                    <td>
                      {t.fromLocationId?.name}
                      <span className="text-xs text-slate-400 ml-1">
                        ({t.fromLocationId?.locationType || 'store'})
                      </span>
                    </td>
                    <td>
                      {t.toLocationId?.name}
                      <span className="text-xs text-slate-400 ml-1">
                        ({t.toLocationId?.locationType || 'store'})
                      </span>
                    </td>
                    <td>{t.items?.length || 0}</td>
                    <td className="capitalize">{t.status}</td>
                    <td>
                      {t.transferDate ? new Date(t.transferDate).toLocaleDateString() : '—'}
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

export default StockTransfersPage;
