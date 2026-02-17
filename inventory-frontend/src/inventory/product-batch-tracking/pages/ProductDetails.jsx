/** @module inventory/product-batch-tracking/pages/ProductDetails */

import { useParams, Link } from 'react-router-dom';
import './ProductDetails.css';

const ProductDetails = () => {
  const { id } = useParams();

  // Dummy product data
  const product = {
    id: id,
    name: 'Widget A',
    sku: 'WID-A-001',
    category: 'Electronics',
    description: 'High-quality widget designed for various industrial and commercial applications. Features durable construction and reliable performance.',
    price: 29.99,
    stock: 45,
    reorderPoint: 20,
    status: 'in-stock',
    batches: [
      { batchNumber: 'BATCH-2024-001', quantity: 30, receivedDate: '2024-01-15', expiryDate: '2025-01-15', status: 'active' },
      { batchNumber: 'BATCH-2024-002', quantity: 15, receivedDate: '2024-02-10', expiryDate: '2025-02-10', status: 'active' },
    ],
    recentActivity: [
      { date: '2024-04-01', type: 'sale', quantity: 5, reference: 'SO-045' },
      { date: '2024-03-28', type: 'sale', quantity: 10, reference: 'SO-042' },
      { date: '2024-03-25', type: 'received', quantity: 15, reference: 'PO-123' },
    ],
  };

  return (
    <div data-testid="product-details-page" className="product-details-page">
      <div className="page-header">
        <div>
          <Link to="/products" className="back-link">← Back to Products</Link>
          <h1>{product.name}</h1>
          <p className="page-subtitle">Product Details & Tracking</p>
        </div>
        <div className="product-actions">
          <Link to={`/products/edit/${id}`} className="btn btn-secondary">
            Edit Product
          </Link>
          <button className="btn btn-primary">Add Stock</button>
        </div>
      </div>

      <div className="product-details-grid">
        <div className="product-info card">
          <div className="card-header">
            <h3 className="card-title">Product Information</h3>
          </div>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">SKU</span>
              <span className="info-value">{product.sku}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Category</span>
              <span className="info-value">
                <span className="badge badge-primary">{product.category}</span>
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Price</span>
              <span className="info-value">${product.price.toFixed(2)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Current Stock</span>
              <span className="info-value">{product.stock} units</span>
            </div>
            <div className="info-item">
              <span className="info-label">Reorder Point</span>
              <span className="info-value">{product.reorderPoint} units</span>
            </div>
            <div className="info-item">
              <span className="info-label">Status</span>
              <span className="info-value">
                <span className="badge badge-success">In Stock</span>
              </span>
            </div>
            <div className="info-item info-item-full">
              <span className="info-label">Description</span>
              <span className="info-value">{product.description}</span>
            </div>
          </div>
        </div>

        <div className="product-batches card">
          <div className="card-header">
            <h3 className="card-title">Batches</h3>
            <span className="badge badge-primary">{product.batches.length}</span>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Batch Number</th>
                  <th>Quantity</th>
                  <th>Received</th>
                  <th>Expiry</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {product.batches.map((batch, idx) => (
                  <tr key={idx}>
                    <td>{batch.batchNumber}</td>
                    <td>{batch.quantity}</td>
                    <td>{batch.receivedDate}</td>
                    <td>{batch.expiryDate}</td>
                    <td>
                      <span className="badge badge-success">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="product-activity card">
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
          </div>
          <div className="activity-list">
            {product.recentActivity.map((activity, idx) => (
              <div key={idx} className="activity-item">
                <div className="activity-icon">
                  {activity.type === 'sale' ? '💰' : '📦'}
                </div>
                <div className="activity-content">
                  <p className="activity-text">
                    {activity.type === 'sale' ? 'Sold' : 'Received'} {activity.quantity} units
                  </p>
                  <span className="activity-reference">{activity.reference}</span>
                </div>
                <span className="activity-date">{activity.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
