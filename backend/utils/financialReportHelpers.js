/**
 * Shared financial calculations for reports (Net Sales, COGS, Net Purchases, Loss, Profit).
 * Scope preference: purchased (GRN) products for inventory/COGS where possible;
 * sales include all sales of products that exist, with returns netted.
 */

const Sale = require('../models/tenant/Sale');
const Product = require('../models/tenant/Product');
const Batch = require('../models/tenant/Batch');
const WriteOff = require('../models/tenant/WriteOff');
const {
  getPurchasedProductIds,
  getPurchasedInventoryValue,
  getActiveWriteOffLoss,
  getPurchaseReturnsInRange,
  getPurchasesInRange,
  batchUnitCost,
  mapWriteOffLossItems,
  mapPurchaseReturnItems,
} = require('./purchaseReportHelpers');
const { getSaleNetTotal, getSaleNetDetails, formatSaleDate } = require('./reportHelpers');

const remainingQty = (item) => {
  const qty = Number(item.quantity) || 0;
  const returned = Math.min(qty, Number(item.returnedQty) || 0);
  return Math.max(0, qty - returned);
};

const itemUnitPrice = (item) => {
  const qty = Number(item.quantity) || 0;
  if (Number(item.unitPrice)) return Number(item.unitPrice);
  return qty ? (Number(item.lineTotal) || 0) / qty : 0;
};

/** Net sales revenue (ex-tax) after customer returns and all discounts. */
const getSalesRevenueExTax = (sales) =>
  sales.reduce((sum, sale) => sum + getSaleNetDetails(sale).netSales, 0);

/** Tax-inclusive net sales (after returns). */
const getSalesNetInclusive = (sales) =>
  sales.reduce((sum, sale) => sum + getSaleNetTotal(sale), 0);

/**
 * COGS for sales using batch usage purchasePrice when available, else product costPrice.
 */
const getSalesCogs = async (tenantId, sales) => {
  const productIds = new Set();
  const batchIds = new Set();

  for (const sale of sales) {
    for (const item of sale.items || []) {
      if (item.productId) productIds.add(String(item.productId));
      for (const usage of item.batchUsage || []) {
        if (usage.batchId) batchIds.add(String(usage.batchId));
      }
    }
  }

  const [products, batches] = await Promise.all([
    Product.find({
      tenantId,
      _id: { $in: [...productIds] },
    })
      .select('costPrice name sku')
      .lean(),
    batchIds.size
      ? Batch.find({ tenantId, _id: { $in: [...batchIds] } })
          .select('purchasePrice productId')
          .lean()
      : Promise.resolve([]),
  ]);

  const costMap = Object.fromEntries(
    products.map((p) => [String(p._id), Number(p.costPrice) || 0])
  );
  const batchCostMap = Object.fromEntries(
    batches.map((b) => [String(b._id), Number(b.purchasePrice) || 0])
  );
  const productInfo = Object.fromEntries(
    products.map((p) => [String(p._id), p])
  );

  let cogs = 0;
  const belowCostItems = [];

  for (const sale of sales) {
    (sale.items || []).forEach((item, itemIdx) => {
      const rem = remainingQty(item);
      if (rem <= 0) return;

      const pid = item.productId?.toString();
      const catalogCost = costMap[pid] || 0;
      let unitCost = catalogCost;

      const usages = item.batchUsage || [];
      if (usages.length) {
        let costSum = 0;
        let qtySum = 0;
        for (const u of usages) {
          const uQty = Number(u.quantity) || 0;
          const bCost = batchCostMap[String(u.batchId)] || catalogCost;
          costSum += bCost * uQty;
          qtySum += uQty;
        }
        if (qtySum > 0) unitCost = costSum / qtySum;
      }

      cogs += unitCost * rem;

      const unitPrice = itemUnitPrice(item);
      // Track below-cost for transparency only — NOT added again to total loss
      // (already reflected in lower gross profit)
      if (unitCost > 0 && unitPrice < unitCost) {
        const lossPerUnit = unitCost - unitPrice;
        belowCostItems.push({
          id: `sale-loss-${sale._id}-${itemIdx}`,
          product: item.productName || productInfo[pid]?.name || 'Unknown',
          sku: productInfo[pid]?.sku || '—',
          category: 'Below-Cost Sale (in Gross Profit)',
          categoryKey: 'below_cost_sale',
          reference: sale.invoiceId || 'INV',
          date: formatSaleDate(sale.createdAt),
          rawDate: sale.createdAt,
          quantity: rem,
          unitCost: Math.round(unitCost),
          salePrice: Math.round(unitPrice),
          totalLoss: Math.round(lossPerUnit * rem),
          reason: `Sold @ Rs. ${Math.round(unitPrice)} (Cost Rs. ${Math.round(unitCost)}) — already in GP`,
          status: 'Below Cost',
          informational: true,
        });
      }
    });
  }

  return { cogs, belowCostItems, costMap, productInfo };
};

/** Write-off loss created in period (use current qty so returned defective isn't double-counted). */
const getWriteOffLossInRange = async (tenantId, start, end) => {
  const filter = { tenantId };
  if (start && end) {
    filter.createdAt = { $gte: start, $lte: end };
  }
  const docs = await WriteOff.find(filter).populate('productId', 'sku name costPrice');
  const items = mapWriteOffLossItems(docs).map((item) => ({
    ...item,
    date: formatSaleDate(item.date),
    rawDate: item.date,
  }));
  const total = items.reduce((s, i) => s + (i.totalLoss || 0), 0);
  return { total, items, docs };
};

/** Expired batch loss — currently expired with remaining qty (purchased products). */
const getExpiredLossSnapshot = async (tenantId) => {
  const purchasedIds = await getPurchasedProductIds(tenantId);
  const purchasedIdList = [...purchasedIds];
  const now = new Date();

  const expiredBatches = await Batch.find({
    tenantId,
    remainingQty: { $gt: 0 },
    expiryDate: { $ne: null, $lte: now },
    ...(purchasedIdList.length ? { productId: { $in: purchasedIdList } } : { productId: null }),
  }).populate('productId', 'name sku costPrice');

  const items = expiredBatches.map((b) => {
    const unitCost = batchUnitCost(b, b.productId);
    const totalVal = (b.remainingQty || 0) * unitCost;
    return {
      id: `exp-${b._id}`,
      product: b.productId?.name || 'Unknown',
      sku: b.productId?.sku || '—',
      category: 'Expired Stock',
      categoryKey: 'expired',
      reference: b.batchNumber || 'BATCH',
      date: formatSaleDate(b.expiryDate),
      rawDate: b.expiryDate,
      quantity: b.remainingQty,
      unitCost: Math.round(unitCost),
      totalLoss: Math.round(totalVal),
      reason: `Batch ${b.batchNumber} expired`,
      status: 'Expired',
    };
  });

  const total = items.reduce((s, i) => s + i.totalLoss, 0);
  return { total, items };
};

/**
 * Full period financials used by Overview + P&L.
 *
 * Net Sales (ex-tax)  = sales after customer returns
 * COGS                = batch/catalog cost × remaining sold qty
 * Gross Profit        = Net Sales − COGS
 * Net Purchases       = GRN spend − purchase returns
 * Operating Loss      = write-offs + expired snapshot + purchase return shortfall
 * Net Profit          = Gross Profit − Operating Loss
 *
 * Purchase returns reduce Net Purchases (not added as P&L income).
 * Below-cost sales reduce Gross Profit only (not double-counted in loss).
 */
const computePeriodFinancials = async (tenantId, start, end) => {
  const saleFilter = { tenantId };
  if (start && end) {
    saleFilter.createdAt = { $gte: start, $lte: end };
  }

  const sales = await Sale.find(saleFilter);
  const netSalesInclusive = getSalesNetInclusive(sales);
  const netSalesExTax = getSalesRevenueExTax(sales);

  const { cogs, belowCostItems } = await getSalesCogs(tenantId, sales);
  const { total: writeOffLoss, items: writeOffItems } = await getWriteOffLossInRange(
    tenantId,
    start,
    end
  );
  const { total: expiredLoss, items: expiredItems } = await getExpiredLossSnapshot(tenantId);

  const { totalAmount: purchaseSpend, totalQty: purchaseQty, receipts } =
    await getPurchasesInRange(tenantId, start, end);
  const { totalAmount: purchaseReturnCredit, totalQty: returnQty, returns } =
    await getPurchaseReturnsInRange(tenantId, start, end);
  const purchaseReturnItems = mapPurchaseReturnItems(returns, formatSaleDate);

  const netPurchases = purchaseSpend - purchaseReturnCredit;
  const grossProfit = netSalesExTax - cogs;
  const purchaseReturnLoss = purchaseReturnItems.reduce((sum, item) => sum + (item.totalLoss || 0), 0);
  const operatingLoss = writeOffLoss + expiredLoss + purchaseReturnLoss;
  const netProfit = grossProfit - operatingLoss;
  const margin =
    netSalesExTax > 0 ? Number(((netProfit / netSalesExTax) * 100).toFixed(1)) : 0;

  const { totalValue: inventoryValue } = await getPurchasedInventoryValue(tenantId);
  const totalTaxGathered = sales.reduce((sum, s) => sum + (Number(s.tax) || 0), 0);

  return {
    sales,
    netSales: Math.round(netSalesExTax),
    netSalesInclusive: Math.round(netSalesInclusive),
    totalTaxGathered: Math.round(totalTaxGathered),
    taxGatheredRaw: Number(totalTaxGathered.toFixed(2)),
    cogs: Math.round(cogs),
    grossProfit: Math.round(grossProfit),
    writeOffLoss: Math.round(writeOffLoss),
    expiredLoss: Math.round(expiredLoss),
    purchaseReturnLoss: Math.round(purchaseReturnLoss),
    operatingLoss: Math.round(operatingLoss),
    totalLoss: Math.round(operatingLoss),
    belowCostExposure: Math.round(
      belowCostItems.reduce((s, i) => s + (i.totalLoss || 0), 0)
    ),
    purchaseSpend: Math.round(purchaseSpend),
    purchaseReturnCredit: Math.round(purchaseReturnCredit),
    netPurchases: Math.round(netPurchases),
    purchaseQty,
    returnQty,
    receiptCount: receipts.length,
    returnCount: returns.length,
    inventoryValue,
    netProfit: Math.round(netProfit),
    margin,
    orderCount: sales.length,
    writeOffItems,
    expiredItems,
    belowCostItems,
    purchaseReturnItems,
  };
};

module.exports = {
  remainingQty,
  itemUnitPrice,
  getSalesRevenueExTax,
  getSalesNetInclusive,
  getSalesCogs,
  getWriteOffLossInRange,
  getExpiredLossSnapshot,
  computePeriodFinancials,
};
