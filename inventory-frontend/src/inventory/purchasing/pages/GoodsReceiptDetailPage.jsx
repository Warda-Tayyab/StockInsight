/** @module inventory/purchasing/pages/GoodsReceiptDetailPage */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { HiOutlinePrinter } from 'react-icons/hi';
import purchaseService from '../../../shared/services/purchaseService';
import PurchaseReceiptModal from '../components/PurchaseReceiptModal';

const GoodsReceiptDetailPage = () => {
  const { id } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    purchaseService
      .getReceipt(id)
      .then((res) => setReceipt(res.data.data))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load'));
  }, [id]);

  if (!receipt) {
    return <div className="page-container py-12 text-center text-slate-500">Loading…</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{receipt.grnNumber}</h1>
          <p className="page-subtitle capitalize">Status: {receipt.status}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="btn-primary !bg-indigo-600 hover:!bg-indigo-700 flex items-center gap-2"
          >
            <HiOutlinePrinter className="w-4 h-4" />
            Print Receipt
          </button>
          <Link to="/purchasing/receive" className="btn-secondary no-underline">
            Back
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="card-padded">
          <p className="text-xs text-slate-500 m-0">Supplier</p>
          <p className="font-semibold m-0 mt-1">{receipt.vendorId?.name}</p>
        </div>
        <div className="card-padded">
          <p className="text-xs text-slate-500 m-0">PO</p>
          <p className="font-semibold m-0 mt-1">{receipt.purchaseOrderId?.poNumber || 'Direct'}</p>
        </div>
        <div className="card-padded">
          <p className="text-xs text-slate-500 m-0">Location</p>
          <p className="font-semibold m-0 mt-1">{receipt.locationId?.name}</p>
        </div>
        <div className="card-padded">
          <p className="text-xs text-slate-500 m-0">Bill</p>
          <p className="font-semibold m-0 mt-1">
            {receipt.billId?.billNumber || '—'}
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit cost</th>
                <th>Batch</th>
                <th>Expiry</th>
              </tr>
            </thead>
            <tbody>
              {(receipt.items || []).map((i) => (
                <tr key={i._id}>
                  <td>{i.productName}</td>
                  <td>{i.quantity}</td>
                  <td>Rs {Number(i.unitCost || 0).toLocaleString()}</td>
                  <td>{i.batchNumber || '—'}</td>
                  <td>{i.expiryDate ? new Date(i.expiryDate).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <PurchaseReceiptModal
          receipt={receipt}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default GoodsReceiptDetailPage;
