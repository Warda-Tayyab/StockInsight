/** @module pos/services/posService - POS API helpers */

import api from '../../shared/utils/api';

const normalizeCode = (v) => String(v || '').trim().toUpperCase();

const toSafeNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const resolveStock = (product) => {
  const candidates = [
    product?.availableStock,
    product?.quantity,
    product?.totalStock,
    product?.stock,
  ];

  for (const c of candidates) {
    if (c !== undefined && c !== null && c !== '') {
      return toSafeNumber(c, 0);
    }
  }

  return 0;
};

/**
 * Normalize backend product into POS cart shape
 */
export const formatPosProduct = (p) => ({
  id: p._id || p.id,

  name: p.name || 'Unnamed Product',

  sku: normalizeCode(p.sku),

  barcode: normalizeCode(p.barcode || ''),

  price: toSafeNumber(
    p.sellingPrice ?? p.price,
    0
  ),

  // Minimum allowed selling price
  costPrice: toSafeNumber(
    p.costPrice,
    0
  ),

  stock: resolveStock(p),

  totalStock: resolveStock(p),

  reorderLevel: toSafeNumber(
    p.reorderLevel,
    0
  ),

  categoryId:
    p.categoryId?._id ||
    p.categoryId ||
    null,

  category:
    p.category?.name ||
    p.categoryId?.name ||
    p.category ||
    'General',

  supplierName: p.supplierName || '',

  image: p.image || null,

  needsSetup: Boolean(p.needsSetup),

  setupStatus: p.setupStatus || 'ready',
});

/**
 * Look up a product by barcode (or SKU) from the database.
 * Used when a USB scanner types a code and sends Enter.
 */
export const lookupProductByBarcode = async (code) => {
  const trimmed = String(code || '').trim();

  if (!trimmed) {
    throw new Error('Barcode is empty');
  }

  const res = await api.get(
    `/api/products/barcode/${encodeURIComponent(trimmed)}`
  );

  return formatPosProduct(res.data);
};

export default {
  formatPosProduct,
  lookupProductByBarcode,
};