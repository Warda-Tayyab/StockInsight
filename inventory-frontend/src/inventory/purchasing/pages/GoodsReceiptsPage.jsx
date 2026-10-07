/** @module inventory/purchasing/pages/GoodsReceiptsPage */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlinePrinter,
  HiOutlineClipboardCheck,
  HiOutlineCalendar,
  HiOutlineDocumentText,
  HiOutlineReceiptTax,
  HiOutlineEye,
} from 'react-icons/hi';
import purchaseService from '../../../shared/services/purchaseService';
import PurchaseReceiptModal from '../components/PurchaseReceiptModal';

const GoodsReceiptsPage = () => {
  const [receipts, setReceipts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'today'
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const loadData = async (filterTab = activeTab) => {
    setLoading(true);
    try {
      const [recRes, sumRes] = await Promise.all([
        purchaseService.listReceipts(filterTab === 'today' ? { filter: 'today' } : {}),
        purchaseService.getSummary(),
      ]);
      setReceipts(recRes.data.data || []);
      setSummary(sumRes.data.data || null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load purchase receipts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab]);

  return (
    <div className="page-container">
      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Receive & Bills History</h1>
          <p className="page-subtitle">
            Purchase receive history, POS printable receipts, and today's purchase tracker
          </p>
        </div>
        <Link to="/purchasing/receive/new" className="btn-primary inline-flex items-center gap-2 no-underline">
          <HiOutlinePlus className="w-4 h-4" />
          New Receive
        </Link>
      </div>

      {/* TOP OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* TOTAL PURCHASES */}
        <div className="card-padded flex items-center gap-4 bg-white border border-slate-200">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <HiOutlineClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase m-0">Total Purchases</p>
            <h3 className="text-xl font-bold text-slate-900 m-0 mt-0.5">
              {summary?.totalPurchasesCount ?? '—'} <span className="text-xs font-normal text-slate-500">GRNs</span>
            </h3>
            <p className="text-xs font-semibold text-indigo-600 m-0 mt-0.5">
              Rs {(summary?.totalPurchasedAmount || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* TODAY'S PURCHASES */}
        <div className="card-padded flex items-center gap-4 bg-white border border-emerald-200 bg-emerald-50/20">
          <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700">
            <HiOutlineCalendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-emerald-700 font-semibold uppercase m-0">Today's Purchases</p>
            <h3 className="text-xl font-bold text-slate-900 m-0 mt-0.5">
              {summary?.todaysPurchasesCount ?? 0} <span className="text-xs font-normal text-slate-500">Today</span>
            </h3>
            <p className="text-xs font-bold text-emerald-700 m-0 mt-0.5">
              Rs {(summary?.todaysPurchasedAmount || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* OPEN POs */}
        <div className="card-padded flex items-center gap-4 bg-white border border-slate-200">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <HiOutlineDocumentText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase m-0">Open Orders (POs)</p>
            <h3 className="text-xl font-bold text-slate-900 m-0 mt-0.5">
              {summary?.openPos ?? '—'}
            </h3>
            <p className="text-xs text-slate-500 m-0 mt-0.5">Pending Delivery</p>
          </div>
        </div>

        {/* UNPAID BILLS
        <div className="card-padded flex items-center gap-4 bg-white border border-slate-200">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
            <HiOutlineReceiptTax className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase m-0">Unpaid Supplier Bills</p>
            <h3 className="text-xl font-bold text-slate-900 m-0 mt-0.5">
              {summary?.unpaidBills ?? '—'}
            </h3>
            <p className="text-xs text-rose-600 font-medium m-0 mt-0.5">Payment Pending</p>
          </div>
        </div> */}
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Purchases ({summary?.totalPurchasesCount || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('today')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'today'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-300 inline-block animate-pulse"></span>
            Today's Purchases ({summary?.todaysPurchasesCount || 0})
          </button>
        </div>

        <span className="text-xs text-slate-500">
          Showing {receipts.length} purchase record(s)
        </span>
      </div>

      {/* TABLE */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>GRN #</th>
                <th>Supplier</th>
                <th>PO Ref</th>
                <th>Location</th>
                <th>Items</th>
                <th className="text-right">Total Amount</th>
                <th>Status</th>
                <th>Date & Time</th>
                <th className="text-center">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-500">
                    Loading purchases…
                  </td>
                </tr>
              ) : receipts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    {activeTab === 'today'
                      ? "No purchases received today yet."
                      : "No purchase receipts found. Click 'New Receive' to record stock intake."}
                  </td>
                </tr>
              ) : (
                receipts.map((r) => {
                  const lineTotalSum = (r.items || []).reduce(
                    (sum, i) => sum + Number(i.quantity || 0) * Number(i.unitCost || 0),
                    0
                  );
                  const totalAmt = r.subtotal || lineTotalSum;

                  return (
                    <tr key={r._id} className="hover:bg-slate-50/80">
                      <td className="font-mono font-medium">
                        <Link to={`/purchasing/receive/${r._id}`} className="text-indigo-600 font-semibold no-underline">
                          {r.grnNumber}
                        </Link>
                      </td>
                      <td className="font-medium text-slate-900">{r.vendorId?.name || '—'}</td>
                      <td className="text-slate-600 text-xs font-mono">{r.purchaseOrderId?.poNumber || 'Direct'}</td>
                      <td>
                        {r.locationId?.name || '—'}
                        {r.locationId?.locationType && (
                          <span className="text-xs text-slate-400 ml-1">
                            ({r.locationId.locationType})
                          </span>
                        )}
                      </td>
                      <td className="font-semibold">{r.items?.length || 0}</td>
                      <td className="text-right font-mono font-bold text-slate-900">
                        Rs {totalAmt.toLocaleString()}
                      </td>
                      <td>
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 capitalize">
                          {r.status || 'posted'}
                        </span>
                      </td>
                      <td className="text-xs text-slate-500">
                        {r.receivedDate
                          ? new Date(r.receivedDate).toLocaleString()
                          : r.createdAt
                          ? new Date(r.createdAt).toLocaleString()
                          : '—'}
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedReceipt(r)}
                            className="btn-secondary !py-1 !px-2.5 text-xs flex items-center gap-1 !border-slate-300 hover:!bg-indigo-50 hover:!text-indigo-600 hover:!border-indigo-300"
                            title="View & Print Purchase Receipt"
                          >
                            <HiOutlinePrinter className="w-3.5 h-3.5" />
                            Receipt
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRINTABLE RECEIPT MODAL */}
      {selectedReceipt && (
        <PurchaseReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};

export default GoodsReceiptsPage;
