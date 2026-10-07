const StockTransfer = require('../models/tenant/StockTransfer');
const Warehouse = require('../models/tenant/Warehouse');
const Product = require('../models/tenant/Product');
const Batch = require('../models/tenant/Batch');
const generateDocumentNumber = require('../utils/generateDocumentNumber');
const { receiveStockLine, deductBatchStock } = require('../utils/stockMovementService');
const INVENTORY_TYPES = require('../constants/inventoryTypes');

exports.listTransfers = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { status, search } = req.query;
    const filter = { tenantId };
    if (status) filter.status = status;
    if (search) filter.transferNumber = { $regex: search, $options: 'i' };

    const transfers = await StockTransfer.find(filter)
      .populate('fromLocationId', 'name code locationType')
      .populate('toLocationId', 'name code locationType')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: transfers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Products + batches available at a source location (from purchase receive).
 */
exports.getTransferSourceOptions = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { fromLocationId } = req.query;

    if (!fromLocationId) {
      return res.status(400).json({ message: 'fromLocationId is required' });
    }

    const warehouse = await Warehouse.findOne({
      _id: fromLocationId,
      tenantId,
      isDeleted: { $ne: true },
    });
    if (!warehouse) {
      return res.status(404).json({ message: 'Location not found' });
    }

    const batches = await Batch.find({
      tenantId,
      warehouseId: fromLocationId,
      remainingQty: { $gt: 0 },
    })
      .populate('productId', 'name sku unit setupStatus status')
      .sort({ receivedDate: 1 })
      .lean();

    const productMap = new Map();
    for (const batch of batches) {
      if (!batch.productId?._id) continue;
      const pid = String(batch.productId._id);
      if (!productMap.has(pid)) {
        productMap.set(pid, {
          productId: batch.productId._id,
          name: batch.productId.name,
          sku: batch.productId.sku,
          batches: [],
        });
      }
      productMap.get(pid).batches.push({
        _id: batch._id,
        batchNumber: batch.batchNumber,
        remainingQty: batch.remainingQty,
        expiryDate: batch.expiryDate,
        receivedDate: batch.receivedDate,
        reference: batch.reference,
      });
    }

    res.json({ success: true, data: Array.from(productMap.values()) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTransfer = async (req, res) => {
  try {
    const transfer = await StockTransfer.findOne({
      _id: req.params.id,
      tenantId: req.auth.tenantId,
    })
      .populate('fromLocationId', 'name code locationType')
      .populate('toLocationId', 'name code locationType');

    if (!transfer) return res.status(404).json({ message: 'Transfer not found' });
    res.json({ success: true, data: transfer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Create a stock transfer.
 * complete=true posts immediately (deduct from source batch, create batch at destination).
 */
exports.createTransfer = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const userId = req.auth.userId;
    const io = req.app.get('io');
    const { fromLocationId, toLocationId, notes, items, complete = true } = req.body;

    if (!fromLocationId || !toLocationId) {
      return res.status(400).json({ message: 'From and To locations are required' });
    }
    if (String(fromLocationId) === String(toLocationId)) {
      return res.status(400).json({ message: 'From and To locations must be different' });
    }
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: 'At least one item is required' });
    }

    const [fromLoc, toLoc] = await Promise.all([
      Warehouse.findOne({ _id: fromLocationId, tenantId, isDeleted: { $ne: true } }),
      Warehouse.findOne({ _id: toLocationId, tenantId, isDeleted: { $ne: true } }),
    ]);
    if (!fromLoc || !toLoc) {
      return res.status(404).json({ message: 'Location not found' });
    }

    const builtItems = [];
    for (const row of items) {
      const product = await Product.findOne({ _id: row.productId, tenantId });
      if (!product) return res.status(404).json({ message: 'Product not found' });
      const quantity = Number(row.quantity);
      if (!quantity || quantity <= 0) {
        return res.status(400).json({ message: `Invalid quantity for ${product.name}` });
      }
      if (!row.batchId) {
        return res.status(400).json({ message: `Batch is required for ${product.name}` });
      }

      const batch = await Batch.findOne({
        _id: row.batchId,
        tenantId,
        productId: product._id,
        warehouseId: fromLocationId,
      });
      if (!batch) {
        return res.status(400).json({
          message: `Batch not found at source for ${product.name}`,
        });
      }
      if ((batch.remainingQty || 0) < quantity) {
        return res.status(400).json({
          message: `Insufficient qty in batch ${batch.batchNumber}`,
        });
      }

      builtItems.push({
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        batchId: batch._id,
        batchNumber: batch.batchNumber,
        quantity,
      });
    }

    const transferNumber = await generateDocumentNumber(tenantId, 'transfer', 'TRF');
    const transfer = await StockTransfer.create({
      tenantId,
      transferNumber,
      fromLocationId,
      toLocationId,
      notes: notes || '',
      items: builtItems,
      status: 'draft',
      createdBy: userId,
    });

    if (complete) {
      await completeTransferInternal(transfer, tenantId, userId, io);
    }

    const populated = await StockTransfer.findById(transfer._id)
      .populate('fromLocationId', 'name code locationType')
      .populate('toLocationId', 'name code locationType');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.completeTransfer = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const userId = req.auth.userId;
    const io = req.app.get('io');
    const transfer = await StockTransfer.findOne({ _id: req.params.id, tenantId });
    if (!transfer) return res.status(404).json({ message: 'Transfer not found' });
    if (transfer.status === 'completed') {
      return res.status(400).json({ message: 'Transfer already completed' });
    }
    if (transfer.status === 'cancelled') {
      return res.status(400).json({ message: 'Transfer is cancelled' });
    }

    await completeTransferInternal(transfer, tenantId, userId, io);

    const populated = await StockTransfer.findById(transfer._id)
      .populate('fromLocationId', 'name code locationType')
      .populate('toLocationId', 'name code locationType');

    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

async function completeTransferInternal(transfer, tenantId, userId, io) {
  for (const item of transfer.items) {
    const sourceBatch = await Batch.findById(item.batchId);
    await deductBatchStock({
      tenantId,
      userId,
      productId: item.productId,
      warehouseId: transfer.fromLocationId,
      batchId: item.batchId,
      quantity: item.quantity,
      reference: transfer.transferNumber,
      note: `Transfer to location`,
      inventoryType: INVENTORY_TYPES.TRANSFER_OUT,
      io,
    });

    const dest = await receiveStockLine({
      tenantId,
      userId,
      productId: item.productId,
      warehouseId: transfer.toLocationId,
      quantity: item.quantity,
      expiryDate: sourceBatch?.expiryDate || null,
      purchasePrice: sourceBatch?.purchasePrice ?? null,
      reference: transfer.transferNumber,
      note: `Transfer from ${transfer.fromLocationId}`,
      inventoryType: INVENTORY_TYPES.TRANSFER_IN,
      io,
      preserveBatchNumber: sourceBatch?.batchNumber,
      sourceBatchId: sourceBatch?._id,
      batchReceivedDate: sourceBatch?.receivedDate || null,
      batchReference: sourceBatch?.reference || null,
    });

    item.destinationBatchId = dest.batch._id;
  }

  transfer.status = 'completed';
  await transfer.save();
}
