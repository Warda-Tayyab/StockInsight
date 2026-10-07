const GoodsReceipt = require('../models/tenant/GoodsReceipt');
const PurchaseReturn = require('../models/tenant/PurchaseReturn');
const Batch = require('../models/tenant/Batch');
const Stock = require('../models/tenant/Stock');
const Product = require('../models/tenant/Product');
const WriteOff = require('../models/tenant/WriteOff');

/** Product IDs that came through Purchase Receive (posted GRNs). */
const getPurchasedProductIds = async (tenantId) => {
  const receipts = await GoodsReceipt.find({ tenantId, status: 'posted' })
    .select('items')
    .lean();

  const ids = new Set();
  for (const receipt of receipts) {
    for (const item of receipt.items || []) {
      if (item.productId) ids.add(String(item.productId));
    }
  }
  return ids;
};

const batchUnitCost = (batch, product) =>
  Number(batch.purchasePrice) || Number(product?.costPrice) || 0;

const calculatePurchaseReturnLoss = (item) => {
  const quantity = Number(item.quantity) || 0;
  const originalUnitCost = Number(item.originalUnitCost) || Number(item.unitCost) || 0;
  const returnUnitCost = Number(item.unitCost) || 0;
  return Math.max(0, originalUnitCost - returnUnitCost) * quantity;
};

/** Inventory cost from purchased batches only (remaining qty × receive cost). */
const getPurchasedInventoryValue = async (tenantId) => {
  const purchasedIds = await getPurchasedProductIds(tenantId);
  if (!purchasedIds.size) return { totalValue: 0, batchCount: 0, productCount: 0 };

  const batches = await Batch.find({
    tenantId,
    remainingQty: { $gt: 0 },
    productId: { $in: [...purchasedIds] },
  })
    .populate('productId', 'costPrice')
    .lean();

  let totalValue = 0;
  const products = new Set();
  for (const b of batches) {
    totalValue += (Number(b.remainingQty) || 0) * batchUnitCost(b, b.productId);
    if (b.productId?._id) products.add(String(b.productId._id));
  }

  return {
    totalValue: Math.round(totalValue),
    batchCount: batches.length,
    productCount: products.size,
  };
};

/** Write-off loss — only qty still on hand (returned to supplier via purchase return excluded). */
const getActiveWriteOffLoss = (writeOffDocs) =>
  writeOffDocs
    .filter((w) => Number(w.quantity) > 0)
    .reduce((sum, w) => {
      const unitCost = Number(w.unitValue) || Number(w.productId?.costPrice) || 0;
      return sum + unitCost * Number(w.quantity);
    }, 0);

const mapWriteOffLossItems = (writeOffDocs) =>
  writeOffDocs
    .filter((w) => Number(w.quantity) > 0)
    .map((w) => {
      const unitCost = Number(w.unitValue) || Number(w.productId?.costPrice) || 0;
      const totalVal = unitCost * Number(w.quantity);
      return {
        id: `wo-${w._id.toString()}`,
        product: w.productName || w.productId?.name || 'Unknown Product',
        sku: w.productId?.sku || '—',
        category: 'Write-Off (Damaged/Defective)',
        categoryKey: 'write_off',
        reference: w.referenceId || w.originalInvoiceId || 'WO-REF',
        date: w.createdAt,
        quantity: w.quantity,
        unitCost: Math.round(unitCost),
        totalLoss: Math.round(totalVal),
        reason: w.reason ? `${w.condition} - ${w.reason}` : w.condition,
        status: w.condition === 'defective' ? 'Defective' : 'Damaged',
      };
    });

/** Posted purchase returns in date range. */
const getPurchaseReturnsInRange = async (tenantId, start, end) => {
  const filter = { tenantId, status: 'posted' };
  if (start && end) {
    filter.returnDate = { $gte: start, $lte: end };
  }

  const returns = await PurchaseReturn.find(filter)
    .populate('vendorId', 'name code')
    .populate('locationId', 'name locationType')
    .sort({ returnDate: -1 })
    .lean();

  const batchIds = returns.flatMap((purchaseReturn) =>
    (purchaseReturn.items || [])
      .map((item) => item.batchId)
      .filter(Boolean)
  );
  const batches = batchIds.length
    ? await Batch.find({ tenantId, _id: { $in: batchIds } }).select('purchasePrice').lean()
    : [];
  const batchCostMap = Object.fromEntries(
    batches.map((batch) => [String(batch._id), Number(batch.purchasePrice) || 0])
  );

  for (const purchaseReturn of returns) {
    for (const item of purchaseReturn.items || []) {
      if (!Number(item.originalUnitCost) && item.batchId) {
        item.originalUnitCost = batchCostMap[String(item.batchId)] || 0;
      }
    }
  }

  const totalAmount = returns.reduce((s, r) => s + (Number(r.totalAmount) || 0), 0);
  const totalQty = returns.reduce(
    (s, r) => s + (r.items || []).reduce((a, i) => a + (Number(i.quantity) || 0), 0),
    0
  );

  return { returns, totalAmount, totalQty };
};

const mapPurchaseReturnItems = (returns, formatDate) => {
  const items = [];
  for (const pr of returns) {
    for (const item of pr.items || []) {
      items.push({
        id: `pr-${pr._id}-${item.batchId || item.productId}`,
        product: item.productName || '—',
        sku: item.sku || '—',
        category: 'Purchase Return to Supplier',
        categoryKey: 'purchase_return',
        reference: pr.returnNumber,
        date: formatDate(pr.returnDate),
        rawDate: pr.returnDate,
        quantity: item.quantity,
        unitCost: Math.round(Number(item.unitCost) || 0),
        totalRecovery: Math.round((Number(item.quantity) || 0) * (Number(item.unitCost) || 0)),
        originalUnitCost: Math.round(Number(item.originalUnitCost) || Number(item.unitCost) || 0),
        totalLoss: Math.round(calculatePurchaseReturnLoss(item)),
        reason: item.reason || pr.notes || 'Returned to supplier',
        status: 'Returned',
        vendor: pr.vendorId?.name || '—',
        batchNumber: item.batchNumber || '—',
      });
    }
  }
  return items.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
};

/** Posted goods receipts in range. */
const getPurchasesInRange = async (tenantId, start, end) => {
  const filter = { tenantId, status: 'posted' };
  if (start && end) {
    filter.receivedDate = { $gte: start, $lte: end };
  }

  const receipts = await GoodsReceipt.find(filter)
    .populate('vendorId', 'name code')
    .populate('locationId', 'name locationType')
    .sort({ receivedDate: -1 })
    .lean();

  const totalAmount = receipts.reduce((s, r) => s + (Number(r.subtotal) || 0), 0);
  const totalQty = receipts.reduce(
    (s, r) => s + (r.items || []).reduce((a, i) => a + (Number(i.quantity) || 0), 0),
    0
  );

  return { receipts, totalAmount, totalQty };
};

/** Aggregate purchased stock by product name (merge duplicate product records). */
const aggregatePurchasedStockByName = async (tenantId) => {
  const purchasedIds = await getPurchasedProductIds(tenantId);
  if (!purchasedIds.size) return new Map();

  const [stocks, products] = await Promise.all([
    Stock.find({
      tenantId,
      productId: { $in: [...purchasedIds] },
    })
      .populate('productId', 'name sku reorderLevel costPrice categoryId')
      .populate('warehouseId', 'name locationType')
      .lean(),
    Product.find({
      tenantId,
      _id: { $in: [...purchasedIds] },
    })
      .populate('categoryId', 'name')
      .select('name sku reorderLevel costPrice categoryId')
      .lean(),
  ]);

  const map = new Map();
  
    // First, add all products to ensure we include those with zero stock
  for (const product of products) {
    if (!product.name) continue;
    const key = String(product.name).trim().toLowerCase();
    if (!map.has(key)) {
      map.set(key, {
        id: String(product._id),
        name: product.name,
        sku: product.sku,
        category: product.categoryId?.name || '—',
        qty: 0,
        reorder: product.reorderLevel || 0,
        costPrice: product.costPrice || 0,
        batchValue: 0,
        locations: [],
      });
    }
  }
  
  // Then add stock quantities
  for (const row of stocks) {
    if (!row.productId?.name) continue;
    const key = String(row.productId.name).trim().toLowerCase();
    if (!map.has(key)) {
      map.set(key, {
        id: String(row.productId._id),
        name: row.productId.name,
        sku: row.productId.sku,
        category: row.productId.categoryId?.name || '—',
        qty: 0,
        reorder: row.productId.reorderLevel || 0,
        costPrice: row.productId.costPrice || 0,
        batchValue: 0,
        locations: [],
      });
    }
    const entry = map.get(key);
    if (!entry.locations) entry.locations = [];
    entry.qty += Number(row.quantity) || 0;

    if (row.warehouseId?._id) {
      const locId = String(row.warehouseId._id);
      const existingLoc = entry.locations.find((l) => String(l.locationId) === locId);
      if (existingLoc) {
        existingLoc.quantity += Number(row.quantity) || 0;
      } else {
        entry.locations.push({
          locationId: row.warehouseId._id,
          name: row.warehouseId.name,
          locationType: row.warehouseId.locationType || 'store',
          quantity: Number(row.quantity) || 0,
        });
      }
    }

    // Update category if stock record has better category info
    if (row.productId.categoryId?.name && (!entry.category || entry.category === '—')) {
      entry.category = row.productId.categoryId.name;
    }
  }

  const batches = await Batch.find({
    tenantId,
    remainingQty: { $gt: 0 },
    productId: { $in: [...purchasedIds] },
  })
    .populate('productId', 'name costPrice')
    .lean();

  for (const b of batches) {
    if (!b.productId?.name) continue;
    const key = String(b.productId.name).trim().toLowerCase();
    if (!map.has(key)) continue;
    map.get(key).batchValue += (Number(b.remainingQty) || 0) * batchUnitCost(b, b.productId);
  }

  return map;
};

module.exports = {
  calculatePurchaseReturnLoss,
  getPurchasedProductIds,
  getPurchasedInventoryValue,
  getActiveWriteOffLoss,
  mapWriteOffLossItems,
  getPurchaseReturnsInRange,
  mapPurchaseReturnItems,
  getPurchasesInRange,
  aggregatePurchasedStockByName,
  batchUnitCost,
};
