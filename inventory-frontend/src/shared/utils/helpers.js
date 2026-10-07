/** @module shared/utils/helpers */

export const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : '-');

export const formatCurrency = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value ?? 0);

export const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export const getSaleNetDetails = (sale) => {
  if (!sale) {
    return {
      originalSubtotal: 0,
      remainingSubtotal: 0,
      ratio: 0,
      storeDiscount: 0,
      productDiscount: 0,
      couponDiscount: 0,
      netSales: 0,
      tax: 0,
      totalSales: 0,
    };
  }

  const originalSubtotal = (sale.items || []).reduce(
    (sum, item) => sum + (Number(item.lineTotal ?? item.discountedLineTotal ?? (item.unitPrice * item.quantity)) || 0),
    0
  );

  const remainingSubtotal = (sale.items || []).reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const returnedQty = Math.min(quantity, Number(item.returnedQty) || 0);
    const lineTotal = Number(item.lineTotal ?? item.discountedLineTotal ?? (item.unitPrice * item.quantity)) || 0;
    const unitPrice = quantity > 0 ? lineTotal / quantity : 0;
    return sum + Math.max(0, quantity - returnedQty) * unitPrice;
  }, 0);

  const ratio = originalSubtotal > 0 ? remainingSubtotal / originalSubtotal : 0;

  const rawProductDiscount = Number(sale.storeDiscountAmount || 0) ||
    (sale.items || []).reduce((sum, item) => sum + Number(item.discountAmount || 0), 0);

  const storeDiscount = rawProductDiscount * ratio;
  const productDiscount = rawProductDiscount * ratio;
  const couponDiscount = (Number(sale.couponDiscountAmount) || 0) * ratio;

  let saleSubtotalExTax = sale.subtotal != null ? Number(sale.subtotal) : originalSubtotal;
  const saleStoreDisc = Number(sale.storeDiscountAmount) || 0;
  const saleCouponDisc = Number(sale.couponDiscountAmount) || 0;
  const saleTax = Number(sale.tax) || 0;
  const saleTotal = Number(sale.total) || 0;

  if (saleStoreDisc > 0 && Math.abs((saleSubtotalExTax - saleCouponDisc + saleTax) - saleTotal) > 0.05) {
    saleSubtotalExTax = Math.max(0, saleSubtotalExTax - saleStoreDisc);
  }

  const netSales = Math.max(0, (saleSubtotalExTax - saleCouponDisc) * ratio);
  const tax = saleTax * ratio;
  const totalSales = netSales + tax;

  return {
    originalSubtotal,
    remainingSubtotal,
    ratio,
    storeDiscount,
    productDiscount,
    couponDiscount,
    netSales,
    tax,
    totalSales,
  };
};

export const getSaleNetTotal = (sale) => getSaleNetDetails(sale).totalSales;

export const calculateSaleReturnAmount = (sale) => {
  if (!sale) return 0;
  const originalTotal = Number(sale.total) || 0;
  const netTotal = getSaleNetTotal(sale);
  return Math.max(0, originalTotal - netTotal);
};

export default { formatDate, formatCurrency, debounce, getSaleNetDetails, getSaleNetTotal, calculateSaleReturnAmount };

