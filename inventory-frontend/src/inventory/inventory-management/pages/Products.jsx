/** @module inventory/inventory-management/pages/Products */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Products.css';

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
      return <span className="badge badge-success">In Stock</span>;
    }
    return <span className="badge badge-warning">Low Stock</span>;
  };

  return (
    <div data-testid="products-page" className="products-page">
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p className="page-subtitle">Manage your product inventory</p>
        </div>
        <Link to="/products/add" className="btn btn-primary">
          <span>➕</span>
          Add Product
        </Link>
      </div>

      <div className="products-filters card">
        <div className="filter-group">
          <label className="form-label">Search Products</label>
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="form-input"
              placeholder="Search by name, SKU, or category..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
        <div className="filter-group">
          <label className="form-label">Category</label>
          <select className="form-select">
            <option>All Categories</option>
            <option>Electronics</option>
            <option>Hardware</option>
            <option>Accessories</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="form-label">Status</label>
          <select className="form-select">
            <option>All Status</option>
            <option>In Stock</option>
            <option>Low Stock</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.length > 0 ? (
              paginatedProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <span className="text-sm font-semibold">{product.sku}</span>
                  </td>
                  <td>
                    <Link to={`/products/${product.id}`} className="product-link">
                      {product.name}
                    </Link>
                  </td>
                  <td>
                    <span className="badge badge-primary">{product.category}</span>
                  </td>
                  <td>{product.stock}</td>
                  <td>${product.price.toFixed(2)}</td>
                  <td>{getStatusBadge(product.status)}</td>
                  <td>
                    <div className="table-actions">
                      <Link to={`/products/edit/${product.id}`} className="btn btn-secondary btn-sm">
                        Edit
                      </Link>
                      <button className="btn btn-danger btn-sm">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center" style={{ padding: '2rem' }}>
                  No products found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages} ({filteredProducts.length} products)
          </span>
          <button
            className="btn btn-secondary btn-sm"
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
