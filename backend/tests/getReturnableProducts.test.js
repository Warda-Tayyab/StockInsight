const test = require('node:test');
const assert = require('node:assert/strict');

function isBatchPurchasedFromVendor({
  batch,
  vendorName,
  purchasedBatchIds,
  purchasedProductIds,
}) {
  const batchId = String(batch._id);
  const productId = String(batch.productId?._id || batch.productId);
  const sourceBatchId = batch.sourceBatchId ? String(batch.sourceBatchId) : null;

  return (
    purchasedBatchIds.has(batchId) ||
    (sourceBatchId && purchasedBatchIds.has(sourceBatchId)) ||
    purchasedProductIds.has(productId) ||
    (vendorName &&
      batch.productId?.supplierName &&
      vendorName.trim().toLowerCase() === batch.productId.supplierName.trim().toLowerCase())
  );
}

test('returns true when product ID matches vendor purchase receipts across locations', () => {
  const batch = { _id: 'batchStore1', productId: { _id: 'prodGreenTea', supplierName: 'Mirab' } };
  const purchasedProductIds = new Set(['prodGreenTea']);
  const purchasedBatchIds = new Set(['batchWarehouseOriginal']);

  const res = isBatchPurchasedFromVendor({
    batch,
    vendorName: 'Mirab',
    purchasedBatchIds,
    purchasedProductIds,
  });
  assert.equal(res, true);
});

test('returns true when transferred batch sourceBatchId matches original receipt batch ID', () => {
  const batch = { _id: 'batchStore2', sourceBatchId: 'batchWhOrig', productId: { _id: 'prodX' } };
  const purchasedProductIds = new Set();
  const purchasedBatchIds = new Set(['batchWhOrig']);

  const res = isBatchPurchasedFromVendor({
    batch,
    vendorName: 'Mirab',
    purchasedBatchIds,
    purchasedProductIds,
  });
  assert.equal(res, true);
});
