/** @module inventory/inventory-management/components/InventoryForm */

import { useState } from 'react';

const InventoryForm = ({ isEdit = false, initialData = {}, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    sku: initialData.sku || '',
    category: initialData.category || '',
    description: initialData.description || '',
    price: initialData.price || '',
    stock: initialData.stock || '',
    reorderPoint: initialData.reorderPoint || '',
    unit: initialData.unit || 'units',
    ...initialData,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Valid price is required';
    if (formData.stock === '' || formData.stock < 0) newErrors.stock = 'Valid stock quantity is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form data-testid="inventory-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="mb-6">
          <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className={`w-full px-3.5 py-2.5 border rounded-lg bg-white text-gray-900 text-sm transition-all focus:outline-none focus:ring-3 focus:ring-blue-100 ${
              errors.name ? 'border-red-500' : 'border-gray-200 focus:border-blue-600'
            }`}
            placeholder="Enter product name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          {errors.name && <span className="text-red-500 text-xs mt-1 block">{errors.name}</span>}
        </div>

        <div className="mb-6">
          <label htmlFor="sku" className="block text-sm font-medium text-gray-900 mb-2">
            SKU <span className="text-red-500">*</span>
          </label>
          <input
            id="sku"
            name="sku"
            type="text"
            className={`w-full px-3.5 py-2.5 border rounded-lg bg-white text-gray-900 text-sm transition-all focus:outline-none focus:ring-3 focus:ring-blue-100 ${
              errors.sku ? 'border-red-500' : 'border-gray-200 focus:border-blue-600'
            }`}
            placeholder="e.g., PROD-001"
            value={formData.sku}
            onChange={handleChange}
            required
          />
          {errors.sku && <span className="text-red-500 text-xs mt-1 block">{errors.sku}</span>}
        </div>

        <div className="mb-6">
          <label htmlFor="category" className="block text-sm font-medium text-gray-900 mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            name="category"
            className={`w-full px-3.5 py-2.5 border rounded-lg bg-white text-gray-900 text-sm transition-all focus:outline-none focus:ring-3 focus:ring-blue-100 ${
              errors.category ? 'border-red-500' : 'border-gray-200 focus:border-blue-600'
            }`}
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select category</option>
            <option value="Electronics">Electronics</option>
            <option value="Hardware">Hardware</option>
            <option value="Accessories">Accessories</option>
            <option value="Software">Software</option>
            <option value="Other">Other</option>
          </select>
          {errors.category && <span className="text-red-500 text-xs mt-1 block">{errors.category}</span>}
        </div>

        <div className="mb-6">
          <label htmlFor="price" className="block text-sm font-medium text-gray-900 mb-2">
            Price ($) <span className="text-red-500">*</span>
          </label>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            className={`w-full px-3.5 py-2.5 border rounded-lg bg-white text-gray-900 text-sm transition-all focus:outline-none focus:ring-3 focus:ring-blue-100 ${
              errors.price ? 'border-red-500' : 'border-gray-200 focus:border-blue-600'
            }`}
            placeholder="0.00"
            value={formData.price}
            onChange={handleChange}
            required
          />
          {errors.price && <span className="text-red-500 text-xs mt-1 block">{errors.price}</span>}
        </div>

        <div className="mb-6">
          <label htmlFor="stock" className="block text-sm font-medium text-gray-900 mb-2">
            Stock Quantity <span className="text-red-500">*</span>
          </label>
          <input
            id="stock"
            name="stock"
            type="number"
            min="0"
            className={`w-full px-3.5 py-2.5 border rounded-lg bg-white text-gray-900 text-sm transition-all focus:outline-none focus:ring-3 focus:ring-blue-100 ${
              errors.stock ? 'border-red-500' : 'border-gray-200 focus:border-blue-600'
            }`}
            placeholder="0"
            value={formData.stock}
            onChange={handleChange}
            required
          />
          {errors.stock && <span className="text-red-500 text-xs mt-1 block">{errors.stock}</span>}
        </div>

        <div className="mb-6">
          <label htmlFor="reorderPoint" className="block text-sm font-medium text-gray-900 mb-2">
            Reorder Point
          </label>
          <input
            id="reorderPoint"
            name="reorderPoint"
            type="number"
            min="0"
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
            placeholder="Minimum stock level"
            value={formData.reorderPoint}
            onChange={handleChange}
          />
        </div>

        <div className="mb-6 md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 resize-y min-h-[100px]"
            rows="4"
            placeholder="Enter product description..."
            value={formData.description}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
        <button type="button" className="bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          {isEdit ? 'Update Product' : 'Add Product'}
        </button>
      </div>
    </form>
  );
};

export default InventoryForm;
