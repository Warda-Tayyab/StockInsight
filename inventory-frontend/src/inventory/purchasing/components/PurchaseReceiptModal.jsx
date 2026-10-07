import React from 'react';
import { HiOutlinePrinter, HiOutlineX } from 'react-icons/hi';
import { useAuthContext } from '../../../shared/context/AuthContext';
import { getTenantDisplayName } from '../../../shared/utils/tenantBrand';

const PurchaseReceiptModal = ({ receipt, onClose }) => {
  const { user } = useAuthContext();
  const tenantName = getTenantDisplayName(user);

  if (!receipt) return null;

  const vendorName = receipt.vendorId?.name || receipt.vendorName || 'Supplier';
  const vendorCode = receipt.vendorId?.code || '';
  const vendorPhone = receipt.vendorId?.phone || '';
  const locationName = receipt.locationId?.name || 'Store';
  const poNumber = receipt.purchaseOrderId?.poNumber || 'Direct Purchase';
  const billNumber = receipt.billId?.billNumber || 'Auto-Bill';
  const dateStr = receipt.receivedDate
    ? new Date(receipt.receivedDate).toLocaleString()
    : receipt.createdAt
    ? new Date(receipt.createdAt).toLocaleString()
    : new Date().toLocaleString();

  const items = receipt.items || [];
  const totalAmount = receipt.subtotal
    || items.reduce((sum, i) => sum + Number(i.quantity || 0) * Number(i.unitCost || 0), 0);

  const handlePrint = () => {
    const printContent = document.getElementById('purchase-receipt-print-area');
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=750,height=900');
    printWindow.document.write(`
      <html>
        <head>
          <title>Purchase Receipt - ${receipt.grnNumber || 'GRN'}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #1e293b;
              padding: 20px;
              background: #fff;
            }
            .receipt-box {
              max-width: 650px;
              margin: 0 auto;
              border: 1px solid #e2e8f0;
              padding: 24px;
              border-radius: 8px;
            }
            .header-title {
              font-size: 20px;
              font-weight: 700;
              text-transform: uppercase;
              text-align: center;
              margin: 0;
            }
            .badge {
              background: #0f172a;
              color: #fff;
              font-size: 12px;
              font-weight: 700;
              text-transform: uppercase;
              text-align: center;
              padding: 4px 8px;
              margin: 12px 0 16px 0;
              letter-spacing: 1px;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px 16px;
              font-size: 13px;
              margin-bottom: 16px;
            }
            .meta-item {
              margin: 0;
            }
            .meta-label {
              font-weight: 600;
              color: #64748b;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 16px;
              font-size: 13px;
            }
            th {
              background: #f8fafc;
              border-bottom: 2px solid #cbd5e1;
              text-align: left;
              padding: 8px;
              font-weight: 700;
              color: #334155;
            }
            td {
              border-bottom: 1px solid #e2e8f0;
              padding: 8px;
            }
            .text-right {
              text-align: right;
            }
            .total-row {
              font-weight: 700;
              font-size: 15px;
              border-top: 2px solid #0f172a;
            }
            .footer-note {
              margin-top: 24px;
              font-size: 11px;
              color: #94a3b8;
              text-align: center;
              border-top: 1px dashed #cbd5e1;
              padding-top: 12px;
            }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  };

  return (
    <div className="modal-overlay z-[9999]" onClick={onClose}>
      <div
        className="modal-content max-w-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold m-0">PURCHASE RECEIPT</h3>
            <span className="bg-indigo-600 text-xs px-2.5 py-0.5 rounded font-mono font-medium">
              {receipt.grnNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="btn-primary !bg-indigo-600 hover:!bg-indigo-700 !text-white flex items-center gap-1.5 text-sm py-1.5 px-3"
            >
              <HiOutlinePrinter className="w-4 h-4" />
              Print Receipt
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-icon !border-slate-700 !bg-slate-800 !text-white hover:!bg-slate-700 hover:!text-white"
            >
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* RECEIPT BODY (SCROLLABLE & PRINTABLE AREA) */}
        <div className="p-6 overflow-y-auto bg-slate-50">
          <div
            id="purchase-receipt-print-area"
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
          >
            {/* COMPANY / STORE NAME */}
            <div className="text-center mb-2">
              <h2 className="text-xl font-bold text-slate-900 m-0 uppercase tracking-wide">
                {tenantName}
              </h2>
              <p className="text-xs text-slate-500 m-0 mt-0.5">Stock & Inventory Management</p>
            </div>

            {/* RECEIPT BANNER */}
            <div className="bg-slate-900 text-white text-center py-1.5 rounded font-bold text-xs tracking-wider uppercase mb-4">
              Goods Received Note (Purchase Receipt)
            </div>

            {/* META DETAILS GRID */}
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
              <div>
                <p className="m-0">
                  <span className="font-semibold text-slate-500">GRN #:</span>{' '}
                  <strong className="text-slate-900">{receipt.grnNumber}</strong>
                </p>
                <p className="m-0 mt-1">
                  <span className="font-semibold text-slate-500">Date:</span> {dateStr}
                </p>
                <p className="m-0 mt-1">
                  <span className="font-semibold text-slate-500">Status:</span>{' '}
                  <span className="uppercase font-bold text-emerald-600">{receipt.status || 'Posted'}</span>
                </p>
              </div>
              <div>
                <p className="m-0">
                  <span className="font-semibold text-slate-500">Supplier:</span>{' '}
                  <strong className="text-slate-900">{vendorName}</strong> {vendorCode && `(${vendorCode})`}
                </p>
                {vendorPhone && (
                  <p className="m-0 mt-1">
                    <span className="font-semibold text-slate-500">Contact:</span> {vendorPhone}
                  </p>
                )}
                <p className="m-0 mt-1">
                  <span className="font-semibold text-slate-500">Location:</span> {locationName}
                </p>
                <p className="m-0 mt-1">
                  <span className="font-semibold text-slate-500">PO Ref:</span> {poNumber}
                </p>
              </div>
            </div>

            {/* ITEMS TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 uppercase font-semibold">
                    <th className="p-2">#</th>
                    <th className="p-2">Item Name</th>
                    <th className="p-2">Batch #</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Unit Cost</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((item, idx) => {
                    const qty = Number(item.quantity || 0);
                    const cost = Number(item.unitCost || 0);
                    const lineTotal = qty * cost;

                    return (
                      <tr key={item._id || idx} className="hover:bg-slate-50">
                        <td className="p-2 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-2 font-medium text-slate-900">
                          {item.productName || item.productId?.name || 'Item'}
                          {item.sku && <span className="text-slate-400 text-[11px] block">SKU: {item.sku}</span>}
                        </td>
                        <td className="p-2 font-mono text-slate-600">{item.batchNumber || '—'}</td>
                        <td className="p-2 text-right font-semibold">{qty}</td>
                        <td className="p-2 text-right text-slate-600">Rs {cost.toLocaleString()}</td>
                        <td className="p-2 text-right font-bold text-slate-900">Rs {lineTotal.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-900 bg-slate-50 font-bold text-slate-900 text-sm">
                    <td colSpan={3} className="p-2 text-right uppercase">
                      Total Purchased Value:
                    </td>
                    <td className="p-2 text-right">
                      {items.reduce((sum, i) => sum + Number(i.quantity || 0), 0)}
                    </td>
                    <td className="p-2"></td>
                    <td className="p-2 text-right text-indigo-700 font-mono">
                      Rs {totalAmount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* NOTES & FOOTER */}
            {receipt.notes && (
              <div className="mt-4 p-2.5 bg-amber-50 rounded border border-amber-200 text-xs text-amber-900">
                <strong>Notes:</strong> {receipt.notes}
              </div>
            )}

            <div className="mt-6 pt-3 border-t border-dashed border-slate-300 text-center text-[11px] text-slate-400">
              <p className="m-0">Computer-generated Goods Receipt Note • Verified Stock Entry</p>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-3 flex justify-between items-center shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            Bill Reference: <strong className="text-slate-700">{billNumber}</strong>
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="btn-primary !bg-indigo-600 hover:!bg-indigo-700 text-sm flex items-center gap-1.5"
            >
              <HiOutlinePrinter className="w-4 h-4" />
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseReceiptModal;
