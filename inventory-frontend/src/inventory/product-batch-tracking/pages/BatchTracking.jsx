/** @module inventory/product-batch-tracking/pages/BatchTracking */

import { useState } from 'react';

const BatchTracking = () => {
  const [selectedBatch, setSelectedBatch] = useState(null);

  // Dummy batch data
  const batches = [
    { id: 1, batchNumber: 'BATCH-2024-001', product: 'Widget A', quantity: 100, receivedDate: '2024-01-15', expiryDate: '2025-01-15', status: 'active', location: 'Warehouse A' },
    { id: 2, batchNumber: 'BATCH-2024-002', product: 'Gadget B', quantity: 50, receivedDate: '2024-02-10', expiryDate: '2024-12-10', status: 'active', location: 'Warehouse B' },
    { id: 3, batchNumber: 'BATCH-2024-003', product: 'Tool C', quantity: 200, receivedDate: '2024-01-20', expiryDate: '2026-01-20', status: 'active', location: 'Warehouse A' },
    { id: 4, batchNumber: 'BATCH-2023-045', product: 'Component D', quantity: 25, receivedDate: '2023-12-01', expiryDate: '2024-12-01', status: 'expiring', location: 'Warehouse C' },
    { id: 5, batchNumber: 'BATCH-2024-004', product: 'Accessory E', quantity: 150, receivedDate: '2024-03-05', expiryDate: '2025-03-05', status: 'active', location: 'Warehouse A' },
  ];

  const usageHistory = selectedBatch ? [
    { id: 1, date: '2024-01-20', quantity: 10, type: 'sale', reference: 'SO-001' },
    { id: 2, date: '2024-02-05', quantity: 5, type: 'transfer', reference: 'TR-002' },
    { id: 3, date: '2024-02-15', quantity: 15, type: 'sale', reference: 'SO-015' },
    { id: 4, date: '2024-03-01', quantity: 8, type: 'sale', reference: 'SO-028' },
  ] : [];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>;
      case 'expiring':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Expiring Soon</span>;
      case 'expired':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Expired</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{status}</span>;
    }
  };

  return (
    <div data-testid="batch-tracking-page" className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Batch Tracking</h1>
          <p className="text-gray-600 text-sm m-0">Track product batches and usage history</p>
        </div>
      </div>

      <div className={`grid gap-6 ${selectedBatch ? 'grid-cols-1 lg:grid-cols-[1fr_400px]' : 'grid-cols-1'}`}>
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 m-0">Product Batches</h3>
            <input
              type="text"
              className="max-w-[300px] px-3.5 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
              placeholder="Search batches..."
            />
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Batch Number</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Product</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Quantity</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Received Date</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Expiry Date</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Status</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Location</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr
                    key={batch.id}
                    className={`transition-colors cursor-pointer ${
                      selectedBatch?.id === batch.id ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedBatch(batch)}
                  >
                    <td className="px-4 py-4 border-b border-gray-200 text-sm text-gray-900">
                      <span className="font-semibold">{batch.batchNumber}</span>
                    </td>
                    <td className="px-4 py-4 border-b border-gray-200 text-sm text-gray-900">{batch.product}</td>
                    <td className="px-4 py-4 border-b border-gray-200 text-sm text-gray-900">{batch.quantity}</td>
                    <td className="px-4 py-4 border-b border-gray-200 text-sm text-gray-900">{batch.receivedDate}</td>
                    <td className="px-4 py-4 border-b border-gray-200 text-sm text-gray-900">{batch.expiryDate}</td>
                    <td className="px-4 py-4 border-b border-gray-200 text-sm">{getStatusBadge(batch.status)}</td>
                    <td className="px-4 py-4 border-b border-gray-200 text-sm text-gray-900">{batch.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedBatch && (
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 m-0">Batch Details</h3>
                <button
                  className="bg-white text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                  onClick={() => setSelectedBatch(null)}
                >
                  Close
                </button>
              </div>
              
              <div className="flex flex-col gap-4">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600 font-medium">Batch Number:</span>
                  <span className="text-sm text-gray-900 font-semibold">{selectedBatch.batchNumber}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600 font-medium">Product:</span>
                  <span className="text-sm text-gray-900 font-semibold">{selectedBatch.product}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600 font-medium">Quantity:</span>
                  <span className="text-sm text-gray-900 font-semibold">{selectedBatch.quantity} units</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600 font-medium">Received Date:</span>
                  <span className="text-sm text-gray-900 font-semibold">{selectedBatch.receivedDate}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600 font-medium">Expiry Date:</span>
                  <span className="text-sm text-gray-900 font-semibold">{selectedBatch.expiryDate}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600 font-medium">Status:</span>
                  <span className="text-sm">{getStatusBadge(selectedBatch.status)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-600 font-medium">Location:</span>
                  <span className="text-sm text-gray-900 font-semibold">{selectedBatch.location}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 m-0">Usage History</h3>
              </div>
              
              <div className="mt-4">
                {usageHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Date</th>
                          <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Quantity</th>
                          <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Type</th>
                          <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usageHistory.map((usage) => (
                          <tr key={usage.id} className="transition-colors hover:bg-gray-50">
                            <td className="px-4 py-4 border-b border-gray-200 text-sm text-gray-900">{usage.date}</td>
                            <td className="px-4 py-4 border-b border-gray-200 text-sm text-gray-900">{usage.quantity}</td>
                            <td className="px-4 py-4 border-b border-gray-200 text-sm">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                usage.type === 'sale' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {usage.type}
                              </span>
                            </td>
                            <td className="px-4 py-4 border-b border-gray-200 text-sm text-gray-900">{usage.reference}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-600">No usage history available</p>
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
