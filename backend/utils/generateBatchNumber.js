const Counter = require('../models/tenant/Counter');
const Batch = require('../models/tenant/Batch');
const Product = require('../models/tenant/Product');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseBatchSeq = (batchNumber) => {
  const match = String(batchNumber || '').match(/-(\d{3})$/);
  return match ? parseInt(match[1], 10) : 0;
};

const getMaxExistingBatchSeq = async (tenantId, product) => {
  if (!product?.name) return 0;

  const sameNameProducts = await Product.find({
    tenantId,
    name: new RegExp(`^${escapeRegex(String(product.name).trim())}$`, 'i')
  }).select('_id').lean();

  const productIds = sameNameProducts.map((p) => p._id);

  const batches = await Batch.find({ tenantId, productId: { $in: productIds } }).select('batchNumber').lean();
  return batches.reduce((max, row) => Math.max(max, parseBatchSeq(row.batchNumber)), 0);
};

const generateBatchNumber = async (tenantId, productId) => {
  const product = await Product.findById(productId);
  if (!product) throw new Error('Product not found');

  const maxExisting = await getMaxExistingBatchSeq(tenantId, product);
  const counter = await Counter.findOne({ tenantId, productId, type: 'batch' });
  const nextSeq = Math.max((counter?.seq || 0) + 1, maxExisting + 1);

  await Counter.findOneAndUpdate(
    { tenantId, productId, type: 'batch' },
    { $set: { seq: nextSeq } },
    { upsert: true }
  );

  const year = new Date().getFullYear();
  return `BATCH-${year}-${String(nextSeq).padStart(3, '0')}`;
};

module.exports = generateBatchNumber;
