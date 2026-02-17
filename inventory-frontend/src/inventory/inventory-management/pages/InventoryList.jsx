/** @module inventory/inventory-management/pages/InventoryList */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import './InventoryList.css';

const InventoryList = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Dummy inventory data
  const inventory = [
    { id: 1, product: 'Widget A', location: 'Warehouse A', quantity: 45, status: 'in-stock' },
    { id: 2, product: 'Gadget B', location: 'Warehouse B', quantity: 12, status: 'low-stock' },
    { id: 3, product: 'Tool C', location: 'Warehouse A', quantity: 78, status: 'in-stock' },
    { id: 4, product: 'Component D', location: 'Warehouse C', quantity: 5, status: 'low-stock' },
    { id: 5, product: 'Accessory E', location: 'Warehouse A', quantity: 120, status: 'in-stock' },
  ];

  const filteredInventory = inventory.filter(item =>
    item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    if (status === 'in-stock') {
      return <span className="badge badge-success">In Stock</span>;
    }
    return <span className="badge badge-warning">Low Stock</span>;
  };

  return (
    <div data-testid="inventory-list-page" className="inventory-list-page">
      <div className="page-header">
        <div>
          <h1>Inventory List</h1>
          <p className="page-subtitle">View inventory across all locations</p>
        </div>
        <button className="btn btn-primary">Add Inventory</button>
      </div>

      <div className="inventory-filters card">
        <div className="filter-group">
          <label className="form-label">Search Inventory</label>
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="form-input"
              placeholder="Search by product or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="filter-group">
          <label className="form-label">Location</label>
          <select className="form-select">
            <option>All Locations</option>
            <option>Warehouse A</option>
            <option>Warehouse B</option>
            <option>Warehouse C</option>
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
              <th>Product</th>
              <th>Location</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.length > 0 ? (
              filteredInventory.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link to={`/products/${item.id}`} className="product-link">
                      {item.product}
                    </Link>
                  </td>
                  <td>{item.location}</td>
                  <td>{item.quantity} units</td>
                  <td>{getStatusBadge(item.status)}</td>
                  <td>
                    <div className="table-actions">
                      <Link to={`/products/${item.id}`} className="btn btn-secondary btn-sm">
                        View
                      </Link>
                      <button className="btn btn-primary btn-sm">Adjust</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center" style={{ padding: '2rem' }}>
                  No inventory found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryList;
