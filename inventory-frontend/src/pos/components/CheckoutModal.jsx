/** @module pos/components/CheckoutModal */

import { useState, useEffect } from 'react';
import {
  HiOutlineCash,
  HiOutlineX,
  HiOutlineTicket,
} from 'react-icons/hi';
import { toast } from 'react-hot-toast';
import promotionsService from '../../shared/services/promotionsService';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', Icon: HiOutlineCash },
];

const CheckoutModal = ({
  isOpen,
  onClose,
  items = [],
  subtotal = 0,
  discountedSubtotal = 0,
  storeDiscount,
  couponDiscount,
  couponDiscountAmount = 0,
  appliedCouponCode,
  tax = 0,
  taxRate = 0,
  total = 0,
  onConfirm,
  loading,
  receipt,
  onPromotionChange,
  promotionItems = [],
}) => {
  const {
    taxLabel = 'Tax',
  } = receipt || {};

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setPaymentMethod('cash');
      setCouponCode(appliedCouponCode || '');
      setCashReceived('');
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, appliedCouponCode]);



  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();

    if (!code) {
      toast.error('Enter a coupon code');
      return;
    }

    setApplyingCoupon(true);

    try {
      const res = await promotionsService.validateCoupon(
        code,
        subtotal,
        promotionItems
      );

      onPromotionChange?.({
        couponCode: code,
        coupon: res.data.coupon,
        storeDiscountAmount: res.data.storeDiscountAmount,
        couponDiscountAmount: res.data.couponDiscountAmount,
        discountedSubtotal: res.data.discountedSubtotal,
      });

      toast.success('Coupon applied');
    } catch (err) {
      onPromotionChange?.({
        couponCode: '',
        coupon: null,
      });

      toast.error(
        err.response?.data?.message || 'Invalid coupon'
      );
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');

    onPromotionChange?.({
      couponCode: '',
      coupon: null,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-content max-w-md !overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="modal-header">
          <h3 className="modal-title">
            Checkout
          </h3>

          <button
            type="button"
            className="btn-icon !border-none !shadow-none"
            onClick={onClose}
            aria-label="Close"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body overflow-y-auto max-h-[50vh] !py-5">

          {/* ===================================================== */}
          {/* ITEM BREAKDOWN */}
          {/* ===================================================== */}

          <div className="mb-5">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">
              Order Details
            </h4>

            {items.map((item, index) => {
 const quantity = Number(item.quantity) || 0;

 const originalLineTotal = Number(
  item.originalLineTotal ??
  (Number(item.product?.price || 0) * quantity)
);

const costPrice =
  Number(item.product?.costPrice || 0);

const minimumLineTotal =
  costPrice * quantity;

const requestedDiscountAmount =
  Number(
    item.discountAmount ??
    item.promotion?.discountAmount ??
    0
  );

const maxAllowedDiscount =
  Math.max(
    originalLineTotal - minimumLineTotal,
    0
  );

const discountAmount = Math.min(
  requestedDiscountAmount,
  maxAllowedDiscount
);

const discountType =
  item.promotion?.type ||
  item.promotion?.discountType ||
  item.discountType ||
  null;

const discountPercentage =
  discountType === 'percentage'
    ? Number(
        item.discountPercentage ??
        item.promotion?.discountPercentage ??
        item.promotion?.value ??
        0
      )
    : 0;
 
    const discountedLineTotal = Math.max(
      Number(
        item.lineTotal ??
        (originalLineTotal - discountAmount)
      ),
      minimumLineTotal
    );

  return (
    <div
      key={item.product?.id || index}
      className="border-b border-dashed border-slate-200 pb-3 mb-3"
    >
      {/* PRODUCT */}
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium text-slate-800 text-sm">
          {item.product?.name || 'Product'}
        </span>

        <span className="text-xs text-slate-500">
          Qty: {quantity}
        </span>
      </div>

      {/* ORIGINAL / DISCOUNT / PRICE */}
      <div className="grid grid-cols-3 gap-1 sm:gap-2 text-[10px] sm:text-xs">

        {/* ORIGINAL */}
        <div className="text-center">
          <p className="text-slate-500 mb-1">
            Original
          </p>

          <p className="font-medium text-slate-700">
            Rs.{originalLineTotal.toFixed(2)}
          </p>
        </div>

        {/* DISCOUNT */}
        <div className="text-center">
          <p className="text-slate-500 mb-1">
            Discount
          </p>

          <p className="font-semibold text-emerald-600">
  {discountAmount > 0
    ? discountType === 'percentage'
      ? `${discountPercentage}%`
      : `-Rs.${discountAmount.toFixed(2)}`
    : '-'}
</p>
        </div>

        {/* DISCOUNTED PRICE */}
        <div className="text-center">
          <p className="text-slate-500 mb-1">
            Price
          </p>

          <p className="font-bold text-emerald-700">
            Rs.{discountedLineTotal.toFixed(2)}
          </p>
        </div>

      </div>
    </div>
  );
})}
          </div>

          {/* ===================================================== */}
          {/* COUPON */}
          {/* ===================================================== */}

          <div className="mb-4">
            <p className="form-label mb-2">
              Coupon Code
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) =>
                  setCouponCode(
                    e.target.value.toUpperCase()
                  )
                }
                placeholder="SAVE20"
                className="input-field flex-1 uppercase"
              />

              {appliedCouponCode ? (
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="btn-secondary whitespace-nowrap w-full sm:w-auto"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={applyingCoupon}
                  className="btn-primary whitespace-nowrap w-full sm:w-auto justify-center"
                >
                  <HiOutlineTicket className="w-4 h-4" />

                  {applyingCoupon
                    ? 'Applying...'
                    : 'Apply'}
                </button>
              )}
            </div>
          </div>

          {/* ===================================================== */}
          {/* PAYMENT METHOD */}
          {/* ===================================================== */}

          <div className="mb-4">
            <p className="form-label mb-2">
              Payment Method
            </p>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() =>
                    setPaymentMethod(pm.id)
                  }
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 sm:py-3 sm:px-4 rounded-xl border-2 transition-colors ${
                    paymentMethod === pm.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <pm.Icon className="w-5 h-5 shrink-0" />

                  <span className="font-medium text-sm">
                    {pm.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ===================================================== */}
          {/* CASH */}
          {/* ===================================================== */}

          <div className="mb-4">
            <label className="form-label mb-2 block">
              Cash Received
            </label>

            <input
              type="number"
              min={total}
              step="0.01"
              value={cashReceived}
              onChange={(e) => {
                const value = e.target.value;

                if (value === '') {
                  setCashReceived('');
                  return;
                }

                if (Number(value) >= 0) {
                  setCashReceived(value);
                }
              }}
              placeholder={`Minimum ${total.toFixed(2)}`}
              className="w-full px-3 py-2 border rounded-lg"
            />

            <p className="mt-2 text-sm text-slate-600">
              Change:{' '}
              {cashReceived
                ? ` Rs.${Math.max(
                    Number(cashReceived) - total,
                    0
                  ).toFixed(2)}`
                : ' Rs.0.00'}
            </p>
          </div>

          {/* ===================================================== */}
          {/* TOTAL SUMMARY */}
          {/* ===================================================== */}

          <div className="pt-4 border-t border-slate-200 space-y-1">

{/* SUBTOTAL */}
<div className="flex justify-between text-sm">
  <span className="text-slate-600">
    Subtotal
  </span>

  <span className="font-medium text-slate-800">
    Rs.{Number(discountedSubtotal).toFixed(2)}
  </span>
</div>

{/* COUPON */}
{Number(couponDiscountAmount) > 0 && (
  <div className="flex justify-between text-sm text-emerald-700">
    <span>
      {appliedCouponCode || 'Coupon'}
    </span>

    <span>
      -Rs.{Number(couponDiscountAmount).toFixed(2)}
    </span>
  </div>
)}

{/* TAX */}
<div className="flex justify-between text-sm">
  <span className="text-slate-600">
    {taxLabel}
  </span>

  <span className="font-medium text-slate-800">
    Rs.{Number(tax).toFixed(2)}
  </span>
</div>

{/* TOTAL */}
<div className="flex justify-between text-lg font-semibold pt-2">
  <span className="text-slate-900">
    Total Amount
  </span>

  <span className="text-indigo-600">
    Rs.{Number(total).toFixed(2)}
  </span>
</div>
</div>
        </div>

        {/* ===================================================== */}
        {/* CONFIRM */}
        {/* ===================================================== */}

        <div className="p-5 sm:p-6 border-t border-slate-100">

          <button
            type="button"
            onClick={() => {
              const received =
                Number(cashReceived);

              if (!cashReceived) {
                alert(
                  'Please enter cash received.'
                );
                return;
              }

              if (received < total) {
                alert(
                  `Cash received cannot be less than total amount (Rs.${total.toFixed(
                    2
                  )}).`
                );
                return;
              }

              onConfirm({
                paymentMethod,
                cashReceived: received,
                changeReturned:
                  received - total,
                couponCode:
                  appliedCouponCode ||
                  undefined,
              });
            }}
            disabled={loading}
            className="w-full py-3 btn-primary disabled:opacity-50"
          >
            {loading
              ? 'Processing...'
              : 'Confirm Sale'}
          </button>

        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;