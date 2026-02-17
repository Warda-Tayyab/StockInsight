/** @module inventory/inventory-management/components/InventoryForm */

import { useState } from 'react';
import './InventoryForm.css';

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
    <form data-testid="inventory-form" onSubmit={handleSubmit} className="inventory-form">
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            Product Name <span className="required">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className={`form-input ${errors.name ? 'error' : ''}`}
            placeholder="Enter product name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="sku" className="form-label">
            SKU <span className="required">*</span>
          </label>
          <input
            id="sku"
            name="sku"
            type="text"
            className={`form-input ${errors.sku ? 'error' : ''}`}
            placeholder="e.g., PROD-001"
            value={formData.sku}
            onChange={handleChange}
            required
          />
          {errors.sku && <span className="form-error">{errors.sku}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="category" className="form-label">
            Category <span className="required">*</span>
          </label>
          <select
            id="category"
            name="category"
            className={`form-select ${errors.category ? 'error' : ''}`}
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
          {errors.category && <span className="form-error">{errors.category}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="price" className="form-label">
            Price ($) <span className="required">*</span>
          </label>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            className={`form-input ${errors.price ? 'error' : ''}`}
            placeholder="0.00"
            value={formData.price}
            onChange={handleChange}
            required
          />
          {errors.price && <span className="form-error">{errors.price}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="stock" className="form-label">
            Stock Quantity <span className="required">*</span>
          </label>
          <input
            id="stock"
            name="stock"
            type="number"
            min="0"
            className={`form-input ${errors.stock ? 'error' : ''}`}
            placeholder="0"
            value={formData.stock}
            onChange={handleChange}
            required
          />
          {errors.stock && <span className="form-error">{errors.stock}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="reorderPoint" className="form-label">
            Reorder Point
          </label>
          <input
            id="reorderPoint"
            name="reorderPoint"
            type="number"
            min="0"
            className="form-input"
            placeholder="Minimum stock level"
            value={formData.reorderPoint}
            onChange={handleChange}
          />
        </div>

        <div className="form-group form-group-full">
          <label htmlFor="description" className="form-label">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            className="form-textarea"
            rows="4"
            placeholder="Enter product description..."
            value={formData.description}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {isEdit ? 'Update Product' : 'Add Product'}
        </button>
      </div>
    </form>
  );
};

export default InventoryForm;
