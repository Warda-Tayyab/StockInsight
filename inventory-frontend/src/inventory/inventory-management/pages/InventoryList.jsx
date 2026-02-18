/** @module inventory/inventory-management/pages/InventoryList */

import { useState } from 'react';
import { Link } from 'react-router-dom';

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
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">In Stock</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Low Stock</span>;
  };

  return (
    <div data-testid="inventory-list-page" className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Inventory List</h1>
          <p className="text-gray-600 text-sm m-0">View inventory across all locations</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Add Inventory</button>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium text-gray-900">Search Inventory</label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-gray-400 text-base">🔍</span>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
                placeholder="Search by product or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium text-gray-900">Location</label>
            <select className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100">
              <option>All Locations</option>
              <option>Warehouse A</option>
              <option>Warehouse B</option>
              <option>Warehouse C</option>
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
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Product</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Location</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Quantity</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Status</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.length > 0 ? (
              filteredInventory.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-4 border-b border-gray-200 text-sm">
                    <Link to={`/products/${item.id}`} className="text-blue-600 font-medium transition-colors hover:text-blue-700 hover:underline">
                      {item.product}
                    </Link>
                  </td>
                  <td className="px-4 py-4 border-b border-gray-200 text-sm text-gray-900">{item.location}</td>
                  <td className="px-4 py-4 border-b border-gray-200 text-sm text-gray-900">{item.quantity} units</td>
                  <td className="px-4 py-4 border-b border-gray-200 text-sm">{getStatusBadge(item.status)}</td>
                  <td className="px-4 py-4 border-b border-gray-200 text-sm">
                    <div className="flex gap-2">
                      <Link to={`/products/${item.id}`} className="bg-white text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">
                        View
                      </Link>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">Adjust</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-8 text-gray-500">No inventory found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryList;
