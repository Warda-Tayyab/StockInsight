const ReturnExchangePolicy = require('../models/tenant/ReturnExchangePolicy');
const Product = require('../models/tenant/Product');
const Stock = require('../models/tenant/Stock');
const Batch = require('../models/tenant/Batch');
const Warehouse = require('../models/tenant/Warehouse');
const Inventory = require('../models/tenant/Inventory');
const WriteOff = require('../models/tenant/WriteOff');
const Counter = require('../models/tenant/Counter');
const getInventoryActivity = require('./inventoryActivityHelper');
const INVENTORY_TYPES = require('../constants/inventoryTypes');

const DEFAULT_POLICY = {
  returnsEnabled: true,
  exchangesEnabled: true,
  returnWindowDays: 14,
  exchangeWindowDays: 14,
  requireReceipt: true,
  allowPartialReturn: true,
  restockingFeePercent: 0,
  refundMethods: ['cash', 'card', 'store_credit'],
  collectionMethods: ['cash', 'card'],
  defaultRefundMethod: 'cash',
  defaultCollectionMethod: 'cash',
  exchangePricePolicy: 'current_price',
  taxRatePercent: 8,
  taxLabel: 'Tax',
  workingHours: '11:00 AM - 11:00 PM',
  workingHoursFriday: '3:00 PM - 11:00 PM',
  receiptFooterMessage: '',
  allowedReasons: ['Defective product', 'Wrong item', 'Changed mind', 'Damaged packaging', 'Other'],
  autoWriteOffReasons: ['Defective product', 'Damaged packaging'],
  policyNotes: ''
};

const SELLABLE = 'sellable';
const WRITE_OFF_CONDITIONS = ['damaged', 'defective'];

const getOrCreatePolicy = async (tenantId) => {
  let policy = await ReturnExchangePolicy.findOne({ tenantId });
  if (!policy) {
    policy = await ReturnExchangePolicy.create({ tenantId, ...DEFAULT_POLICY });
  }

  return {
    ...DEFAULT_POLICY,
    ...policy.toObject()
  };
};

const getNextReference = async (tenantId, type) => {
  const name = type === 'exchange' ? 'exchange' : 'return';
  const prefix = type === 'exchange' ? 'EXC' : 'RET';
  const counter = await Counter.findOneAndUpdate(
    { tenantId, name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `${prefix}-${String(counter.seq).padStart(6, '0')}`;
};

const isWithinWindow = (saleDate, windowDays) => {
  if (windowDays === 0) return true;
  const deadline = new Date(saleDate);
  deadline.setDate(deadline.getDate() + windowDays);
  return new Date() <= deadline;
};

const getReturnableQty = (saleItem) =>
  Math.max(0, (saleItem.quantity || 0) - (saleItem.returnedQty || 0));

const resolveItemCondition = (reason, explicitCondition, policy) => {
  if (explicitCondition && explicitCondition !== SELLABLE) return explicitCondition;
  if (explicitCondition === SELLABLE) return SELLABLE;
  if (reason && (policy.autoWriteOffReasons || []).includes(reason)) return 'damaged';
  return SELLABLE;
};

const isRestockable = (condition) => !WRITE_OFF_CONDITIONS.includes(condition);

const resolveWarehouse = async (tenantId) => {
  const warehouse = await Warehouse.findOne({
    tenantId,
    status: 'active',
    isDeleted: false
  }).sort({ createdAt: 1 });

  if (!warehouse) {
    throw new Error('No active warehouse found for inventory operations');
  }
  return warehouse;
};

const getTotalStock = async (tenantId, productId) => {
  const records = await Stock.find({ tenantId, productId });
  return records.reduce((sum, s) => sum + (s.quantity || 0), 0);
};

/** Original batches used when this line was sold */
const resolveSaleBatchUsage = async (tenantId, sale, productId) => {
  const saleItem = sale.items.find((i) => String(i.productId) === String(productId));

  if (saleItem?.batchUsage?.length) {
    return saleItem.batchUsage.map((b) => ({
      batchId: b.batchId,
      batchNumber: b.batchNumber,
      warehouseId: b.warehouseId,
      deductedQty: b.deductedQty,
      returnedQty: b.returnedQty || 0
    }));
  }

  const logs = await Inventory.find({
    tenantId,
    reference: sale.invoiceId,
    productId,
    type: INVENTORY_TYPES.SALE
  });

  const merged = new Map();
  for (const log of logs) {
    for (const usage of log.batchUsage || []) {
      const key = String(usage.batchId);
      const row = merged.get(key) || {
        batchId: usage.batchId,
        batchNumber: usage.batchNumber,
        warehouseId: log.warehouseId || usage.warehouseId,
        deductedQty: 0,
        returnedQty: 0
      };
      row.deductedQty += usage.deductedQty || 0;
      merged.set(key, row);
    }
  }

  return [...merged.values()];
};

/** Return qty back to same batches (LIFO — reverse of sale deduction) */
const allocateReturnToBatches = (batchLines, returnQty) => {
  const lines = [...batchLines].reverse();
  const allocations = [];
  let remaining = returnQty;

  for (const line of lines) {
    const restorable = line.deductedQty - (line.returnedQty || 0);
    if (restorable <= 0) continue;

    const restoreQty = Math.min(remaining, restorable);
    if (restoreQty > 0) {
      allocations.push({
        batchId: line.batchId,
        batchNumber: line.batchNumber,
        warehouseId: line.warehouseId,
        restoreQty
      });
      remaining -= restoreQty;
    }
  }

  if (remaining > 0) {
    throw new Error('Cannot match return quantity to original sale batches');
  }

  return allocations;
};

/** Restock sellable returns into the original sale batch(es) */
const restockItems = async ({
  tenantId,
  userId,
  items,
  reference,
  note,
  sale
}) => {
  if (!sale) {
    throw new Error('Original sale is required to restock into source batches');
  }

  for (const item of items) {
    const product = await Product.findOne({ _id: item.productId, tenantId });
    if (!product) throw new Error(`Product not found: ${item.productName}`);

    const batchLines = await resolveSaleBatchUsage(tenantId, sale, item.productId);
    if (!batchLines.length) {
      throw new Error(
        `No batch history for ${item.productName} on ${sale.invoiceId}. Cannot restock to original batch.`
      );
    }

    const allocations = allocateReturnToBatches(batchLines, item.quantity);
    const previousQuantity = await getTotalStock(tenantId, item.productId);
    const batchUsageLog = [];

    for (const alloc of allocations) {
      const batch = await Batch.findOne({ _id: alloc.batchId, tenantId });
      if (!batch) {
        throw new Error(`Original batch ${alloc.batchNumber} not found`);
      }

      batch.remainingQty = Math.min(
        batch.quantity,
        (batch.remainingQty || 0) + alloc.restoreQty
      );
      await batch.save();

      let stock = await Stock.findOne({
        tenantId,
        productId: item.productId,
        warehouseId: alloc.warehouseId
      });
      if (!stock) {
        stock = await Stock.create({
          tenantId,
          productId: item.productId,
          warehouseId: alloc.warehouseId,
          quantity: 0
        });
      }
      stock.quantity += alloc.restoreQty;
      await stock.save();

      batchUsageLog.push({
        batchId: alloc.batchId,
        batchNumber: alloc.batchNumber,
        deductedQty: alloc.restoreQty
      });

      const saleItem = sale.items.find((i) => String(i.productId) === String(item.productId));
      if (saleItem?.batchUsage?.length) {
        const usageRow = saleItem.batchUsage.find(
          (b) => String(b.batchId) === String(alloc.batchId)
        );
        if (usageRow) {
          usageRow.returnedQty = (usageRow.returnedQty || 0) + alloc.restoreQty;
        }
      }
    }

    const newQuantity = await getTotalStock(tenantId, item.productId);
    const activity = getInventoryActivity(INVENTORY_TYPES.RETURN, item.quantity);
    const primaryWarehouse = allocations[0].warehouseId;

    await Inventory.create({
      tenantId,
      productId: item.productId,
      productName: product.name,
      sku: product.sku,
      warehouseId: primaryWarehouse,
      type: INVENTORY_TYPES.RETURN,
      quantity: item.quantity,
      previousQuantity,
      newQuantity,
      reference,
      note: note || `Customer return — restored to batch ${batchUsageLog.map((b) => b.batchNumber).join(', ')}`,
      activityText: activity.text,
      activityIcon: activity.icon,
      createdBy: userId,
      batchUsage: batchUsageLog,
      batchNumber: batchUsageLog.map((b) => b.batchNumber).join(', ')
    });
  }
};

/** Track damaged/defective — no stock increase */
const writeOffItems = async ({
  tenantId,
  userId,
  items,
  reference,
  returnExchangeId,
  originalSaleId,
  originalInvoiceId,
  note
}) => {
  const warehouse = await resolveWarehouse(tenantId);

  for (const item of items) {
    const product = await Product.findOne({ _id: item.productId, tenantId });
    if (!product) throw new Error(`Product not found: ${item.productName}`);

    const currentStock = await getTotalStock(tenantId, item.productId);

    await WriteOff.create({
      tenantId,
      referenceId: reference,
      returnExchangeId,
      originalSaleId,
      originalInvoiceId,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      condition: item.condition,
      reason: item.reason || '',
      unitValue: item.unitPrice,
      lineValue: item.lineTotal,
      notes: note || '',
      processedBy: userId
    });

    const activity = getInventoryActivity(INVENTORY_TYPES.WRITE_OFF, item.quantity);

    await Inventory.create({
      tenantId,
      productId: item.productId,
      productName: product.name,
      sku: product.sku,
      warehouseId: warehouse._id,
      type: INVENTORY_TYPES.WRITE_OFF,
      quantity: item.quantity,
      previousQuantity: currentStock,
      newQuantity: currentStock,
      reference,
      note: `Written off (${item.condition}) — not added to sellable stock`,
      activityText: activity.text,
      activityIcon: activity.icon,
      createdBy: userId
    });
  }
};

/** Deduct stock for exchange items (FIFO) */
const deductExchangeItems = async ({ tenantId, userId, items, reference }) => {
  for (const item of items) {
    const product = await Product.findOne({ _id: item.productId, tenantId });
    if (!product) throw new Error(`Product not found: ${item.productName}`);

    const batches = await Batch.find({
      tenantId,
      productId: item.productId,
      remainingQty: { $gt: 0 }
    }).sort({ receivedDate: 1 });

    let qtyToDeduct = item.quantity;
    const batchUsage = [];

    for (const batch of batches) {
      if (qtyToDeduct <= 0) break;
      const deduct = Math.min(batch.remainingQty, qtyToDeduct);
      batch.remainingQty -= deduct;
      await batch.save();
      batchUsage.push({
        batchId: batch._id,
        batchNumber: batch.batchNumber,
        deductedQty: deduct
      });
      qtyToDeduct -= deduct;

      const stock = await Stock.findOne({
        tenantId,
        productId: item.productId,
        warehouseId: batch.warehouseId
      });
      if (stock) {
        stock.quantity = Math.max(0, stock.quantity - deduct);
        await stock.save();
      }
    }

    if (qtyToDeduct > 0) {
      throw new Error(`Insufficient stock for exchange: ${item.productName}`);
    }

    const previousQuantity = await getTotalStock(tenantId, item.productId) + item.quantity;
    const newQuantity = await getTotalStock(tenantId, item.productId);
    const activity = getInventoryActivity(INVENTORY_TYPES.EXCHANGE, item.quantity);
    const primaryBatch = batchUsage[0];

    await Inventory.create({
      tenantId,
      productId: item.productId,
      productName: product.name,
      sku: product.sku,
      warehouseId: batches[0]?.warehouseId,
      type: INVENTORY_TYPES.EXCHANGE,
      quantity: item.quantity,
      previousQuantity,
      newQuantity,
      reference,
      note: 'Exchange — new item issued',
      activityText: activity.text,
      activityIcon: activity.icon,
      createdBy: userId,
      batchUsage,
      batchNumber: primaryBatch?.batchNumber
    });
  }
};

const calculateSettlement = (subtotalReturned, subtotalExchanged, restockingFeePercent) => {
  const restockingFee = (subtotalReturned * (restockingFeePercent || 0)) / 100;
  const returnedNet = Math.max(0, subtotalReturned - restockingFee);
  const priceDifference = subtotalExchanged - returnedNet;

  let settlementType = 'even';
  let refundAmount = 0;
  let amountDue = 0;

  if (priceDifference > 0.005) {
    settlementType = 'collect';
    amountDue = Math.round(priceDifference * 100) / 100;
  } else if (priceDifference < -0.005) {
    settlementType = 'refund';
    refundAmount = Math.round(Math.abs(priceDifference) * 100) / 100;
  }

  return { restockingFee, returnedNet, priceDifference, settlementType, refundAmount, amountDue };
};

const updateSaleReturnStatus = (sale) => {
  const allReturned = sale.items.every(
    (i) => (i.returnedQty || 0) >= (i.quantity || 0)
  );
  const anyReturned = sale.items.some((i) => (i.returnedQty || 0) > 0);

  if (allReturned) sale.returnStatus = 'full';
  else if (anyReturned) sale.returnStatus = 'partial';
  else sale.returnStatus = 'none';
};

module.exports = {
  DEFAULT_POLICY,
  SELLABLE,
  WRITE_OFF_CONDITIONS,
  getOrCreatePolicy,
  getNextReference,
  isWithinWindow,
  getReturnableQty,
  resolveItemCondition,
  isRestockable,
  restockItems,
  writeOffItems,
  deductExchangeItems,
  calculateSettlement,
  updateSaleReturnStatus
};
