const Product = require('../models/tenant/Product');
const Warehouse = require('../models/tenant/Warehouse');
const Stock = require('../models/tenant/Stock');
const Batch = require('../models/tenant/Batch');
const Inventory = require('../models/tenant/Inventory');
const generateBatchNumber = require('../utils/generateBatchNumber');
const getInventoryActivity = require('../utils/inventoryActivityHelper');
const sendAlerts = require('../utils/alertEngine');
const INVENTORY_TYPES = require('../constants/inventoryTypes');

/**
 * Shared stock increase used by:
 * - Manual Stock In (legacy / adjustments)
 * - Purchase Receive (GRN post)
 * - Stock Transfer (destination side)
 */
const receiveStockLine = async ({
  tenantId,
  userId,
  productId,
  warehouseId,
  quantity,
  expiryDate = null,
  purchasePrice = null,
  reference = null,
  note = '',
  inventoryType = INVENTORY_TYPES.STOCK_IN,
  io = null,
  existingBatchId = null,
  preserveBatchNumber = null,
  sourceBatchId = null,
  batchReceivedDate = null,
  batchReference = null,
}) => {
  const qty = Number(quantity);
  if (!productId) throw new Error('Product is required');
  if (!warehouseId) throw new Error('Location is required');
  if (!qty || qty <= 0) throw new Error('Quantity must be greater than 0');

  const product = await Product.findOne({ _id: productId, tenantId });
  if (!product) throw new Error('Product not found');

  const warehouse = await Warehouse.findOne({
    _id: warehouseId,
    tenantId,
    isDeleted: { $ne: true },
  });
  if (!warehouse) throw new Error('Location not found');

  let stock = await Stock.findOne({ tenantId, productId, warehouseId });
  if (!stock) {
    stock = await Stock.create({
      tenantId,
      productId,
      warehouseId,
      quantity: 0,
    });
  }

  const previousQuantity = stock.quantity;
  const newQuantity = previousQuantity + qty;
  stock.quantity = newQuantity;
  await stock.save();

  let createdBatch;
  if (existingBatchId) {
    createdBatch = await Batch.findOne({ _id: existingBatchId, tenantId });
    if (!createdBatch) throw new Error('Batch not found');
    createdBatch.remainingQty = (createdBatch.remainingQty || 0) + qty;
    createdBatch.quantity = (createdBatch.quantity || 0) + qty;
    if (purchasePrice != null) createdBatch.purchasePrice = purchasePrice;
    await createdBatch.save();
  } else if (preserveBatchNumber) {
    createdBatch = await Batch.findOne({
      tenantId,
      productId,
      warehouseId,
      batchNumber: preserveBatchNumber,
    });

    if (createdBatch) {
      createdBatch.remainingQty = (createdBatch.remainingQty || 0) + qty;
      createdBatch.quantity = (createdBatch.quantity || 0) + qty;
      if (purchasePrice != null) createdBatch.purchasePrice = purchasePrice;
      await createdBatch.save();
    } else {
      createdBatch = await Batch.create({
        tenantId,
        productId,
        warehouseId,
        batchNumber: preserveBatchNumber,
        quantity: qty,
        remainingQty: qty,
        expiryDate: expiryDate || null,
        purchasePrice: purchasePrice != null ? Number(purchasePrice) : undefined,
        receivedDate: batchReceivedDate || new Date(),
        reference: batchReference || reference || null,
        sourceBatchId: sourceBatchId || null,
      });
    }
  } else {
    const batchNumber = await generateBatchNumber(tenantId, productId);
    createdBatch = await Batch.create({
      tenantId,
      productId,
      warehouseId,
      batchNumber,
      quantity: qty,
      remainingQty: qty,
      expiryDate: expiryDate || null,
      purchasePrice: purchasePrice != null ? Number(purchasePrice) : undefined,
      receivedDate: new Date(),
      reference: reference || null,
    });
  }

  const batchUsage = [
    {
      batchId: createdBatch._id,
      batchNumber: createdBatch.batchNumber,
      deductedQty: qty,
    },
  ];

  const activity = getInventoryActivity(inventoryType, qty);
  const inventory = await Inventory.create({
    tenantId,
    productId,
    productName: product.name,
    sku: product.sku,
    warehouseId,
    type: inventoryType,
    quantity: qty,
    previousQuantity,
    newQuantity,
    reference,
    note,
    activityText: activity.text,
    activityIcon: activity.icon,
    createdBy: userId,
    batchUsage,
    batchNumber: createdBatch.batchNumber,
  });

  if (io) {
    if (createdBatch?.expiryDate) {
      const createNotification = require('./createNotification');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const exp = new Date(createdBatch.expiryDate);
      const locLabel = `${warehouse.name} (${warehouse.locationType === 'warehouse' ? 'Warehouse' : 'Store'})`;

      if (exp < today) {
        await createNotification(io, {
          tenantId,
          type: 'expired',
          title: `🔴 Received Expired Product - ${locLabel}`,
          message: `🔴 RECEIVED EXPIRED PRODUCT: ${product.name} (Batch: ${createdBatch.batchNumber}) received at ${locLabel} is ALREADY EXPIRED!`,
          productId,
          warehouseId,
          batchId: createdBatch._id,
          priority: 'critical',
          destination: locLabel,
          locationName: warehouse.name,
          locationType: warehouse.locationType,
        });
      } else {
        const sixMonthsLater = new Date(today);
        sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
        if (exp <= sixMonthsLater) {
          await createNotification(io, {
            tenantId,
            type: 'expiring',
            title: `🟠 Received Expiring Product - ${locLabel}`,
            message: `🟠 RECEIVED EXPIRING SOON: ${product.name} (Batch: ${createdBatch.batchNumber}, Exp: ${exp.toLocaleDateString()}) received at ${locLabel} is expiring soon!`,
            productId,
            warehouseId,
            batchId: createdBatch._id,
            priority: 'high',
            destination: locLabel,
            locationName: warehouse.name,
            locationType: warehouse.locationType,
          });
        }
      }
    }

    await sendAlerts({
      io,
      tenantId,
      productId,
      warehouseId,
      product,
      warehouse,
      totalQty: newQuantity,
    });
  }

  return {
    inventory,
    batch: createdBatch,
    stock,
    product,
    warehouse,
    previousQuantity,
    newQuantity,
  };
};

/**
 * Deduct from a specific batch and sync stock quantity for that location.
 */
const deductBatchStock = async ({
  tenantId,
  userId,
  productId,
  warehouseId,
  batchId,
  quantity,
  reference = null,
  note = '',
  inventoryType = INVENTORY_TYPES.STOCK_OUT,
  io = null,
}) => {
  const qty = Number(quantity);
  if (!qty || qty <= 0) throw new Error('Quantity must be greater than 0');

  const product = await Product.findOne({ _id: productId, tenantId });
  if (!product) throw new Error('Product not found');

  const warehouse = await Warehouse.findOne({
    _id: warehouseId,
    tenantId,
    isDeleted: { $ne: true },
  });
  if (!warehouse) throw new Error('Location not found');

  const batch = await Batch.findOne({
    _id: batchId,
    tenantId,
    productId,
    warehouseId,
  });
  if (!batch) throw new Error('Batch not found at source location');
  if ((batch.remainingQty || 0) < qty) {
    throw new Error(`Insufficient batch qty for ${product.name} (${batch.batchNumber})`);
  }

  batch.remainingQty -= qty;
  await batch.save();

  const allBatches = await Batch.find({ tenantId, productId, warehouseId });
  const totalRemaining = allBatches.reduce((sum, b) => sum + (b.remainingQty || 0), 0);

  let stock = await Stock.findOne({ tenantId, productId, warehouseId });
  if (!stock) {
    stock = await Stock.create({
      tenantId,
      productId,
      warehouseId,
      quantity: 0,
    });
  }

  const previousQuantity = stock.quantity;
  stock.quantity = totalRemaining;
  await stock.save();

  const activity = getInventoryActivity(inventoryType, qty);
  const inventory = await Inventory.create({
    tenantId,
    productId,
    productName: product.name,
    sku: product.sku,
    warehouseId,
    type: inventoryType,
    quantity: qty,
    previousQuantity,
    newQuantity: totalRemaining,
    reference,
    note,
    activityText: activity.text,
    activityIcon: activity.icon,
    createdBy: userId,
    batchNumber: batch.batchNumber,
    batchUsage: [
      {
        batchId: batch._id,
        batchNumber: batch.batchNumber,
        deductedQty: qty,
      },
    ],
  });

  if (io) {
    await sendAlerts({
      io,
      tenantId,
      productId,
      warehouseId,
      product,
      warehouse,
      totalQty: totalRemaining,
    });
  }

  return { inventory, batch, stock, product, warehouse, previousQuantity, newQuantity: totalRemaining };
};

module.exports = {
  receiveStockLine,
  deductBatchStock,
};
