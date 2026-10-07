/** @module inventory/purchasing/pages/GoodsReceiptFormPage */
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Select from 'react-select';
import purchaseService from '../../../shared/services/purchaseService';
import api from '../../../shared/utils/api';
import PurchaseReceiptModal from '../components/PurchaseReceiptModal';

const selectCustomStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '42px',
    borderRadius: '0.5rem',
    borderColor: state.isFocused ? '#4f46e5' : '#cbd5e1',
    boxShadow: state.isFocused ? '0 0 0 1px #4f46e5' : 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#4f46e5' : '#94a3b8',
    },
  }),
  menu: (base) => ({
    ...base,
    zIndex: 9999,
  }),
};

const blankLine = () => ({
  purchaseOrderItemId: '',
  productName: '',
  quantity: 1,
  unitCost: 0,
  unit: 'pcs',
  expiryDate: '',
  maxQty: 0,
});

const GoodsReceiptFormPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const poIdFromUrl = searchParams.get('po');

  const [vendors, setVendors] = useState([]);
  const [locations, setLocations] = useState([]);
  const [openOrders, setOpenOrders] = useState([]);
  const [po, setPo] = useState(null);
  const [poLineOptions, setPoLineOptions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [createdReceipt, setCreatedReceipt] = useState(null);
  const [errors, setErrors] = useState({
    purchaseOrderId: '',
    vendorId: '',
    locationId: '',
    items: [],
  });
  const [form, setForm] = useState({
    vendorId: '',
    locationId: '',
    purchaseOrderId: '',
    notes: '',
    createBill: true,
    items: [blankLine()],
  });

  const buildLineOptions = (order) =>
    (order?.items || [])
      .map((i) => {
        const remaining = Number(i.quantity) - Number(i.receivedQty || 0);
        if (remaining <= 0) return null;
        return {
          _id: i._id,
          productName: i.productName,
          unitCost: i.unitCost || 0,
          unit: i.unit || 'pcs',
          remaining,
        };
      })
      .filter(Boolean);

  const applyPurchaseOrder = (order) => {
    const options = buildLineOptions(order);
    setPo(order);
    setPoLineOptions(options);
    setForm({
      vendorId: order.vendorId?._id || order.vendorId || '',
      locationId: order.locationId?._id || order.locationId || '',
      purchaseOrderId: order._id,
      notes: '',
      createBill: true,
      items: options.length
        ? options.map((opt) => ({
            purchaseOrderItemId: opt._id,
            productName: opt.productName,
            quantity: opt.remaining,
            unitCost: opt.unitCost,
            unit: opt.unit,
            expiryDate: '',
            maxQty: opt.remaining,
          }))
        : [blankLine()],
    });
  };

  const loadPurchaseOrder = async (orderId) => {
    if (!orderId) {
      setPo(null);
      setPoLineOptions([]);
      setForm((f) => ({
        ...f,
        purchaseOrderId: '',
        vendorId: '',
        items: [blankLine()],
      }));
      return;
    }
    const res = await purchaseService.getOrder(orderId);
    applyPurchaseOrder(res.data.data);
  };

  useEffect(() => {
    const boot = async () => {
      try {
        const [vRes, wRes, oRes] = await Promise.all([
          purchaseService.listVendors({ status: 'active' }),
          api.get('/api/warehouses'),
          purchaseService.listOrders(),
        ]);
        setVendors(vRes.data.data || []);
        const locs = (Array.isArray(wRes.data.data) ? wRes.data.data : []).filter(
          (l) => l.status !== 'inactive' && !l.isDeleted
        );
        setLocations(locs);

        const receivable = (oRes.data.data || []).filter((o) =>
          ['ordered', 'partial'].includes(o.status)
        );
        setOpenOrders(receivable);

        if (poIdFromUrl) {
          await loadPurchaseOrder(poIdFromUrl);
        } else if (receivable.length === 1) {
          await loadPurchaseOrder(receivable[0]._id);
        } else {
          const store = locs.find((l) => l.locationType === 'store') || locs[0];
          if (store) setForm((f) => ({ ...f, locationId: store._id }));
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load');
      }
    };
    boot();
  }, [poIdFromUrl]);

  const storeHint = useMemo(() => {
    const loc = locations.find((l) => l._id === form.locationId);
    if (!loc) return '';
    if (loc.locationType === 'warehouse') {
      return 'Warehouse receive — quantity will appear in the Inventory List. POS quantity will increase when stock is transferred to the Store.';
    }
    return 'Store receive — POS quantity will increase from here once the product setup is complete.';
  }, [locations, form.locationId]);

  const getRemainingForLine = (line, idx) => {
    const opt = poLineOptions.find((o) => o._id === line.purchaseOrderItemId);
    if (!opt) return 0;
    const usedElsewhere = form.items.reduce((sum, row, rowIdx) => {
      if (rowIdx === idx) return sum;
      if (row.purchaseOrderItemId === line.purchaseOrderItemId) {
        return sum + Number(row.quantity || 0);
      }
      return sum;
    }, 0);
    return Math.max(0, opt.remaining - usedElsewhere);
  };

  const updateLine = (idx, patch) => {
    setForm((f) => {
      const items = [...f.items];
      items[idx] = { ...items[idx], ...patch };
      return { ...f, items };
    });
  };

  const handlePoChange = async (orderId) => {
    try {
      await loadPurchaseOrder(orderId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load purchase order');
    }
  };

  const handleProductSelect = (idx, itemId) => {
    const opt = poLineOptions.find((o) => o._id === itemId);
    if (!opt) {
      updateLine(idx, blankLine());
      return;
    }
    updateLine(idx, {
      purchaseOrderItemId: opt._id,
      productName: opt.productName,
      quantity: opt.remaining,
      unitCost: opt.unitCost,
      unit: opt.unit,
      maxQty: opt.remaining,
    });
  };

  const addLine = () => {
    setForm((f) => ({ ...f, items: [...f.items, blankLine()] }));
  };
  const validate = () => {
    const newErrors = {
      purchaseOrderId: '',
      vendorId: '',
      locationId: '',
      items: [],
    };
  
    if (!form.purchaseOrderId) {
      newErrors.purchaseOrderId = 'Purchase order is required';
    }
  
    if (!form.vendorId) {
      newErrors.vendorId = 'Supplier is required';
    }
  
    if (!form.locationId) {
      newErrors.locationId = 'Receive location is required';
    }
  
    form.items.forEach((item, index) => {
      const itemErrors = {};
  
      if (!item.purchaseOrderItemId) {
        itemErrors.productName = 'Product is required';
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
      } else {
        const allowed = getRemainingForLine(item, index);
  
        if (allowed > 0 && quantity > allowed) {
          itemErrors.quantity = `Quantity cannot exceed ${allowed}`;
        }
      }
  
      const unitCost = Number(item.unitCost);
  
      if (
        item.unitCost === '' ||
        item.unitCost === null ||
        item.unitCost === undefined ||
        Number.isNaN(unitCost) ||
        unitCost <= 0
      ) {
        itemErrors.unitCost = 'Cost/unit must be greater than 0';
      }
  
      if (!item.unit) {
        itemErrors.unit = 'Unit is required';
      }
      if (item.expiryDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
      
        const expiry = new Date(item.expiryDate);
        expiry.setHours(0, 0, 0, 0);
      
        if (expiry < today) {
          itemErrors.expiryDate = 'Expired products cannot be received';
        }
      }
      newErrors.items[index] = itemErrors;
    });
  
    setErrors(newErrors);
  
    const hasItemErrors = newErrors.items.some(
      (item) => Object.keys(item).length > 0
    );
  
    return (
      !newErrors.purchaseOrderId &&
      !newErrors.vendorId &&
      !newErrors.locationId &&
      !hasItemErrors
    );
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!validate()) {
      return;
    }
  
    setSaving(true);
  
    try {
      const res = await purchaseService.createReceipt({
        vendorId: form.vendorId,
        locationId: form.locationId,
        purchaseOrderId: form.purchaseOrderId,
        notes: form.notes,
        post: true,
        createBill: form.createBill,
        items: form.items.map((i) => ({
          productName: i.productName,
          quantity: Number(i.quantity),
          unitCost: Number(i.unitCost),
          unit: i.unit || 'pcs',
          expiryDate: i.expiryDate || null,
          purchaseOrderItemId: i.purchaseOrderItemId,
        })),
      });
  
      toast.success(
        `Stock received successfully! Receipt #${res.data.data.grnNumber} generated.`
      );
  
      setCreatedReceipt(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Receive failed');
    } finally {
      setSaving(false);
    }
  };


    

  const selectableOptionsForLine = (line, idx) => {
    const selectedElsewhere = new Set(
      form.items
        .filter((_, rowIdx) => rowIdx !== idx)
        .map((row) => row.purchaseOrderItemId)
        .filter(Boolean)
    );
    return poLineOptions.filter(
      (opt) => opt._id === line.purchaseOrderItemId || !selectedElsewhere.has(opt._id)
    );
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {po ? `Receive against ${po.poNumber}` : 'Purchase Receive'}
          </h1>
          <p className="page-subtitle">
  Select a purchase order — only ordered products will appear in the dropdown.
</p>
        </div>
        <Link to="/purchasing/receive" className="btn-secondary no-underline">
          Back
        </Link>
      </div>

      <form onSubmit={handleSubmit}  noValidate className="card-padded flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="form-label">Purchase Order *</label>
            <select
  className={`select-field ${
    errors.purchaseOrderId ? 'border-red-500 focus:border-red-500' : ''
  }`}
  value={form.purchaseOrderId}
  onChange={(e) => {
    handlePoChange(e.target.value);

    if (errors.purchaseOrderId) {
      setErrors((prev) => ({
        ...prev,
        purchaseOrderId: '',
      }));
    }
  }}
>
  <option value="">Select purchase order</option>

  {openOrders.map((o) => (
    <option key={o._id} value={o._id}>
      {o.poNumber} — {o.vendorId?.name || 'Supplier'} ({o.status})
    </option>
  ))}
</select>

{errors.purchaseOrderId && (
  <p className="text-red-500 text-xs mt-1">
    {errors.purchaseOrderId}
  </p>
)}
            {openOrders.length === 0 && (
              <p className="text-xs text-amber-700 mt-1 m-0">
               'No open purchase orders available. Please create a PO and mark it as ordered first.'
              </p>
            )}
          </div>

<div>
  <label className="form-label">Supplier *</label>

  <select
    className={`select-field ${
      errors.vendorId ? 'border-red-500 focus:border-red-500' : ''
    }`}
    value={form.vendorId}
    disabled={Boolean(po)}
    onChange={(e) => {
      setForm({ ...form, vendorId: e.target.value });

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
            <label className="form-label">Receive into *</label>
            <select
  className={`select-field ${
    errors.locationId ? 'border-red-500 focus:border-red-500' : ''
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

{storeHint && (
  <p className="text-xs text-slate-500 mt-1 m-0">
    {storeHint}
  </p>
)}
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.createBill}
            onChange={(e) => setForm({ ...form, createBill: e.target.checked })}
          />
          Auto-create supplier bill
        </label>

        <div>
          <div className="flex justify-between mb-2">
            <h2 className="text-sm font-semibold m-0">Items from purchase order</h2>
            {po && poLineOptions.length > form.items.length && (
              <button type="button" className="btn-secondary text-xs" onClick={addLine}>
                Add line
              </button>
            )}
          </div>

          {!form.purchaseOrderId ? (
           <p className="text-sm text-slate-500 m-0">
           Please select a purchase order first.
         </p>
          ) : poLineOptions.length === 0 ? (
            <p className="text-sm text-amber-700 m-0">
            All quantities from this order have already been received.
          </p>
          ) : (
            <div className="flex flex-col gap-2">
              {form.items.map((line, idx) => {
                const maxQty = getRemainingForLine(line, idx) || line.maxQty;
                return (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                    <div className="md:col-span-4">
                      <label className="form-label">Product (from order) *</label>
                      <Select
  styles={{
    ...selectCustomStyles,
    control: (base, state) => ({
      ...selectCustomStyles.control(base, state),
      borderColor: errors.items[idx]?.productName
        ? '#ef4444'
        : state.isFocused
        ? '#4f46e5'
        : '#cbd5e1',
      boxShadow: errors.items[idx]?.productName
        ? '0 0 0 1px #ef4444'
        : state.isFocused
        ? '0 0 0 1px #4f46e5'
        : 'none',
    }),
  }}
                        options={selectableOptionsForLine(line, idx).map((opt) => ({
                          value: opt._id,
                          label: `${opt.productName} (pending: ${opt.remaining})`,
                        }))}
                        value={
                          line.purchaseOrderItemId
                            ? {
                                value: line.purchaseOrderItemId,
                                label: `${line.productName} (pending: ${maxQty})`,
                              }
                            : null
                        }
                        onChange={(opt) => handleProductSelect(idx, opt ? opt.value : '')}
                        placeholder="Type product name…"
                        isSearchable
                        isClearable
                      />
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
  max={maxQty || undefined}
  className={`input-field ${
    errors.items[idx]?.quantity
      ? 'border-red-500 focus:border-red-500'
      : ''
  }`}
  value={line.quantity}
  onChange={(e) => {
    const value = e.target.value;

    updateLine(idx, { quantity: value });

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
                      {line.purchaseOrderItemId && (
                        <p className="text-[11px] text-slate-500 m-0 mt-0.5">Max: {maxQty}</p>
                      )}
                    </div>
                    {errors.items[idx]?.quantity && (
  <p className="text-red-500 text-xs mt-1">
    {errors.items[idx].quantity}
  </p>
)}
                    <div className="md:col-span-2">
                      <label className="form-label">Unit</label>
                      <input className="input-field" value={line.unit} disabled readOnly />
                    </div>
                    <div className="md:col-span-2">
                      <label className="form-label">Cost/unit</label>
                      <input
  type="number"
  min="0"
  step="0.01"
  className={`input-field ${
    errors.items[idx]?.unitCost
      ? 'border-red-500 focus:border-red-500'
      : ''
  }`}
  value={line.unitCost}
  onChange={(e) => {
    const value = e.target.value;

    updateLine(idx, {
      unitCost: value,
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
/>{errors.items[idx]?.unitCost && (
  <p className="text-red-500 text-xs mt-1">
    {errors.items[idx].unitCost}
  </p>
)}
                    </div>
                    <div className="md:col-span-2">
  <label className="form-label">Expiry</label>

  <input
    type="date"
    min={new Date().toISOString().split('T')[0]}
    className={`input-field ${
      errors.items[idx]?.expiryDate
        ? 'border-red-500 focus:border-red-500'
        : ''
    }`}
    value={line.expiryDate}
    onChange={(e) => {
      const value = e.target.value;

      updateLine(idx, { expiryDate: value });

      if (errors.items[idx]?.expiryDate) {
        setErrors((prev) => {
          const items = [...prev.items];

          items[idx] = {
            ...items[idx],
            expiryDate: '',
          };

          return {
            ...prev,
            items,
          };
        });
      }
    }}
    disabled={!line.purchaseOrderItemId}
  />

  {errors.items[idx]?.expiryDate && (
    <p className="text-red-500 text-xs mt-1">
      {errors.items[idx].expiryDate}
    </p>
  )}
</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Link to="/purchasing/receive" className="btn-secondary no-underline">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn-primary"
            disabled={saving || !form.purchaseOrderId || poLineOptions.length === 0}
          >
            {saving ? 'Posting…' : 'Receive goods'}
          </button>
        </div>
      </form>

      {/* PRINTABLE PURCHASE RECEIPT MODAL */}
      {createdReceipt && (
        <PurchaseReceiptModal
          receipt={createdReceipt}
          onClose={() => {
            setCreatedReceipt(null);
            navigate('/purchasing/receive');
          }}
        />
      )}
    </div>
  );
};

export default GoodsReceiptFormPage;
