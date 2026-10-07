const Inventory = require('../models/tenant/Inventory');
const Product = require('../models/tenant/Product');
const Warehouse = require('../models/tenant/Warehouse');
const Stock = require('../models/tenant/Stock');
const Batch = require('../models/tenant/Batch');
const generateBatchNumber = require('../utils/generateBatchNumber');
const getInventoryActivity = require('../utils/inventoryActivityHelper');
const createNotification = require('../utils/createNotification');
const sendAlerts = require('../utils/alertEngine');
const { receiveStockLine } = require('../utils/stockMovementService');
const INVENTORY_TYPES = require('../constants/inventoryTypes');
const { getStoreLocationIds, getWarehouseLocationIds } = require('../utils/locationStockHelper');
const {
  getPurchasedLowStockRows,
  getPurchasedStockAlerts,
  getPurchasedExpiryAlerts,
} = require('../utils/lowStockHelpers');
/**
 * ======================================================
 * ✅ 1. GET INVENTORY LIST (Current stock for frontend)
 * ======================================================
 */
exports.getInventory = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;

    const stock = await Stock.find({ tenantId })
      .populate('productId', 'name sku reorderLevel')
      .populate('warehouseId', 'name locationType code');

    res.json(stock);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * One row per product with warehouse vs store breakdown (for inventory list UI).
 */
exports.getInventorySummary = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { search } = req.query;

    const [storeIds, warehouseIds, stockRows] = await Promise.all([
      getStoreLocationIds(tenantId),
      getWarehouseLocationIds(tenantId),
      Stock.find({ tenantId, quantity: { $gt: 0 } })
        .populate({
          path: 'productId',
          select: 'name sku reorderLevel unit categoryId',
          populate: { path: 'categoryId', select: 'name' }
        })
        .populate('warehouseId', 'name locationType code')
        .lean(),
    ]);

    const storeIdSet = new Set(storeIds.map(String));
    const warehouseIdSet = new Set(warehouseIds.map(String));
    const productMap = new Map();

    for (const row of stockRows) {
      if (!row.productId?._id || !row.warehouseId?._id) continue;

      const key = String(row.productId.name || '').trim().toLowerCase();

      if (!productMap.has(key)) {
        productMap.set(key, {
          productId: row.productId._id,
          name: row.productId.name,
          sku: row.productId.sku,
          unit: row.productId.unit || 'pcs',
          reorderLevel: row.productId.reorderLevel || 0,
          warehouseQty: 0,
          storeQty: 0,
          totalQty: 0,
          locations: [],
        });
      }

      const entry = productMap.get(key);
      const qty = Number(row.quantity) || 0;
      const locId = String(row.warehouseId._id);
      const locType = row.warehouseId.locationType || 'store';

      if (warehouseIdSet.has(locId)) {
        entry.warehouseQty += qty;
      } else if (storeIdSet.has(locId)) {
        entry.storeQty += qty;
      } else {
        entry.storeQty += qty;
      }

      entry.totalQty += qty;
      entry.locations.push({
        locationId: row.warehouseId._id,
        name: row.warehouseId.name,
        locationType: locType,
        quantity: qty,
      });
    }

    let results = Array.from(productMap.values());

    if (search) {
      const q = String(search).trim().toLowerCase();
      results = results.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q)
      );
    }

    results.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/**
 * ======================================================
 * ✅ 2. STOCK IN (Add inventory) — prefer Purchase Receive for tracked buys
 * ======================================================
 */
exports.createInventory = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const userId = req.auth.userId;
    const io = req.app.get('io');
    let { productId, warehouseId, quantity, expiryDate, reference, note, purchasePrice } = req.body;
    quantity = Number(quantity);
    if (!productId) {
      return res.status(400).json({ message: 'Product is required' });
    }
    if (!quantity) {
      return res.status(400).json({ message: 'Quantity is required' });
    }
    if ( quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }
    if (!warehouseId) {
      return res.status(400).json({ message: 'Location is required' });
    }

    const result = await receiveStockLine({
      tenantId,
      userId,
      productId,
      warehouseId,
      quantity,
      expiryDate,
      purchasePrice,
      reference,
      note,
      inventoryType: INVENTORY_TYPES.STOCK_IN,
      io,
    });

    res.status(201).json(result.inventory);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/**
 * ======================================================
 * ✅ 3. STOCK OUT 
 * ======================================================
 */
          
exports.stockOutInventory = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const userId = req.auth.userId;
    const io = req.app.get('io');
    let {
      productId,
      warehouseId,
      quantity,
      reference,
      note,
      batchNumber
    } = req.body;

    quantity = Number(quantity);

    // ✅ VALIDATIONS
    if (!productId) {
      return res.status(400).json({ message: 'Product is required' });
    }

    if (!warehouseId) {
      return res.status(400).json({ message: 'Warehouse is required' });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        message: 'Quantity must be greater than 0'
      });
    }

    if (!batchNumber) {
      return res.status(400).json({
        message: 'Batch number is required'
      });
    }

    // ✅ PRODUCT
    const product = await Product.findOne({
      _id: productId,
      tenantId
    });

    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }
    const warehouse = await Warehouse.findOne({
      _id: warehouseId,
      tenantId
    });
    // ✅ STOCK
    let stock = await Stock.findOne({
      tenantId,
      productId,
      warehouseId
    });

    if (!stock || stock.quantity < quantity) {
      return res.status(400).json({
        message: 'Insufficient stock'
      });
    }

    // ✅ FIND BATCH
    const batch = await Batch.findOne({
      tenantId,
      productId,
      warehouseId,
      batchNumber
    });

    if (!batch) {
      return res.status(404).json({
        message: 'Batch not found'
      });
    }

    if (batch.remainingQty < quantity) {
      return res.status(400).json({
        message: 'Insufficient stock in selected batch'
      });
    }

    // ✅ PREVIOUS STOCK
    const previousQuantity = stock.quantity;

    // ✅ DEDUCT BATCH
    batch.remainingQty -= quantity;
    await batch.save();

    // ✅ RECALCULATE STOCK
    const allBatches = await Batch.find({
      tenantId,
      productId,
      warehouseId
    });

    const totalQty = allBatches.reduce(
      (sum, b) => sum + b.remainingQty,
      0
    );

    stock.quantity = totalQty;

    const newQuantity = totalQty;

    await stock.save();
    
    // ✅ BATCH USAGE
    const batchUsage = [{
      batchId: batch._id,
      batchNumber: batch.batchNumber,
      deductedQty: quantity
    }];
const activity = getInventoryActivity('stock_out', quantity);
    // ✅ INVENTORY LOG
    const inventory = await Inventory.create({
      tenantId,
      productId,
      productName: product.name,
      sku: product.sku,
      warehouseId,
      type: 'stock_out',
      quantity,
      previousQuantity,
      newQuantity,
      reference,
      note,
      createdBy: userId,
      batchUsage,
      batchNumber,
      activityText: activity.text,
activityIcon: activity.icon,
    });
    await sendAlerts({
      io,
      tenantId,
      productId,
      warehouseId,
      product,
      warehouse,
      totalQty 
    });
    res.status(201).json(inventory);

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};



/**
 * ======================================================
 * ✅ 4. ADJUST STOCK (Manual adjustment)
 * ======================================================
 */
exports.adjustInventory = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const userId = req.auth.userId;
    const io = req.app.get('io');
    let { productId,  warehouseId, quantity, note,batchNumber} = req.body;
    quantity = Number(quantity);
    if (!productId) {
      return res.status(400).json({ message: 'Product is required' });
    }
    if (!warehouseId) {
      return res.status(400).json({ message: 'Warehouse is required' });
    }
    if (!quantity) {
      return res.status(400).json({ message: 'Quantity is required' });
    }
    if ( quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }
    if (!note) {
      return res.status(400).json({ message: 'Adjustment reason is required' });
    }
    if (!batchNumber) {
  return res.status(400).json({ message: 'Batch number is required' });
}
    let stock = await Stock.findOne({ tenantId, productId, warehouseId });
    const product = await Product.findOne({ _id: productId, tenantId });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const warehouse = await Warehouse.findOne({
      _id: warehouseId,
      tenantId
    });
    if (!stock) {
      stock = await Stock.create({
        tenantId,
        productId,
        warehouseId,
        quantity: 0
      });
    }

   
// 🔥 STEP 1: FIND BATCH
const batch = await Batch.findOne({
  tenantId,
  productId,
  warehouseId,
  batchNumber
});

if (!batch) {
  return res.status(404).json({ message: 'Batch not found' });
}
const previousQuantity = batch.remainingQty;

const difference = quantity - previousQuantity;

const newQuantity = quantity;
// 🔥 STEP 2: UPDATE BATCH
if (difference > 0) {
  batch.remainingQty += difference;
}

if (difference < 0) {
  const reduce = Math.abs(difference);

  if (batch.remainingQty < reduce) {
    return res.status(400).json({ message: 'Not enough batch stock' });
  }

  batch.remainingQty -= reduce;
}

await batch.save();    
// recalculate total stock from all batches
const allBatches = await Batch.find({
  tenantId,
  productId,
  warehouseId
});

const totalQty = allBatches.reduce(
  (sum, b) => sum + b.remainingQty,
  0
);

stock.quantity = totalQty;

await stock.save();
const batchUsage = [{
  batchId: batch._id,
  batchNumber: batch.batchNumber,
  deductedQty: Math.abs(difference)
}];
const activity = getInventoryActivity('adjust', Math.abs(difference));
    const inventory = await Inventory.create({
      tenantId,
      productName: product.name,  
      sku: product.sku,
      productId,
      warehouseId,
      type: 'adjust',
      quantity: Math.abs(difference),
      previousQuantity,
      newQuantity,
      note,
      createdBy: userId,
      adjustmentDifference: difference,
      batchNumber,
      batchUsage,
      activityText: activity.text,
activityIcon: activity.icon,
    });
    await sendAlerts({
      io,
      tenantId,
      productId,
      warehouseId,
      product,
      warehouse,
      totalQty
    });
    res.json(inventory);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



/**
 * ======================================================
 * ✅ 5. INVENTORY HISTORY
 * ======================================================
 */
exports.getInventoryHistory = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { search, type } = req.query;
    const filter = { tenantId };

    if (type && type !== 'all') {
      filter.type = type;
    }

    if (search) {
      filter.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { batchNumber: { $regex: search, $options: 'i' } },
        { reference: { $regex: search, $options: 'i' } },
        { note: { $regex: search, $options: 'i' } },
        { activityText: { $regex: search, $options: 'i' } },
      ];
    }

    const history = await Inventory.find(filter)
      .populate('productId', 'name sku')
      .populate('warehouseId', 'name locationType')
      .populate({
        path: 'createdBy',
        select: 'firstName lastName email',
        model: 'User'
      })
      .sort({ createdAt: -1 })
      .limit(300);

    res.json(history);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
/**
 * ======================================================
 * ✅ 6. Usage HISTORY
 * ======================================================
 */

exports.getProductUsageHistory = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { productId } = req.params;

    const history = await Inventory.find({
      tenantId,
      productId
    })
      .sort({ createdAt: -1 });

    res.json(history);
    }
     catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 /* ✅ 6. LOW STOCK ITEMS
 * ======================================================
 */
exports.getLowStockItems = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { locationId, locationType } = req.query;
    const lowStock = await getPurchasedLowStockRows(tenantId, { locationId, locationType });
    res.json(lowStock);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
/**
 * ======================================================
 * ✅ 7. GET STOCK ALERTS
 * ======================================================
 */
exports.getStockAlerts = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { locationId, mode } = req.query;
    // Alerts page: byLocation (default). Dashboard can pass mode=combined.
    const byLocation = mode !== 'combined';

    const [{ alerts: stockAlerts, locations }, expiryAlerts] = await Promise.all([
      getPurchasedStockAlerts(tenantId, { byLocation }),
      getPurchasedExpiryAlerts(tenantId),
    ]);

    let allAlerts = [...stockAlerts, ...expiryAlerts];

    if (locationId) {
      allAlerts = allAlerts.filter(
        (a) => a.locationId && String(a.locationId) === String(locationId)
      );
    }

    res.json({
      success: true,
      alerts: allAlerts,
      locations,
      mode: byLocation ? 'byLocation' : 'combined',
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/**
 * ======================================================
 * ✅ GET RECENT IN-APP NOTIFICATIONS (bell)
 * ======================================================
 */
exports.getRecentNotifications = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const Notification = require('../models/tenant/Notification');

    const rows = await Notification.find({
      tenantId,
      isRead: false,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({
      success: true,
      notifications: rows.map((n) => ({
        id: String(n._id),
        tenantId: String(tenantId),
        type: n.type,
        title: n.title,
        message: n.message || n.title || 'Alert',
        priority: n.priority,
        time: n.createdAt
          ? new Date(n.createdAt).toLocaleTimeString()
          : '',
        createdAt: n.createdAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * ======================================================
 * ✅ MARK NOTIFICATIONS READ (Clear All)
 * ======================================================
 */
exports.markNotificationsRead = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const Notification = require('../models/tenant/Notification');

    await Notification.updateMany(
      { tenantId, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * ======================================================
 * ✅ 7. GET Batches History
 * ======================================================
 */

  exports.getBatchUsageHistory = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { batchId } = req.params;

    const history = await Inventory.find({
      tenantId,
      "batchUsage.batchId": batchId
    })
      .populate('productId', 'name sku')
      .populate('warehouseId', 'name')
      .populate({
        path: 'createdBy',
        select: 'firstName lastName email',
        model: 'User'
      })
      .sort({ createdAt: -1 });

    res.json(history);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};