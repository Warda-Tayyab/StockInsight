/** @module inventory/purchasing/pages/BillsPage */
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { HiOutlinePrinter, HiOutlineReceiptTax, HiOutlineCheckCircle } from 'react-icons/hi';
import purchaseService from '../../../shared/services/purchaseService';
import PurchaseReceiptModal from '../components/PurchaseReceiptModal';

const BillsPage = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await purchaseService.listBills();
      setBills(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openReceiptForBill = (bill) => {
    if (bill.goodsReceiptId && typeof bill.goodsReceiptId === 'object') {
      setSelectedReceipt(bill.goodsReceiptId);
      return;
    }

    // Construct receipt fallback object from bill info
    const fallbackReceipt = {
      _id: bill._id,
      grnNumber: bill.goodsReceiptId?.grnNumber || bill.billNumber,
      vendorId: bill.vendorId,
      purchaseOrderId: bill.purchaseOrderId,
      locationId: { name: 'Store' },
      receivedDate: bill.createdAt,
      createdAt: bill.createdAt,
      status: 'posted',
      items: bill.items || [],
      subtotal: bill.subtotal || bill.total || 0,
      notes: bill.notes || `Invoice Bill #${bill.billNumber}`,
      billId: { billNumber: bill.billNumber },
    };

    setSelectedReceipt(fallbackReceipt);
  };

  return (
    <div className="page-container">
      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Bills & Invoices</h1>
          <p className="page-subtitle">
            Supplier purchase invoices automatically settled on inventory receipt
          </p>
        </div>
      </div>

      {/* OVERVIEW METRIC CARD */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card-padded flex items-center gap-4 bg-white border border-slate-200">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <HiOutlineReceiptTax className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase m-0">Total Invoices</p>
            <h3 className="text-xl font-bold text-slate-900 m-0 mt-0.5">{bills.length}</h3>
          </div>
        </div>

        <div className="card-padded flex items-center gap-4 bg-white border border-emerald-200 bg-emerald-50/30">
          <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700">
            <HiOutlineCheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-emerald-700 font-semibold uppercase m-0">Total Settled Amount</p>
            <h3 className="text-xl font-bold text-slate-900 m-0 mt-0.5">
              Rs{' '}
              {bills
                .reduce((sum, b) => sum + Number(b.total || 0), 0)
                .toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="card-padded flex items-center gap-4 bg-white border border-slate-200">
          <div className="p-3 rounded-xl bg-slate-100 text-slate-700">
            <HiOutlinePrinter className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase m-0">Receipt Printable</p>
            <p className="text-xs font-semibold text-slate-700 m-0 mt-1">
              Click any bill row to print POS receipt
            </p>
          </div>
        </div>
      </div>

      {/* BILLS TABLE */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bill #</th>
                <th>Supplier</th>
                <th>PO / GRN Ref</th>
                <th className="text-center">Items</th>
                <th className="text-right">Total Amount</th>
                <th>Status</th>
                <th>Date & Time</th>
                <th className="text-center">Purchase Receipt</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500">
                    Loading bills…
                  </td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    No purchase bills recorded yet. Received purchases will automatically generate settled bills here.
                  </td>
                </tr>
              ) : (
                bills.map((b) => (
                  <tr
                    key={b._id}
                    className="hover:bg-slate-50/80 cursor-pointer"
                    onClick={() => openReceiptForBill(b)}
                  >
                    <td className="font-mono font-bold text-indigo-600">
                      {b.billNumber}
                    </td>
                    <td className="font-medium text-slate-900">
                      {b.vendorId?.name || 'Supplier'}
                    </td>
                    <td className="text-xs text-slate-500 font-mono">
                      {b.purchaseOrderId?.poNumber || 'Direct'} / {b.goodsReceiptId?.grnNumber || 'GRN'}
                    </td>
                    <td className="text-center font-semibold text-slate-700">
                      {b.items?.length || 0}
                    </td>
                    <td className="text-right font-mono font-bold text-slate-900">
                      Rs {Number(b.total || 0).toLocaleString()}
                    </td>
                    <td>
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 capitalize inline-flex items-center gap-1">
                        <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                        Paid
                      </span>
                    </td>
                    <td className="text-xs text-slate-500">
                      {b.createdAt ? new Date(b.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => openReceiptForBill(b)}
                        className="btn-secondary !py-1 !px-3 text-xs flex items-center gap-1.5 mx-auto !border-slate-300 hover:!bg-indigo-50 hover:!text-indigo-600 hover:!border-indigo-300"
                        title="View & Print Purchase Receipt"
                      >
                        <HiOutlinePrinter className="w-3.5 h-3.5" />
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))
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

export default BillsPage;
