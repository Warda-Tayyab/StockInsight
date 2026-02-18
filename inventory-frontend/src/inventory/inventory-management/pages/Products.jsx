/** @module inventory/inventory-management/pages/Products */

import { useState } from 'react';
import { Link } from 'react-router-dom';

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dummy products data
  const products = [
    { id: 1, name: 'Widget A', category: 'Electronics', stock: 45, price: 29.99, status: 'in-stock', sku: 'WID-A-001' },
    { id: 2, name: 'Gadget B', category: 'Electronics', stock: 12, price: 49.99, status: 'low-stock', sku: 'GAD-B-002' },
    { id: 3, name: 'Tool C', category: 'Hardware', stock: 78, price: 19.99, status: 'in-stock', sku: 'TOL-C-003' },
    { id: 4, name: 'Component D', category: 'Electronics', stock: 5, price: 15.99, status: 'low-stock', sku: 'COM-D-004' },
    { id: 5, name: 'Accessory E', category: 'Accessories', stock: 120, price: 9.99, status: 'in-stock', sku: 'ACC-E-005' },
    { id: 6, name: 'Device F', category: 'Electronics', stock: 23, price: 99.99, status: 'in-stock', sku: 'DEV-F-006' },
    { id: 7, name: 'Part G', category: 'Hardware', stock: 8, price: 7.99, status: 'low-stock', sku: 'PRT-G-007' },
    { id: 8, name: 'Item H', category: 'Accessories', stock: 56, price: 12.99, status: 'in-stock', sku: 'ITM-H-008' },
    { id: 9, name: 'Product I', category: 'Electronics', stock: 34, price: 79.99, status: 'in-stock', sku: 'PRD-I-009' },
    { id: 10, name: 'Widget J', category: 'Hardware', stock: 67, price: 24.99, status: 'in-stock', sku: 'WID-J-010' },
    { id: 11, name: 'Gadget K', category: 'Electronics', stock: 3, price: 149.99, status: 'low-stock', sku: 'GAD-K-011' },
    { id: 12, name: 'Tool L', category: 'Hardware', stock: 89, price: 34.99, status: 'in-stock', sku: 'TOL-L-012' },
  ];

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (status) => {
    if (status === 'in-stock') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">In Stock</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Low Stock</span>;
  };

  return (
    <div data-testid="products-page" className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Products</h1>
          <p className="text-gray-600 text-sm m-0">Manage your product inventory</p>
        </div>
        <Link to="/products/add" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2">
          <span>➕</span>
          Add Product
        </Link>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium text-gray-900">Search Products</label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-gray-400 text-base">🔍</span>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
                placeholder="Search by name, SKU, or category..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium text-gray-900">Category</label>
            <select className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100">
              <option>All Categories</option>
              <option>Electronics</option>
              <option>Hardware</option>
              <option>Accessories</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium text-gray-900">Status</label>
            <select className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100">
              <option>All Status</option>
              <option>In Stock</option>
              <option>Low Stock</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">SKU</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Product Name</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Category</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Stock</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Price</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Status</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.length > 0 ? (
              paginatedProducts.map((product) => (
                <tr key={product.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-4 border-b border-gray-200 text-sm text-gray-900">
                    <span className="text-sm font-semibold">{product.sku}</span>
                  </td>
                  <td className="px-4 py-4 border-b border-gray-200 text-sm">
                    <Link to={`/products/${product.id}`} className="text-blue-600 font-medium transition-colors hover:text-blue-700 hover:underline">
                      {product.name}
                    </Link>
                  </td>
                  <td className="px-4 py-4 border-b border-gray-200 text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{product.category}</span>
                  </td>
                  <td className="px-4 py-4 border-b border-gray-200 text-sm text-gray-900">{product.stock}</td>
                  <td className="px-4 py-4 border-b border-gray-200 text-sm text-gray-900">${product.price.toFixed(2)}</td>
                  <td className="px-4 py-4 border-b border-gray-200 text-sm">{getStatusBadge(product.status)}</td>
                  <td className="px-4 py-4 border-b border-gray-200 text-sm">
                    <div className="flex gap-2">
                      <Link to={`/products/edit/${product.id}`} className="bg-white text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">
                        Edit
                      </Link>
                      <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500">No products found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-6 p-6 bg-white rounded-xl shadow-md">
          <button
            className="bg-white text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages} ({filteredProducts.length} products)
          </span>
          <button
            className="bg-white text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Products;
