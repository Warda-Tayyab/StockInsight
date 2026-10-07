import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlinePlus, HiOutlineSearch, HiOutlineRefresh } from 'react-icons/hi';
import purchaseService from '../../../shared/services/purchaseService';
import toast from 'react-hot-toast';

const PurchaseReturnsPage = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchReturns();
  }, [search]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await purchaseService.listReturns({ search: search || undefined });
      setReturns(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load purchase returns');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Returns</h1>
          <p className="page-subtitle">Return purchased stock back to suppliers and update inventory batches</p>
        </div>
        <Link
          to="/purchasing/returns/new"
          className="btn-primary inline-flex items-center gap-2 no-underline"
        >
          <HiOutlinePlus className="w-5 h-5" />
          New Purchase Return
        </Link>
      </div>

      <div className="card-padded mb-6">
        <div className="relative flex items-center max-w-md">
          <HiOutlineSearch className="absolute left-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            className="input-field !pl-10"
            placeholder="Search by return number (PR-…)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Return #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Supplier</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Items</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Total Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-500">Loading purchase returns…</td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-500">
                    No purchase returns recorded yet.
                  </td>
                </tr>
              ) : (
                returns.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                      <Link to={`/purchasing/returns/${r._id}`} className="text-indigo-600 hover:underline no-underline">
                        {r.returnNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(r.returnDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                      {r.vendorId?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {r.locationId?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {r.items?.length || 0} items
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                      Rs. {(r.totalAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        {r.status || 'posted'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <Link
                        to={`/purchasing/returns/${r._id}`}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline no-underline"
                      >
                        View Details
                      </Link>
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

export default PurchaseReturnsPage;
