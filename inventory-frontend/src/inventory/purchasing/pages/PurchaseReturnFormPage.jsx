import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import purchaseService from '../../../shared/services/purchaseService';
import api from '../../../shared/utils/api';

const blankReturnItem = () => ({
  returnGroupId: '',
  productId: '',
  productName: '',
  sku: '',
  batchId: '',
  batchNumber: '',
  availableBatches: [],
  maxQty: 0,
  purchasedQty: 0,
  maxUnitCost: 0,
  quantity: 1,
  unitCost: 0,
  reason: 'Damaged / Defective',
  returnSource: '',
});

const PurchaseReturnFormPage = () => {
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [returnableProducts, setReturnableProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [form, setForm] = useState({
    vendorId: '',
    locationId: '',
    returnDate: new Date().toISOString().split('T')[0],
    notes: '',
    items: [blankReturnItem()],
  });
  const [errors, setErrors] = useState({
    vendorId: '',
    locationId: '',
    returnDate: '',
    notes: '',
    items: [],
  });
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [vRes, wRes] = await Promise.all([
          purchaseService.listVendors({ status: 'active' }),
          api.get('/api/warehouses'),
        ]);

        const supplierList = Array.isArray(vRes.data?.data) ? vRes.data.data : [];
        const locList = Array.isArray(wRes.data?.data) ? wRes.data.data : [];
        const activeLocs = locList.filter((l) => l.status !== 'inactive' && !l.isDeleted);

        setSuppliers(supplierList);
        setLocations(activeLocs);

        if (supplierList.length === 1) {
          setForm((prev) => ({ ...prev, vendorId: supplierList[0]._id }));
        }
      } catch (err) {
        console.error('Initial data load error:', err);
        toast.error('Failed to load form options');
      }
    };

    loadInitialData();
  }, []);

  const fetchReturnableProducts = async (locationId, vendorId = form.vendorId) => {
    if (!locationId || !vendorId) {
      setReturnableProducts([]);
      return;
    }
    try {
      setLoadingProducts(true);
      const res = await purchaseService.getReturnableProducts(locationId, vendorId);
      const list = res.data?.data || [];
      setReturnableProducts(list);
      if (list.length === 0) {
        toast.error('No purchased stock available at this location');
      }
    } catch (err) {
      console.error('Failed to fetch returnable products', err);
      setReturnableProducts([]);
      toast.error(err.response?.data?.message || 'Failed to load products for this location');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleLocationChange = async (locationId) => {
    setErrors((prev) => ({
      ...prev,
      locationId: '',
    }));
    setForm((prev) => ({
      ...prev,
      locationId,
      items: [blankReturnItem()],
    }));
    await fetchReturnableProducts(locationId);
  };

  const handleSupplierChange = async (vendorId) => {
    setErrors((prev) => ({
      ...prev,
      vendorId: '',
    }));
    setForm((prev) => ({ ...prev, vendorId, items: [blankReturnItem()] }));
    setReturnableProducts([]);
    if (form.locationId && vendorId) await fetchReturnableProducts(form.locationId, vendorId);
  };

  const handleProductSelect = (index, returnGroupId) => {
    const itemsCopy = [...form.items];
  
    // Product error clear
    setErrors((prev) => {
      const itemErrors = [...prev.items];
      itemErrors[index] = {
        ...(itemErrors[index] || {}),
        productId: '',
        batchId: '',
      };
  
      return {
        ...prev,
        items: itemErrors,
      };
    });
  
    if (!returnGroupId) {
      itemsCopy[index] = blankReturnItem();
      setForm({ ...form, items: itemsCopy });
      return;
    }
  
    const prod = returnableProducts.find(
      (p) => String(p._id) === String(returnGroupId)
    );
  
    const batches = prod?.batches || [];
    const defaultBatch = batches[0];
  
    itemsCopy[index] = {
      ...itemsCopy[index],
      returnGroupId,
      productId: defaultBatch?.productId || prod?._id || returnGroupId,
      productName: prod?.name || '',
      sku: prod?.sku || '',
      unitCost: defaultBatch
        ? Number(defaultBatch.unitCost)
        : Number(prod?.costPrice) || 0,
      maxUnitCost: defaultBatch
        ? Number(defaultBatch.maxUnitCost ?? defaultBatch.unitCost)
        : 0,
      availableBatches: batches,
      batchId: defaultBatch?._id || '',
      batchNumber: defaultBatch?.batchNumber || '',
      maxQty: defaultBatch ? Number(defaultBatch.remainingQty) : 0,
      purchasedQty: defaultBatch ? Number(defaultBatch.purchasedQty) : 0,
      quantity: defaultBatch
        ? Math.min(1, Number(defaultBatch.remainingQty))
        : 1,
      returnSource: defaultBatch?.returnSource || '',
    };
  
    setForm({ ...form, items: itemsCopy });
  };

  const handleBatchChange = (index, batchId) => {
    setErrors((prev) => {
      const itemErrors = [...prev.items];
  
      itemErrors[index] = {
        ...(itemErrors[index] || {}),
        batchId: '',
      };
  
      return {
        ...prev,
        items: itemErrors,
      };
    });
    const itemsCopy = [...form.items];
    const item = itemsCopy[index];
    const selectedBatch = item.availableBatches.find((b) => String(b._id) === String(batchId));

    if (!selectedBatch) return;

    const unitCost = Number(selectedBatch.unitCost) || 0;

    itemsCopy[index] = {
      ...item,
      batchId: selectedBatch._id,
      batchNumber: selectedBatch.batchNumber,
      productId: selectedBatch.productId,
      maxQty: Number(selectedBatch.remainingQty),
      purchasedQty: Number(selectedBatch.purchasedQty),
      unitCost,
      maxUnitCost: Number(selectedBatch.maxUnitCost ?? unitCost),
      quantity: Math.min(Number(item.quantity) || 1, Number(selectedBatch.remainingQty)),
      returnSource: selectedBatch.returnSource || '',
    };

    setForm({ ...form, items: itemsCopy });
  };

  const addItemRow = () => {
    setForm({ ...form, items: [...form.items, blankReturnItem()] });
  };

  const removeItemRow = (index) => {
    if (form.items.length === 1) {
      toast.error('At least one item is required');
      return;
    }
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const updateItemField = (index, field, value) => {
    const itemsCopy = [...form.items];
  
    itemsCopy[index] = {
      ...itemsCopy[index],
      [field]: value,
    };
  
    setForm({ ...form, items: itemsCopy });
  
    // Clear error for changed field
    if (['quantity', 'unitCost', 'reason'].includes(field)) {
      setErrors((prev) => {
        const itemErrors = [...prev.items];
  
        itemErrors[index] = {
          ...(itemErrors[index] || {}),
          [field]: '',
        };
  
        return {
          ...prev,
          items: itemErrors,
        };
      });
    }
  };

  const calculateTotal = () =>
    form.items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitCost) || 0), 0);

    const handleSubmit = async (e) => {
      e.preventDefault();
    
      const newErrors = {
        vendorId: '',
        locationId: '',
        returnDate: '',
        notes: '',
        items: [],
      };
    
      // Supplier validation
      if (!form.vendorId) {
        newErrors.vendorId = 'Supplier is required';
      }
    
      // Location validation
      if (!form.locationId) {
        newErrors.locationId = 'Return location is required';
      }
    
      // Date validation
      if (!form.returnDate) {
        newErrors.returnDate = 'Return date is required';
      }
    
      form.items.forEach((item, index) => {
        const itemErrors = {};
      
        if (!item.productId) {
          itemErrors.productId = 'Product is required';
        }
      
        if (!item.batchId) {
          itemErrors.batchId = 'Batch is required';
        }
      
        const qty = Number(item.quantity);
        const maxQty = Number(item.maxQty);
        const purchasedQty = Number(item.purchasedQty);
        const cost = Number(item.unitCost);
      
        if (!qty || qty <= 0) {
          itemErrors.quantity = 'Quantity must be greater than 0';
        } else if (maxQty > 0 && qty > maxQty) {
          itemErrors.quantity = `Maximum ${maxQty} units can be returned`;
        } else if (purchasedQty > 0 && qty > purchasedQty) {
          itemErrors.quantity = `Only ${purchasedQty} units were originally purchased`;
        }
        if (item.batchId) {
          if (cost < 0) {
            itemErrors.unitCost = 'Unit cost cannot be negative';
          } else if (cost === 0) {
            itemErrors.unitCost = 'Unit cost must be greater than 0';
          } else if (
            item.maxUnitCost > 0 &&
            cost > Number(item.maxUnitCost)
          ) {
            itemErrors.unitCost =
              `Cannot exceed receive cost Rs.${item.maxUnitCost}`;
          }
        }
      
        newErrors.items[index] = itemErrors;
      });
      setErrors(newErrors);
    
      // Stop submission if any error exists
      const hasItemErrors = newErrors.items.some(
        (item) => Object.keys(item || {}).length > 0
      );
    
      if (
        newErrors.vendorId ||
        newErrors.locationId ||
        newErrors.returnDate ||
        hasItemErrors
      ) {
        return;
      }
    
      try {
        setSaving(true);
    
        const payload = {
          vendorId: form.vendorId,
          locationId: form.locationId,
          returnDate: form.returnDate,
          notes: form.notes,
          items: form.items.map((i) => ({
            productId: i.productId,
            batchId: i.batchId,
            batchNumber: i.batchNumber,
            quantity: Number(i.quantity),
            unitCost: Number(i.unitCost),
            reason: i.reason,
            returnSource: i.returnSource,
          })),
        };
    
        const res = await purchaseService.createReturn(payload);
    
        toast.success('Purchase Return completed successfully');
    
        navigate(`/purchasing/returns/${res.data.data._id}`);
      } catch (err) {
        toast.error(
          err.response?.data?.message || 'Failed to submit purchase return'
        );
      } finally {
        setSaving(false);
      }
    };
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">New Purchase Return</h1>
          <p className="page-subtitle">
            Select a location first — purchased products will appear in the dropdown
          </p>
        </div>
        <Link to="/purchasing/returns" className="btn-secondary no-underline">
          Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="card-padded flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Supplier *</label>
            <select
              className="select-field"
              value={form.vendorId}
              onChange={(e) => handleSupplierChange(e.target.value)}
              required
            >
              <option value="">Select supplier…</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
            {errors.vendorId && (
  <p className="text-xs text-red-500 mt-1">
    {errors.vendorId}
  </p>
)}
          </div>

          <div>
            <label className="form-label">Return Location *</label>
            <select
              className="select-field"
              value={form.locationId}
              onChange={(e) => handleLocationChange(e.target.value)}
              required
            >
              <option value="">Select a location first…</option>
              {locations.map((loc) => (
                <option key={loc._id} value={loc._id}>
                  {loc.name} ({loc.locationType || 'location'})
                </option>
              ))}
            </select>
            {errors.locationId && (
  <p className="text-xs text-red-500 mt-1">
    {errors.locationId}
  </p>
)}
          </div>

          <div>
            <label className="form-label">Return Date</label>
            <input
              type="date"
              className="input-field"
              value={form.returnDate}
              onChange={(e) => {
                setForm({ ...form, returnDate: e.target.value });
                setErrors((prev) => ({
                  ...prev,
                  returnDate: '',
                }));
              }}
            />
            {errors.returnDate && (
  <p className="text-xs text-red-500 mt-1">
    {errors.returnDate}
  </p>
)}
          </div>

          <div className="md:col-span-3">
            <label className="form-label">Notes</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Damaged items returned to supplier"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        {!form.locationId && (
          <p className="text-sm text-amber-800 m-0 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
          For the Product dropdown, please select a return location first.
          </p>
        )}

        {form.locationId && !loadingProducts && returnableProducts.length === 0 && (
          <p className="text-sm text-amber-800 m-0 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
            There is no purchased stock available at this location (either it is sold out or has not been received yet).

          </p>
        )}

        <div className="card-padded">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Returned Items</h2>
              <p className="text-xs text-slate-500">
              </p>
            </div>
            <button
              type="button"
              className="btn-secondary text-xs inline-flex items-center gap-1"
              onClick={addItemRow}
              disabled={!form.locationId || !form.vendorId || returnableProducts.length === 0}
            >
              <HiOutlinePlus className="w-4 h-4" /> Add Item
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {form.items.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end border border-slate-100 rounded-lg p-3"
              >
                <div className="md:col-span-3">
                  <label className="form-label">Product *</label>
                  <select
                    className="select-field"
                    value={row.returnGroupId}
                    onChange={(e) => handleProductSelect(idx, e.target.value)}
                    disabled={!form.locationId || !form.vendorId || loadingProducts || returnableProducts.length === 0}
                   
                  >
                    <option value="">
                      {loadingProducts
                        ? 'Loading products…'
                        : !form.locationId
                        ? ' Select a location first'
                        : returnableProducts.length === 0
                        ? 'No Product available'
                        : 'Select product'}
                    </option>
                    {returnableProducts.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                        {p.sku ? ` (${p.sku})` : ''} — Stock: {p.totalBatchQty}
                      </option>
                    ))}
                  </select>
                  {errors.items?.[idx]?.productId && (
  <p className="text-xs text-red-500 mt-1">
    {errors.items[idx].productId}
  </p>
)}
                </div>

                <div className="md:col-span-3">
                  <label className="form-label">Batch *</label>
                  <select
                    className="select-field"
                    value={row.batchId}
                    onChange={(e) => handleBatchChange(idx, e.target.value)}
                    disabled={!row.returnGroupId || !row.availableBatches?.length}
                    required
                  >
                    <option value="">
                      {!row.returnGroupId ? 'Select a product first' : 'Select batch'}
                    </option>
                    {row.availableBatches?.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.batchNumber} · avail {b.remainingQty}
                        {b.returnSource === 'pos_defective' ? ' · POS customer return' : ''}
                        {b.reference ? ` · ${b.reference}` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.items?.[idx]?.batchId && (
  <p className="text-xs text-red-500 mt-1">
    {errors.items[idx].batchId}
  </p>
)}
                </div>

                <div className="md:col-span-2">
  <label className="form-label">Return Qty *</label>

  <input
    type="number"
    className="input-field"
    value={row.quantity}
    onChange={(e) =>
      updateItemField(idx, 'quantity', e.target.value)
    }
    disabled={!row.batchId}
  />

  {row.maxQty > 0 && (
    <span className="text-[11px] text-slate-500">
      Max: {row.maxQty}
    </span>
  )}

  {errors.items?.[idx]?.quantity && (
    <p className="text-xs text-red-500 mt-1">
      {errors.items[idx].quantity}
    </p>
  )}
</div>

                <div className="md:col-span-2">
                  <label className="form-label">Unit Cost *</label>
                  <input
                    type="number"
                  
                    
                    step="0.01"
                    className="input-field"
                    value={row.unitCost}
                    onChange={(e) => updateItemField(idx, 'unitCost', e.target.value)}
                    disabled={!row.batchId}
                    required
                  />
                  {row.maxUnitCost > 0 && (
                    <span className="text-[11px] text-slate-500">
                      Max receive cost: Rs.{row.maxUnitCost}
                    </span>
                  )}
                  {errors.items?.[idx]?.unitCost && (
  <p className="text-xs text-red-500 mt-1">
    {errors.items[idx].unitCost}
  </p>
)}
                </div>

                <div className="md:col-span-1">
                  <label className="form-label">Reason</label>
                  <select
                    className="select-field text-sm"
                    value={row.reason}
                    onChange={(e) => updateItemField(idx, 'reason', e.target.value)}
                  >
                    <option value="Damaged / Defective">Damaged</option>
                    <option value="Expired Stock">Expired</option>
                    <option value="Wrong Item Received">Wrong Item</option>
                    <option value="Excess Inventory">Excess</option>
                  </select>
                </div>

                <div className="md:col-span-1 flex items-end justify-end">
                  {form.items.length > 1 && (
                    <button
                      type="button"
                      className="p-2 text-red-500 hover:text-red-700"
                      onClick={() => removeItemRow(idx)}
                      title="Remove row"
                    >
                      <HiOutlineTrash className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 mt-4">
            <div className="text-right">
              <span className="text-sm text-slate-500 mr-3">Total Return Value:</span>
              <span className="text-xl font-bold text-slate-900">
                Rs. {calculateTotal().toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link to="/purchasing/returns" className="btn-secondary no-underline">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || !form.locationId || returnableProducts.length === 0}
            className="btn-primary"
          >
            {saving ? 'Processing Return…' : 'Post Purchase Return'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PurchaseReturnFormPage;
