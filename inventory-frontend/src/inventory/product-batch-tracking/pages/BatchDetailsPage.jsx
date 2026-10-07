/** @module inventory/product-batch-tracking/pages/BatchDetailsPage */

import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import api from "../../../shared/utils/api";
const BatchDetailsPage = () => {
  const { id } = useParams();

  const [batch, setBatch] = useState(null);
  const [usageHistory, setUsageHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // ✅ Batch details
        const batchRes = await api.get(`/api/batches/${id}`);

        const b = batchRes.data;

        setBatch({
          id: b._id,
          batchNumber: b.batchNumber,
          product: b.productId?.name || "N/A",
          productId: b.productId?._id, 
          quantity: b.remainingQty,
          costPrice: b.purchasePrice !== undefined && b.purchasePrice !== null ? `Rs.${b.purchasePrice}` : (b.productId?.costPrice !== undefined ? `Rs.${b.productId.costPrice}` : "N/A"),
          sellingPrice: b.productId?.sellingPrice !== undefined ? `Rs.${b.productId.sellingPrice}` : "N/A",
          supplierName: b.productId?.supplierName || "N/A",
          barcode: b.productId?.barcode || "N/A",
          receivedDate: b.receivedDate
            ? format(new Date(b.receivedDate), "dd-MM-yyyy")
            : "N/A",
          expiryDate: b.expiryDate
            ? format(new Date(b.expiryDate), "dd-MM-yyyy")
            : "N/A",
          location: b.warehouseId?.name || "N/A",
        });

        // ✅ Usage history
        const historyRes = await api.get(
          `/api/inventory/batch/${b._id}/history`
        );

       const formattedHistory = historyRes.data.map((item) => {
  let quantityDisplay = item.quantity;

  if (item.type === "adjust") {
    quantityDisplay = ` ${item.previousQuantity} → ${item.newQuantity}`;
  }

  return {
    id: item._id,
    date: item.createdAt
      ? format(new Date(item.createdAt), "dd-MM-yyyy")
      : "N/A",
    quantity: quantityDisplay,
    type: item.type,
    reference: item.reference || item.note || "N/A",
  };
});

        setUsageHistory(formattedHistory);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const getTypeBadge = (type) => {
    switch (type) {
      case "sale":
        return "bg-green-100 text-green-800";
      case "stock_out":
        return "bg-indigo-50 text-indigo-700";
      case "stock_in":
        return "bg-purple-100 text-purple-800";
      case "adjustment":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (!batch) {
    return <div className="text-center py-10">Batch not found</div>;
  }

  return (
    <div className="flex flex-col gap-6">

      {/* 🔵 HEADER (same style as ProductDetails) */}
      <div className="flex items-start justify-between gap-6">

        <div>
          <Link
            to="/batch-tracking"
            className="text-indigo-600 text-sm mb-2 inline-block hover:underline"
          >
            ← Back to Batch Tracking
          </Link>

          <h1 className="text-3xl font-semibold text-slate-900 mb-2">
             {batch.batchNumber}
        
          </h1>

          <p className="text-slate-600 text-sm m-0">
            Batch Details & Tracking
          </p>
        </div>

      </div>

      {/* 🟦 BATCH DETAILS CARD */}
      <div className="card p-6">

        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 m-0">
            Batch Details
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="flex justify-between py-2 border-b border-slate-200">
            <span className="text-sm text-slate-600 font-medium">Batch Number:</span>
            <span className="text-sm text-slate-900 font-semibold font-mono">
              {batch.batchNumber}
            </span>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-200">
            <span className="text-sm text-slate-600 font-medium">Product Name:</span>
            <span className="text-sm text-slate-900 font-semibold">
              {batch.product}
            </span>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-200">
            <span className="text-sm text-slate-600 font-medium">Barcode:</span>
            <span className="text-sm text-indigo-700 font-semibold font-mono">
              {batch.barcode}
            </span>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-200">
            <span className="text-sm text-slate-600 font-medium">Vendor / Supplier:</span>
            <span className="text-sm text-slate-900 font-semibold">
              {batch.supplierName}
            </span>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-200">
            <span className="text-sm text-slate-600 font-medium">Batch Cost Price:</span>
            <span className="text-sm text-amber-800 font-semibold">
              {batch.costPrice}
            </span>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-200">
            <span className="text-sm text-slate-600 font-medium">Selling Price:</span>
            <span className="text-sm text-emerald-700 font-semibold">
              {batch.sellingPrice}
            </span>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-200">
            <span className="text-sm text-slate-600 font-medium">Remaining Quantity:</span>
            <span className="text-sm text-slate-900 font-semibold">
              {batch.quantity}
            </span>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-200">
            <span className="text-sm text-slate-600 font-medium">Received Date:</span>
            <span className="text-sm text-slate-900 font-semibold">
              {batch.receivedDate}
            </span>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-200">
            <span className="text-sm text-slate-600 font-medium">Expiry Date:</span>
            <span className="text-sm text-slate-900 font-semibold">
              {batch.expiryDate}
            </span>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-200">
            <span className="text-sm text-slate-600 font-medium">Location:</span>
            <span className="text-sm text-slate-900 font-semibold">
              {batch.location}
            </span>
          </div>

        </div>
      </div>

      {/* 🟩 USAGE HISTORY CARD */}
      <div className="card p-6">

        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 m-0">
            Usage History
          </h2>
        </div>

        {usageHistory.length === 0 ? (
          <p className="text-center text-slate-600">
            No usage history available
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">

              <thead className="bg-slate-50">
  <tr>
    <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
      Date
    </th>
    <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
      Quantity
    </th>
    <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
      Type
    </th>
    <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
      Reference
    </th>
  </tr>
</thead>

              <tbody>
                {usageHistory.map((h) => (
                 
                   <tr
  key={h.id}
  className="transition-colors hover:bg-slate-50 cursor-pointer"
>
                        <td className="px-4 py-4 border-b border-slate-200 text-sm text-slate-900">
                      {h.date}
                    </td>

                        <td className="px-4 py-4 border-b border-slate-200 text-sm text-slate-900">
                      {h.quantity}
                    </td>

                  
            <td className="px-4 py-4 border-b border-slate-200 text-sm text-slate-900">

                      <span className={`px-2 py-1 rounded text-xs ${getTypeBadge(h.type)}`}>
                        {h.type}
                      </span>
                    </td>

                    <td className="px-4 py-4 border-b border-slate-200 text-sm text-slate-900">
                      {h.reference}
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

      </div>

    </div>
  );
};

export default BatchDetailsPage;