/** @module inventory/purchasing/pages/StockTransferFormPage */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import purchaseService from '../../../shared/services/purchaseService';
import api from '../../../shared/utils/api';

const blankLine = () => ({
  productId: '',
  batchId: '',
  quantity: 0,
  batches: [],
});

const StockTransferFormPage = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [sourceProducts, setSourceProducts] = useState([]);
  const [loadingSource, setLoadingSource] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fromLocationId: '',
    toLocationId: '',
    notes: '',
    items: [blankLine()],
  });
  const [errors, setErrors] = useState({
    fromLocationId: '',
    toLocationId: '',
    items: [],
  });
  useEffect(() => {
    api
      .get('/api/warehouses')
      .then((wRes) => {
        const locs = (Array.isArray(wRes.data.data) ? wRes.data.data : []).filter(
          (l) => l.status !== 'inactive' && !l.isDeleted
        );
        setLocations(locs);
        const warehouse = locs.find((l) => l.locationType === 'warehouse');
        const store = locs.find((l) => l.locationType === 'store');
        if (warehouse && store) {
          setForm((f) => ({
            ...f,
            fromLocationId: warehouse._id,
            toLocationId: store._id,
          }));
        }
      })
      .catch(() => toast.error('Failed to load locations'));
  }, []);

  const loadSourceProducts = async (fromLocationId) => {
    if (!fromLocationId) {
      setSourceProducts([]);
      return;
    }
    setLoadingSource(true);
    try {
      const res = await purchaseService.getTransferSourceOptions(fromLocationId);
      setSourceProducts(res.data.data || []);
    } catch (err) {
      setSourceProducts([]);
      toast.error(err.response?.data?.message || 'Failed to load received products');
    } finally {
      setLoadingSource(false);
    }
  };

  useEffect(() => {
    if (form.fromLocationId) {
      loadSourceProducts(form.fromLocationId);
      setForm((f) => ({
        ...f,
        items: [blankLine()],
      }));
    }
  }, [form.fromLocationId]);

  const getProductEntry = (productId) =>
    sourceProducts.find((p) => String(p.productId) === String(productId));

  const selectableProductsForLine = (line, idx) => {
    const usedElsewhere = new Set(
      form.items
        .filter((_, rowIdx) => rowIdx !== idx)
        .map((row) => row.batchId)
        .filter(Boolean)
    );
    return sourceProducts.filter((product) =>
      product.batches.some(
        (b) => String(b._id) === String(line.batchId) || !usedElsewhere.has(String(b._id))
      )
    );
  };

  const selectableBatchesForLine = (line, idx) => {
    const product = getProductEntry(line.productId);
    if (!product) return [];
    const usedElsewhere = new Set(
      form.items
        .filter((_, rowIdx) => rowIdx !== idx)
        .map((row) => row.batchId)
        .filter(Boolean)
    );
    return product.batches.filter(
      (b) => String(b._id) === String(line.batchId) || !usedElsewhere.has(String(b._id))
    );
  };

  const handleProductSelect = (idx, productId) => {
    setErrors((prev) => {
      const itemErrors = [...prev.items];
      itemErrors[idx] = {
        ...(itemErrors[idx] || {}),
        productId: '',
        batchId: '',
        quantity: '',
      };
    
      return {
        ...prev,
        items: itemErrors,
      };
    });
    const product = getProductEntry(productId);
    setForm((f) => {
      const items = [...f.items];
      items[idx] = {
        productId,
        batchId: '',
        quantity: 0,
        batches: product?.batches || [],
      };
      return { ...f, items };
    });
  };

  const handleBatchSelect = (idx, batchId) => {
    setErrors((prev) => {
      const itemErrors = [...prev.items];
      itemErrors[idx] = {
        ...(itemErrors[idx] || {}),
        batchId: '',
        quantity: '',
      };
    
      return {
        ...prev,
        items: itemErrors,
      };
    });
    const line = form.items[idx];
    const batch = (line.batches || []).find((b) => String(b._id) === String(batchId));
    setForm((f) => {
      const items = [...f.items];
      items[idx] = {
        ...items[idx],
        batchId,
        quantity: batch ? Number(batch.remainingQty) : 1,
        maxQty: batch ? Number(batch.remainingQty) : 0,
      };
      return { ...f, items };
    });
  };

  const getMaxQtyForLine = (line) => {
    const batch = (line.batches || []).find((b) => String(b._id) === String(line.batchId));
    return batch ? Number(batch.remainingQty) : Number(line.maxQty) || 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const newErrors = {
      fromLocationId: '',
      toLocationId: '',
      items: [],
    };
  
    if (!form.fromLocationId) {
      newErrors.fromLocationId = 'Source location is required';
    }
  
    if (!form.toLocationId) {
      newErrors.toLocationId = 'Destination location is required';
    }
  
    if (
      form.fromLocationId &&
      form.toLocationId &&
      form.fromLocationId === form.toLocationId
    ) {
      newErrors.toLocationId = 'Destination location must be different from source location';
    }
  
    form.items.forEach((line, idx) => {
      const itemErrors = {};
  
      if (!line.productId) {
        itemErrors.productId = 'Product is required';
      }
  
      if (!line.batchId) {
        itemErrors.batchId = 'Batch is required';
      }
  
      const quantity = Number(line.quantity);
      const maxQty = getMaxQtyForLine(line);
  
      if (!quantity || quantity <= 0) {
        itemErrors.quantity = 'Transfer quantity must be greater than 0';
      } else if (maxQty > 0 && quantity > maxQty) {
        itemErrors.quantity = `Maximum ${maxQty} units can be transferred`;
      }
  
      newErrors.items[idx] = itemErrors;
    });
  
    setErrors(newErrors);
  
    const hasItemErrors = newErrors.items.some(
      (item) => Object.keys(item || {}).length > 0
    );
  
    if (
      newErrors.fromLocationId ||
      newErrors.toLocationId ||
      hasItemErrors
    ) {
      return;
    
    }

    setSaving(true);
    try {
      const res = await purchaseService.createTransfer({
        fromLocationId: form.fromLocationId,
        toLocationId: form.toLocationId,
        notes: form.notes,
        complete: true,
        items: form.items.map((i) => ({
          productId: i.productId,
          batchId: i.batchId,
          quantity: Number(i.quantity),
        })),
      });
      toast.success(`Transfer completed (${res.data.data.transferNumber})`);
      navigate('/purchasing/transfers');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transfer failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">New Stock Transfer</h1>
          <p className="page-subtitle">
          Select a batch and enter the quantity to transfer (partial transfer allowed)
          </p>
        </div>
        <Link to="/purchasing/transfers" className="btn-secondary no-underline">
          Back
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="card-padded flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="form-label">From *</label>
            <select
  className="select-field"
  value={form.fromLocationId}
  onChange={(e) => {
    setForm({ ...form, fromLocationId: e.target.value });
    setErrors((prev) => ({
      ...prev,
      fromLocationId: '',
    }));
  }}
  
>
              <option value="">Select</option>
              {locations.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.name} ({l.locationType || 'store'})
                </option>
              ))}
            </select>
            {errors.fromLocationId && (
  <p className="text-xs text-red-500 mt-1">
    {errors.fromLocationId}
  </p>
)}
          </div>
          <div>
            <label className="form-label">To *</label>
            <select
  className="select-field"
  value={form.toLocationId}
  onChange={(e) => {
    setForm({ ...form, toLocationId: e.target.value });
    setErrors((prev) => ({
      ...prev,
      toLocationId: '',
    }));
  }}
  
>
              <option value="">Select</option>
              {locations.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.name} ({l.locationType || 'store'})
                </option>
              ))}
            </select>
            {errors.toLocationId && (
  <p className="text-xs text-red-500 mt-1">
    {errors.toLocationId}
  </p>
)}
          </div>
        </div>

        {!form.fromLocationId ? (
          <p className="text-sm text-slate-500 m-0">Please select a source location first.</p>
        ) : loadingSource ? (
          <p className="text-sm text-slate-500 m-0">Loading received products…</p>
        ) : sourceProducts.length === 0 ? (
          <p className="text-sm text-amber-700 m-0">
           No received batches are available at this location. Please receive stock first.
          </p>
        ) : (
          <div>
            <div className="flex justify-between mb-2">
              <h2 className="text-sm font-semibold m-0">Items</h2>
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() => setForm({ ...form, items: [...form.items, blankLine()] })}
              >
                Add line
              </button>
            </div>
            {form.items.map((line, idx) => {
              const maxQty = getMaxQtyForLine(line);
              return (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end mb-2">
                  <div className="md:col-span-4">
                    <label className="form-label">Product (received)</label>
                    <select
                      className="select-field"
                      value={line.productId}
                      onChange={(e) => handleProductSelect(idx, e.target.value)}
                      
                    >
                      <option value="">Select product</option>
                      {selectableProductsForLine(line, idx).map((p) => (
                        <option key={p.productId} value={p.productId}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                    {errors.items?.[idx]?.productId && (
  <p className="text-xs text-red-500 mt-1">
    {errors.items[idx].productId}
  </p>
)}
                  </div>
                  <div className="md:col-span-4">
                    <label className="form-label">Batch</label>
                    <select
                      className="select-field"
                      value={line.batchId}
                      onChange={(e) => handleBatchSelect(idx, e.target.value)}
                    
                      disabled={!line.productId}
                    >
                      <option value="">Select batch</option>
                      {selectableBatchesForLine(line, idx).map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.batchNumber}
                          {b.reference ? ` · ${b.reference}` : ''}
                          {' · Available '}
                          {b.remainingQty}
                        </option>
                      ))}
                    </select>
                    {errors.items?.[idx]?.batchId && (
  <p className="text-xs text-red-500 mt-1">
    {errors.items[idx].batchId}
  </p>
)}
                  </div>
                  <div className="md:col-span-3">
                    <label className="form-label">Transfer qty *</label>
                    <input
                      type="number"
                      
                     
                      className="input-field"
                      value={line.quantity || ''}
                      onChange={(e) => {
                        const items = [...form.items];
                        items[idx] = { ...items[idx], quantity: e.target.value };
                        setForm({ ...form, items });
                      
                        setErrors((prev) => {
                          const itemErrors = [...prev.items];
                          itemErrors[idx] = {
                            ...(itemErrors[idx] || {}),
                            quantity: '',
                          };
                      
                          return {
                            ...prev,
                            items: itemErrors,
                          };
                        });
                      }}
                      
                      disabled={!line.batchId}
                    />
                    {line.batchId && (
                      <p className="text-[11px] text-slate-500 m-0 mt-0.5">Max: {maxQty}</p>
                    )}
                    {errors.items?.[idx]?.quantity && (
  <p className="text-xs text-red-500 mt-1">
    {errors.items[idx].quantity}
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
              );
            })}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Link to="/purchasing/transfers" className="btn-secondary no-underline">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn-primary"
            disabled={saving || !form.fromLocationId || sourceProducts.length === 0}
          >
            {saving ? 'Transferring…' : 'Complete transfer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StockTransferFormPage;
