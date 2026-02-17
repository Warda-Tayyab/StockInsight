/** @module inventory/product-batch-tracking/pages/BatchTracking */

import { useState } from 'react';
import './BatchTracking.css';

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
        return <span className="badge badge-success">Active</span>;
      case 'expiring':
        return <span className="badge badge-warning">Expiring Soon</span>;
      case 'expired':
        return <span className="badge badge-error">Expired</span>;
      default:
        return <span className="badge badge-info">{status}</span>;
    }
  };

  return (
    <div data-testid="batch-tracking-page" className="batch-tracking-page">
      <div className="page-header">
        <div>
          <h1>Batch Tracking</h1>
          <p className="page-subtitle">Track product batches and usage history</p>
        </div>
      </div>

      <div className="batch-tracking-content">
        <div className="batch-list-section">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Product Batches</h3>
              <input
                type="text"
                className="form-input"
                placeholder="Search batches..."
                style={{ maxWidth: '300px' }}
              />
            </div>
            
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Batch Number</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Received Date</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch) => (
                    <tr
                      key={batch.id}
                      className={selectedBatch?.id === batch.id ? 'selected' : ''}
                      onClick={() => setSelectedBatch(batch)}
                    >
                      <td>
                        <span className="font-semibold">{batch.batchNumber}</span>
                      </td>
                      <td>{batch.product}</td>
                      <td>{batch.quantity}</td>
                      <td>{batch.receivedDate}</td>
                      <td>{batch.expiryDate}</td>
                      <td>{getStatusBadge(batch.status)}</td>
                      <td>{batch.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {selectedBatch && (
          <div className="batch-details-section">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Batch Details</h3>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedBatch(null)}
                >
                  Close
                </button>
              </div>
              
              <div className="batch-details">
                <div className="detail-item">
                  <span className="detail-label">Batch Number:</span>
                  <span className="detail-value">{selectedBatch.batchNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Product:</span>
                  <span className="detail-value">{selectedBatch.product}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Quantity:</span>
                  <span className="detail-value">{selectedBatch.quantity} units</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Received Date:</span>
                  <span className="detail-value">{selectedBatch.receivedDate}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Expiry Date:</span>
                  <span className="detail-value">{selectedBatch.expiryDate}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value">{getStatusBadge(selectedBatch.status)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Location:</span>
                  <span className="detail-value">{selectedBatch.location}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Usage History</h3>
              </div>
              
              <div className="usage-history">
                {usageHistory.length > 0 ? (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Quantity</th>
                          <th>Type</th>
                          <th>Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usageHistory.map((usage) => (
                          <tr key={usage.id}>
                            <td>{usage.date}</td>
                            <td>{usage.quantity}</td>
                            <td>
                              <span className={`badge ${usage.type === 'sale' ? 'badge-success' : 'badge-info'}`}>
                                {usage.type}
                              </span>
                            </td>
                            <td>{usage.reference}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-secondary">No usage history available</p>
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
