import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye } from 'react-icons/fa';
import {
  HiOutlinePlus,
  HiOutlineMinus,
  HiOutlineCog,
  HiOutlineClock,
  HiOutlineSearch,
  HiOutlineRefresh,
} from 'react-icons/hi';
import api from '../../../shared/utils/api';

const InventoryList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState('all');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    fetchSummary();
  }, [debouncedSearch]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const query = debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : '';
      const res = await api.get(`/api/inventory/summary${query}`);
      setSummary(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSummary = useMemo(() => {
    if (locationFilter === 'warehouse') {
      return summary.filter((row) => row.warehouseQty > 0);
    }
    if (locationFilter === 'store') {
      return summary.filter((row) => row.storeQty > 0);
    }
    return summary;
  }, [summary, locationFilter]);

  const totals = useMemo(
    () =>
      filteredSummary.reduce(
        (acc, row) => ({
          warehouse: acc.warehouse + (row.warehouseQty || 0),
          store: acc.store + (row.storeQty || 0),
          total: acc.total + (row.totalQty || 0),
        }),
        { warehouse: 0, store: 0, total: 0 }
      ),
    [filteredSummary]
  );

  return (
    <div data-testid="inventory-list-page" className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory List</h1>
          <p className="page-subtitle">
            One line per product — warehouse and store stock shown separately
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/purchasing/receive/new"
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white text-sm shadow-sm no-underline"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Purchase Receive
          </Link>
          <Link
            to="/purchasing/returns/new"
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-sm shadow-sm no-underline"
          >
            <HiOutlineRefresh className="w-4 h-4" />
            Return Purchase
          </Link>
          <Link
            to="/inventory/history"
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-sm shadow-sm no-underline"
          >
            <HiOutlineClock className="w-4 h-4" />
            History
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-sm text-indigo-900">
        Receive new stock via <Link to="/purchasing/receive/new" className="font-semibold underline">Purchase Receive</Link>.
        After transfer, the <strong>same batch number</strong> moves to the store.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card-padded !py-3">
          <p className="text-xs text-slate-500 m-0">Warehouse stock</p>
          <p className="text-xl font-bold text-slate-900 m-0 mt-1">{totals.warehouse}</p>
        </div>
        <div className="card-padded !py-3">
          <p className="text-xs text-slate-500 m-0">Store stock (POS)</p>
          <p className="text-xl font-bold text-emerald-700 m-0 mt-1">{totals.store}</p>
        </div>
        <div className="card-padded !py-3">
          <p className="text-xs text-slate-500 m-0">Total units</p>
          <p className="text-xl font-bold text-indigo-700 m-0 mt-1">{totals.total}</p>
        </div>
      </div>

      <div className="card-padded">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div className="flex flex-col gap-2 w-full">
            <label className="form-label">Search product</label>
            <div className="relative flex items-center">
              <HiOutlineSearch className="absolute left-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="input-field !pl-10"
                placeholder="Search by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <label className="text-sm font-medium text-slate-900">Filter</label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full h-[42px] px-3.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600"
            >
              <option value="all">All products with stock</option>
              <option value="warehouse">Stock available in Warehouse</option>
              <option value="store">Stock available in Store</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[560px] sm:min-w-[720px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Product</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">SKU</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Warehouse</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Store</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Total</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">Loading…</td>
                </tr>
              ) : filteredSummary.length > 0 ? (
                filteredSummary.map((row) => (
                  <tr key={row.productId} className="hover:bg-slate-50">
                    <td className="px-4 py-4 border-b border-slate-200 text-sm">
                      <Link
                        to={`/products/${row.productId}`}
                        className="text-indigo-600 font-medium hover:underline"
                      >
                        {row.name}
                      </Link>
                    </td>
                    <td className="px-4 py-4 border-b border-slate-200 text-sm font-mono text-slate-700">
                      {row.sku}
                    </td>
                    <td className="px-4 py-4 border-b border-slate-200 text-sm">
                      {row.warehouseQty > 0 ? (
                        <span className="font-semibold text-amber-800">{row.warehouseQty}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                      <span className="text-slate-400 text-xs ml-1">{row.unit || 'pcs'}</span>
                    </td>
                    <td className="px-4 py-4 border-b border-slate-200 text-sm">
                      {row.storeQty > 0 ? (
                        <span className="font-semibold text-emerald-700">{row.storeQty}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                      <span className="text-slate-400 text-xs ml-1">{row.unit || 'pcs'}</span>
                    </td>
                    <td className="px-4 py-4 border-b border-slate-200 text-sm font-semibold">
                      {row.totalQty}
                    </td>
                    <td className="px-4 py-4 border-b border-slate-200 text-sm">
                      <Link
                        to={`/products/${row.productId}`}
                        className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 inline-flex"
                        title="View product"
                      >
                        <FaEye className="text-indigo-600" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    {debouncedSearch ? 'No stock found for this search' : 'No stock available'}
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

export default InventoryList;
