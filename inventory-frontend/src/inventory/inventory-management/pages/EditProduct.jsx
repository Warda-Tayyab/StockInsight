/** @module inventory/inventory-management/pages/EditProduct */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import InventoryForm from "../components/InventoryForm";

const EditProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
const [initialData, setInitialData] = useState({});

  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // ✅ FETCH SINGLE PRODUCT
  const fetchProduct = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/products/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const product = response.data;

      setInitialData({
        name: product.name,
        sku: product.sku,
        categoryId: product.categoryId?._id,
        description: product.description || "",
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        quantity: product.quantity,
        unit: product.unit,
        reorderLevel: product.reorderLevel,
        supplierName: product.supplierName,
        status: product.status,
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
      await axios.put(
        `http://localhost:5000/api/products/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      navigate("/products");

    } catch (error) {
      console.error(error.response?.data || error.message);
    }
  };

  const handleCancel = () => {
    navigate("/products");
  };

  if (loading) {
    return (
      <div className="text-center py-10 text-gray-500">
        Loading product...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Edit Product
        </h1>
        <p className="text-gray-600 text-sm">
          Update product information
        </p>
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
