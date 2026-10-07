/** @module inventory/inventory-management/pages/AddWarehouse */

import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast'
import WarehouseForm from '../components/WarehouseForm';
import api from '../../../shared/utils/api';
const AddWarehouse = () => {
  const navigate = useNavigate();
  const handleSubmit = async (formData) => {
    try {
      const token = localStorage.getItem("token");
  
      if (!token) {
        alert("Unauthorized. Please login again.");
        return;
      }
  
      await api.post("/api/warehouses", formData);
  
      toast.success("Warehouse Created Successfully 🚀");
  
      navigate("/settings/warehouses");
  
    } catch (error) {
      console.error("Add Warehouse Error:", error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const handleCancel = () => {
    navigate('/settings/warehouses');
  };

  return (
    <div data-testid="add-warehouse-page" className="page-container">
    <Toaster position="top-right" reverseOrder={false} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Add New Warehouse</h1>
          <p className="page-subtitle">Create a new warehouse location in your system</p>
        </div>
      </div>

      <div className="card-padded">
  <WarehouseForm
    onSubmit={handleSubmit}
    onCancel={handleCancel}
  />
</div>

    </div>
  );
};

export default AddWarehouse;