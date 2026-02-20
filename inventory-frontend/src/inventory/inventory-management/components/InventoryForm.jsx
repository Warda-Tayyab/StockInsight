import { useState, useEffect } from "react";
import jwt_decode from "jwt-decode";
import CategoryModal from "./CategoryModal";

const InventoryForm = ({ isEdit = false, initialData = {}, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: initialData.name || "",
    sku: initialData.sku || "",
    categoryId: initialData.categoryId || "",
    description: initialData.description || "",
    costPrice: initialData.costPrice || "",
    sellingPrice: initialData.sellingPrice || "",
    quantity: initialData.quantity || "",
    reorderLevel: initialData.reorderLevel || "",
    unit: initialData.unit || "pcs",
    supplierName: initialData.supplierName || "",
    status: initialData.status || "active",
    image: initialData.image || ""
  });

  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [catLoading, setCatLoading] = useState(true);
  const [catError, setCatError] = useState("");

  // 🔹 Category modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // 🔥 Fetch categories from backend
  const fetchCategories = async () => {
    setCatLoading(true);
    setCatError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token not found");

      const decoded = jwt_decode(token);
      const tenantId = decoded.tenantId;

      const res = await fetch(`http://localhost:5000/api/categories?tenantId=${tenantId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch categories");

      setCategories(data);
    } catch (err) {
      console.error("Categories fetch error:", err);
      setCatError(err.message);
    } finally {
      setCatLoading(false);
    }
  };
useEffect(() => {
  if (isEdit && initialData) {
    setFormData({
      name: initialData.name || "",
      sku: initialData.sku || "",
      categoryId: initialData.categoryId || "",
      description: initialData.description || "",
      costPrice: initialData.costPrice || "",
      sellingPrice: initialData.sellingPrice || "",
      quantity: initialData.quantity || "",
      reorderLevel: initialData.reorderLevel || "",
      unit: initialData.unit || "pcs",
      supplierName: initialData.supplierName || "",
      status: initialData.status || "active",
      image: initialData.image || ""
    });
  }
}, [initialData, isEdit]);

  useEffect(() => {
    fetchCategories();
  }, []);

  // 🔹 Input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  // 🔹 Validation
  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (!formData.sku.trim()) newErrors.sku = "SKU is required";
    if (!formData.categoryId) newErrors.categoryId = "Category is required";
    if (!formData.costPrice || formData.costPrice < 0) newErrors.costPrice = "Valid cost price required";
    if (!formData.sellingPrice || formData.sellingPrice < 0) newErrors.sellingPrice = "Valid selling price required";
    if (formData.quantity === "" || formData.quantity < 0) newErrors.quantity = "Valid quantity required";
    if (!formData.reorderLevel || formData.reorderLevel < 0) newErrors.reorderLevel = "Valid reorder level required";
    if (!formData.supplierName.trim()) newErrors.supplierName = "Supplier name is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🔹 Submit
  const handleSubmit = (e) => {
  e.preventDefault();
  if (!validate()) return;

  if (onSubmit) {
    onSubmit(formData); // 🔥 Parent ko data bhej do
  }
};

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField label="Product Name *" name="name" value={formData.name} onChange={handleChange} error={errors.name} />
        <InputField label="SKU *" name="sku" value={formData.sku} onChange={handleChange} error={errors.sku} />

        {/* 🔹 Category Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">Category *</label>

          <div className="flex gap-2">
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-lg focus:border-blue-600"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowCategoryModal(true)}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg"
            >
              +
            </button>
          </div>

          {errors.categoryId && <span className="text-red-500 text-xs">{errors.categoryId}</span>}
        </div>

        {/* Remaining Fields */}
        <InputField 
  label="Cost Price *" 
  name="costPrice" 
  type="number"
  value={formData.costPrice} 
  onChange={handleChange} 
  error={errors.costPrice} 
/>

<InputField 
  label="Selling Price *" 
  name="sellingPrice" 
  type="number"
  value={formData.sellingPrice} 
  onChange={handleChange} 
  error={errors.sellingPrice} 
/>

<InputField 
  label="Quantity *" 
  name="quantity" 
  type="number"
  value={formData.quantity} 
  onChange={handleChange} 
  error={errors.quantity} 
/>

<InputField 
  label="Reorder Level *" 
  name="reorderLevel" 
  type="number"
  value={formData.reorderLevel} 
  onChange={handleChange} 
  error={errors.reorderLevel} 
/>

<InputField 
  label="Supplier Name *" 
  name="supplierName" 
  type="text"
  value={formData.supplierName} 
  onChange={handleChange} 
  error={errors.supplierName} 
/>

        {/* Unit */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">Unit *</label>
          <select name="unit" value={formData.unit} onChange={handleChange} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg">
            <option value="pcs">pcs</option>
            <option value="kg">kg</option>
            <option value="box">box</option>
            <option value="pack">pack</option>
            <option value="litre">litre</option>
            <option value="dozen">dozen</option>
            <option value="gram">gram</option>
          </select>
        </div>

        {/* Status */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">Status</label>
          <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>

        {/* Description */}
        <div className="md:col-span-2 mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
          <textarea
            name="description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="bg-white border border-gray-200 px-4 py-2 rounded-lg">Cancel</button>
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
          {loading ? "Saving..." : isEdit ? "Update Product" : "Add Product"}
        </button>
      </div>

      {/* 🔹 Category Modal */}
      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        categories={categories}
        fetchCategories={fetchCategories}
        selectedCategory={formData.categoryId}
        setSelectedCategory={(id) => setFormData((prev) => ({ ...prev, categoryId: id }))}
      />
    </form>
  );
};

// 🔹 Reusable InputField
const InputField = ({ label, name, value, onChange, error, type = "text" }) => (
  <div className="mb-6">
    <label className="block text-sm font-medium text-gray-900 mb-2">
      {label}
    </label>
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      className={`w-full px-3.5 py-2.5 border rounded-lg ${
        error ? "border-red-500" : "border-gray-200 focus:border-blue-600"
      }`}
    />
    {error && <span className="text-red-500 text-xs">{error}</span>}
  </div>
);


export default InventoryForm;
