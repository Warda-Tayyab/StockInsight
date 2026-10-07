import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from "react-hot-toast";
import api from '../../../shared/utils/api';
import Select from "react-select";
const InventoryForm = ({ type = "stock-in", item = null, onClose, onSuccess }) => {
  const token = localStorage.getItem('token');

const [batches, setBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [batchesFetched, setBatchesFetched] = useState(false);

  const [formData, setFormData] = useState({
    productId: '',
    warehouseId: '',
    quantity: '',
    reference: '',
    note: '',
    expiryDate: '',
    
     batchNumber: ''
  });

  const formTitle =
    type === "stock-in"
      ? "Stock In"
      : type === "stock-out"
      ? "Stock Out"
      : "Adjust Inventory";

      const submitText =
      type === "stock-in"
        ? "Add Stock"
        : type === "stock-out"
        ? "Remove Stock"
        : "Adjust Stock";
  
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchWarehouses();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/api/products');
      const activeProducts = res.data.filter(p => p.status === "active");
      setProducts(activeProducts);
     // setProducts(res.data);
    } catch (err) {
      console.error("Products fetch error:", err);
    }
  };
const fetchBatches = async (productId, warehouseId) => {
  if (!productId || !warehouseId) {
    setBatches([]);
    setBatchesFetched(false);
    return;
  }

  setBatchesLoading(true);
  try {
    const res = await api.get(
      `/api/batches/product/${productId}?warehouseId=${warehouseId}`
    );
    const list = Array.isArray(res.data) ? res.data : res.data?.batches || [];
    setBatches(list);
    setBatchesFetched(true);
  } catch (err) {
    console.error("Batch fetch error:", err.response?.data || err.message);
    setBatches([]);
    setBatchesFetched(true);
  } finally {
    setBatchesLoading(false);
  }
};
  const fetchWarehouses = async () => {
    try {
      const res = await api.get('/api/warehouses');
      const warehousesData = Array.isArray(res.data.data)
      ? res.data.data
      : Array.isArray(res.data)
      ? res.data
      : [];

    
    // Filter only active warehouses for the form dropdown
    const activeWarehouses = warehousesData.filter(w => w.status === "active");
    setWarehouses(activeWarehouses);
    } catch (err) {
      console.error("Warehouses fetch error:", err);
    }
  };

 const handleChange = (e) => {

  const { name, value } = e.target;

  const updated = {
    ...formData,
    [name]: value
  };

  setFormData(updated);

  // remove error
  if (errors[name]) {
    setErrors(prev => ({
      ...prev,
      [name]: ""
    }));
  }

  // ✅ fetch batches on BOTH changes — clear previous batch selection
  if (name === "productId" || name === "warehouseId") {
    updated.batchNumber = "";
    setFormData(updated);
    setBatchesFetched(false);
    fetchBatches(updated.productId, updated.warehouseId);
  }
};
  const validate = () => {
    const newErrors = {};
    if (!formData.productId) newErrors.productId = "Product is required";
    if (!formData.warehouseId) newErrors.warehouseId = "Warehouse is required";
    const qty = Number(formData.quantity);
    if (isNaN(qty)) {
    newErrors.quantity = "Quantity is required";
   } else if (qty <= 0) {
  newErrors.quantity = "Quantity must be greater than 0";
   } else if (qty >= 1000) {
  newErrors.quantity = "Quantity must be smaller than 1000";
    }
    const reference = formData.reference.trim();
    if (reference) {
      if (reference.length < 3) {
        newErrors.reference = "Reference too short";
      } else if (reference.length > 20) {
        newErrors.reference = "Max 20 characters allowed";
      } else if (!/^[a-zA-Z0-9\-\/]+$/.test(reference)) {
        newErrors.reference = "Invalid reference format";
      }
    }
  // expiry date validation 
  if (type === "stock-in" && formData.expiryDate) {
  const today = new Date().toISOString().split("T")[0];
  if (formData.expiryDate < today) {
    newErrors.expiryDate = "Expiry date cannot be in the past";
  }
}
  
 //batch no validation 
  // ✅ Validation for stock-out and adjust
if ((type === "stock-out" || type === "adjust") && !formData.batchNumber.trim()) {
  if (batchesFetched && batches.length === 0) {
    newErrors.batchNumber = "No batch in this warehouse — select another warehouse";
  } else {
    newErrors.batchNumber = "Batch number is required";
  }
}
    // note validation
    const note = formData.note.trim();
    if (type === "adjust") {
      if (!note) {
        newErrors.note = "Adjustment reason is required";
      } else if (note.length < 5) {
        newErrors.note = "Note too short";
      }
    }
  
    if (note && note.length > 200) {
      newErrors.note = "Too long (max 200 chars)";
    }
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    let endpoint = "stock-in";
    if (type === "stock-out") endpoint = "stock-out";
    if (type === "adjust") endpoint = "adjust";
    try {
      setLoading(true);
      await api.post(`/api/inventory/${endpoint}`, formData);
      if (type === "stock-in") {
        toast.success("Stock added successfully ");
      } else if (type === "stock-out") {
        toast.success("Stock removed successfully ");
      } else {
        toast.success("Inventory adjusted successfully ");
      }
      onSuccess();   // refresh list
      onClose();     // close form
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong";
    
      if (msg.toLowerCase().includes("product")) {
        setErrors(prev => ({ ...prev, productId: msg }));
      } else if (msg.toLowerCase().includes("stock")) {
        setErrors(prev => ({ ...prev, quantity: msg }));
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <h1 className="page-title">{formTitle}</h1>
        <p className="page-subtitle">
          {type === 'stock-in'
            ? 'Manual stock in (prefer Purchase Receive for supplier-tracked buys)'
            : type === 'stock-out'
            ? 'Remove stock from a location'
            : 'Set final quantity manually'}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
  <label className="block text-sm font-medium  mb-2">
    Product *
  </label>

  <Select
    placeholder="Select or search product..."
    className="product-select"
  classNamePrefix="product-select"
    isSearchable
    options={products.map((p) => ({
      value: p._id,
      label: p.name,
    }))}
    value={
      products
        .map((p) => ({
          value: p._id,
          label: p.name,
        }))
        .find((option) => option.value === formData.productId) || null
    }
    onChange={(selected) => {
      const updated = {
        ...formData,
        productId: selected ? selected.value : "",
      };

      setFormData(updated);

      fetchBatches(updated.productId, updated.warehouseId);

      if (errors.productId) {
        setErrors((prev) => ({
          ...prev,
          productId: "",
        }));
      }
    }}
  />

  {errors.productId && (
    <span className="text-red-500 text-xs">
      {errors.productId}
    </span>
  )}
</div>

        <InputField
          label="Location *"
          name="warehouseId"
          value={formData.warehouseId}
          onChange={handleChange}
          options={warehouses.map(w => ({
            value: w._id,
            label: `${w.name}${w.locationType ? ` (${w.locationType})` : ''}`,
          }))}
          error={errors.warehouseId}
        />

        <InputField
          label="Quantity *"
          name="quantity"
          type="number"
          value={formData.quantity}
          onChange={handleChange}
          error={errors.quantity}
        />

{type === "stock-in" && (
  <InputField
    label="Expiry Date *"
    name="expiryDate"
    type="date"
    value={formData.expiryDate}
    onChange={handleChange}
    error={errors.expiryDate}
  />
)}

{(type === "stock-out" || type === "adjust") && (
  <div>
    <label className="block text-sm font-medium text-slate-900 mb-2">Batch Number *</label>
    <select
      name="batchNumber"
      value={formData.batchNumber}
      onChange={handleChange}
      disabled={
        !formData.productId ||
        !formData.warehouseId ||
        batchesLoading ||
        (batchesFetched && batches.length === 0)
      }
      className={`w-full px-3.5 py-2.5 border rounded-lg focus:border-indigo-600 ${
        errors.batchNumber ? "border-red-500" : "border-slate-200"
      } ${batchesFetched && batches.length === 0 ? "text-amber-700 bg-amber-50" : ""}`}
    >
      {!formData.productId || !formData.warehouseId ? (
        <option value="">Select product & warehouse first</option>
      ) : batchesLoading ? (
        <option value="">Loading batches...</option>
      ) : batches.length === 0 && batchesFetched ? (
        <option value="">No batch in this warehouse — select another warehouse</option>
      ) : (
        <>
          <option value="">Select Batch</option>
          {batches.map((batch) => (
            <option key={batch._id || batch.batchNumber} value={batch.batchNumber}>
              {batch.batchNumber} (Qty: {batch.remainingQty})
            </option>
          ))}
        </>
      )}
    </select>
    {batchesFetched && batches.length === 0 && formData.productId && formData.warehouseId && (
      <p className="text-amber-700 text-xs mt-1.5">
        This product has no batches in the selected warehouse. Choose another warehouse or add stock there first.
      </p>
    )}
    {errors.batchNumber && (
      <span className="text-red-500 text-xs">{errors.batchNumber}</span>
    )}
  </div>
)}

        <InputField
          label="Reference"
          name="reference"
          value={formData.reference}
          onChange={handleChange}
          error={errors.reference} 
        />

        <div className="md:col-span-2">
          <label className="form-label">Note</label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            rows="3"
            className="textarea-field"
          />
          {errors.note && <span className="text-red-500 text-xs">{errors.note}</span>}
        </div>

        <div className="md:col-span-2 flex justify-end gap-4 pt-4 ">
          <button
            type="button"
            onClick={onClose}
            className="bg-white border border-slate-200 px-4 py-2.5 rounded-lg"
          >
            Cancel
          </button>
          <button
        type="submit"
        disabled={loading}
        className="btn-primary"
      >
        {loading ? "Saving..." : submitText}
      </button>
        </div>
      </div>
    </form>
  );
};

const InputField = ({ label, name, value, onChange, error, type = "text", options }) => (
  <div>
    <label className="block text-sm font-medium text-slate-900 mb-2">{label}</label>
    {options ? (
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full px-3.5 py-2.5 border rounded-lg focus:border-indigo-600 ${error ? "border-red-500" : "border-slate-200"}`}
      >
        <option value="">Select {label.split(" ")[0]}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    ) : (
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className={`w-full px-3.5 py-2.5 border rounded-lg focus:border-indigo-600 ${error ? "border-red-500" : "border-slate-200"}`}
      />
    )}
    {error && <span className="text-red-500 text-xs">{error}</span>}
  </div>
);

export default InventoryForm;