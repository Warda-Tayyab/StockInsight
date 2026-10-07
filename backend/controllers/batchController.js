const Batch = require('../models/tenant/Batch');
const Product = require('../models/tenant/Product');

/**
 * ======================================================
 * ✅ 1. CREATE BATCH (Usually called from STOCK IN)
 * ======================================================
 */
exports.createBatch = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;

    let {
      productId,
      warehouseId,
      quantity,
      expiryDate,
      reference
    } = req.body;

    quantity = Number(quantity);

    if (!productId) return res.status(400).json({ message: 'Product is required' });
    if (!warehouseId) return res.status(400).json({ message: 'Warehouse is required' });
    if (!quantity || quantity <= 0)
      return res.status(400).json({ message: 'Quantity must be greater than 0' });

    const product = await Product.findOne({ _id: productId, tenantId });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const batchNumber = `BATCH-${Date.now()}`;

    const batch = await Batch.create({
      tenantId,
      productId,
      warehouseId,
      batchNumber,
      quantity,
   
      remainingQty: quantity,
      receivedDate: new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      reference: reference || null
    });

    res.status(201).json(batch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const filterDuplicateTransferredBatches = (batches) => {
  const batchGroups = new Map();

  for (const b of batches) {
    const key = `${String(b.tenantId || '')}::${String(b.batchNumber || '')}`;
    if (!batchGroups.has(key)) {
      batchGroups.set(key, []);
    }
    batchGroups.get(key).push(b);
  }

  const result = [];

  for (const group of batchGroups.values()) {
    if (group.length === 1) {
      result.push(group[0]);
      continue;
    }

    const hasActiveStockInGroup = group.some((row) => (row.remainingQty || 0) > 0);

    for (const row of group) {
      const qty = row.remainingQty || 0;
      if (qty > 0) {
        result.push(row);
      } else if (!hasActiveStockInGroup) {
        const zeroRows = group.filter((r) => (r.remainingQty || 0) === 0);
        if (row === zeroRows[0]) {
          result.push(row);
        }
      }
    }
  }

  return result;
};

/**
 * ======================================================
 * ✅ 2. GET ALL BATCHES (FILTERABLE)
 * ======================================================
 */
exports.getBatches = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;

    const { productId, warehouseId } = req.query;

    const filter = { tenantId };

    if (productId) filter.productId = productId;
    if (warehouseId) filter.warehouseId = warehouseId;

    let batches = await Batch.find(filter)
      .populate('productId', 'name sku costPrice sellingPrice barcode supplierName')
      .populate('warehouseId', 'name')
      .sort({ receivedDate: -1 }); // FIFO order

    // Hide 0-quantity transferred source rows if active stock exists in destination location
    if (!warehouseId) {
      batches = filterDuplicateTransferredBatches(batches);
    }

    res.json(batches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * ======================================================
 * ✅ 3. GET PRODUCT BATCHES (VERY IMPORTANT)
 * ======================================================
 */
exports.getProductBatches = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;

    const { productId } = req.params;
    const { warehouseId } = req.query;

    const filter = {
      tenantId,
      productId,
      remainingQty: { $gt: 0 }
    };

    // ✅ Filter by warehouse
    if (warehouseId) {
      filter.warehouseId = warehouseId;
    }

    const batches = await Batch.find(filter)
      .populate('productId', 'name sku costPrice sellingPrice barcode supplierName')
      .populate('warehouseId', 'name')
      .sort({ receivedDate: 1 });

    res.json(batches);

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

/**
 * ======================================================
 * ✅ 4. GET SINGLE BATCH
 * ======================================================
 */
exports.getBatchById = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;

    const batch = await Batch.findOne({
      _id: req.params.id,
      tenantId
    })
      .populate('productId', 'name sku costPrice sellingPrice barcode supplierName')
      .populate('warehouseId', 'name');

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    res.json(batch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * ======================================================
 * ✅ 5. FIFO STOCK DEDUCTION (CORE LOGIC)
 * 👉 USE THIS INSIDE STOCK-OUT CONTROLLER
 * ======================================================
 */
exports.deductFromBatchesFIFO = async (
  tenantId,
  productId,
  warehouseId,
  quantity
) => {
  let qtyToDeduct = quantity;

  const batches = await Batch.find({
    tenantId,
    productId,
    warehouseId,
    remainingQty: { $gt: 0 }
  }).sort({ receivedDate: 1 });

  for (let batch of batches) {
    if (qtyToDeduct <= 0) break;

    const deduct = Math.min(batch.remainingQty, qtyToDeduct);

    batch.remainingQty -= deduct;
    await batch.save();

    qtyToDeduct -= deduct;
  }

  if (qtyToDeduct > 0) {
    throw new Error('Not enough batch stock available');
  }

  return true;
};