const createNotification = require('./createNotification');
const checkExpiryAlerts = require('./checkExpiryAlerts');
const { getPurchasedQtyByProductName } = require('./lowStockHelpers');
const { getPurchasedProductIds } = require('./purchaseReportHelpers');
const Product = require('../models/tenant/Product');
const Warehouse = require('../models/tenant/Warehouse');
const Stock = require('../models/tenant/Stock');

const normalizeName = (name) => String(name || '').trim().toLowerCase();
const locationLabel = (locType) => (locType === 'warehouse' ? 'Warehouse' : 'Store');

const sendAlerts = async ({
  io,
  tenantId,
  productId,
  product,
  warehouseId,
  warehouse,
  totalQty,
}) => {
  const purchasedIds = await getPurchasedProductIds(tenantId);
  if (!purchasedIds.size) return;

  let prod = product;
  if (!prod?.name && productId) {
    prod = await Product.findById(productId).select('name reorderLevel');
  }
  if (!prod?.name) return;

  let loc = warehouse;
  if (!loc?.name && warehouseId) {
    loc = await Warehouse.findById(warehouseId).select('name locationType');
  }

  const locName = loc?.name || '';
  const locType = loc?.locationType || 'store';
  const destString = locName ? ` at ${locName} (${locationLabel(locType)})` : '';

  const isPurchased =
    purchasedIds.has(String(productId)) ||
    (await Product.find({
      tenantId,
      name: prod.name,
      _id: { $in: [...purchasedIds] },
    }).limit(1)).length > 0;

  if (!isPurchased) return;

  const reorderLevel = Number(prod.reorderLevel ?? 0);
  let qty = totalQty;

  if (qty == null && warehouseId) {
    const stockDoc = await Stock.findOne({ tenantId, productId: prod._id, warehouseId });
    qty = stockDoc ? stockDoc.quantity : 0;
  }

  if (qty == null) {
    const merged = await getPurchasedQtyByProductName(tenantId, prod.name);
    if (merged) qty = merged.quantity;
  }

  const stockAlerts = [];

  if (qty === 0) {
    stockAlerts.push({ type: 'out-of-stock' });
  } else if (reorderLevel > 0 && qty <= reorderLevel) {
    stockAlerts.push({ type: 'low-stock' });
  }

  for (const alert of stockAlerts) {
    const isOutOfStock = alert.type === 'out-of-stock';
    const locLabel = locName ? `${locName} (${locationLabel(locType)})` : 'all locations';

    await createNotification(io, {
      tenantId,
      type: alert.type,
      title: isOutOfStock
        ? `🚨 Out of Stock Alert - ${locLabel}`
        : `⚠️ Low Stock Alert - ${locLabel}`,
      message: isOutOfStock
        ? `🚨 OUT OF STOCK: ${prod.name} is out of stock at ${locLabel}`
        : `⚠️ LOW STOCK: ${prod.name} is running low in stock (${qty} remaining) at ${locLabel}`,
      productId: prod._id || productId,
      warehouseId: loc?._id || warehouseId || null,
      priority: isOutOfStock ? 'critical' : 'high',
      destination: locLabel,
      locationName: locName,
      locationType: locType,
    });
  }

  const expiryAlerts = await checkExpiryAlerts(tenantId);

  for (const alert of expiryAlerts) {
    if (!purchasedIds.has(String(alert.productId))) continue;

    const alertProduct = await Product.findById(alert.productId).select('name');
    if (!alertProduct) continue;
    if (prod && normalizeName(alertProduct.name) !== normalizeName(prod.name)) continue;

    let alertLocName = locName;
    let alertLocType = locType;
    let alertWarehouseId = alert.warehouseId || loc?._id || warehouseId || null;

    if (alert.warehouseId) {
      const alertWh = await Warehouse.findById(alert.warehouseId).select('name locationType');
      if (alertWh) {
        alertLocName = alertWh.name;
        alertLocType = alertWh.locationType;
        alertWarehouseId = alertWh._id;
      }
    }

    const locLabel = alertLocName
      ? `${alertLocName} (${locationLabel(alertLocType)})`
      : 'location';
    const isExpired = alert.type === 'expired';

    await createNotification(io, {
      tenantId,
      type: alert.type,
      title: isExpired
        ? `🔴 Expired Product Alert - ${locLabel}`
        : `🟠 Expiring Soon Alert - ${locLabel}`,
      message: isExpired
        ? `🔴 EXPIRED PRODUCT: ${alertProduct.name} (Batch: ${alert.batchNumber}) has EXPIRED at ${locLabel}`
        : `🟠 EXPIRING SOON: ${alertProduct.name} (Batch: ${alert.batchNumber}) is expiring soon at ${locLabel}`,
      productId: alert.productId,
      warehouseId: alertWarehouseId,
      batchId: alert.batchId,
      priority: isExpired ? 'critical' : 'high',
      destination: locLabel,
      locationName: alertLocName,
      locationType: alertLocType,
    });
  }
};

module.exports = sendAlerts;
