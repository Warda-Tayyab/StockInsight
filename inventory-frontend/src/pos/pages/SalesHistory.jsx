/** @module pos/pages/SalesHistory */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Receipt from '../components/Receipt';
import { usePOSContext } from '../context/POSContext';
import { Receipt as ReceiptIcon } from 'lucide-react';
import { Calendar, DollarSign, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { HiOutlineSearch, HiOutlineFilter } from 'react-icons/hi';
import { calculateSaleReturnAmount } from '../../shared/utils/helpers';

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const SalesHistory = () => {
const { sales, todayStats } = usePOSContext();

const [selectedSale, setSelectedSale] = useState(null);

const [search, setSearch] = useState('');
const [dateFilter, setDateFilter] = useState('');
const [range, setRange] = useState('');
const [discountFilter, setDiscountFilter] = useState('');
const [min, setMin] = useState('');
const [max, setMax] = useState('');
const [sort, setSort] = useState('latest');
const filteredSales = useMemo(() => {
  let data = [...sales];

  // 🔍 SEARCH
  if (search) {
    data = data.filter((s) =>
      s.invoiceId?.toLowerCase().includes(search.toLowerCase()) ||
      s.items?.some(i =>
        i.productName?.toLowerCase().includes(search.toLowerCase())
      )
    );
  }

  // 📅 DATE
 if (dateFilter) {
  data = data.filter((s) => {
    const saleDate = new Date(s.createdAt);

    const saleYMD = saleDate.getFullYear() + '-' +
      String(saleDate.getMonth() + 1).padStart(2, '0') + '-' +
      String(saleDate.getDate()).padStart(2, '0');

    return saleYMD === dateFilter;
  });
}

  // ⚡ RANGE
  if (range === 'today') {
    const today = new Date().toDateString();
    data = data.filter((s) =>
      new Date(s.createdAt).toDateString() === today
    );
  }

  if (range === 'week') {
    const now = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);

    data = data.filter((s) =>
      new Date(s.createdAt) >= weekAgo
    );
  }

  if (range === 'month') {
    const now = new Date();
    const monthAgo = new Date();
    monthAgo.setMonth(now.getMonth() - 1);

    data = data.filter((s) =>
      new Date(s.createdAt) >= monthAgo
    );
  }

  // 🏷️ DISCOUNT FILTER
  if (discountFilter === 'coupon') {
    data = data.filter((s) => Boolean(
      s.couponCode ||
      (s.couponDiscountAmount && Number(s.couponDiscountAmount) > 0)
    ));
  } else if (discountFilter === 'product_discount') {
    data = data.filter((s) => Boolean(
      (s.storeDiscountAmount && Number(s.storeDiscountAmount) > 0) ||
      s.items?.some((i) =>
        Number(i.discountAmount || 0) > 0 ||
        (i.originalLineTotal != null && Number(i.originalLineTotal) > Number(i.discountedLineTotal || i.lineTotal))
      )
    ));
  } else if (discountFilter === 'any_discount') {
    data = data.filter((s) => Boolean(
      s.couponCode ||
      (s.couponDiscountAmount && Number(s.couponDiscountAmount) > 0) ||
      (s.storeDiscountAmount && Number(s.storeDiscountAmount) > 0) ||
      s.items?.some((i) =>
        Number(i.discountAmount || 0) > 0 ||
        (i.originalLineTotal != null && Number(i.originalLineTotal) > Number(i.discountedLineTotal || i.lineTotal))
      )
    ));
  }

  // 💰 MIN / MAX
  if (min) data = data.filter((s) => s.total >= Number(min));
  if (max) data = data.filter((s) => s.total <= Number(max));

  // 🔽 SORT
  if (sort === 'oldest') {
    data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else {
    data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  return data;
}, [sales, search, dateFilter, range, discountFilter, min, max, sort]);

const { totalReturnAmount, returnCount } = useMemo(() => {
  let amount = 0;
  let count = 0;
  for (const s of filteredSales) {
    const ret = calculateSaleReturnAmount(s);
    if (ret > 0 || (s.returnStatus && s.returnStatus !== 'none')) {
      amount += ret;
      count += 1;
    }
  }
  return { totalReturnAmount: amount, returnCount: count };
}, [filteredSales]);

const recentSales = filteredSales.slice(0, 20);
  return (

    
    <div data-testid="sales-history-page" className="page-container">
      <div>
        <h1 className="page-title">Sales History</h1>
        <p className="page-subtitle">Today&apos;s sales and recent transactions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-padded stat-border-success border-t-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="card-title">Today&apos;s Sales</h3>
              
              <p className="text-sm text-slate-500 m-0">{todayStats.transactions} transaction(s)</p>

            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">Rs.{(todayStats.totalSales || 0).toFixed(2)}</p>
        </div>

        <div className="card-padded stat-border-danger border-t-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="card-title">Customer Returns</h3>
              <p className="text-sm text-slate-500 m-0">{returnCount} return transaction(s)</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600">Rs.{totalReturnAmount.toFixed(2)}</p>
        </div>

        <div className="card-padded stat-border-primary border-t-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="card-title">Total Transactions</h3>
              <p className="text-sm text-slate-500 m-0">All time</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-indigo-600">{sales.length}</p>
        </div>
      </div>

      <div className="table-container">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="card-title flex items-center gap-2 m-0">
            <ReceiptIcon  className="w-5 h-5 text-indigo-600" />
            Recent Transactions
          </h3>
          <Link to="/returns" className="link-primary text-sm no-underline">
            Returns & Exchange →
          </Link>
        </div>
        {/* Search & Filters */}
<div className="card-padded !rounded-none !border-0 !shadow-none flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">

  {/* Search */}
  <div className="relative w-full sm:flex-1 sm:min-w-[180px]">
    <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
    <input
      type="text"
      placeholder="Search invoice or product..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="input-field pl-10 w-full"
    />
  </div>

  {/* Calendar */}
  <input
    type="date"
    value={dateFilter}
    onChange={(e) => setDateFilter(e.target.value)}
    className="select-field w-full sm:w-auto"
  />

  {/* Quick Filter */}
<select
  value={range}
  onChange={(e) => setRange(e.target.value)}
  className="select-field w-full sm:w-auto"
>
  <option value="">All Time</option>
  <option value="today">Today</option>
  <option value="week">Last 7 Days</option>
  <option value="month">This Month</option>
</select>

{/* Discount Filter */}
<select
  value={discountFilter}
  onChange={(e) => setDiscountFilter(e.target.value)}
  className="select-field w-full sm:w-auto"
>
  <option value="">All Discounts</option>
  <option value="coupon">Coupons Only</option>
  <option value="product_discount">Product Discounts Only</option>
  <option value="any_discount">Any Discount</option>
</select>

{/* Min Amount */}
<input
  type="number"
  placeholder="Min Rs."
  value={min}
  onChange={(e) => setMin(e.target.value)}
  className="input-field w-full sm:w-24"
/>

{/* Max Amount */}
<input
  type="number"
  placeholder="Max Rs"
  value={max}
  onChange={(e) => setMax(e.target.value)}
  className="input-field w-full sm:w-24"
/>
  

  {/* Sort */}
  
  <select
  value={sort}
  onChange={(e) => setSort(e.target.value)}
  className="select-field w-full sm:w-auto"
>
  <option value="latest">Newest</option>
  <option value="oldest">Oldest</option>
</select>

  {/* ❌ Clear Icon Button */}
  <button
   type="button"
   onClick={() => {
  setSearch('');
  setDateFilter('');
  setRange('');
  setDiscountFilter('');
  setMin('');
  setMax('');
  setSort('latest');
}}
    className="btn-icon"
    aria-label="Clear filters"
  >
    <HiOutlineFilter className="w-4 h-4" />
  </button>

</div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  Invoice / Date
                </th>
                <th>
                  Items
                </th>
                <th>
                  Payment
                </th>
                <th>
                  Return
                </th>
                <th className="text-right">
                  Total
                </th>
                <th className="text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm">
                    No sales yet. Complete a sale from the POS to see transactions here.
                  </td>
                </tr>
              ) : (
                recentSales.map((sale) => (
                  <tr key={sale._id} 
                  onClick={(e) => {
  e.stopPropagation();
  setSelectedSale(sale);
}}
                  
                   
                  className="cursor-pointer">
                    <td>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-medium text-slate-900 m-0">
                          {sale.invoiceId || '—'}
                        </p>
                        {Boolean(sale.couponCode || (sale.couponDiscountAmount && Number(sale.couponDiscountAmount) > 0)) && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded">
                            Coupon: {sale.couponCode || 'Applied'}
                          </span>
                        )}
                        {Boolean((sale.storeDiscountAmount && Number(sale.storeDiscountAmount) > 0) || sale.items?.some(i => Number(i.discountAmount || 0) > 0 || (i.originalLineTotal != null && Number(i.originalLineTotal) > Number(i.discountedLineTotal || i.lineTotal)))) && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-800 rounded">
                            Disc Product
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 m-0">{formatDate(sale.createdAt)}</p>
                    </td>
                    <td>
                      <p className="text-sm text-slate-700 m-0">
                        {sale.items?.length ?? 0} item(s)
                      </p>
                      <p className="text-xs text-slate-500 m-0 line-clamp-2">
                        {sale.items?.map((i) => i.productName).join(', ') || '—'}
                      </p>
                    </td>
                    <td>
                      <span className="badge-neutral capitalize">
                        {sale.paymentMethod || 'Cash'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge capitalize ${
                        sale.returnStatus === 'full' ? 'badge-danger'
                          : sale.returnStatus === 'partial' ? 'badge-warning'
                            : 'badge-success'
                      }`}>
                        {sale.returnStatus || 'none'}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="text-sm font-semibold text-slate-900">
                        Rs.{(sale.total ?? 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="text-right">
                      {sale.returnStatus !== 'full' && sale.invoiceId && (
                        <Link
                          to={`/returns?invoice=${encodeURIComponent(sale.invoiceId)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="link-primary text-xs no-underline"
                        >
                          Return
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {selectedSale && (
    <Receipt
    sale={selectedSale}
    onClose={() => setSelectedSale(null)}
   />
)}
      </div>
    </div>
  );
};

export default SalesHistory;
