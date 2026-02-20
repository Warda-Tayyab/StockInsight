/** @module inventory/inventory-management/pages/AddProduct */

import { useNavigate } from 'react-router-dom';
import InventoryForm from '../components/InventoryForm';

const AddProduct = () => {
  const navigate = useNavigate();

 const handleSubmit = async (formData) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Unauthorized. Please login again.");
      return;
    }

    const response = await fetch("http://localhost:5000/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to add product");
    }

    alert("Product Added Successfully 🚀");

    navigate("/products");

  } catch (error) {
    console.error("Add Product Error:", error);
    alert(error.message);
  }
};


  const handleCancel = () => {
    navigate('/products');
  };

  return (
    <div data-testid="add-product-page" className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Add New Product</h1>
          <p className="text-gray-600 text-sm m-0">Create a new product entry in your inventory</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md">
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
