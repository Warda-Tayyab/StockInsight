const Product = require('../models/tenant/Product');
const generateDocumentNumber = require('./generateDocumentNumber');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const nameRegex = (name) =>
  new RegExp(`^${escapeRegex(String(name).trim())}$`, 'i');

const resolvePurchaseLineProduct = async ({ tenantId, row, vendor }) => {
  if (row.productId) {
    const existing = await Product.findOne({ _id: row.productId, tenantId });
    if (!existing) throw new Error('Product not found');
    return existing;
  }

  const name = String(row.productName || '').trim();
  if (!name) throw new Error('Product name is required on each line');

  const vendorName = vendor?.name || row.supplierName || 'Imported';
  const regex = nameRegex(name);
  const rowUnitCost = Number(row.unitCost) || 0;
  const rowBarcode = row.barcode ? String(row.barcode).trim() : null;

  // Check if an existing product with same name AND matching costPrice & barcode exists
  let product = await Product.findOne({
    tenantId,
    name: regex,
    setupStatus: 'ready',
    ...(rowUnitCost > 0 ? { costPrice: rowUnitCost } : {}),
  }).sort({ updatedAt: -1 });

  if (product && (!rowBarcode || product.barcode === rowBarcode)) {
    if (rowUnitCost > 0) product.costPrice = rowUnitCost;
    if (row.unit) product.unit = row.unit;
    if (!product.supplierName && vendorName) {
      product.supplierName = vendorName;
    }
    await product.save();
    return product;
  }

  // Create new purchase product entry with pending setup status so user can configure barcode, category & selling price
  const sku = await generateDocumentNumber(tenantId, 'purchase_sku', 'PUR');

  product = await Product.create({
    tenantId,
    name,
    sku,
    setupStatus: 'pending',
    status: 'inactive',
    costPrice: rowUnitCost,
    sellingPrice: row.sellingPrice ? Number(row.sellingPrice) : 0,
    unit: row.unit || 'pcs',
    reorderLevel: Number(row.reorderLevel) > 0 ? Number(row.reorderLevel) : 5,
    supplierName: vendorName,
    categoryId: row.categoryId || null,
    barcode: rowBarcode,
  });

  return product;
};

module.exports = { resolvePurchaseLineProduct };
