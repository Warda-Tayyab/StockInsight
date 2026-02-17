/** @module inventory/inventory-management/pages/AddProduct */

import { useNavigate } from 'react-router-dom';
import InventoryForm from '../components/InventoryForm';
import './AddProduct.css';

const AddProduct = () => {
  const navigate = useNavigate();

  const handleSubmit = (formData) => {
    // Simulate API call
    console.log('Adding product:', formData);
    // In real app, would call API here
    setTimeout(() => {
      navigate('/products');
    }, 500);
  };

  const handleCancel = () => {
    navigate('/products');
  };

  return (
    <div data-testid="add-product-page" className="add-product-page">
      <div className="page-header">
        <div>
          <h1>Add New Product</h1>
          <p className="page-subtitle">Create a new product entry in your inventory</p>
        </div>
      </div>

      <div className="card">
        <InventoryForm
          isEdit={false}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default AddProduct;
