const Stock = require('../models/tenant/Stock');
const Batch = require('../models/tenant/Batch');
const Product = require('../models/tenant/Product');
const Warehouse = require('../models/tenant/Warehouse');
const { getPurchasedProductIds } = require('./purchaseReportHelpers');
const { getStockStatus } = require('./reportHelpers');

const normalizeName = (name) => String(name || '').trim().toLowerCase();

const locationLabel = (locType) =>
  locType === 'warehouse' ? 'Warehouse' : 'Store';

/** Merge purchased products by name with qty across all locations. */
const buildPurchasedStockByName = async (tenantId) => {
  const purchasedIds = await getPurchasedProductIds(tenantId);
  if (!purchasedIds.size) {
    return { items: [], purchasedIds };
  }

  const purchasedIdList = [...purchasedIds];

  const [stocks, products] = await Promise.all([
    Stock.find({
      tenantId,
      productId: { $in: purchasedIdList },
    })
      .populate({
        path: 'productId',
        select: 'name sku reorderLevel sellingPrice categoryId costPrice',
        populate: { path: 'categoryId', select: 'name' },
      })
      .populate('warehouseId', 'name locationType code')
      .lean(),
    Product.find({
      tenantId,
      _id: { $in: purchasedIdList },
    })
      .populate('categoryId', 'name')
      .select('name sku reorderLevel sellingPrice categoryId costPrice')
      .lean(),
  ]);

  const map = new Map();

  for (const row of stocks) {
    if (!row.productId?.name) continue;
    const key = normalizeName(row.productId.name);
    if (!map.has(key)) {
      map.set(key, {
        id: String(row.productId._id),
        productId: row.productId,
        name: row.productId.name,
        sku: row.productId.sku,
        category: row.productId.categoryId?.name || '—',
        costPrice: Number(row.productId.costPrice) || 0,
        reorder: Number(row.productId.reorderLevel) || 0,
        quantity: 0,
        locations: [],
      });
    }

    const entry = map.get(key);
    const qty = Number(row.quantity) || 0;
    entry.quantity += qty;

    const reorder = Number(row.productId.reorderLevel) || 0;
    if (reorder > entry.reorder) entry.reorder = reorder;

    if (row.warehouseId?._id) {
      const locId = String(row.warehouseId._id);
      const existingLoc = entry.locations.find((l) => String(l.locationId) === locId);
      if (existingLoc) {
        existingLoc.quantity += qty;
      } else {
        entry.locations.push({
          locationId: row.warehouseId._id,
          name: row.warehouseId.name,
          locationType: row.warehouseId.locationType || 'store',
          quantity: qty,
        });
      }
    }
  }

  for (const product of products) {
    const key = normalizeName(product.name);
    if (!map.has(key)) {
      map.set(key, {
        id: String(product._id),
        productId: product,
        name: product.name,
        sku: product.sku,
        category: product.categoryId?.name || '—',
        costPrice: Number(product.costPrice) || 0,
        reorder: Number(product.reorderLevel) || 0,
        quantity: 0,
        locations: [],
      });
    }
  }

  return { items: [...map.values()], purchasedIds };
};

/**
 * One row per product-name × location (for location-specific alerts).
 * Includes qty=0 stock rows so sold-out products still alert.
 */
const buildPurchasedStockByLocation = async (tenantId) => {
  const purchasedIds = await getPurchasedProductIds(tenantId);
  if (!purchasedIds.size) {
    return { items: [], purchasedIds, locations: [] };
  }

  const purchasedIdList = [...purchasedIds];

  const [stocks, locations] = await Promise.all([
    Stock.find({
      tenantId,
      productId: { $in: purchasedIdList },
    })
      .populate({
        path: 'productId',
        select: 'name sku reorderLevel sellingPrice categoryId',
        populate: { path: 'categoryId', select: 'name' },
      })
      .populate('warehouseId', 'name locationType code')
      .lean(),
    Warehouse.find({ tenantId, isDeleted: false })
      .select('name locationType code')
      .sort({ locationType: 1, name: 1 })
      .lean(),
  ]);

  const map = new Map();

  for (const row of stocks) {
    if (!row.productId?.name || !row.warehouseId?._id) continue;

    const productKey = normalizeName(row.productId.name);
    const locId = String(row.warehouseId._id);
    const key = `${productKey}::${locId}`;

    if (!map.has(key)) {
      map.set(key, {
        id: `${row.productId._id}-${locId}`,
        productId: row.productId,
        name: row.productId.name,
        sku: row.productId.sku,
        reorder: Number(row.productId.reorderLevel) || 0,
        quantity: 0,
        locationId: row.warehouseId._id,
        locationName: row.warehouseId.name,
        locationType: row.warehouseId.locationType || 'store',
        destination: `${row.warehouseId.name} (${locationLabel(row.warehouseId.locationType || 'store')})`,
      });
    }

    const entry = map.get(key);
    entry.quantity += Number(row.quantity) || 0;
    const reorder = Number(row.productId.reorderLevel) || 0;
    if (reorder > entry.reorder) entry.reorder = reorder;
  }

  return {
    items: [...map.values()],
    purchasedIds,
    locations: locations.map((l) => ({
      id: String(l._id),
      name: l.name,
      locationType: l.locationType || 'store',
      label: `${l.name} (${locationLabel(l.locationType || 'store')})`,
    })),
  };
};

const classifyStockItem = (item) => {
  const qty = Number(item.quantity) || 0;
  const reorder = Number(item.reorder) || 0;
  let alertType = null;
  let severity = 'high';

  if (qty === 0) {
    alertType = 'out-of-stock';
    severity = 'critical';
  } else if (reorder > 0 && qty <= reorder) {
    alertType = 'low-stock';
    severity = qty <= Math.max(1, Math.floor(reorder / 2)) ? 'critical' : 'high';
  }

  const suggested = Math.max(reorder * 2 - qty, reorder);

  return {
    ...item,
    current: qty,
    min: reorder,
    suggested,
    severity,
    alertType,
    status: getStockStatus(qty, reorder),
  };
};

/** Low stock rows — evaluated per location so location shortages (Store vs Warehouse) are never merged/hidden. */
const getPurchasedLowStockRows = async (tenantId, { locationId, locationType } = {}) => {
  const { items } = await buildPurchasedStockByLocation(tenantId);
  let filtered = items
    .map(classifyStockItem)
    .filter((item) => item.alertType === 'low-stock');

  if (locationId && locationId !== 'all') {
    filtered = filtered.filter((i) => String(i.locationId) === String(locationId));
  }
  if (locationType && locationType !== 'all') {
    filtered = filtered.filter((i) => String(i.locationType) === String(locationType));
  }

  return filtered.map((item) => ({
    _id: item.id,
    productId: item.productId,
    quantity: item.current,
    reorderPoint: item.min,
    suggested: item.suggested,
    severity: item.severity,
    alertType: item.alertType,
    locationId: item.locationId,
    locationName: item.locationName,
    locationType: item.locationType,
    destination: item.destination,
    locations: [
      {
        locationId: item.locationId,
        name: item.locationName,
        locationType: item.locationType,
        quantity: item.current,
      },
    ],
  }));
};

/**
 * Stock alerts per location (default).
 * Each alert has destination = location name + type.
 */
const getPurchasedStockAlerts = async (tenantId, { byLocation = true } = {}) => {
  if (byLocation) {
    const { items, locations } = await buildPurchasedStockByLocation(tenantId);
    const alerts = items
      .map(classifyStockItem)
      .filter((item) => item.alertType)
      .map((item) => ({
        id: `${item.alertType}-${item.id}`,
        type: item.alertType,
        productId: item.productId,
        quantity: item.current,
        reorderPoint: item.min,
        locationId: item.locationId,
        locationName: item.locationName,
        locationType: item.locationType,
        destination: item.destination,
        severity: item.severity,
        createdAt: new Date(),
      }));
    return { alerts, locations };
  }

  const { items } = await buildPurchasedStockByName(tenantId);
  const alerts = items
    .map(classifyStockItem)
    .filter((item) => item.alertType)
    .map((item) => ({
      id: `${item.alertType}-${item.id}`,
      type: item.alertType,
      productId: item.productId,
      quantity: item.current,
      reorderPoint: item.min,
      locations: item.locations,
      destination:
        item.locations?.length > 0
          ? item.locations
              .map((l) => `${l.name} (${locationLabel(l.locationType)})`)
              .join(' · ')
          : 'All locations',
      locationId: null,
      locationName: 'All locations',
      locationType: 'combined',
      severity: item.severity,
      createdAt: new Date(),
    }));

  return { alerts, locations: [] };
};

/** Expiry alerts for purchased product batches — always location-specific. */
const getPurchasedExpiryAlerts = async (tenantId) => {
  const purchasedIds = await getPurchasedProductIds(tenantId);
  if (!purchasedIds.size) return [];

  const today = new Date();
  const sixMonthsLater = new Date(today);
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

  const batches = await Batch.find({
    tenantId,
    remainingQty: { $gt: 0 },
    expiryDate: { $ne: null },
    productId: { $in: [...purchasedIds] },
  })
    .populate('productId', 'name sku reorderLevel')
    .populate('warehouseId', 'name locationType')
    .lean();

  return batches
    .map((batch) => {
      const expiry = new Date(batch.expiryDate);
      const locationName = batch.warehouseId?.name || '—';
      const locationType = batch.warehouseId?.locationType || 'store';
      const destination = `${locationName} (${locationLabel(locationType)})`;

      const base = {
        productId: batch.productId,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        quantity: batch.remainingQty,
        locationId: batch.warehouseId?._id || null,
        location: locationName,
        locationName,
        locationType,
        destination,
        createdAt: batch.updatedAt || batch._id.getTimestamp?.() || new Date(),
      };

      if (expiry < today) {
        return {
          id: `expired-${batch._id}`,
          type: 'expired',
          severity: 'critical',
          ...base,
        };
      }

      if (expiry >= today && expiry <= sixMonthsLater) {
        return {
          id: `expiring-${batch._id}`,
          type: 'expiring',
          severity: 'high',
          ...base,
        };
      }

      return null;
    })
    .filter(Boolean);
};

/**
 * Low stock report rows — per location by default so destination is clear.
 * Optional locationId filter.
 */
const getPurchasedLowStockReport = async (tenantId, { locationId } = {}) => {
  const { items, locations } = await buildPurchasedStockByLocation(tenantId);
  let rows = items
    .map(classifyStockItem)
    .filter((item) => item.alertType === 'low-stock');

  if (locationId) {
    rows = rows.filter((item) => String(item.locationId) === String(locationId));
  }

  return {
    items: rows.map((item) => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      reorderPoint: item.min,
      quantity: item.current,
      locationId: item.locationId,
      locationName: item.locationName,
      locationType: item.locationType,
      destination: item.destination,
      status: item.status,
    })),
    locations,
  };
};

/** Summary metrics — evaluated per location so low stock count includes all location-level shortages. */
const getPurchasedStockSummary = async (tenantId) => {
  const { items } = await buildPurchasedStockByLocation(tenantId);
  let inStock = 0;
  let lowStock = 0;
  let outOfStock = 0;

  for (const item of items) {
    const classified = classifyStockItem(item);
    if (classified.alertType === 'out-of-stock') outOfStock++;
    else if (classified.alertType === 'low-stock') lowStock++;
    else inStock++;
  }

  return {
    inStock,
    lowStock,
    outOfStock,
    totalProducts: items.length,
    lowStockCount: lowStock + outOfStock,
  };
};

/** Total qty for a product name (purchased records only) — used by alert engine. */
const getPurchasedQtyByProductName = async (tenantId, productName) => {
  const key = normalizeName(productName);
  const { items, purchasedIds } = await buildPurchasedStockByName(tenantId);
  if (!purchasedIds.size) return null;

  const match = items.find((item) => normalizeName(item.name) === key);
  if (!match) return null;

  return {
    quantity: match.quantity,
    reorder: match.reorder,
    product: match.productId,
  };
};

module.exports = {
  buildPurchasedStockByName,
  buildPurchasedStockByLocation,
  classifyStockItem,
  getPurchasedLowStockRows,
  getPurchasedStockAlerts,
  getPurchasedExpiryAlerts,
  getPurchasedLowStockReport,
  getPurchasedStockSummary,
  getPurchasedQtyByProductName,
  locationLabel,
};
