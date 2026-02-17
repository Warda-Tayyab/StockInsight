/** @module inventory/inventory-management/pages/EditProduct */

import { useNavigate, useParams } from 'react-router-dom';
import InventoryForm from '../components/InventoryForm';
import './EditProduct.css';

const EditProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Dummy data - in real app, fetch from API
  const initialData = {
    name: 'Widget A',
    sku: 'WID-A-001',
    category: 'Electronics',
    description: 'High-quality widget for various applications',
    price: 29.99,
    stock: 45,
    reorderPoint: 20,
    unit: 'units',
  };

  const handleSubmit = (formData) => {
    // Simulate API call
    console.log('Updating product:', id, formData);
    // In real app, would call API here
    setTimeout(() => {
      navigate('/products');
    }, 500);
  };

  const handleCancel = () => {
    navigate('/products');
  };

  return (
    <div data-testid="edit-product-page" className="edit-product-page">
      <div className="page-header">
        <div>
          <h1>Edit Product</h1>
          <p className="page-subtitle">Update product information</p>
        </div>
      </div>

      <div className="card">
        <InventoryForm
          isEdit={true}
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default EditProduct;
