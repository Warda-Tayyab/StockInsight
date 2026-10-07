import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlinePrinter } from 'react-icons/hi';
import purchaseService from '../../../shared/services/purchaseService';

const PurchaseReturnDetailPage = () => {
  const { id } = useParams();
  const [ret, setRet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await purchaseService.getReturn(id);
        setRet(res.data?.data || null);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load purchase return');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="page-container">
        <p className="text-center py-12 text-slate-500">Loading purchase return details…</p>
      </div>
    );
  }

  if (!ret) {
    return (
      <div className="page-container">
        <p className="text-center py-12 text-slate-500">Purchase return document not found.</p>
        <div className="text-center">
          <Link to="/purchasing/returns" className="btn-secondary no-underline">
            Back to Purchase Returns
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Link to="/purchasing/returns" className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline mb-2 no-underline">
            <HiOutlineArrowLeft className="w-4 h-4" /> Back to Purchase Returns
          </Link>
          <h1 className="page-title">{ret.returnNumber}</h1>
          <p className="page-subtitle">Purchase Return Document Details</p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="btn-secondary inline-flex items-center gap-2"
        >
          <HiOutlinePrinter className="w-4 h-4" /> Print
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 card-padded mb-6">
        <div>
          <p className="text-xs text-slate-500 uppercase font-semibold">Supplier</p>
          <p className="font-bold text-slate-900 mt-1">{ret.vendorId?.name || '—'}</p>
          <p className="text-xs text-slate-500">{ret.vendorId?.code}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase font-semibold">Return Location</p>
          <p className="font-bold text-slate-900 mt-1">{ret.locationId?.name || '—'}</p>
          <p className="text-xs text-slate-500">{ret.locationId?.locationType}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase font-semibold">Return Date</p>
          <p className="font-bold text-slate-900 mt-1">{new Date(ret.returnDate).toLocaleDateString()}</p>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 mt-1">
            {ret.status}
          </span>
        </div>

        {ret.notes && (
          <div className="md:col-span-3 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500 uppercase font-semibold">Notes / Reason</p>
            <p className="text-sm text-slate-800 mt-0.5">{ret.notes}</p>
          </div>
        )}
      </div>

      <div className="card overflow-hidden mb-6">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">Returned Line Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Batch #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Qty Returned</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Unit Cost</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Reason</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ret.items?.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.productName}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 font-mono">{item.sku || '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-indigo-700 font-mono">{item.batchNumber}</td>
                  <td className="px-4 py-3 text-sm font-bold text-slate-900">{item.quantity}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">Rs. {Number(item.unitCost || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{item.reason || '—'}</td>
                  <td className="px-4 py-3 text-sm font-bold text-slate-900 text-right">
                    Rs. {(Number(item.quantity || 0) * Number(item.unitCost || 0)).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <div className="text-right">
            <span className="text-sm font-medium text-slate-600 mr-4">Total Amount:</span>
            <span className="text-2xl font-extrabold text-slate-900">
              Rs. {(ret.totalAmount || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseReturnDetailPage;
