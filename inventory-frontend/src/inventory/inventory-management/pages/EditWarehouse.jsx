/** @module inventory/inventory-management/pages/EditWarehouse */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Toaster, toast } from 'react-hot-toast'
import axios from "axios";
import WarehouseForm from "../components/WarehouseForm";
import api from "../../../shared/utils/api";
const EditWarehouse = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // FETCH SINGLE WAREHOUSE
  const fetchWarehouse = async () => {
    try {
      const res = await api.get(`/api/warehouses/${id}`);
      const warehouse = res.data.data || res.data; // depending on API response
      setInitialData({
        _id: warehouse._id,
        name: warehouse.name || "",
        code: warehouse.code || "",
        address: warehouse.address || "",
        city: warehouse.city || "",
        country: warehouse.country || "",
        postalCode: warehouse.postalCode || "",
        contactPerson: warehouse.contactPerson || "",
        phone: warehouse.phone || "",
        email: warehouse.email || "",
        description: warehouse.description || "",
        status: warehouse.status || "active",
      });

    } catch (err) {
      console.error(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouse();
  }, [id]);

  // UPDATE WAREHOUSE
  const handleSubmit = async (formData) => {
    try {
      const updatedData = {};
  
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== initialData[key]) {
          updatedData[key] = formData[key];
        }
      });
  
      await api.put(`/api/warehouses/${id}`, updatedData);
  
      toast.success("Warehouse updated successfully 🚀");
      setTimeout(() => navigate("/settings/warehouses"), 300);
  
    } catch (err) {
      console.error(err.response?.data || err.message);
      toast.error(
        err.response?.data?.message || "Failed to update warehouse ❌"
      );
    }
  };
  const handleCancel = () => navigate("/settings/warehouses");

  if (loading) {
    return (
      <div className="text-center py-10 text-slate-500">
        Loading warehouse...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 mb-2">
          Edit Warehouse
        </h1>
        <p className="text-slate-600 text-sm">
          Update warehouse information
        </p>
      </div>

      <div className="card-padded">
        {initialData && (
          <WarehouseForm
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  );
};

export default EditWarehouse;