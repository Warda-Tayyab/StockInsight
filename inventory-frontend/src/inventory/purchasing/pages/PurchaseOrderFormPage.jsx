/** @module inventory/purchasing/pages/PurchaseOrderFormPage */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import purchaseService from '../../../shared/services/purchaseService';
import api from '../../../shared/utils/api';

const blankLine = () => ({
  productId: '',
  productName: '',
  quantity: 1,
  unitCost: 0,
  unit: 'pcs',
});

const PurchaseOrderFormPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id) && id !== 'new';
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [locations, setLocations] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [purchasedProducts, setPurchasedProducts] = useState([]);
  const [errors, setErrors] = useState({
    vendorId: '',
    locationId: '',
    expectedDate: '',
    items: [],
  });
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    vendorId: '',
    locationId: '',
    expectedDate: '',
    notes: '',
    status: 'ordered',
    items: [blankLine()],
  });

  useEffect(() => {
    const boot = async () => {
      try {
        const [vRes, wRes, productsRes] = await Promise.all([
          purchaseService.listVendors({ status: 'active' }),
          api.get('/api/warehouses'),
          api.get('/api/products'),
        ]);
        setVendors(vRes.data.data || []);
        const locs = (Array.isArray(wRes.data.data) ? wRes.data.data : []).filter(
          (l) => l.status !== 'inactive' && !l.isDeleted
        );
        setLocations(locs);

        const productList = Array.isArray(productsRes.data) ? productsRes.data : [];
        setAllProducts(productList);

        if (isEdit) {
          const res = await purchaseService.getOrder(id);
          const o = res.data.data;
          setForm({
            vendorId: o.vendorId?._id || o.vendorId || '',
            locationId: o.locationId?._id || o.locationId || '',
            expectedDate: o.expectedDate ? String(o.expectedDate).slice(0, 10) : '',
            notes: o.notes || '',
            status: o.status,
            items: (o.items || []).map((i) => ({
              productId: i.productId?._id || i.productId || '',
              productName: i.productName,
              quantity: i.quantity,
              unitCost: i.unitCost,
              unit: i.unit || 'pcs',
            })),
          });
        } else {
          const store = locs.find((l) => l.locationType === 'store') || locs[0];
          if (store) setForm((f) => ({ ...f, locationId: store._id }));
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load form data');
      }
    };
    boot();
  }, [id, isEdit]);

  useEffect(() => {
    const selectedVendor = vendors.find((vendor) => String(vendor._id) === String(form.vendorId));
    const vendorName = selectedVendor?.name?.trim().toLowerCase();
    if (!vendorName) {
      setPurchasedProducts([]);
      return;
    }

    setPurchasedProducts(allProducts
      .filter((product) => product.supplierName?.trim().toLowerCase() === vendorName)
      .map((product) => ({
        productId: product._id,
        productName: product.name,
        unitCost: product.costPrice || 0,
        unit: product.unit || 'pcs',
      }))
      .sort((a, b) => a.productName.localeCompare(b.productName)));
  }, [allProducts, vendors, form.vendorId]);

  const updateLine = (idx, patch) => {
    setForm((f) => {
      const items = [...f.items];
      items[idx] = { ...items[idx], ...patch };
      return { ...f, items };
    });
  };

  const handleProductSelect = (idx, productId) => {
    if (productId === '__new__') {
      updateLine(idx, { productId: '', productName: '', unitCost: 0, unit: 'pcs' });
      return;
    }
    const selected = purchasedProducts.find((product) => String(product.productId) === productId);
    if (selected) {
      updateLine(idx, {
        productId: selected.productId,
        productName: selected.productName,
        unitCost: selected.unitCost,
        unit: selected.unit,
      });
    }
  };

  const handleNewProductNameChange = (idx, productName) => {
    updateLine(idx, { productId: '', productName });
  };

  const handleSupplierChange = (vendorId) => {
    setForm((current) => ({ ...current, vendorId, items: [blankLine()] }));
  };
  const validate = () => {
    const newErrors = {
      vendorId: '',
      locationId: '',
      expectedDate: '',
      items: [],
    };
  
    if (!form.vendorId) {
      newErrors.vendorId = 'Supplier is required';
    }
  
    if (!form.locationId) {
      newErrors.locationId = 'Destination location is required';
    }
  
    if (form.expectedDate) {
      const selectedDate = new Date(form.expectedDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
  
      if (selectedDate < today) {
        newErrors.expectedDate = 'Expected date cannot be in the past';
      }
    }
  
    form.items.forEach((item, index) => {
      const itemErrors = {};
  
      if (!String(item.productName || '').trim()) {
        itemErrors.productName = 'Product name is required';
      } else if (String(item.productName).trim().length < 2) {
        itemErrors.productName =
          'Product name must be at least 2 characters';
      }
  
      const quantity = Number(item.quantity);

      if (
        item.quantity === '' ||
        item.quantity === null ||
        item.quantity === undefined ||
        Number.isNaN(quantity) ||
        quantity <= 0
      ) {
        itemErrors.quantity = 'Quantity must be greater than 0';
      } else if (!Number.isInteger(quantity)) {
        itemErrors.quantity = 'Quantity must be a whole number';
      }
      if (item.unitCost === '' || Number(item.unitCost) <=0) {
        itemErrors.unitCost = 'Cost/unit must be greater than 0.';
      }
  
      const allowedUnits = [
        'pcs',
        'kg',
        'box',
        'pack',
        'litre',
        'dozen',
        'gram',
      ];
  
      if (!allowedUnits.includes(item.unit)) {
        itemErrors.unit = 'Please select a valid unit';
      }
  
      newErrors.items[index] = itemErrors;
    });
  
    setErrors(newErrors);
  
    const hasItemErrors = newErrors.items.some(
      (item) => Object.keys(item).length > 0
    );
  
    return (
      !newErrors.vendorId &&
      !newErrors.locationId &&
      !newErrors.expectedDate &&
      !hasItemErrors
    );
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        expectedDate: form.expectedDate || null,
        items: form.items.map((i) => ({
          productId: i.productId || undefined,
          productName: String(i.productName).trim(),
          quantity: Number(i.quantity),
          unitCost: Number(i.unitCost) || 0,
          unit: i.unit || 'pcs',
        })),
      };
      if (isEdit) {
        await purchaseService.updateOrder(id, payload);
        toast.success('PO updated');
        navigate(`/purchasing/orders/${id}`);
      } else {
        await purchaseService.createOrder(payload);
        toast.success('Purchase order created');
        navigate('/purchasing/orders');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Purchase Order' : 'New Purchase Order'}</h1>
        </div>
        <Link to="/purchasing/orders" className="btn-secondary no-underline">
          Back
        </Link>
      </div>

      <form onSubmit={handleSubmit}  noValidate className="card-padded flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
  <label className="form-label">Supplier *</label>

  <select
    className={`select-field ${
      errors.vendorId ? 'border-red-500' : ''
    }`}
    value={form.vendorId}
    onChange={(e) => {
      handleSupplierChange(e.target.value);

      if (errors.vendorId) {
        setErrors((prev) => ({
          ...prev,
          vendorId: '',
        }));
      }
    }}
  >
    <option value="">Select supplier</option>

    {vendors.map((v) => (
      <option key={v._id} value={v._id}>
        {v.name}
      </option>
    ))}
  </select>

  {errors.vendorId && (
    <p className="text-red-500 text-xs mt-1">
      {errors.vendorId}
    </p>
  )}
</div>
<div>
  <label className="form-label">Destination *</label>

  <select
    className={`select-field ${
      errors.locationId ? 'border-red-500' : ''
    }`}
    value={form.locationId}
    onChange={(e) => {
      setForm({
        ...form,
        locationId: e.target.value,
      });

      if (errors.locationId) {
        setErrors((prev) => ({
          ...prev,
          locationId: '',
        }));
      }
    }}
  >
    <option value="">Select location</option>

    {locations.map((l) => (
      <option key={l._id} value={l._id}>
        {l.name} ({l.locationType || 'store'})
      </option>
    ))}
  </select>

  {errors.locationId && (
    <p className="text-red-500 text-xs mt-1">
      {errors.locationId}
    </p>
  )}
</div>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <h2 className="text-sm font-semibold m-0">Line items</h2>
            <button
              type="button"
              className="btn-secondary text-xs"
              onClick={() => setForm({ ...form, items: [...form.items, blankLine()] })}
            >
              Add line
            </button>
          </div>
          {form.items.map((line, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end mb-2">
             <div className="md:col-span-5">
  <label className="form-label">Product name *</label>

  <select
    className={`input-field ${
      errors.items[idx]?.productName
        ? 'border-red-500'
        : ''
    }`}
    value={
      line.productId ||
      (line.productName ? '__new__' : '')
    }
    onChange={(e) => {
      handleProductSelect(idx, e.target.value);

      if (errors.items[idx]?.productName) {
        setErrors((prev) => {
          const items = [...prev.items];
          items[idx] = {
            ...items[idx],
            productName: '',
          };

          return {
            ...prev,
            items,
          };
        });
      }
    }}
  >
    <option value="">Select purchased product</option>

    {purchasedProducts.map((product) => (
      <option
        key={product.productId}
        value={product.productId}
      >
        {product.productName}
      </option>
    ))}

    <option value="__new__">
      + New product
    </option>
  </select>

  {!line.productId && (
    <input
      type="text"
      className={`input-field mt-2 ${
        errors.items[idx]?.productName
          ? 'border-red-500'
          : ''
      }`}
      value={line.productName}
      onChange={(e) => {
        handleNewProductNameChange(
          idx,
          e.target.value
        );

        if (errors.items[idx]?.productName) {
          setErrors((prev) => {
            const items = [...prev.items];

            items[idx] = {
              ...items[idx],
              productName: '',
            };

            return {
              ...prev,
              items,
            };
          });
        }
      }}
      placeholder="Enter new product name"
    />
  )}

  {errors.items[idx]?.productName && (
    <p className="text-red-500 text-xs mt-1">
      {errors.items[idx].productName}
    </p>
  )}
</div>
<div className="md:col-span-2">
  <label className="form-label">Qty *</label>

  <input
    type="number"
    min="1"
    step="1"
    className={`input-field ${
      errors.items[idx]?.quantity
        ? 'border-red-500 focus:border-red-500'
        : ''
    }`}
    value={line.quantity}
    onChange={(e) => {
      const value = e.target.value;

      updateLine(idx, {
        quantity: value,
      });

      if (errors.items[idx]?.quantity) {
        setErrors((prev) => {
          const items = [...prev.items];

          items[idx] = {
            ...items[idx],
            quantity: '',
          };

          return {
            ...prev,
            items,
          };
        });
      }
    }}
  />

  {errors.items[idx]?.quantity && (
    <p className="text-red-500 text-xs mt-1">
      {errors.items[idx].quantity}
    </p>
  )}
</div>
              <div className="md:col-span-2">
                <label className="form-label">Unit</label>
                <select
      className={`select-field ${
        errors.items[idx]?.unit ? 'border-red-500' : ''
      }`}
                  value={line.unit}
                  onChange={(e) => updateLine(idx, { unit: e.target.value })}
                >
                  {['pcs', 'kg', 'box', 'pack', 'litre', 'dozen', 'gram'].map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                {errors.items[idx]?.unit && (
  <span className="text-red-500 text-xs mt-1 block">
    {errors.items[idx].unit}
  </span>
)}
              </div>
              <div className="md:col-span-2">
  <label className="form-label">Cost/unit</label>

  <input
    type="number"
    min="0"
    step="0.01"
    className={`input-field ${
      errors.items[idx]?.unitCost
        ? 'border-red-500'
        : ''
    }`}
    value={line.unitCost}
    onChange={(e) => {
      updateLine(idx, {
        unitCost: e.target.value,
      });

      if (errors.items[idx]?.unitCost) {
        setErrors((prev) => {
          const items = [...prev.items];

          items[idx] = {
            ...items[idx],
            unitCost: '',
          };

          return {
            ...prev,
            items,
          };
        });
      }
    }}
  />

  {errors.items[idx]?.unitCost && (
    <p className="text-red-500 text-xs mt-1">
      {errors.items[idx].unitCost}
    </p>
  )}
</div>
              <div className="md:col-span-1">
                {form.items.length > 1 && (
                  <button
                    type="button"
                    className="btn-secondary w-full"
                    onClick={() =>
                      setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })
                    }
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Link to="/purchasing/orders" className="btn-secondary no-underline">
            Cancel
          </Link>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Update PO' : 'Create PO'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PurchaseOrderFormPage;
