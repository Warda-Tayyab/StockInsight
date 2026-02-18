/** @module inventory/product-batch-tracking/pages/ProductDetails */

import { useParams, Link } from 'react-router-dom';

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
    <div data-testid="product-details-page" className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <Link to="/products" className="text-blue-600 text-sm mb-2 inline-block transition-colors hover:text-blue-700 hover:underline">← Back to Products</Link>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">{product.name}</h1>
          <p className="text-gray-600 text-sm m-0">Product Details & Tracking</p>
        </div>
        <div className="flex gap-4">
          <Link to={`/products/edit/${id}`} className="bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Edit Product
          </Link>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Add Stock</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-md lg:col-span-2">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 m-0">Product Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400 uppercase tracking-wide">SKU</span>
              <span className="text-sm text-gray-900 font-medium">{product.sku}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400 uppercase tracking-wide">Category</span>
              <span className="text-sm">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{product.category}</span>
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400 uppercase tracking-wide">Price</span>
              <span className="text-sm text-gray-900 font-medium">${product.price.toFixed(2)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400 uppercase tracking-wide">Current Stock</span>
              <span className="text-sm text-gray-900 font-medium">{product.stock} units</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400 uppercase tracking-wide">Reorder Point</span>
              <span className="text-sm text-gray-900 font-medium">{product.reorderPoint} units</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400 uppercase tracking-wide">Status</span>
              <span className="text-sm">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">In Stock</span>
              </span>
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs text-gray-400 uppercase tracking-wide">Description</span>
              <span className="text-sm text-gray-900 font-medium">{product.description}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 m-0">Batches</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{product.batches.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Batch Number</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Quantity</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Received</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Expiry</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Status</th>
                </tr>
              </thead>
              <tbody>
                {product.batches.map((batch, idx) => (
                  <tr key={idx} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-4 border-b border-gray-200 text-sm text-gray-900">{batch.batchNumber}</td>
                    <td className="px-4 py-4 border-b border-gray-200 text-sm text-gray-900">{batch.quantity}</td>
                    <td className="px-4 py-4 border-b border-gray-200 text-sm text-gray-900">{batch.receivedDate}</td>
                    <td className="px-4 py-4 border-b border-gray-200 text-sm text-gray-900">{batch.expiryDate}</td>
                    <td className="px-4 py-4 border-b border-gray-200 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 m-0">Recent Activity</h3>
          </div>
          <div className="flex flex-col gap-4">
            {product.recentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 rounded-lg transition-colors hover:bg-gray-50">
                <div className="text-2xl flex-shrink-0">
                  {activity.type === 'sale' ? '💰' : '📦'}
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <p className="text-sm text-gray-900 m-0">
                    {activity.type === 'sale' ? 'Sold' : 'Received'} {activity.quantity} units
                  </p>
                  <span className="text-xs text-gray-400">{activity.reference}</span>
                </div>
                <span className="text-xs text-gray-400">{activity.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
