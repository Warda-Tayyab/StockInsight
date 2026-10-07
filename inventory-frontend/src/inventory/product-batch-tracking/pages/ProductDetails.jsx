/** @module inventory/product-batch-tracking/pages/ProductDetails */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import api from "../../../shared/utils/api";
 const ProductDetails = () => {
 const { id } = useParams();
  const [product, setProduct] = useState(null);
  const token = localStorage.getItem('token');
  const [usageHistory, setUsageHistory] = useState([]);
const [batches, setBatches] = useState([]);


useEffect(() => {
  const fetchData = async () => {
    try {
      // PRODUCT DETAILS
      const productRes = await api.get(`/api/products/${id}`);

      setProduct(productRes.data);

      // PRODUCT BATCHES
      const batchRes = await api.get(`/api/batches/product/${id}`);

      const formattedBatches = batchRes.data.map((batch) => {
        const today = new Date();
        const expiry = batch.expiryDate
          ? new Date(batch.expiryDate)
          : null;

        let status = "active";

        if (expiry) {
          if (expiry < today) {
            status = "expired";
          } else {
            const diffDays = Math.ceil(
              (expiry - today) / (1000 * 60 * 60 * 24)
            );

            if (diffDays <= 30) {
              status = "expiring";
            }
          }
        }

        return {
          ...batch,
          quantity: batch.remainingQty,
          receivedDate: batch.receivedDate
            ? new Date(batch.receivedDate).toLocaleDateString()
            : "N/A",
          expiryDate: batch.expiryDate
            ? new Date(batch.expiryDate).toLocaleDateString()
            : "N/A",
          status,
        };
      });

      setBatches(formattedBatches);

      // PRODUCT HISTORY
      const historyRes = await api.get(`/api/inventory/product/${id}/history`);

      const formattedHistory = historyRes.data.map((item) => {
  let activityText = item.activityText;

  // ✅ Special handling for adjustment
  if (item.type === "adjust") {
    activityText = `Adjusted from ${item.previousQuantity} to ${item.newQuantity} units`;
  }

  return {
    date: item.createdAt
      ? new Date(item.createdAt).toLocaleDateString()
      : "N/A",
    activityText,
    activityIcon: item.activityIcon,
    reference: item.reference || item.note || "N/A",
  };
});

      setUsageHistory(formattedHistory);

    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  fetchData();
}, [id, token]);

const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>;
      case 'expiring':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Expiring Soon</span>;
      case 'expired':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Expired</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">{status}</span>;
    }
  };


  if (!product) return <div className="text-center py-8">Loading...</div>;

  // Dummy product data
   

  return (
    <div data-testid="product-details-page" className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          {product.image && (
            <img src={product.image} alt={product.name} className="w-28 h-28 object-cover rounded-md border" />
          )}
          <div>
          <Link to="/products" className="text-indigo-600 text-sm mb-2 inline-block transition-colors hover:text-indigo-700 hover:underline">← Back to Products</Link>
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">{product.name}</h1>
          <p className="text-slate-600 text-sm m-0">Product Details & Tracking</p>
          </div>
        </div>
        <div className="flex gap-4">
          <Link to={`/products/edit/${id}`} className="btn-primary">
            Edit Product
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-padded lg:col-span-2">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 m-0">Product Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-400 uppercase tracking-wide">SKU</span>
              <span className="text-sm text-slate-900 font-medium">{product.sku}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-400 uppercase tracking-wide">Barcode</span>
              <span className="text-sm text-slate-900 font-medium">{product.barcode || '—'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-400 uppercase tracking-wide">Name</span>
              <span className="text-sm text-slate-900 font-medium">{product.name}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-400 uppercase tracking-wide">Category</span>
              <span className="text-sm">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">{product.categoryId?.name}</span>
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-400 uppercase tracking-wide">Price</span>
              <span className="text-sm text-slate-900 font-medium">Rs.{product.sellingPrice}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-400 uppercase tracking-wide">Unit</span>
              <span className="text-sm text-slate-900 font-medium">{product.unit}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-400 uppercase tracking-wide">Reorder Point</span>
              <span className="text-sm text-slate-900 font-medium">{product.reorderLevel} units</span>
            </div>
          
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-400 uppercase tracking-wide">Supplier</span>
              <span className="text-sm text-slate-900 font-medium">{product.supplierName}</span>
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs text-slate-400 uppercase tracking-wide">Description</span>
              <span className="text-sm text-slate-900 font-medium">{product.description}</span>
            </div>
          </div>
        </div>

        <div className="card-padded">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 m-0">Batches</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">{batches.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[700px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Batch Number</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Barcode</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Cost Price</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Selling Price</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Vendor</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Quantity</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Received</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Status</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch, idx) => (
                  <tr key={idx} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-4 border-b border-slate-200 text-sm font-semibold font-mono text-slate-900">{batch.batchNumber}</td>
                    <td className="px-4 py-4 border-b border-slate-200 text-sm font-mono text-indigo-700">{batch.barcode || product.barcode || '—'}</td>
                    <td className="px-4 py-4 border-b border-slate-200 text-sm text-amber-800 font-medium">Rs.{batch.costPrice ?? product.costPrice}</td>
                    <td className="px-4 py-4 border-b border-slate-200 text-sm text-emerald-700 font-medium">Rs.{batch.sellingPrice ?? product.sellingPrice}</td>
                    <td className="px-4 py-4 border-b border-slate-200 text-sm text-slate-900">{batch.vendorName || product.supplierName || '—'}</td>
                    <td className="px-4 py-4 border-b border-slate-200 text-sm text-slate-900 font-semibold">{batch.quantity}</td>
                    <td className="px-4 py-4 border-b border-slate-200 text-sm text-slate-900">{batch.receivedDate}</td>
                    <td className="px-4 py-4 border-b border-slate-200 text-sm">
                      {getStatusBadge(batch.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-padded">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 m-0">Recent Activity</h3>
          </div>
          <div className="flex flex-col gap-4">
            {usageHistory.map((activity, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 rounded-lg transition-colors hover:bg-slate-50">
                
                <div className="text-2xl flex-shrink-0">
  {activity.activityIcon}
</div>
                <div className="flex-1 flex flex-col gap-1">
                  <p className="text-sm text-slate-900 m-0">
                    {activity.activityText}
                  </p>
                  <span className="text-xs text-slate-400">{activity.reference}</span>
                </div>
                <span className="text-xs text-slate-400">{activity.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
