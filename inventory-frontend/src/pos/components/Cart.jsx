/** @module pos/components/Cart */

import CartItem from './CartItem';

const TAX_RATE = 0.08;

const Cart = ({
  items,
  onIncrease,
  onDecrease,
  onRemove,
  subtotal,
  storeDiscount,
  couponDiscount,
  tax,
  total,
  onQuantityChange,
  onCheckout,
  taxLabel,
}) => {
  return (
    <div className="flex flex-col h-full card overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80">
        <h3 className="font-semibold text-slate-900">Cart</h3>
        <p className="text-xs text-slate-500 mt-0.5">{items.length} item(s)</p>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">Cart is empty</p>
        ) : (
          items.map((item) => (
            <CartItem
              key={item.product.id}
              item={item}
              onIncrease={onIncrease}
              onDecrease={onDecrease}
               onQuantityChange={onQuantityChange}
              onRemove={onRemove}
            />
          ))
        )}
      </div>
      {items.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/80 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Subtotal</span>
            <span className="font-medium text-slate-800">Rs.{subtotal.toFixed(2)}</span>
          </div>
          {storeDiscount?.amount > 0 && (
            <div className="flex justify-between text-sm text-emerald-700">
              <span>{storeDiscount.label || 'Store Discount'}</span>
              <span>-Rs.{storeDiscount.amount.toFixed(2)}</span>
            </div>
          )}
          {couponDiscount?.amount > 0 && (
            <div className="flex justify-between text-sm text-emerald-700">
              <span>Coupon ({couponDiscount.code})</span>
              <span>-Rs.{couponDiscount.amount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">{taxLabel || 'Tax (8%)'}</span>
            <span className="font-medium text-slate-800">Rs.{tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold pt-1 border-t border-slate-200">
            <span className="text-slate-900">Total</span>
            <span className="text-indigo-600">Rs.{total.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
export { TAX_RATE };
