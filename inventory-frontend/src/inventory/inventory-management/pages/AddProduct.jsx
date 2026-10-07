/** @module inventory/inventory-management/pages/AddProduct */
import { Toaster, toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom';
import ProductForm from '../components/ProductForm';
import api from '../../../shared/utils/api';
const AddProduct = () => {
  const navigate = useNavigate();

 const handleSubmit = async (formData) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Unauthorized. Please login again.");
      return;
    }

    let response;
    if (formData instanceof FormData) {
      response = await api.post("/api/products", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } else {
      response = await api.post("/api/products", formData);
    }
    const { data } = response;
toast.success("Product Added Successfully 🚀");

    navigate("/products");

  } catch (error) {
    console.error("Add Product Error:", error);
    toast.error(error.response?.data?.message || error.message);
  }
};


  const handleCancel = () => {
    navigate('/products');
  };

  return (
    <div data-testid="add-product-page" className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Add New Product</h1>
          <p className="page-subtitle">Create a new product entry in your inventory</p>
        </div>
      </div>

      <div className="card-padded">
        <ProductForm
          isEdit={false}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default AddProduct;
