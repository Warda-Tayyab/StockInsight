/** @module inventory/product-batch-tracking/pages/BatchTracking */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import api from "../../../shared/utils/api";
const BatchTracking = () => {
const [selectedBatch, setSelectedBatch] = useState(null);
const [batches, setBatches] = useState([]);
const [usageHistory, setUsageHistory] = useState([]);
const [loading, setLoading] = useState(true);
const [searchTerm, setSearchTerm] = useState('');
const token = localStorage.getItem('token');
 const navigate = useNavigate();
const getTypeBadge = (type) => {
  switch (type) {
    case 'sale':
      return 'bg-green-100 text-green-800';
    case 'stock_out':
      return 'bg-indigo-50 text-indigo-700';
    case 'stock_in':
      return 'bg-purple-100 text-purple-800';
    case 'adjustment':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
};
  
  useEffect(() => {
  const fetchBatches = async () => {
    try {
      const res = await api.get("/api/batches");

      const formatted = res.data.map((batch) => {
        const today = new Date();
        let status = 'active';

        if (batch.expiryDate) {
          const expiry = new Date(batch.expiryDate);
          const diffDays = Math.ceil(
            (expiry - today) / (1000 * 60 * 60 * 24)
          );

          if (diffDays <= 0) status = 'expired';
          else if (diffDays <= 180) status = 'expiring';
        }

        return {
          id: batch._id,
          batchNumber: batch.batchNumber,
          product: batch.productId?.name || 'N/A',
          quantity: batch.remainingQty,
          costPrice: batch.purchasePrice !== undefined && batch.purchasePrice !== null ? `$${batch.purchasePrice}` : (batch.productId?.costPrice !== undefined ? `$${batch.productId.costPrice}` : 'N/A'),
          sellingPrice: batch.productId?.sellingPrice !== undefined ? `$${batch.productId.sellingPrice}` : 'N/A',
          vendor: batch.productId?.supplierName || 'N/A',
          barcode: batch.productId?.barcode || 'N/A',
          receivedDate: batch.receivedDate
            ? format(new Date(batch.receivedDate), "dd-MM-yyyy")
            : "N/A",

          expiryDate: batch.expiryDate
            ? format(new Date(batch.expiryDate), "dd-MM-yyyy")
            : "N/A",

          status,
          location: batch.warehouseId?.name || 'N/A',
          productId: batch.productId?._id
        };
      });

      setBatches(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  fetchBatches();
}, [token]);

const filteredBatches = batches.filter(
  (batch) =>
    batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.vendor.toLowerCase().includes(searchTerm.toLowerCase())
);

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

  return (
    <div data-testid="batch-tracking-page" className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">Batch Tracking</h1>
          <p className="text-slate-600 text-sm m-0">Track product batches and usage history</p>
        </div>
      </div>

      <div className={`grid gap-6 ${selectedBatch ? 'grid-cols-1 lg:grid-cols-[1fr_400px]' : 'grid-cols-1'}`}>
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 m-0">Product Batches</h3>
            <input
              type="text"
              className="max-w-[300px] px-3.5 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm transition-all focus:outline-none focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100"
              placeholder="Search by batch, name, barcode, vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Batch Number</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Product</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Quantity</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Received Date</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Expiry Date</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Status</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Location</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map((batch) => (
                  <tr
                    key={batch.id}
                    className="transition-colors cursor-pointer hover:bg-slate-50"
                    onClick={() => {
                      navigate(`/batches/${batch.id}`);
                    }}
                  >
                    <td className="px-4 py-4 border-b border-slate-200 text-sm text-slate-900">
                      <span className="font-semibold">{batch.batchNumber}</span>
                    </td>
                    <td className="px-4 py-4 border-b border-slate-200 text-sm text-slate-900">{batch.product}</td>
                    <td className="px-4 py-4 border-b border-slate-200 text-sm text-slate-900">{batch.quantity}</td>
                    <td className="px-4 py-4 border-b border-slate-200 text-sm text-slate-900">{batch.receivedDate}</td>
                    <td className="px-4 py-4 border-b border-slate-200 text-sm text-slate-900">{batch.expiryDate}</td>
                    <td className="px-4 py-4 border-b border-slate-200 text-sm">{getStatusBadge(batch.status)}</td>
                    <td className="px-4 py-4 border-b border-slate-200 text-sm text-slate-900">{batch.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedBatch && (
          <div className="flex flex-col gap-6">
            <div className="card-padded">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 m-0">Batch Details</h3>
                <button
                  className="bg-white text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors"
                  onClick={() => setSelectedBatch(null)}
                >
                  Close
                </button>
              </div>
              
              <div className="flex flex-col gap-4">
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-sm text-slate-600 font-medium">Batch Number:</span>
                  <span className="text-sm text-slate-900 font-semibold">{selectedBatch.batchNumber}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-sm text-slate-600 font-medium">Product:</span>
                  <span className="text-sm text-slate-900 font-semibold">{selectedBatch.product}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-sm text-slate-600 font-medium">Quantity:</span>
                  <span className="text-sm text-slate-900 font-semibold">{selectedBatch.quantity} units</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-sm text-slate-600 font-medium">Received Date:</span>
                  <span className="text-sm text-slate-900 font-semibold">{selectedBatch.receivedDate}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-sm text-slate-600 font-medium">Expiry Date:</span>
                  <span className="text-sm text-slate-900 font-semibold">{selectedBatch.expiryDate}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-sm text-slate-600 font-medium">Status:</span>
                  <span className="text-sm">{getStatusBadge(selectedBatch.status)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-slate-600 font-medium">Location:</span>
                  <span className="text-sm text-slate-900 font-semibold">{selectedBatch.location}</span>
                </div>
              </div>
            </div>

            <div className="card-padded">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 m-0">Usage History</h3>
              </div>
              
              <div className="mt-4">
                {usageHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Date</th>
                          <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Quantity</th>
                          <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Type</th>
                          <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usageHistory.map((usage) => (
                          <tr key={usage.id} className="transition-colors hover:bg-slate-50">
                            <td className="px-4 py-4 border-b border-slate-200 text-sm text-slate-900">{usage.date}</td>
                            <td className="px-4 py-4 border-b border-slate-200 text-sm text-slate-900">{usage.quantity}</td>
                            <td className="px-4 py-4 border-b border-slate-200 text-sm">
                             <span className={`px-2 py-1 rounded text-xs ${getTypeBadge(usage.type)}`}>
  {usage.type}
</span>
                            </td>
                            <td className="px-4 py-4 border-b border-slate-200 text-sm text-slate-900">{usage.reference}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-slate-600">No usage history available</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchTracking;
