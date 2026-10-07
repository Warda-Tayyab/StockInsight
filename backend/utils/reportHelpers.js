/**
 * Shared helpers for report controllers
 */

function getDateRange(range = 'month') {
  const end = new Date();
  const start = new Date();

  if (range === 'week') {
    start.setDate(end.getDate() - 7);
  } else if (range === 'month') {
    start.setMonth(end.getMonth() - 1);
  } else if (range === 'quarter') {
    start.setMonth(end.getMonth() - 3);
  } else if (range === 'year') {
    start.setFullYear(end.getFullYear() - 1);
  } else if (range === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (range === 'all') {
    start.setFullYear(2000, 0, 1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setMonth(end.getMonth() - 1);
  }

  return { start, end };
}

function getPreviousRange(start, end) {
  const duration = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime());
  const prevStart = new Date(start.getTime() - duration);
  return { start: prevStart, end: prevEnd };
}

function calcGrowth(current, previous) {
  if (previous === 0 && current > 0) return '+100%';
  if (previous === 0) return '0%';
  const pct = ((current - previous) / previous) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

function getSaleNetDetails(sale) {
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
}

function sumSalesTotal(sales = []) {
  return sales.reduce((sum, sale) => sum + getSaleNetTotal(sale), 0);
}

function sumSalesNetSales(sales = []) {
  return sales.reduce((sum, sale) => sum + getSaleNetDetails(sale).netSales, 0);
}

function sumSalesTax(sales = []) {
  return sales.reduce((sum, sale) => sum + getSaleNetDetails(sale).tax, 0);
}

function sumSalesCouponDiscounts(sales = []) {
  return sales.reduce((sum, sale) => sum + getSaleNetDetails(sale).couponDiscount, 0);
}

function sumSalesProductDiscounts(sales = []) {
  return sales.reduce((sum, sale) => sum + getSaleNetDetails(sale).productDiscount, 0);
}

function getSaleNetTotal(sale) {
  return getSaleNetDetails(sale).totalSales;
}

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfWeek() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
}

function startOfMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d;
}

function formatSaleDate(date) {
  return new Date(date).toLocaleString('en-PK', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStockStatus(qty, reorder) {
  if (qty === 0) return 'out_of_stock';
  if (qty <= reorder) return 'low_stock';
  return 'in_stock';
}

function getExpiryStatus(daysLeft) {
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 30) return 'critical';
  if (daysLeft <= 180) return 'expiring';
  return 'ok';
}

module.exports = {
  getDateRange,
  getPreviousRange,
  calcGrowth,
  getSaleNetDetails,
  sumSalesTotal,
  sumSalesNetSales,
  sumSalesTax,
  sumSalesCouponDiscounts,
  sumSalesProductDiscounts,
  getSaleNetTotal,
  startOfDay,
  endOfDay,
  startOfWeek,
  startOfMonth,
  formatSaleDate,
  getStockStatus,
  getExpiryStatus,
};
