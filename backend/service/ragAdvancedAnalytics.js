const Product = require('../models/tenant/Product');
const Stock = require('../models/tenant/Stock');
const Sale = require('../models/tenant/Sale');
const Batch = require('../models/tenant/Batch');
const ReturnExchange = require('../models/tenant/ReturnExchange');
const Warehouse = require('../models/tenant/Warehouse');
const Vendor = require('../models/tenant/Vendor');
const { getSaleNetTotal } = require('../utils/reportHelpers');
require('../models/tenant/Category'); // ensure populate works

const formatCurrency = (amount) =>
  `Rs ${Number(amount || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;

const daysBetween = (from, to = new Date()) =>
  Math.max(1, Math.ceil((to - from) / (1000 * 60 * 60 * 24)));

/**
 * Deterministic advanced inventory analytics from live DB.
 * Used for KPI cards/charts; a compact slice is also sent to Groq for AI narratives.
 */
const buildAdvancedAnalytics = async (tenantId) => {
  const now = new Date();
  const days90 = new Date(now);
  days90.setDate(now.getDate() - 90);
  const days30 = new Date(now);
  days30.setDate(now.getDate() - 30);
  const days60 = new Date(now);
  days60.setDate(now.getDate() - 60);
  const next30 = new Date(now);
  next30.setDate(now.getDate() + 30);

  const [products, stocks, sales, batches, returns, warehouses, registeredVendors] = await Promise.all([
    Product.find({ tenantId, status: 'active' })
      .select('name sku costPrice sellingPrice reorderLevel supplierName categoryId')
      .populate('categoryId', 'name')
      .lean(),
    Stock.find({ tenantId }).populate('warehouseId', 'name').lean(),
    Sale.find({ tenantId, createdAt: { $gte: days90 } }).sort({ createdAt: 1 }).lean(),
    Batch.find({ tenantId, remainingQty: { $gt: 0 } })
      .populate('productId', 'name sku')
      .lean(),
    ReturnExchange.find({ tenantId, status: 'completed', createdAt: { $gte: days90 } }).lean(),
    Warehouse.find({ tenantId, isDeleted: false, status: 'active' }).select('name code').lean(),
    Vendor.find({ tenantId, isDeleted: false }).select('name vendorCode phone email status').lean()
  ]);

  const stockByProduct = {};
  const warehouseTotals = {};

  stocks.forEach((s) => {
    const pid = s.productId?.toString();
    if (!pid) return;
    stockByProduct[pid] = (stockByProduct[pid] || 0) + (s.quantity || 0);

    const whName = s.warehouseId?.name || 'Unknown';
    warehouseTotals[whName] = (warehouseTotals[whName] || 0) + (s.quantity || 0);
  });

  const soldByProduct = {};
  const revenueByDay = {};
  const monthly = {};
  let revenue90 = 0;
  let estimatedCost90 = 0;
  let unitsSold90 = 0;

  const productCostMap = {};
  products.forEach((p) => {
    productCostMap[p._id.toString()] = p.costPrice || 0;
  });

  sales.forEach((sale) => {
    const total = getSaleNetTotal(sale);
    revenue90 += total;

    const dayKey = new Date(sale.createdAt).toISOString().slice(0, 10);
    revenueByDay[dayKey] = (revenueByDay[dayKey] || 0) + total;

    const monthKey = new Date(sale.createdAt).toLocaleString('en-US', {
      month: 'short',
      year: '2-digit'
    });
    if (!monthly[monthKey]) monthly[monthKey] = { revenue: 0, transactions: 0 };
    monthly[monthKey].revenue += total;
    monthly[monthKey].transactions += 1;

    (sale.items || []).forEach((item) => {
      const pid = item.productId?.toString() || item.productName || 'unknown';
      const name = item.productName || 'Unknown';
      const qty = item.quantity || 0;
      unitsSold90 += qty;

      if (!soldByProduct[pid]) {
        soldByProduct[pid] = { name, sku: '', quantity: 0, revenue: 0 };
      }
      soldByProduct[pid].quantity += qty;
      soldByProduct[pid].revenue += item.lineTotal || 0;

      const cost = productCostMap[item.productId?.toString()] || 0;
      estimatedCost90 += cost * qty;
    });
  });

  const periodDays = daysBetween(days90, now);
  let inventoryValueCost = 0;
  let inventoryValueRetail = 0;

  const lowStock = [];
  const outOfStock = [];
  const overstocked = [];
  const deadStock = [];
  const healthy = [];
  const reorderRecommendations = [];
  const demandForecast = [];
  const supplierMap = {};

  products.forEach((p) => {
    const pid = p._id.toString();
    const qty = stockByProduct[pid] || 0;
    const sold = soldByProduct[pid]?.quantity || 0;
    const soldRevenue = soldByProduct[pid]?.revenue || 0;
    const dailyVelocity = sold / periodDays;
    const daysOfCover = dailyVelocity > 0 ? qty / dailyVelocity : qty > 0 ? 999 : 0;
    const reorderLevel = p.reorderLevel || 0;
    const cost = p.costPrice || 0;
    const sell = p.sellingPrice || 0;

    inventoryValueCost += qty * cost;
    inventoryValueRetail += qty * sell;

    const supplier = p.supplierName || 'Unknown';
    if (!supplierMap[supplier]) {
      supplierMap[supplier] = {
        supplier,
        products: 0,
        stockUnits: 0,
        stockValue: 0,
        lowStock: 0,
        soldUnits: 0
      };
    }
    supplierMap[supplier].products += 1;
    supplierMap[supplier].stockUnits += qty;
    supplierMap[supplier].stockValue += qty * cost;
    supplierMap[supplier].soldUnits += sold;

    const row = {
      name: p.name,
      sku: p.sku,
      quantity: qty,
      reorderLevel,
      sold90d: sold,
      revenue90d: Math.round(soldRevenue),
      daysOfCover: Math.round(daysOfCover),
      dailyVelocity: Number(dailyVelocity.toFixed(2)),
      supplier,
      category: p.categoryId?.name || 'Uncategorized'
    };

    if (qty === 0) {
      outOfStock.push(row);
      supplierMap[supplier].lowStock += 1;
    } else if (qty <= reorderLevel) {
      lowStock.push(row);
      supplierMap[supplier].lowStock += 1;
    } else if (daysOfCover > 90 && qty > Math.max(reorderLevel * 3, reorderLevel + 20)) {
      overstocked.push(row);
    } else if (sold === 0 && qty > 0) {
      deadStock.push(row);
    } else {
      healthy.push(row);
    }

    const suggestedReorder = Math.max(
      0,
      Math.ceil(dailyVelocity * 30 + reorderLevel - qty)
    );
    if (suggestedReorder > 0 || qty <= reorderLevel) {
      reorderRecommendations.push({
        ...row,
        suggestedQty: Math.max(suggestedReorder, qty <= reorderLevel ? Math.max(reorderLevel * 2 - qty, 1) : 0),
        reason:
          qty === 0
            ? 'Out of stock'
            : qty <= reorderLevel
              ? 'Below reorder level'
              : 'Projected stockout within 30 days'
      });
    }

    if (dailyVelocity > 0) {
      demandForecast.push({
        name: p.name,
        sku: p.sku,
        avgDailyDemand: Number(dailyVelocity.toFixed(2)),
        forecast30d: Math.ceil(dailyVelocity * 30),
        currentStock: qty,
        gap: Math.max(0, Math.ceil(dailyVelocity * 30) - qty)
      });
    }
  });

  const movers = Object.entries(soldByProduct)
    .map(([pid, data]) => ({
      productId: pid,
      name: data.name,
      quantity: data.quantity,
      revenue: Math.round(data.revenue),
      stock: stockByProduct[pid] || 0
    }))
    .sort((a, b) => b.quantity - a.quantity);

  const fastMovers = movers.slice(0, 8);
  const slowMovers = products
    .map((p) => {
      const pid = p._id.toString();
      const sold = soldByProduct[pid]?.quantity || 0;
      const qty = stockByProduct[pid] || 0;
      return {
        name: p.name,
        sku: p.sku,
        quantity: sold,
        revenue: Math.round(soldByProduct[pid]?.revenue || 0),
        stock: qty
      };
    })
    .filter((p) => p.stock > 0)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 8);

  const salesTrend = Object.entries(monthly).map(([month, data]) => ({
    month,
    revenue: Math.round(data.revenue),
    transactions: data.transactions
  }));

  const dayRevenues = Object.values(revenueByDay);
  const avgDaily =
    dayRevenues.length > 0
      ? dayRevenues.reduce((a, b) => a + b, 0) / dayRevenues.length
      : 0;

  const anomalies = [];
  Object.entries(revenueByDay).forEach(([day, rev]) => {
    if (avgDaily > 0 && rev > avgDaily * 2.5) {
      anomalies.push({
        type: 'sales_spike',
        severity: 'medium',
        title: `Unusual sales spike on ${day}`,
        detail: `${formatCurrency(rev)} vs avg ${formatCurrency(avgDaily)}`,
        value: Math.round(rev)
      });
    }
  });

  const returnCount = returns.length;
  const refundTotal = returns.reduce(
    (sum, r) => sum + (r.refundAmount || r.returnedNet || 0),
    0
  );
  const returnRate =
    sales.length > 0 ? Number(((returnCount / sales.length) * 100).toFixed(1)) : 0;

  if (returnRate >= 10) {
    anomalies.push({
      type: 'high_returns',
      severity: 'high',
      title: 'Elevated return rate',
      detail: `${returnRate}% of sales involved a return/exchange in the last 90 days`,
      value: returnRate
    });
  }

  const returnedProducts = {};
  returns.forEach((r) => {
    (r.returnedItems || []).forEach((item) => {
      const key = item.productName || 'Unknown';
      if (!returnedProducts[key]) returnedProducts[key] = { name: key, quantity: 0, value: 0 };
      returnedProducts[key].quantity += item.quantity || 0;
      returnedProducts[key].value += item.lineTotal || 0;
    });
  });

  const topReturned = Object.values(returnedProducts)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const sixMonthsLater = new Date(now);
  sixMonthsLater.setMonth(now.getMonth() + 6);

  const expiringSoon = batches
    .filter((b) => b.expiryDate && new Date(b.expiryDate) <= sixMonthsLater && new Date(b.expiryDate) >= now)
    .map((b) => ({
      batchNumber: b.batchNumber,
      product: b.productId?.name || 'Unknown',
      sku: b.productId?.sku,
      remainingQty: b.remainingQty,
      expiryDate: b.expiryDate
    }))
    .slice(0, 10);

  const expired = batches.filter(
    (b) => b.expiryDate && new Date(b.expiryDate) < now
  ).length;

  const alerts = [];
  if (outOfStock.length) {
    alerts.push({
      type: 'out_of_stock',
      severity: 'high',
      title: `${outOfStock.length} products out of stock`,
      detail: outOfStock.slice(0, 3).map((p) => p.name).join(', ')
    });
  }
  if (lowStock.length) {
    alerts.push({
      type: 'low_stock',
      severity: 'high',
      title: `${lowStock.length} products below reorder level`,
      detail: lowStock.slice(0, 3).map((p) => p.name).join(', ')
    });
  }
  if (expiringSoon.length) {
    alerts.push({
      type: 'expiry',
      severity: 'medium',
      title: `${expiringSoon.length} batches expiring within 6 months`,
      detail: expiringSoon.slice(0, 3).map((b) => b.product).join(', ')
    });
  }
  if (deadStock.length) {
    alerts.push({
      type: 'dead_stock',
      severity: 'medium',
      title: `${deadStock.length} dead-stock SKUs (no sales in 90 days)`,
      detail: deadStock.slice(0, 3).map((p) => p.name).join(', ')
    });
  }
  anomalies.slice(0, 3).forEach((a) => {
    alerts.push({
      type: a.type,
      severity: a.severity,
      title: a.title,
      detail: a.detail
    });
  });

  const estimatedProfit = revenue90 - estimatedCost90;
  const profitMargin =
    revenue90 > 0 ? Number(((estimatedProfit / revenue90) * 100).toFixed(1)) : 0;

  const sales30 = sales.filter((s) => new Date(s.createdAt) >= days30);
  const revenue30 = sales30.reduce((sum, s) => sum + (s.total || 0), 0);
  const salesPrev30 = sales.filter((s) => {
    const d = new Date(s.createdAt);
    return d >= days60 && d < days30;
  });
  const revenuePrev30 = salesPrev30.reduce((sum, s) => sum + (s.total || 0), 0);
  const revenueGrowth =
    revenuePrev30 > 0
      ? `${revenue30 >= revenuePrev30 ? '+' : ''}${(((revenue30 - revenuePrev30) / revenuePrev30) * 100).toFixed(1)}%`
      : null;

  reorderRecommendations.sort((a, b) => b.suggestedQty - a.suggestedQty);
  demandForecast.sort((a, b) => b.forecast30d - a.forecast30d);

  const analytics = {
    kpis: {
      activeProducts: products.length,
      inventoryValueCost: Math.round(inventoryValueCost),
      inventoryValueRetail: Math.round(inventoryValueRetail),
      inventoryValueCostLabel: formatCurrency(inventoryValueCost),
      inventoryValueRetailLabel: formatCurrency(inventoryValueRetail),
      revenue90d: Math.round(revenue90),
      revenue90dLabel: formatCurrency(revenue90),
      revenue30d: Math.round(revenue30),
      revenue30dLabel: formatCurrency(revenue30),
      revenueGrowth,
      estimatedProfit90d: Math.round(estimatedProfit),
      estimatedProfitLabel: formatCurrency(estimatedProfit),
      profitMargin,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      overstockCount: overstocked.length,
      deadStockCount: deadStock.length,
      fastMoverCount: fastMovers.length,
      returnCount,
      returnRate,
      refundTotal: Math.round(refundTotal),
      refundTotalLabel: formatCurrency(refundTotal),
      expiringSoonCount: expiringSoon.length,
      expiredBatchCount: expired,
      warehouses: warehouses.length,
      unitsSold90d: unitsSold90,
      avgOrderValue: sales.length ? Math.round(revenue90 / sales.length) : 0,
      avgOrderValueLabel: sales.length
        ? formatCurrency(revenue90 / sales.length)
        : formatCurrency(0)
    },
    stockHealth: {
      healthy: healthy.length,
      low: lowStock.length,
      out: outOfStock.length,
      overstock: overstocked.length,
      dead: deadStock.length
    },
    salesTrend,
    fastMovers,
    slowMovers,
    deadStock: deadStock.slice(0, 8),
    overstocked: overstocked.slice(0, 8),
    lowStock: lowStock.slice(0, 8),
    outOfStock: outOfStock.slice(0, 8),
    reorderRecommendations: reorderRecommendations.slice(0, 10),
    demandForecast: demandForecast.slice(0, 8),
    expiryAlerts: expiringSoon,
    returnAnalysis: {
      returnCount,
      returnRate,
      refundTotal: Math.round(refundTotal),
      refundTotalLabel: formatCurrency(refundTotal),
      topReturned
    },
    registeredVendors: (registeredVendors || []).map((v) => ({
      name: v.name,
      code: v.vendorCode,
      phone: v.phone,
      email: v.email,
      status: v.status
    })),
    supplierPerformance: (registeredVendors && registeredVendors.length > 0)
      ? registeredVendors.map((v) => {
          const matched = supplierMap[v.name] || {};
          return {
            supplier: v.name,
            code: v.vendorCode,
            phone: v.phone,
            products: matched.products || 0,
            stockUnits: matched.stockUnits || 0,
            stockValue: matched.stockValue || 0,
            soldUnits: matched.soldUnits || 0,
            stockValueLabel: formatCurrency(matched.stockValue || 0)
          };
        })
      : Object.values(supplierMap)
          .sort((a, b) => b.soldUnits - a.soldUnits)
          .slice(0, 6)
          .map((s) => ({
            ...s,
            stockValueLabel: formatCurrency(s.stockValue)
          })),
    warehouseBalance: Object.entries(warehouseTotals)
      .map(([name, units]) => ({ name, units }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 6),
    alerts,
    anomalies: anomalies.slice(0, 5)
  };

  return analytics;
};

/** Compact text for Groq — keeps TPM under free-tier limits */
const toAiContext = (analytics) => {
  const compact = {
    kpis: analytics.kpis,
    stockHealth: analytics.stockHealth,
    salesTrend: analytics.salesTrend,
    lowStock: analytics.lowStock.slice(0, 5).map((p) => ({
      name: p.name,
      qty: p.quantity,
      reorder: p.reorderLevel,
      sold90d: p.sold90d
    })),
    outOfStock: analytics.outOfStock.slice(0, 5).map((p) => ({ name: p.name, sku: p.sku })),
    overstocked: analytics.overstocked.slice(0, 4).map((p) => ({
      name: p.name,
      qty: p.quantity,
      daysOfCover: p.daysOfCover
    })),
    deadStock: analytics.deadStock.slice(0, 4).map((p) => ({ name: p.name, qty: p.quantity })),
    fastMovers: analytics.fastMovers.slice(0, 5).map((p) => ({
      name: p.name,
      sold: p.quantity,
      revenue: p.revenue
    })),
    slowMovers: analytics.slowMovers.slice(0, 4).map((p) => ({
      name: p.name,
      sold: p.quantity,
      stock: p.stock
    })),
    reorderTop: analytics.reorderRecommendations.slice(0, 5).map((p) => ({
      name: p.name,
      suggestedQty: p.suggestedQty,
      reason: p.reason
    })),
    demandForecast: analytics.demandForecast.slice(0, 4).map((p) => ({
      name: p.name,
      forecast30d: p.forecast30d,
      gap: p.gap
    })),
    expiry: analytics.expiryAlerts.slice(0, 4),
    returns: analytics.returnAnalysis,
    registeredVendors: analytics.registeredVendors,
    suppliers: analytics.supplierPerformance.slice(0, 4).map((s) => ({
      supplier: s.supplier,
      code: s.code,
      phone: s.phone,
      soldUnits: s.soldUnits,
      stockUnits: s.stockUnits
    })),
    warehouses: analytics.warehouseBalance,
    alerts: analytics.alerts.slice(0, 6).map((a) => ({
      type: a.type,
      severity: a.severity,
      title: a.title
    })),
    anomalies: analytics.anomalies
  };

  return JSON.stringify(compact);
};

module.exports = {
  buildAdvancedAnalytics,
  toAiContext
};
