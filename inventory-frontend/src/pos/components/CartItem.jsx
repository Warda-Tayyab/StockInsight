/** @module pos/components/CartItem */

import { Plus, Minus, Trash2 } from 'lucide-react';

const CartItem = ({
  item,
  onIncrease,
  onDecrease,
  onQuantityChange,
  onRemove,
}) => {
  const { product, quantity, promotion } = item;

  const numericQuantity = Number(quantity) || 0;

  const originalLineTotal =
    Number(product.price || 0) * numericQuantity;

  const costPrice =
    Number(product.costPrice || 0);

  const minimumLineTotal =
    costPrice * numericQuantity;

  const requestedDiscountAmount =
    Number(
      item.discountAmount ??
      promotion?.discountAmount ??
      0
    );

  const maxAllowedDiscount = Math.max(
    originalLineTotal - minimumLineTotal,
    0
  );

  const discountAmount = Math.min(
    requestedDiscountAmount,
    maxAllowedDiscount
  );

  const discountedLineTotal = Math.max(
    originalLineTotal - discountAmount,
    minimumLineTotal
  );

  const discountType =
    promotion?.type ||
    promotion?.discountType ||
    item.discountType ||
    null;

  const discountPercentage =
    discountType === 'percentage'
      ? Number(
          promotion?.discountPercentage ??
          promotion?.value ??
          item.discountPercentage ??
          0
        )
      : 0;

  const handleQuantityChange = (e) => {
    const value = e.target.value;

    if (value === '') {
      onQuantityChange(product.id, '');
      return;
    }

    const newQuantity = parseInt(value, 10);

    if (!Number.isNaN(newQuantity) && newQuantity >= 1) {
      onQuantityChange(product.id, newQuantity);
    }
  };

  const handleQuantityBlur = () => {
    if (!quantity || Number(quantity) < 1) {
      onQuantityChange(product.id, 1);
    }
  };

  return (
    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
      {/* Product Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 text-sm leading-5 break-words">
            {product.name}
          </p>

          <p className="text-xs text-slate-500 mt-0.5">
            Rs.{Number(product.price || 0).toFixed(2)} each
          </p>
        </div>

        <button
          type="button"
          onClick={() => onRemove(product.id)}
          className="shrink-0 p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
          aria-label={`Remove ${product.name}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Row */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100">
        {/* Quantity */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onDecrease(product.id)}
            className="btn-icon !p-0 w-7 h-7 shrink-0"
            aria-label="Decrease quantity"
          >
            <Minus className="w-3 h-3" />
          </button>

          <input
            type="number"
            min="1"
            max={product.stock}
            value={quantity}
            onChange={handleQuantityChange}
            onBlur={handleQuantityBlur}
            className="w-10 h-7 text-center text-xs font-semibold text-slate-800
                       border border-slate-200 rounded-md
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Quantity"
          />

          <button
            type="button"
            onClick={() => onIncrease(product.id)}
            className="btn-icon !p-0 w-7 h-7 shrink-0"
            aria-label="Increase quantity"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Price */}
        <div className="text-right min-w-0">
          {discountAmount > 0 ? (
            <div>
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-[11px] text-slate-400 line-through">
                  Rs.{originalLineTotal.toFixed(2)}
                </span>

                <span className="text-sm font-semibold text-emerald-700">
                  Rs.{discountedLineTotal.toFixed(2)}
                </span>
              </div>

              <span className="block text-[10px] font-semibold text-emerald-600">
                {discountPercentage > 0
                  ? `${discountPercentage}% OFF`
                  : `Save Rs.${discountAmount.toFixed(2)}`}
              </span>
            </div>
          ) : (
            <span className="text-sm font-semibold text-slate-900">
              Rs.{originalLineTotal.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartItem;