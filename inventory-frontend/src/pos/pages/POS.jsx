

import { useState, useCallback, useEffect, useMemo } from 'react';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { usePOSContext } from '../context/POSContext';
import ProductSearch from '../components/ProductSearch';
import ProductGrid from '../components/ProductGrid';
import Cart from '../components/Cart';
import CheckoutModal from '../components/CheckoutModal';
import Receipt from '../components/Receipt';
import BarcodeScanner from '../components/BarcodeScanner';
import api from '../../shared/utils/api';
import promotionsService from '../../shared/services/promotionsService';
import { buildPromotionCartItems } from '../utils/promotionCartItems';

const POS = () => {
  const { products, fetchProducts, fetchSales, fetchTodayStats } = usePOSContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [promotionPreview, setPromotionPreview] = useState(null);
  const [appliedCouponCode, setAppliedCouponCode] = useState('');

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const res = await api.get('/api/return-exchange/policy');
        setPolicy(res.data.policy);
      } catch (error) {
        console.error('Failed to fetch policy:', error);
      }
    };
    fetchPolicy();
  }, []);

  const originalSubtotal = useMemo(
    () =>
      cart.reduce(
        (sum, i) =>
          sum + i.product.price * (Number(i.quantity) || 0),
        0
      ),
    [cart]
  );
  
  const subtotal = originalSubtotal;
  const discountedItemSubtotal = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const quantity = Number(item.quantity) || 0;
  
        const originalLineTotal =
          Number(item.product?.price || 0) * quantity;
  
        const costPrice =
          Number(item.product?.costPrice || 0);
  
        const minimumLineTotal =
          costPrice * quantity;
  
        const discountAmount = Math.min(
          Number(item.promotion?.discountAmount || 0),
          Math.max(originalLineTotal - minimumLineTotal, 0)
        );
  
        const discountedLineTotal = Math.max(
          originalLineTotal - discountAmount,
          minimumLineTotal
        );
  
        return sum + discountedLineTotal;
      }, 0),
    [cart]
  );
  useEffect(() => {
    let cancelled = false;
  
    const loadPromotionPreview = async () => {
      if (cart.length === 0 || originalSubtotal <= 0) {
        setPromotionPreview(null);
  
        setCart((prev) =>
          prev.map((item) => ({
            ...item,
            promotion: null,
            discountAmount: 0,
            discountPercentage: 0,
            discountType: null,
            originalLineTotal: 0,
            lineTotal: 0,
          }))
        );
  
        return;
      }
  
      try {
        const res = await promotionsService.previewTotals(
          originalSubtotal,
          appliedCouponCode || undefined,
          buildPromotionCartItems(cart)
        );
  
        if (cancelled) return;
  
        const itemDiscounts = res.data.itemPromotions || [];
  
        setCart((prev) =>
          prev.map((item) => {
            const discount = itemDiscounts.find(
              (d) =>
                String(d.productId) ===
                String(item.product.id)
            );
  
            const quantity = Number(item.quantity) || 0;

            const originalLineTotal =
              Number(item.product?.price || 0) * quantity;
            
            const costPrice =
              Number(item.product?.costPrice || 0);
            
            const minimumLineTotal =
              costPrice * quantity;
            
            const requestedDiscountAmount =
              Number(discount?.discountAmount || 0);
            
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
              discount?.type ||
              discount?.discountType ||
              null;
            
            const discountPercentage =
              discountType === 'percentage'
                ? Number(
                    discount?.discountPercentage ||
                    discount?.value ||
                    0
                  )
                : 0;
            
            const discountedLineTotal = Math.max(
              originalLineTotal - discountAmount,
              minimumLineTotal
            );
  
            return {
              ...item,
  
              promotion: discount
                ? {
                    ...discount,
                    type: discountType,
                  }
                : null,
  
              discountAmount,
              discountPercentage,
              discountType,
              originalLineTotal,
              lineTotal: discountedLineTotal,
            };
          })
        );
  
        setPromotionPreview(res.data);
  
      } catch (error) {
        if (!cancelled) {
          console.error(
            'Promotion preview failed:',
            error
          );
  
          setPromotionPreview(null);
        }
      }
    };
  
    loadPromotionPreview();
  
    return () => {
      cancelled = true;
    };
  }, [cart, originalSubtotal, appliedCouponCode]);
  const handlePromotionChange = useCallback(
    ({
      couponCode = '',
      coupon = null,
      storeDiscountAmount = 0,
      couponDiscountAmount = 0,
      discountedSubtotal = null,
    }) => {
      setAppliedCouponCode(couponCode);
  
      setPromotionPreview((prev) => ({
        ...prev,
        coupon: couponCode ? coupon : null,
        storeDiscountAmount: Number(storeDiscountAmount) || 0,
        couponDiscountAmount: Number(couponDiscountAmount) || 0,
        discountedSubtotal: discountedItemSubtotal,
      }));
    },
    [discountedItemSubtotal]
  );
  const addToCart = useCallback((product) => {
    if (product.needsSetup) {
      toast.error(`Complete setup for "${product.name}" before selling`);
      return false;
    }

    let added = true;
  
    setCart((prev) => {
      const existing = prev.find(
        (i) => String(i.product.id) === String(product.id)
      );
  
      if (existing) {
        if (existing.quantity >= product.stock) {
          added = false;
          return prev;
        }
  
        return prev.map((i) =>
          String(i.product.id) === String(product.id)
            ? {
                ...i,
                quantity: i.quantity + 1,
              }
            : i
        );
      }
  
      if (Number(product.stock) <= 0) {
        added = false;
        return prev;
      }
  
      return [
        ...prev,
        {
          product,
          quantity: 1,
  
          // Promotion fields
          promotion: null,
          discountAmount: 0,
          discountPercentage: 0,
          discountType: null,
          originalLineTotal: Number(product.price || 0),
          lineTotal: Number(product.price || 0),
        },
      ];
    });
  
    return added;
  }, []);

  const increaseQty = useCallback((productId) => {
  const item = cart.find((i) => i.product.id === productId);

  if (!item) return;

  if (item.quantity >= item.product.stock) {
    toast.error(`Only ${item.product.stock} items available in stock`);
    return;
  }

  setCart((prev) =>
    prev.map((i) =>
      i.product.id === productId
        ? { ...i, quantity: i.quantity + 1 }
        : i
    )
  );
}, [cart]);

  const decreaseQty = useCallback((productId) => {
    setCart((prev) => {
      const item = prev.find((i) => i.product.id === productId);
      if (!item) return prev;
      if (item.quantity <= 1) return prev.filter((i) => i.product.id !== productId);
      return prev.map((i) =>
        i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i
      );
    });
  }, []);
const handleQuantityChange = useCallback((productId, newQuantity) => {
  const item = cart.find((i) => i.product.id === productId);

  if (!item) return;

  if (newQuantity === '') {
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId
          ? { ...i, quantity: '' }
          : i
      )
    );
    return;
  }

  const quantity = Number(newQuantity);

  if (!Number.isFinite(quantity) || quantity < 1) return;

  if (quantity > item.product.stock) {
    toast.error(`Only ${item.product.stock} items available in stock`);

    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId
          ? { ...i, quantity: item.product.stock }
          : i
      )
    );

    return;
  }

  setCart((prev) =>
    prev.map((i) =>
      i.product.id === productId
        ? { ...i, quantity }
        : i
    )
  );
}, [cart]);
  const removeItem = useCallback((productId) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const taxRate = policy ? (policy.taxRatePercent || 8) / 100 : 0.08;
  const storeDiscount = null;
  const couponDiscount = promotionPreview?.coupon || null;

  const discountedSubtotal = discountedItemSubtotal;

  const couponDiscountAmount =
    Number(promotionPreview?.couponDiscountAmount || 0);
  
  const subtotalAfterCoupon = Math.max(
    discountedSubtotal - couponDiscountAmount,
    0
  );
  
  const tax = subtotalAfterCoupon * taxRate;
  
  const total = subtotalAfterCoupon + tax;
  const handleConfirmSale = async (checkoutData) => {
  if (cart.length === 0) return;

  setLoading(true);

  try {
    const saleData = {
      items: cart.map((i) => ({
        productId: i.product.id,
        quantity: Number(i.quantity),
        unitPrice: Number(i.product.price),
    
        // Send promotion information for backend validation
        discountAmount: Number(i.discountAmount || 0),
        discountType: i.discountType || null,
        discountPercentage: Number(i.discountPercentage || 0),
      })),
      paymentMethod: checkoutData.paymentMethod,
      cashReceived: checkoutData.cashReceived,
      changeReturned: checkoutData.changeReturned,
      couponCode: checkoutData.couponCode,
    };

    const res = await api.post('/api/sales', saleData);


    const saleObj = res.data.sale;

    
    setLastReceipt(saleObj);
    if (!saleObj?.invoiceId) {
      toast.error('Invoice ID missing from backend response');
      return;
    }

    toast.success('Sale completed successfully!');

    await fetchProducts();
    await fetchSales();
    await fetchTodayStats();

    
    setLastReceipt(saleObj);

    setCart([]);
    setAppliedCouponCode('');
    setPromotionPreview(null);
    setCheckoutOpen(false);

  } catch (error) {
    console.error(error);
    const msg =
      error.response?.data?.message ||
      error.message ||
      'Sale failed. Please try again.';
    toast.error(msg);
  } finally {
    setLoading(false);
  }
};

  const closeReceipt = () => setLastReceipt(null);

  return (
    <div data-testid="pos-page" className="min-h-0 flex flex-col page-container !gap-3 sm:!gap-4 sm:min-h-[calc(100dvh-8rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <h1 className="page-title !text-xl sm:!text-2xl m-0">Point of Sale</h1>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <ShoppingCart className="w-5 h-5 text-indigo-600" />
          <span>{cart.length} item(s) in cart</span>
        </div>
      </div>

      <BarcodeScanner onAddToCart={addToCart} disabled={loading} />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-h-0">
        <div className="lg:col-span-2 flex flex-col min-h-0 order-2 lg:order-1">
          <ProductSearch value={searchTerm} onChange={setSearchTerm} />
          <div className="flex-1 overflow-y-auto min-h-[240px] lg:min-h-0 mt-3 sm:mt-4 max-h-[50vh] lg:max-h-none">
            <ProductGrid products={products} searchTerm={searchTerm} onAddToCart={addToCart} />
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col min-h-0 order-1 lg:order-2 sticky top-[72px] lg:static bg-slate-50 lg:bg-transparent z-10 pb-2 lg:pb-0">
         
        <Cart
  items={cart}
  onIncrease={increaseQty}
  onDecrease={decreaseQty}
  onRemove={removeItem}
  onQuantityChange={handleQuantityChange}
  subtotal={discountedItemSubtotal}
  storeDiscount={storeDiscount}
  couponDiscount={couponDiscount}
  tax={tax}
  total={total}
  taxLabel={
    policy
      ? `${policy.taxLabel || 'Tax'} (${policy.taxRatePercent || 8}%)`
      : null
  }
/>
          <button
            type="button"
            onClick={() => setCheckoutOpen(true)}
            disabled={cart.length === 0}
            className="mt-3 sm:mt-4 w-full py-3 btn-primary !rounded-xl disabled:!bg-slate-300 disabled:cursor-not-allowed"
          >
            Checkout
          </button>
        </div>
      </div>

      <CheckoutModal
  isOpen={checkoutOpen}
  onClose={() => setCheckoutOpen(false)}
  items={cart}
  subtotal={subtotal}
  discountedSubtotal={discountedSubtotal}
  storeDiscount={storeDiscount}
  couponDiscount={couponDiscount}
  couponDiscountAmount={
    promotionPreview?.couponDiscountAmount || 0
  }
  appliedCouponCode={appliedCouponCode}
  promotionItems={buildPromotionCartItems(cart)}
  tax={tax}
  taxRate={taxRate}
  total={total}
  onConfirm={handleConfirmSale}
  loading={loading}
  onPromotionChange={handlePromotionChange}
  receipt={
    policy
      ? {
          taxLabel: `${policy.taxLabel || 'Tax'} (${policy.taxRatePercent || 8}%)`
        }
      : null
  }
/>

      {lastReceipt && (
        <Receipt
          sale={lastReceipt}
          onClose={closeReceipt}
          onPrint={() => window.print()}
        />
      )}
    </div>
  );
};

export default POS;
