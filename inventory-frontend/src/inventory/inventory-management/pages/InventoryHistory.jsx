import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineSearch, HiOutlineClock, HiOutlineArrowLeft, HiOutlineRefresh } from 'react-icons/hi';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';

const InventoryHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    fetchHistory();
  }, [debouncedSearch, typeFilter]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (typeFilter !== 'all') params.type = typeFilter;

      const res = await api.get('/api/inventory/history', { params });
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to load inventory history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'purchase_receive':
        return <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs font-semibold">Purchase Receive</span>;
      case 'purchase_return':
        return <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-semibold">Purchase Return</span>;
      case 'stock_in':
        return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">Stock In</span>;
      case 'stock_out':
        return <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-xs font-medium">Stock Out</span>;
      case 'adjust':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-medium">Adjustment</span>;
      case 'transfer_in':
      case 'transfer_out':
        return <span className="bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded text-xs font-medium">Stock Transfer</span>;
      case 'sale':
        return <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-medium">POS Sale</span>;
      case 'return':
      case 'write_off':
        return <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-medium">Customer Return</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-medium">{type}</span>;
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Link
            to="/inventory"
            className="text-indigo-600 text-xs font-medium mb-1 inline-flex items-center gap-1 hover:underline no-underline"
          >
            <HiOutlineArrowLeft className="w-3.5 h-3.5" /> Back to Inventory List
          </Link>
          <h1 className="page-title flex items-center gap-2">
            <HiOutlineClock className="w-7 h-7 text-indigo-600" />
            Inventory History
          </h1>
          <p className="page-subtitle">Track all inventory movement logs, receipts, returns, and adjustments</p>
        </div>
        <button
          type="button"
          onClick={fetchHistory}
          className="btn-secondary text-xs inline-flex items-center gap-1.5"
        >
          <HiOutlineRefresh className="w-4 h-4" /> Refresh History
        </button>
      </div>

      {/* Filters */}
      <div className="card-padded">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Search movement</label>
            <div className="relative flex items-center">
              <HiOutlineSearch className="absolute left-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="input-field !pl-10 text-sm"
                placeholder="Search product, batch #, reference (GRN/PR), note…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Filter by Type</label>
            <select
              className="select-field text-sm"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Movement Types</option>
              <option value="purchase_receive">Purchase Receive</option>
              <option value="purchase_return">Purchase Return</option>
              <option value="stock_in">Stock In</option>
              <option value="stock_out">Stock Out</option>
              <option value="adjust">Adjustment</option>
              <option value="transfer_in">Stock Transfer In</option>
              <option value="transfer_out">Stock Transfer Out</option>
              <option value="sale">POS Sale</option>
              <option value="write_off">Write-off / Customer Return</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[640px] sm:min-w-[900px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">Product</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">Location</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">Movement Type</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">Batch #</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">Qty</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">Previous</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">New Qty</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">Note / Reference</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">Logged By</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">Date / Time</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-slate-500">
                    Loading inventory history logs…
                  </td>
                </tr>
              ) : history.length > 0 ? (
                history.map((item) => {
                  const productName = item.productName || item.productId?.name || '—';
                  const locationName = item.warehouseId?.name || '—';
                  const batchNo = item.batchNumber || (item.batchUsage && item.batchUsage[0]?.batchNumber) || '—';

                  return (
                    <tr key={item._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3.5 text-sm font-medium text-slate-900">
                        {productName}
                        {item.sku && <span className="text-xs text-slate-400 block font-mono">{item.sku}</span>}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">{locationName}</td>
                      <td className="px-4 py-3.5">{getTypeBadge(item.type)}</td>
                      <td className="px-4 py-3.5 text-sm font-mono text-indigo-700 font-medium">{batchNo}</td>
                      <td className="px-4 py-3.5 text-sm font-bold text-slate-900">{item.quantity}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-500">{item.previousQuantity ?? '—'}</td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-slate-900">{item.newQuantity ?? '—'}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-600 max-w-xs truncate" title={item.note || item.activityText}>
                        {item.reference && (
                          <span className="font-semibold text-indigo-600 mr-1.5">[{item.reference}]</span>
                        )}
                        {item.note || item.activityText || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">
                        {item.createdBy ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900">
                              {item.createdBy.firstName} {item.createdBy.lastName}
                            </span>
                            <span className="text-[11px] text-slate-400">{item.createdBy.email}</span>
                          </div>
                        ) : (
                          'System'
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-slate-500">
                    No inventory history logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryHistory;