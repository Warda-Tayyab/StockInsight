/**
 * Report-aligned RAG context — same formulas as Reports dashboard.
 */
const mongoose = require('mongoose');
const Sale = require('../models/tenant/Sale');
const Product = require('../models/tenant/Product');
const WriteOff = require('../models/tenant/WriteOff');
const { computePeriodFinancials } = require('./financialReportHelpers');
const { getPurchasedProductIds, getPurchaseReturnsInRange, mapPurchaseReturnItems } = require('./purchaseReportHelpers');
const { buildExpirySummary } = require('./batchReportHelpers');
const {
  getPurchasedLowStockReport,
  getPurchasedStockSummary,
  buildPurchasedStockByLocation,
  classifyStockItem,
} = require('./lowStockHelpers');
const { getDateRange, getPreviousRange, calcGrowth, formatSaleDate } = require('./reportHelpers');

const tenantObjectId = (id) => new mongoose.Types.ObjectId(id);

const detectRangeFromQuestion = (question = '') => {
  const q = String(question).toLowerCase();
  if (/\b(today|aaj|aj)\b/.test(q)) return 'today';
  if (/\b(week|hafta)\b/.test(q)) return 'week';
  if (/\b(quarter|3\s*month)\b/.test(q)) return 'quarter';
  if (/\b(year|saal|annual)\b/.test(q)) return 'year';
  if (/\b(abhi tk|ab tak|till now|so far|lifetime|total|poora|sab|all time)\b/.test(q)) return 'all';
  if (/\b(all|poora|sab)\b/.test(q) && /sales|profit|loss|purchase|kharid|farokht/.test(q)) return 'all';
  return 'all';
};

const buildLossBreakdown = async (tenantId, start, end) => {
  const filter = { tenantId };
  if (start && end) filter.createdAt = { $gte: start, $lte: end };
  const writeOffs = await WriteOff.find(filter).populate('productId', 'sku name costPrice').lean();
  const writeOffLoss = writeOffs
    .filter((w) => Number(w.quantity) > 0)
    .reduce((s, w) => s + (Number(w.unitValue) || Number(w.productId?.costPrice) || 0) * Number(w.quantity), 0);

  const { returns } = await getPurchaseReturnsInRange(tenantId, start, end);
  const purchaseReturnItems = mapPurchaseReturnItems(returns, formatSaleDate);
  const purchaseReturnLoss = purchaseReturnItems.reduce((s, i) => s + (i.totalLoss || 0), 0);

  const fin = await computePeriodFinancials(tenantId, start, end);
  return {
    actualLossInPeriod: Math.round(writeOffLoss + purchaseReturnLoss),
    operatingLossReport: fin.operatingLoss,
    writeOffLoss: Math.round(writeOffLoss),
    purchaseReturnLoss: Math.round(purchaseReturnLoss),
    expiredStockValue: fin.expiredLoss,
  };
};

const buildProductPerformance = async (tenantId, start, end) => {
  const purchasedIds = await getPurchasedProductIds(tenantId);
  const purchasedIdList = [...purchasedIds];
  const productAgg = await Sale.aggregate([
    { $match: { tenantId: tenantObjectId(tenantId), createdAt: { $gte: start, $lte: end } } },
    { $unwind: '$items' },
    ...(purchasedIdList.length
      ? [{ $match: { 'items.productId': { $in: purchasedIdList.map((id) => tenantObjectId(id)) } } }]
      : [{ $match: { 'items.productId': null } }]),
    {
      $addFields: {
        netQty: { $max: [0, { $subtract: ['$items.quantity', { $ifNull: ['$items.returnedQty', 0] }] }] },
      },
    },
    { $group: { _id: '$items.productId', sold: { $sum: '$netQty' }, revenue: { $sum: { $multiply: [{ $ifNull: ['$items.unitPrice', 0] }, '$netQty'] } } } },
  ]);

  const products = await Product.find({
    tenantId,
    status: 'active',
    ...(purchasedIdList.length ? { _id: { $in: purchasedIdList } } : { _id: null }),
  }).select('name sku costPrice').lean();

  const costMap = Object.fromEntries(products.map((p) => [p._id.toString(), p]));
  const withProfit = productAgg.map((p) => {
    const prod = costMap[p._id?.toString()];
    const unitCost = prod?.costPrice || 0;
    return {
      name: prod?.name || 'Unknown',
      sku: prod?.sku || '—',
      sold: p.sold || 0,
      revenue: Math.round(p.revenue || 0),
      profit: Math.round((p.revenue || 0) - unitCost * (p.sold || 0)),
    };
  });

  const soldIds = new Set(productAgg.map((p) => p._id?.toString()));
  const deadStock = products
    .filter((p) => !soldIds.has(p._id.toString()))
    .map((p) => ({ name: p.name, sku: p.sku, sold: 0, profit: 0 }));

  return {
    bestSelling: [...withProfit].sort((a, b) => b.sold - a.sold).slice(0, 15),
    mostProfitable: [...withProfit].sort((a, b) => b.profit - a.profit).slice(0, 15),
    slowMoving: [...withProfit].filter((p) => p.sold > 0).sort((a, b) => a.sold - b.sold).slice(0, 15),
    deadStock,
    deadStockCount: deadStock.length,
  };
};

const buildLocationBreakdown = async (tenantId, expirySummary) => {
  const { items, locations } = await buildPurchasedStockByLocation(tenantId);
  const expiryByLoc = new Map((expirySummary.byLocation || []).map((l) => [String(l.locationId), l]));
  const byLoc = new Map();

  for (const loc of locations) {
    byLoc.set(String(loc.id), {
      locationId: loc.id,
      name: loc.name,
      destination: loc.label,
      locationType: loc.locationType,
      lowStockCount: 0,
      outOfStockCount: 0,
      lowStock: [],
      outOfStock: [],
      expiredProductCount: 0,
      expiringSoonProductCount: 0,
      expired: [],
      expiringSoon: [],
    });
  }

  for (const item of items) {
    const c = classifyStockItem(item);
    const locId = String(item.locationId);
    if (!byLoc.has(locId)) continue;
    const entry = byLoc.get(locId);
    const row = { name: item.name, sku: item.sku, quantity: item.current, reorder: item.min };
    if (c.alertType === 'low-stock') { entry.lowStockCount += 1; entry.lowStock.push(row); }
    else if (c.alertType === 'out-of-stock') { entry.outOfStockCount += 1; entry.outOfStock.push(row); }
  }

  for (const [locId, entry] of byLoc.entries()) {
    const exp = expiryByLoc.get(locId);
    if (exp) {
      entry.expiredProductCount = exp.expiredProductCount || 0;
      entry.expiringSoonProductCount = exp.expiringSoonProductCount || 0;
      entry.expired = exp.expired || [];
      entry.expiringSoon = exp.expiringSoon || [];
    }
  }
  return [...byLoc.values()];
};

const buildRagReportSnapshot = async (tenantId, question = '') => {
  let range = detectRangeFromQuestion(question);
  const requestedRange = range;
  let { start, end } = getDateRange(range);
  let prev = getPreviousRange(start, end);
  const todayBounds = getDateRange('today');

  let [fin, prevFin, stockSummary, lowStockReport, productPerformance, expiry, lossBreakdown, todayLoss] =
    await Promise.all([
      computePeriodFinancials(tenantId, start, end),
      computePeriodFinancials(tenantId, prev.start, prev.end),
      getPurchasedStockSummary(tenantId),
      getPurchasedLowStockReport(tenantId),
      buildProductPerformance(tenantId, start, end),
      buildExpirySummary(tenantId),
      buildLossBreakdown(tenantId, start, end),
      buildLossBreakdown(tenantId, todayBounds.start, todayBounds.end),
    ]);

  let fallbackApplied = false;
  if (range !== 'all' && (fin.netSales || 0) === 0 && (fin.orderCount || 0) === 0 && (fin.netPurchases || 0) === 0) {
    const rangeSequence = ['quarter', 'year', 'all'];
    const startIdx = rangeSequence.indexOf(range);
    const retryRanges = startIdx >= 0 ? rangeSequence.slice(startIdx + 1) : rangeSequence;

    for (const widerRange of retryRanges) {
      const widerBounds = getDateRange(widerRange);
      const widerPrev = getPreviousRange(widerBounds.start, widerBounds.end);
      const [wFin, wPrevFin, wProductPerformance, wLossBreakdown] = await Promise.all([
        computePeriodFinancials(tenantId, widerBounds.start, widerBounds.end),
        computePeriodFinancials(tenantId, widerPrev.start, widerPrev.end),
        buildProductPerformance(tenantId, widerBounds.start, widerBounds.end),
        buildLossBreakdown(tenantId, widerBounds.start, widerBounds.end),
      ]);

      if ((wFin.netSales || 0) > 0 || (wFin.orderCount || 0) > 0 || (wFin.netPurchases || 0) > 0 || widerRange === 'all') {
        range = widerRange;
        start = widerBounds.start;
        end = widerBounds.end;
        prev = widerPrev;
        fin = wFin;
        prevFin = wPrevFin;
        productPerformance = wProductPerformance;
        lossBreakdown = wLossBreakdown;
        fallbackApplied = true;
        break;
      }
    }
  }

  const ReturnExchange = require('../models/tenant/ReturnExchange');
  const WriteOffModel = require('../models/tenant/WriteOff');

  const [customerReturns, writeOffDocs] = await Promise.all([
    ReturnExchange.find({ tenantId }).lean(),
    WriteOffModel.find({ tenantId }).lean(),
  ]);

  const customerReturnCount = customerReturns.length;
  let customerReturnRefunds = 0;
  let customerReturnedItemsCount = 0;
  customerReturns.forEach((r) => {
    customerReturnRefunds += r.refundAmount || 0;
    customerReturnedItemsCount += (r.returnedItems || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
  });

  const writeOffCount = writeOffDocs.length;
  const writeOffTotalValue = writeOffDocs.reduce(
    (sum, w) => sum + (Number(w.lineValue) || (Number(w.unitValue || 0) * (w.quantity || 1))),
    0
  );

  const locationBreakdown = await buildLocationBreakdown(tenantId, expiry);

  return {
    period: { range, requestedRange, start, end, fallbackApplied },
    answerKey: {
      lowStockProducts: stockSummary.lowStock,
      outOfStockProducts: stockSummary.outOfStock,
      expiredProducts: expiry.expiredProductCount,
      expiringSoonProducts: expiry.expiringSoonProductCount,
      warehouseExpiredProducts: expiry.warehouseTotals?.expiredProductCount || 0,
      storeExpiredProducts: expiry.storeTotals?.expiredProductCount || 0,
      warehouseExpiringSoonProducts: expiry.warehouseTotals?.expiringSoonProductCount || 0,
      storeExpiringSoonProducts: expiry.storeTotals?.expiringSoonProductCount || 0,
      deadStockProducts: productPerformance.deadStockCount,
      netSales: fin.netSales,
      totalTaxGathered: `Rs ${(fin.totalTaxGathered || 0).toLocaleString('en-PK')}`,
      taxCollected: `Rs ${(fin.totalTaxGathered || 0).toLocaleString('en-PK')}`,
      netProfit: fin.netProfit,
      netPurchases: fin.netPurchases,
      operatingLoss: fin.operatingLoss,
      todayLoss: todayLoss.actualLossInPeriod,
      todayHasLoss: todayLoss.actualLossInPeriod > 0,
      totalItemsPurchased: fin.purchaseQty,
      purchaseReturnQty: fin.returnQty,
      netItemsPurchased: Math.max(0, (fin.purchaseQty || 0) - (fin.returnQty || 0)),
      grnCount: fin.receiptCount,
      purchaseReturnCount: fin.returnCount,
      salesTransactions: fin.orderCount,
      customerReturnCount,
      customerReturnRefunds: `Rs ${customerReturnRefunds.toLocaleString('en-PK')}`,
      customerReturnedItemsCount,
      writeOffCount,
      writeOffTotalValue: `Rs ${writeOffTotalValue.toLocaleString('en-PK')}`,
      totalReturnCount: customerReturnCount + fin.returnCount,
    },
    financials: {
      netSales: fin.netSales,
      totalTaxGathered: `Rs ${(fin.totalTaxGathered || 0).toLocaleString('en-PK')}`,
      cogs: fin.cogs,
      grossProfit: fin.grossProfit,
      operatingLoss: fin.operatingLoss,
      netProfit: fin.netProfit,
      netPurchases: fin.netPurchases,
      margin: fin.margin,
      inventoryValue: fin.inventoryValue,
    },
    growth: { netSales: calcGrowth(fin.netSales, prevFin.netSales), netProfit: calcGrowth(fin.netProfit, prevFin.netProfit) },
    inventory: stockSummary,
    lowStock: { count: lowStockReport.items.length, items: lowStockReport.items, locations: lowStockReport.locations },
    expiry,
    productPerformance,
    lossBreakdown,
    todayLoss,
    locationBreakdown,
  };
};

const slimExpiryRow = (row) => ({
  name: row.name || row.productName || row.product || 'Unknown',
  sku: row.sku || '—',
  batchNumber: row.batchNumber || '—',
  destination: row.destination || '—',
  locationType: row.locationType || undefined,
  remainingQty: row.remainingQty,
  expiryDate: row.expiryDate,
  daysLeft: row.daysLeft,
});

/**
 * Compact, question-aware report slice for RAG.
 * Returns an OBJECT (never mid-JSON string truncation).
 */
const toCompactReportContext = (snapshot, question = '') => {
  const q = String(question).toLowerCase();
  const compact = {
    answerKey: snapshot.answerKey,
    locationSummary: (snapshot.locationBreakdown || []).map((l) => ({
      destination: l.destination,
      locationType: l.locationType,
      lowStock: l.lowStockCount,
      outOfStock: l.outOfStockCount,
      expired: l.expiredProductCount,
      expiringSoon: l.expiringSoonProductCount,
    })),
    financials: snapshot.financials,
  };

  if (/low|out of stock|reorder|kam|warehouse|godown|godam|store|location/.test(q) && !/expir/.test(q)) {
    compact.lowStockDetail = (snapshot.lowStock?.items || []).slice(0, 20).map((i) => ({
      name: i.name,
      sku: i.sku,
      quantity: i.quantity,
      reorderLevel: i.reorderPoint ?? i.reorder,
      destination: i.destination,
    }));
  }

  if (/purchase|kharid|grn|items purchase/.test(q)) {
    compact.purchasing = {
      totalItemsPurchased: snapshot.answerKey.totalItemsPurchased,
      netItemsPurchased: snapshot.answerKey.netItemsPurchased,
      netPurchases: snapshot.answerKey.netPurchases,
      grnCount: snapshot.answerKey.grnCount,
      period: snapshot.period?.range,
    };
  }

  if (/expir|batch|batches/.test(q)) {
    const expiry = snapshot.expiry || {};
    compact.expiryFocus = {
      counts: {
        expiredProducts: expiry.expiredProductCount || 0,
        expiringSoonProducts: expiry.expiringSoonProductCount || 0,
        expiredBatches: expiry.expiredBatchCount || 0,
        expiringSoonBatches: expiry.expiringSoonBatchCount || 0,
        warehouseExpiredProducts: expiry.warehouseTotals?.expiredProductCount || 0,
        warehouseExpiringSoonProducts: expiry.warehouseTotals?.expiringSoonProductCount || 0,
        storeExpiredProducts: expiry.storeTotals?.expiredProductCount || 0,
        storeExpiringSoonProducts: expiry.storeTotals?.expiringSoonProductCount || 0,
      },
      storeTotals: expiry.storeTotals,
      warehouseTotals: expiry.warehouseTotals,
      byLocation: (expiry.byLocation || []).map((l) => ({
        destination: l.destination,
        name: l.name,
        locationType: l.locationType,
        expiredProductCount: l.expiredProductCount,
        expiringSoonProductCount: l.expiringSoonProductCount,
        expiredProducts: (l.expired || []).map(slimExpiryRow),
        expiringSoonProducts: (l.expiringSoon || []).map(slimExpiryRow),
      })),
      expiredBatches: (expiry.expiredBatches || []).map(slimExpiryRow),
      expiringSoonBatches: (expiry.expiringSoonBatches || []).map(slimExpiryRow),
      note: 'List ALL product names from expiredBatches / expiringSoonBatches. For warehouse vs store use counts + byLocation.',
    };
  }

  if (/dead/.test(q)) compact.deadStock = snapshot.productPerformance?.deadStock;
  if (/profit|loss|nuksan|purchase/.test(q) && !/expir/.test(q)) {
    compact.profitLoss = { ...snapshot.financials, ...snapshot.lossBreakdown };
  }

  // Return object — callers stringify. Never mid-truncate JSON.
  return compact;
};

module.exports = {
  detectRangeFromQuestion,
  buildRagReportSnapshot,
  toCompactReportContext,
  buildExpirySummary,
  slimExpiryRow,
};
