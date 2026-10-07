const Warehouse = require('../models/tenant/Warehouse');
const Stock = require('../models/tenant/Stock');
const Product = require('../models/tenant/Product');

const escapeRegex = (value) =>
  String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Store locations = sellable (POS). Warehouse = bulk only until transferred.
 * Legacy rows without locationType count as store.
 */
const getStoreLocationIds = async (tenantId) => {
  const rows = await Warehouse.find({
    tenantId,
    isDeleted: { $ne: true },
    status: 'active',
    $or: [{ locationType: 'store' }, { locationType: { $exists: false } }],
  })
    .select('_id')
    .lean();

  return rows.map((r) => r._id);
};

const getWarehouseLocationIds = async (tenantId) => {
  const rows = await Warehouse.find({
    tenantId,
    isDeleted: { $ne: true },
    status: 'active',
    locationType: 'warehouse',
  })
    .select('_id')
    .lean();

  return rows.map((r) => r._id);
};

const aggregateStockByProduct = async (tenantId, productIds, { storeOnly = false, warehouseOnly = false } = {}) => {
  const map = new Map();
  if (!productIds?.length) return map;

  const filter = {
    tenantId,
    productId: { $in: productIds },
  };

  if (storeOnly) {
    const storeIds = await getStoreLocationIds(tenantId);
    if (!storeIds.length) return map;
    filter.warehouseId = { $in: storeIds };
  } else if (warehouseOnly) {
    const warehouseIds = await getWarehouseLocationIds(tenantId);
    if (!warehouseIds.length) return map;
    filter.warehouseId = { $in: warehouseIds };
  }

  const stockRows = await Stock.find(filter).select('productId quantity').lean();
  for (const row of stockRows) {
    const key = String(row.productId);
    map.set(key, (map.get(key) || 0) + (Number(row.quantity) || 0));
  }
  return map;
};

const getStoreStockForProduct = async (tenantId, productId) => {
  const map = await aggregateStockByProduct(tenantId, [productId], { storeOnly: true });
  return map.get(String(productId)) || 0;
};

/** Same name + category duplicates (legacy purchase duplicates) */
const getDuplicateProductIds = async (tenantId, productId) => {
  const product = await Product.findOne({ _id: productId, tenantId }).lean();
  if (!product) return [productId];

  const filter = {
    tenantId,
    name: { $regex: new RegExp(`^${escapeRegex(product.name.trim())}$`, 'i') },
  };

  if (product.categoryId) {
    filter.categoryId = product.categoryId;
  } else {
    filter.$or = [{ categoryId: null }, { categoryId: { $exists: false } }];
  }

  const rows = await Product.find(filter).select('_id').lean();
  return rows.length ? rows.map((r) => r._id) : [productId];
};

const getStoreStockForProductGroup = async (tenantId, productId) => {
  const ids = await getDuplicateProductIds(tenantId, productId);
  const map = await aggregateStockByProduct(tenantId, ids, { storeOnly: true });
  let total = 0;
  for (const id of ids) {
    total += map.get(String(id)) || 0;
  }
  return total;
};

module.exports = {
  getStoreLocationIds,
  getWarehouseLocationIds,
  aggregateStockByProduct,
  getStoreStockForProduct,
  getDuplicateProductIds,
  getStoreStockForProductGroup,
};
