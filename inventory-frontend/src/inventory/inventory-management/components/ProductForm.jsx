import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import jwt_decode from "jwt-decode";
import api from '../../../shared/utils/api';
const ProductForm = ({ isEdit = false, initialData = {}, onSubmit, onCancel }) => {
  const [pendingSetup, setPendingSetup] = useState(initialData.setupStatus === 'pending');
  const isPendingSetup = isEdit && pendingSetup;
  const [formData, setFormData] = useState({
    name: initialData.name || "",
    sku: initialData.sku || "",
    barcode: initialData.barcode || "",
    categoryId: initialData.categoryId || "",
    description: initialData.description || "",
    costPrice: initialData.costPrice || "",
    sellingPrice: initialData.sellingPrice || "",
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
  const [imageFile, setImageFile] = useState(null);

  // 🔥 Fetch categories from backend
  const fetchCategories = async () => {
    setCatLoading(true);
    setCatError("");
  
    try {
      const decoded = jwt_decode(localStorage.getItem("token"));
      const tenantId = decoded.tenantId;
  
      const res = await api.get(`/api/categories?tenantId=${tenantId}`);
  
      setCategories(res.data);
    } catch (err) {
      setCatError(err.message);
    } finally {
      setCatLoading(false);
    }
  };
useEffect(() => {
  if (isEdit && initialData) {
    setPendingSetup(initialData.setupStatus === 'pending');
    setFormData({
      name: initialData.name || "",
      sku: initialData.sku || "",
      barcode: initialData.barcode || "",
      categoryId: initialData.categoryId || "",
      description: initialData.description || "",
      costPrice: initialData.costPrice || "",
      sellingPrice: initialData.sellingPrice || "",
      reorderLevel: initialData.reorderLevel || "",
      unit: initialData.unit || "pcs",
      supplierName: initialData.supplierName || "",
      status: initialData.setupStatus === 'pending' ? 'active' : (initialData.status || "active"),
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
    if (name === "name") {
      if (!/^[a-zA-Z0-9\s\-]*$/.test(value)) return;
    }
    if (name === "barcode") {
      if (!/^[a-zA-Z0-9\-]*$/.test(value)) return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  // 🔹 Handle image file selection → convert to data URL
  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // 🔹 Validation
  const validate = () => {
    const newErrors = {};
    const name = formData.name.trim();
  // ✅ NAME VALIDATION
  if (!name) {
    newErrors.name = "Product name is required";
  } else if (name.length < 4) {
    newErrors.name = "Product name must be at least 4 characters";
  } else if (/^[^a-zA-Z0-9]+$/.test(name)) {
    newErrors.name = "Invalid name (only symbols not allowed)";
  } else if (/^\d+$/.test(name)) {
    newErrors.name = "Name cannot be only numbers";
  } else if (!/^[a-zA-Z][a-zA-Z0-9\s\-]*$/.test(name)) {
    newErrors.name = "Start with letter, no weird symbols";
  }

  // ✅ SKU VALIDATION
  const sku = formData.sku.trim();
  if (!sku) {
    newErrors.sku = "SKU is required";
  } else if (!/^[A-Z0-9\-]+$/.test(sku)) {
    newErrors.sku = "SKU must be uppercase (A-Z, 0-9, - only)";
  }

  // ✅ BARCODE — used by POS USB scanner
  const barcode = formData.barcode.trim();
  if (!barcode) {
    newErrors.barcode = "Barcode is required for POS scanning";
  } else if (barcode.length < 4) {
    newErrors.barcode = "Barcode must be at least 4 characters";
  } else if (!/^[a-zA-Z0-9\-]+$/.test(barcode)) {
    newErrors.barcode = "Only letters, numbers, and hyphens allowed";
  }

  // ✅ CATEGORY
  if (!formData.categoryId) {
    newErrors.categoryId = "Category is required";
  }

  // ✅ COST PRICE
  if (!formData.costPrice || Number(formData.costPrice) <= 0) {
    newErrors.costPrice = "Cost price must be greater than 0";
  }

  // ✅ SELLING PRICE
  if (!formData.sellingPrice || Number(formData.sellingPrice) <= 0) {
    newErrors.sellingPrice = "Selling price must be greater than 0";
  }

  // ✅ PRICE RELATION
  if (
    formData.costPrice &&
    formData.sellingPrice &&
    Number(formData.sellingPrice) < Number(formData.costPrice)
  ) {
    newErrors.sellingPrice = "Selling price should be greater than cost price";
  }

  // ✅ REORDER LEVEL
if (!formData.reorderLevel) {
  newErrors.reorderLevel = "Reorder level is required";
} else if (Number(formData.reorderLevel) <= 0) {
  newErrors.reorderLevel = "Reorder level must be greater than 0";
}

  // ✅ SUPPLIER NAME
  const supplier = formData.supplierName.trim();
  if (!supplier) {
    newErrors.supplierName = "Supplier name is required";
  } else if (!isPendingSetup && supplier.length < 5) {
    newErrors.supplierName = "Too short";
  } else if (!/^[a-zA-Z\s]+$/.test(supplier)) {
    newErrors.supplierName = "Only letters allowed";
  }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🔹 Submit
  const handleSubmit = (e) => {
  e.preventDefault();
  if (!validate()) return;

  if (onSubmit) {
    const payload = { ...formData };
    if (isPendingSetup || initialData.setupStatus === 'pending') {
      payload.setupStatus = 'ready';
      payload.status = 'active';
    }
    // If user selected a file, send multipart/form-data
    if (imageFile) {
      const fd = new FormData();
      fd.append('image', imageFile);
      Object.keys(payload).forEach((k) => {
        if (k === 'image') return;
        const val = payload[k] === undefined || payload[k] === null ? '' : String(payload[k]);
        fd.append(k, val);
      });
      onSubmit(fd);
    } else {
      onSubmit(payload);
    }
  }
};

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {isPendingSetup && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold m-0">Complete product setup</p>
          <p className="m-0 mt-1">
            This product was created from a purchase. Add category, barcode, and selling price to enable POS sales.
            If stock is in a warehouse, transfer it to your Store first.
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField label="Product Name *" name="name" value={formData.name} onChange={handleChange} error={errors.name} />
        <InputField label="SKU *" name="sku" value={formData.sku} onChange={handleChange} error={errors.sku} />

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Barcode *
          </label>
          <input
            name="barcode"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="e.g. 8901234500012"
            value={formData.barcode}
            onChange={handleChange}
            className={`w-full px-3.5 py-2.5 border rounded-lg font-mono ${
              errors.barcode ? "border-red-500" : "border-slate-200 focus:border-indigo-600"
            }`}
          />
          <p className="text-xs text-slate-500 mt-1 m-0">
            Enter the barcode printed on the product. POS scanner will use this to add to cart.
          </p>
          {errors.barcode && <span className="text-red-500 text-xs">{errors.barcode}</span>}
        </div>

        {/* 🔹 Category Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-900 mb-2">Category *</label>

          <div className="flex gap-2">
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-600"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <Link
              to="/categories"
              className="px-3 py-2 btn-secondary !text-sm no-underline shrink-0"
              title="Manage categories"
            >
              Manage
            </Link>
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
  label="Reorder Level *" 
  name="reorderLevel" 
  type="number"
  min={1}
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

        {/* Image upload / URL */}
        <div className="mb-6 md:col-span-2">
          <label className="block text-sm font-medium text-slate-900 mb-2">Product Image</label>
          <div className="flex gap-3 items-center">
            <input type="file" accept="image/*" onChange={handleFileChange} className="" />
            <input
              name="image"
              type="text"
              placeholder="Or paste image URL"
              value={formData.image || ''}
              onChange={handleChange}
              className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-lg"
            />
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, image: '' }))}
              className="px-3 py-2 btn-secondary"
            >
              Clear
            </button>
          </div>
          {formData.image && (
            <div className="mt-3">
              <img src={formData.image} alt="preview" className="w-36 h-24 object-cover rounded-md border" />
            </div>
          )}
        </div>

        {/* Unit */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-900 mb-2">Unit *</label>
          <select name="unit" value={formData.unit} onChange={handleChange} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg">
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
          <label className="block text-sm font-medium text-slate-900 mb-2">Status</label>
          <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Description */}
        <div className="md:col-span-2 mb-6">
          <label className="block text-sm font-medium text-slate-900 mb-2">Description</label>
          <textarea
            name="description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-slate-200">
        <button type="button" onClick={onCancel} className="bg-white border border-slate-200 px-4 py-2 rounded-lg">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Saving..." : isEdit ? "Update Product" : "Add Product"}
        </button>
      </div>
    </form>
  );
};

// 🔹 Reusable InputField
const InputField = ({ label, name, value, onChange, error, type = "text", min }) => (
  <div className="mb-6">
    <label className="block text-sm font-medium text-slate-900 mb-2">
      {label}
    </label>
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      className={`w-full px-3.5 py-2.5 border rounded-lg ${
        error ? "border-red-500" : "border-slate-200 focus:border-indigo-600"
      }`}
    />
    {error && <span className="text-red-500 text-xs">{error}</span>}
  </div>
);


export default ProductForm;
