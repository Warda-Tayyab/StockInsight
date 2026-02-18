/** @module inventory/inventory-management/pages/EditProduct */

import { useNavigate, useParams } from 'react-router-dom';
import InventoryForm from '../components/InventoryForm';

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
    <div data-testid="edit-product-page" className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Edit Product</h1>
          <p className="text-gray-600 text-sm m-0">Update product information</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md">
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
