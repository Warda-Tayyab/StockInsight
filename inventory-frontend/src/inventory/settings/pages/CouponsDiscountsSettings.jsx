/** @module inventory/settings/pages/CouponsDiscountsSettings */

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil } from 'react-icons/hi';
import promotionsService from '../../../shared/services/promotionsService';

const emptyDiscountForm = {
  name: '',
  type: 'percentage',
  value: '',
  scope: '',
  productIds: [],
  batchIds: [],
  startDate: '',
  endDate: '',
  isActive: true,
};
const emptyCouponForm = {
  code: '',
  description: '',
  type: 'percentage',
  value: '',
  minOrderAmount: '',
  maxUses: '',
  startDate: '',
  endDate: '',
  isActive: true,
};

const scopeLabels = {
  product: 'Product',
  batch: 'Specific Batch',
};
const batchStatusStyles = {
  active: 'bg-emerald-100 text-emerald-700',
  expiring_soon: 'bg-amber-100 text-amber-800',
  expired: 'bg-rose-100 text-rose-700',
};

const batchStatusLabels = {
  active: 'Active',
  expiring_soon: 'Expiring soon',
  expired: 'Expired',
};

const formatValue = (type, value) =>
  type === 'percentage' ? `${value}%` : `Rs.${Number(value).toFixed(2)}`;

const formatDate = (value) => {
  if (!value) return 'No limit';
  return new Date(value).toLocaleDateString();
};

const CouponsDiscountsSettings = () => {
  const [discounts, setDiscounts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [discountOptions, setDiscountOptions] = useState({
    categories: [],
    products: [],
    brands: [],
    batches: [],
  });
  const [batchStatusFilter, setBatchStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [savingDiscount, setSavingDiscount] = useState(false);
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [discountForm, setDiscountForm] = useState(emptyDiscountForm);
  const [couponForm, setCouponForm] = useState(emptyCouponForm);
  const [editingDiscountId, setEditingDiscountId] = useState(null);
  const [editingCouponId, setEditingCouponId] = useState(null);

  const loadData = async () => {
    try {
      const [discountRes, couponRes, optionsRes] = await Promise.all([
        promotionsService.getDiscounts(),
        promotionsService.getCoupons(),
        promotionsService.getDiscountOptions(),
      ]);
      setDiscounts(discountRes.data.discounts || []);
      setCoupons(couponRes.data.coupons || []);
      setDiscountOptions({
        categories: optionsRes.data.categories || [],
        products: optionsRes.data.products || [],
        brands: optionsRes.data.brands || [],
        batches: optionsRes.data.batches || [],
      });
    } catch {
      toast.error('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetDiscountForm = () => {
    setDiscountForm(emptyDiscountForm);
    setEditingDiscountId(null);
  };

  const resetCouponForm = () => {
    setCouponForm(emptyCouponForm);
    setEditingCouponId(null);
  };

  const handleDiscountChange = (field, value) => {
    setDiscountForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'scope') {
        next.productIds = [];
        next.batchIds = [];
      }
      return next;
    });
  };

  const toggleDiscountSelection = (field, value) => {
    setDiscountForm((prev) => {
      const current = prev[field] || [];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [field]: next };
    });
  };

  const formatDiscountScope = (discount) => {
    const scope = discount.scope;
  
    if (scope === 'product') {
      const names = (discount.productIds || [])
        .map((id) =>
          discountOptions.products.find(
            (product) => String(product._id) === String(id)
          )?.name
        )
        .filter(Boolean);
  
      return names.length ? names.join(', ') : 'Selected products';
    }
  
    if (scope === 'batch') {
      const names = (discount.batchIds || [])
        .map((id) => {
          const batch = discountOptions.batches.find(
            (item) => String(item._id) === String(id)
          );
  
          if (!batch) return null;
  
          return `${batch.batchNumber} (${batch.productName})`;
        })
        .filter(Boolean);
  
      return names.length ? names.join(', ') : 'Selected batches';
    }
  
    return '';
  };
  const handleCouponChange = (field, value) => {
    setCouponForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'scope') {
        next.categoryIds = [];
        next.productIds = [];
        next.brandNames = [];
        next.batchIds = [];
      }
      return next;
    });
  };

  const toggleCouponSelection = (field, value) => {
    setCouponForm((prev) => {
      const current = prev[field] || [];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [field]: next };
    });
  };

  const renderScopeFields = (form, onChange, toggleSelection) => (
    <>
      <div>
  <label className="form-label">Applies To</label>

  <select
    className="input-field"
    value={form.scope}
    onChange={(e) => onChange('scope', e.target.value)}
    required
  >
    <option value="" disabled>
      Select products or batches
    </option>
    <option value="product">Specific Products</option>
    <option value="batch">Specific Batches</option>
  </select>
</div>


   

      {form.scope === 'product' && (
        <div className="md:col-span-2">
          <label className="form-label">Products</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-3">
            {discountOptions.products.map((product) => (
              <label key={product._id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.productIds.includes(String(product._id))}
                  onChange={() => toggleSelection('productIds', String(product._id))}
                  className="rounded accent-indigo-600"
                />
                <span>{product.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

    
      {form.scope === 'batch' && (
        <div className="md:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <label className="form-label mb-0">Batches with stock</label>
            <select
              className="input-field !w-auto !py-1.5 text-xs"
              value={batchStatusFilter}
              onChange={(e) => setBatchStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="expiring_soon">Expiring soon</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
            {(discountOptions.batches || [])
              .filter((batch) =>
                batchStatusFilter === 'all' ? true : batch.status === batchStatusFilter
              )
              .map((batch) => (
                <label key={batch._id} className="flex items-start gap-3 p-3 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={form.batchIds.includes(String(batch._id))}
                    onChange={() => toggleSelection('batchIds', String(batch._id))}
                    className="mt-1 rounded accent-indigo-600"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-slate-800">{batch.batchNumber}</span>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          batchStatusStyles[batch.status] || batchStatusStyles.active
                        }`}
                      >
                        {batchStatusLabels[batch.status] || 'Active'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 truncate">
                      {batch.productName}
                      {batch.sku ? ` · ${batch.sku}` : ''}
                      {batch.warehouseName ? ` · ${batch.warehouseName}` : ''}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Qty: {batch.remainingQty}
                      {batch.expiryDate
                        ? ` · Expiry: ${new Date(batch.expiryDate).toLocaleDateString()}`
                        : ' · No expiry date'}
                      {batch.daysUntilExpiry != null && batch.status === 'expiring_soon'
                        ? ` · ${batch.daysUntilExpiry} day(s) left`
                        : ''}
                    </p>
                  </div>
                </label>
              ))}
            {(discountOptions.batches || []).filter((batch) =>
              batchStatusFilter === 'all' ? true : batch.status === batchStatusFilter
            ).length === 0 && (
              <p className="p-4 text-sm text-slate-500 text-center">
                No batches with remaining quantity found.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );

 

  const handleSaveDiscount = async (e) => {
    e.preventDefault();
    setSavingDiscount(true);
    try {
      const payload = {
        name: discountForm.name,
        type: discountForm.type,
        value: Number(discountForm.value),
        scope: discountForm.scope,
        productIds: discountForm.productIds,
        batchIds: discountForm.batchIds,
        startDate: discountForm.startDate || null,
        endDate: discountForm.endDate || null,
        isActive: discountForm.isActive,
      };;

      if (editingDiscountId) {
        await promotionsService.updateDiscount(editingDiscountId, payload);
        toast.success('Discount updated');
      } else {
        await promotionsService.createDiscount(payload);
        toast.success('Discount created');
      }

      resetDiscountForm();
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save discount');
    } finally {
      setSavingDiscount(false);
    }
  };
  const handleEditDiscount = (discount) => {
    setEditingDiscountId(discount._id);
  
    setDiscountForm({
      name: discount.name || '',
      type: discount.type || 'percentage',
      value: discount.value ?? '',
      scope: discount.scope || 'product',
      productIds: (discount.productIds || []).map(String),
      batchIds: (discount.batchIds || []).map(String),
      startDate: discount.startDate
        ? discount.startDate.slice(0, 10)
        : '',
      endDate: discount.endDate
        ? discount.endDate.slice(0, 10)
        : '',
      isActive: Boolean(discount.isActive),
    });
  };
  const handleToggleDiscount = async (discount) => {
    try {
      await promotionsService.updateDiscount(discount._id, {
        isActive: !discount.isActive,
      });
      toast.success(discount.isActive ? 'Discount deactivated' : 'Discount activated');
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update discount');
    }
  };

  const handleDeleteDiscount = async (id) => {
    if (!window.confirm('Delete this store discount?')) return;
    try {
      await promotionsService.deleteDiscount(id);
      toast.success('Discount deleted');
      if (editingDiscountId === id) resetDiscountForm();
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete discount');
    }
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    setSavingCoupon(true);
    try {
      const payload = {
        code: couponForm.code.trim().toUpperCase(),
        description: couponForm.description,
        type: couponForm.type,
        value: Number(couponForm.value),
        minOrderAmount: Number(couponForm.minOrderAmount) || 0,
        maxUses: couponForm.maxUses === '' ? null : Number(couponForm.maxUses),
        startDate: couponForm.startDate || null,
        endDate: couponForm.endDate || null,
        isActive: couponForm.isActive,
      };

      if (editingCouponId) {
        await promotionsService.updateCoupon(editingCouponId, payload);
        toast.success('Coupon updated');
      } else {
        await promotionsService.createCoupon(payload);
        toast.success('Coupon created');
      }

      resetCouponForm();
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save coupon');
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleEditCoupon = (coupon) => {
    setEditingCouponId(coupon._id);
  
    setCouponForm({
      code: coupon.code || '',
      description: coupon.description || '',
      type: coupon.type || 'percentage',
      value: coupon.value ?? '',
      minOrderAmount: coupon.minOrderAmount ?? '',
      maxUses: coupon.maxUses ?? '',
      startDate: coupon.startDate
        ? coupon.startDate.slice(0, 10)
        : '',
      endDate: coupon.endDate
        ? coupon.endDate.slice(0, 10)
        : '',
      isActive: Boolean(coupon.isActive),
    });
  };

  const handleToggleCoupon = async (coupon) => {
    try {
      await promotionsService.updateCoupon(coupon._id, {
        isActive: !coupon.isActive,
      });
      toast.success(coupon.isActive ? 'Coupon deactivated' : 'Coupon activated');
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update coupon');
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await promotionsService.deleteCoupon(id);
      toast.success('Coupon deleted');
      if (editingCouponId === id) resetCouponForm();
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete coupon');
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-500">Loading...</div>;
  }

  return (
    <div className="w-full space-y-8">
      <section className="card-padded flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Store Discounts</h2>
          <p className="text-sm text-slate-500 mt-1">
          Apply discounts to specific products or batches. Only the best applicable discount is applied to each item.
</p>
        </div>

        <form onSubmit={handleSaveDiscount} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="form-label">Discount Name</label>
            <input
              className="input-field"
              value={discountForm.name}
              onChange={(e) => handleDiscountChange('name', e.target.value)}
              placeholder="Summer Sale"
              required
            />
          </div>

          {renderScopeFields(discountForm, handleDiscountChange, toggleDiscountSelection)}

          <div>
            <label className="form-label">Type</label>
            <select
              className="input-field"
              value={discountForm.type}
              onChange={(e) => handleDiscountChange('type', e.target.value)}
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (Rs.)</option>
            </select>
          </div>

          <div>
            <label className="form-label">Value</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input-field"
              value={discountForm.value}
              onChange={(e) => handleDiscountChange('value', e.target.value)}
              placeholder={discountForm.type === 'percentage' ? '10' : '5.00'}
              required
            />
          </div>

         

          <div>
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="input-field"
              value={discountForm.startDate}
              onChange={(e) => handleDiscountChange('startDate', e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="input-field"
              value={discountForm.endDate}
              onChange={(e) => handleDiscountChange('endDate', e.target.value)}
            />
          </div>

          <label className="md:col-span-2 flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={discountForm.isActive}
              onChange={(e) => handleDiscountChange('isActive', e.target.checked)}
              className="w-4 h-4 rounded accent-indigo-600"
            />
            <span className="text-sm font-medium text-slate-700">Activate this discount now</span>
          </label>

          <div className="md:col-span-2 flex gap-3">
            <button type="submit" disabled={savingDiscount} className="btn-primary">
              {savingDiscount
                ? 'Saving...'
                : editingDiscountId
                  ? 'Update Discount'
                  : 'Add Discount'}
            </button>
            {editingDiscountId && (
              <button type="button" onClick={resetDiscountForm} className="btn-secondary">
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Applies To</th>
                <th className="py-2 pr-3">Value</th>
                <th className="py-2 pr-3">Dates</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {discounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    No store discounts yet
                  </td>
                </tr>
              ) : (
                discounts.map((discount) => (
                  <tr key={discount._id} className="border-b border-slate-100">
                    <td className="py-3 pr-3 font-medium text-slate-800">{discount.name}</td>
                    <td className="py-3 pr-3">
                      <div className="font-medium text-slate-700">
                        {scopeLabels[discount.scope || 'all']}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {formatDiscountScope(discount)}
                      </div>
                    </td>
                    <td className="py-3 pr-3">{formatValue(discount.type, discount.value)}</td>
                  
                    <td className="py-3 pr-3">
                      {formatDate(discount.startDate)} - {formatDate(discount.endDate)}
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          discount.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {discount.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleDiscount(discount)}
                          className="text-xs btn-secondary !py-1 !px-2"
                        >
                          {discount.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditDiscount(discount)}
                          className="btn-icon !py-1 !px-2"
                          aria-label="Edit discount"
                        >
                          <HiOutlinePencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDiscount(discount._id)}
                          className="btn-icon !py-1 !px-2 text-red-600"
                          aria-label="Delete discount"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card-padded flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Coupons</h2>
          <p className="text-sm text-slate-500 mt-1">
            Create coupon codes that cashiers can apply at checkout. Discounts appear on the receipt.
          </p>
        </div>

        <form onSubmit={handleSaveCoupon} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Coupon Code</label>
            <input
              className="input-field uppercase"
              value={couponForm.code}
              onChange={(e) => handleCouponChange('code', e.target.value.toUpperCase())}
              placeholder="SAVE20"
              required
            />
          </div>

          <div>
            <label className="form-label">Description</label>
            <input
              className="input-field"
              value={couponForm.description}
              onChange={(e) => handleCouponChange('description', e.target.value)}
              placeholder="New customer offer"
            />
          </div>

        

          <div>
            <label className="form-label">Type</label>
            <select
              className="input-field"
              value={couponForm.type}
              onChange={(e) => handleCouponChange('type', e.target.value)}
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (Rs)</option>
            </select>
          </div>

          <div>
            <label className="form-label">Value</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input-field"
              value={couponForm.value}
              onChange={(e) => handleCouponChange('value', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="form-label">Minimum Order (Rs)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input-field"
              value={couponForm.minOrderAmount}
              onChange={(e) => handleCouponChange('minOrderAmount', e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Max Uses</label>
            <input
              type="number"
              min="1"
              className="input-field"
              value={couponForm.maxUses}
              onChange={(e) => handleCouponChange('maxUses', e.target.value)}
              placeholder="Unlimited"
            />
          </div>

          <div>
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="input-field"
              value={couponForm.startDate}
              onChange={(e) => handleCouponChange('startDate', e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="input-field"
              value={couponForm.endDate}
              onChange={(e) => handleCouponChange('endDate', e.target.value)}
            />
          </div>

          <label className="md:col-span-2 flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={couponForm.isActive}
              onChange={(e) => handleCouponChange('isActive', e.target.checked)}
              className="w-4 h-4 rounded accent-indigo-600"
            />
            <span className="text-sm font-medium text-slate-700">Coupon is active</span>
          </label>

          <div className="md:col-span-2 flex gap-3">
            <button type="submit" disabled={savingCoupon} className="btn-primary">
              <HiOutlinePlus className="w-4 h-4" />
              {savingCoupon
                ? 'Saving...'
                : editingCouponId
                  ? 'Update Coupon'
                  : 'Add Coupon'}
            </button>
            {editingCouponId && (
              <button type="button" onClick={resetCouponForm} className="btn-secondary">
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 pr-3">Code</th>
                <th className="py-2 pr-3">Value</th>
                <th className="py-2 pr-3">Uses</th>
                <th className="py-2 pr-3">Min. Order</th>
                <th className="py-2 pr-3">Dates</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    No coupons yet
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon._id} className="border-b border-slate-100">
                    <td className="py-3 pr-3">
                      <div className="font-semibold text-slate-800">{coupon.code}</div>
                      {coupon.description && (
                        <div className="text-xs text-slate-500">{coupon.description}</div>
                      )}
                    </td>
                    <td className="py-3 pr-3">{formatValue(coupon.type, coupon.value)}</td>

                    <td className="py-3 pr-3">
                      {coupon.usedCount || 0}
                      {coupon.maxUses != null ? ` / ${coupon.maxUses}` : ' / ∞'}
                    </td>
                    <td className="py-3 pr-3">
  Rs.{Number(coupon.minOrderAmount || 0).toFixed(2)}
</td>
                    <td className="py-3 pr-3">
                      {formatDate(coupon.startDate)} - {formatDate(coupon.endDate)}
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          coupon.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleCoupon(coupon)}
                          className="text-xs btn-secondary !py-1 !px-2"
                        >
                          {coupon.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditCoupon(coupon)}
                          className="btn-icon !py-1 !px-2"
                          aria-label="Edit coupon"
                        >
                          <HiOutlinePencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(coupon._id)}
                          className="btn-icon !py-1 !px-2 text-red-600"
                          aria-label="Delete coupon"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default CouponsDiscountsSettings;

