/** @module inventory/inventory-management/pages/EditProduct */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import ProductForm from "../components/ProductForm";
import { Toaster, toast } from 'react-hot-toast'
import api from '../../../shared/utils/api';
const EditProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
const [initialData, setInitialData] = useState({});

  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // ✅ FETCH SINGLE PRODUCT
  const fetchProduct = async () => {
    try {
      const response = await api.get(`/api/products/${id}`);
      const product = response.data;

      setInitialData({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode || "",
        categoryId: product.categoryId?._id,
        description: product.description || "",
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
       // quantity: product.quantity,
        unit: product.unit,
        reorderLevel: product.reorderLevel,
        supplierName: product.supplierName,
        status: product.status,
        setupStatus: product.setupStatus,
        image: product.image,
      });

    } catch (error) {
      console.error(error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, []);

  // ✅ UPDATE PRODUCT
  const handleSubmit = async (formData) => {
    try {
      if (formData instanceof FormData) {
        await api.put(`/api/products/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.put(`/api/products/${id}`, formData);
      }
      toast.success(
        initialData.setupStatus === 'pending'
          ? 'Product setup complete — ab POS par sell ho sakta hai'
          : 'Product Updated Successfully 🚀'
      );
      setTimeout(() => {
        navigate("/products");
      }, 400);

    } catch (error) {
      console.error(error.response?.data || error.message);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const handleCancel = () => {
    navigate("/products");
  };

  if (loading) {
    return (
      <div className="text-center py-10 text-slate-500">
        Loading product...
      </div>
    );
  }

  return (
    <div className="page-container">
      <div>
        <h1 className="page-title">
          {initialData.setupStatus === 'pending' ? 'Complete Product Setup' : 'Edit Product'}
        </h1>
        <p className="page-subtitle">
          {initialData.setupStatus === 'pending'
            ? 'Add selling price, barcode, and category after purchase receive'
            : 'Update product information'}
        </p>
      </div>

      <div className="card-padded">
        <ProductForm
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
