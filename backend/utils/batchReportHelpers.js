const Batch = require('../models/tenant/Batch');
const { startOfDay } = require('./reportHelpers');
const { locationLabel } = require('./lowStockHelpers');

const filterDuplicateTransferredBatches = (batches) => {
  const batchGroups = new Map();
  for (const b of batches) {
    const key = `${String(b.tenantId || '')}::${String(b.batchNumber || '')}`;
    if (!batchGroups.has(key)) batchGroups.set(key, []);
    batchGroups.get(key).push(b);
  }
  const result = [];
  for (const group of batchGroups.values()) {
    if (group.length === 1) {
      result.push(group[0]);
      continue;
    }
    const hasActive = group.some((row) => (row.remainingQty || 0) > 0);
    for (const row of group) {
      const qty = row.remainingQty || 0;
      if (qty > 0) result.push(row);
      else if (!hasActive) {
        const zeroRows = group.filter((r) => (r.remainingQty || 0) === 0);
        if (row === zeroRows[0]) result.push(row);
      }
    }
  }
  return result;
};

/** Expiry counts aligned with Dashboard (unique productId, remainingQty > 0). */
const buildExpirySummary = async (tenantId) => {
  const today = startOfDay();
  const batches = await Batch.find({ tenantId, expiryDate: { $ne: null } })
    .populate('productId', 'name sku costPrice sellingPrice')
    .populate('warehouseId', 'name locationType code')
    .sort({ expiryDate: 1 })
    .lean();

  const filtered = filterDuplicateTransferredBatches(batches);
  const expiredBatches = [];
  const expiringSoonBatches = [];
  const expiredProductIds = new Set();
  const expiringSoonProductIds = new Set();
  const byLocationMap = new Map();

  let expiredTotalCost = 0;
  let expiredTotalSelling = 0;
  let expiringSoonTotalCost = 0;
  let expiringSoonTotalSelling = 0;

  const storeExpiredProductIds = new Set();
  const storeExpiringSoonProductIds = new Set();
  const warehouseExpiredProductIds = new Set();
  const warehouseExpiringSoonProductIds = new Set();

  let storeExpiredCost = 0;
  let storeExpiredSelling = 0;
  let storeExpiringSoonCost = 0;
  let storeExpiringSoonSelling = 0;

  let warehouseExpiredCost = 0;
  let warehouseExpiredSelling = 0;
  let warehouseExpiringSoonCost = 0;
  let warehouseExpiringSoonSelling = 0;

  for (const b of filtered) {
    const qty = Number(b.remainingQty) || 0;
    if (qty <= 0) continue;

    const expiry = startOfDay(new Date(b.expiryDate));
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    const pid = b.productId?._id ? String(b.productId._id) : '';
    const locId = String(b.warehouseId?._id || 'unknown');
    const locName = b.warehouseId?.name || '—';
    const locType = b.warehouseId?.locationType || 'store';
    const destination = `${locName} (${locationLabel(locType)})`;

    const unitCost = Number(b.productId?.costPrice) || 0;
    const unitSelling = Number(b.productId?.sellingPrice) || 0;
    const batchCostVal = qty * unitCost;
    const batchSellingVal = qty * unitSelling;

    if (!byLocationMap.has(locId)) {
      byLocationMap.set(locId, {
        locationId: locId,
        name: locName,
        destination,
        locationType: locType,
        expiredProductIds: new Set(),
        expiringSoonProductIds: new Set(),
        expiredCostValue: 0,
        expiredSellingValue: 0,
        expiringSoonCostValue: 0,
        expiringSoonSellingValue: 0,
        expired: [],
        expiringSoon: [],
      });
    }
    const loc = byLocationMap.get(locId);
    const row = {
      batchNumber: b.batchNumber || '—',
      name: b.productId?.name || 'Unknown',
      productName: b.productId?.name || 'Unknown',
      product: b.productId?.name || 'Unknown',
      sku: b.productId?.sku || '—',
      destination,
      locationType: locType,
      locationName: locName,
      remainingQty: qty,
      unitCostPrice: `Rs ${unitCost}`,
      unitSellingPrice: `Rs ${unitSelling}`,
      totalCostValue: `Rs ${Math.round(batchCostVal)}`,
      totalSellingValue: `Rs ${Math.round(batchSellingVal)}`,
      expiryDate: expiry.toISOString().split('T')[0],
      daysLeft: diffDays,
    };

    if (diffDays <= 0) {
      expiredBatches.push(row);
      if (pid) expiredProductIds.add(pid);
      loc.expired.push(row);
      if (pid) loc.expiredProductIds.add(pid);
      loc.expiredCostValue += batchCostVal;
      loc.expiredSellingValue += batchSellingVal;

      expiredTotalCost += batchCostVal;
      expiredTotalSelling += batchSellingVal;

      if (locType === 'store') {
        storeExpiredCost += batchCostVal;
        storeExpiredSelling += batchSellingVal;
        if (pid) storeExpiredProductIds.add(pid);
      } else {
        warehouseExpiredCost += batchCostVal;
        warehouseExpiredSelling += batchSellingVal;
        if (pid) warehouseExpiredProductIds.add(pid);
      }
    } else if (diffDays <= 180) {
      expiringSoonBatches.push(row);
      if (pid) expiringSoonProductIds.add(pid);
      loc.expiringSoon.push(row);
      if (pid) loc.expiringSoonProductIds.add(pid);
      loc.expiringSoonCostValue += batchCostVal;
      loc.expiringSoonSellingValue += batchSellingVal;

      expiringSoonTotalCost += batchCostVal;
      expiringSoonTotalSelling += batchSellingVal;

      if (locType === 'store') {
        storeExpiringSoonCost += batchCostVal;
        storeExpiringSoonSelling += batchSellingVal;
        if (pid) storeExpiringSoonProductIds.add(pid);
      } else {
        warehouseExpiringSoonCost += batchCostVal;
        warehouseExpiringSoonSelling += batchSellingVal;
        if (pid) warehouseExpiringSoonProductIds.add(pid);
      }
    }
  }

  const byLocation = [...byLocationMap.values()].map((loc) => ({
    locationId: loc.locationId,
    name: loc.name,
    destination: loc.destination,
    locationType: loc.locationType,
    expiredProductCount: loc.expiredProductIds.size,
    expiringSoonProductCount: loc.expiringSoonProductIds.size,
    expiredCostValue: `Rs ${Math.round(loc.expiredCostValue).toLocaleString('en-PK')}`,
    expiredSellingValue: `Rs ${Math.round(loc.expiredSellingValue).toLocaleString('en-PK')}`,
    expiringSoonCostValue: `Rs ${Math.round(loc.expiringSoonCostValue).toLocaleString('en-PK')}`,
    expiringSoonSellingValue: `Rs ${Math.round(loc.expiringSoonSellingValue).toLocaleString('en-PK')}`,
    expiredCostValueRaw: Math.round(loc.expiredCostValue),
    expiringSoonCostValueRaw: Math.round(loc.expiringSoonCostValue),
    expired: loc.expired,
    expiringSoon: loc.expiringSoon,
  }));

  return {
    expiredProductCount: expiredProductIds.size,
    expiringSoonProductCount: expiringSoonProductIds.size,
    expiredBatchCount: expiredBatches.length,
    expiringSoonBatchCount: expiringSoonBatches.length,
    expiredCount: expiredProductIds.size,
    expiringSoonCount: expiringSoonProductIds.size,
    expiredTotalCostValue: `Rs ${Math.round(expiredTotalCost).toLocaleString('en-PK')}`,
    expiredTotalSellingValue: `Rs ${Math.round(expiredTotalSelling).toLocaleString('en-PK')}`,
    expiringSoonTotalCostValue: `Rs ${Math.round(expiringSoonTotalCost).toLocaleString('en-PK')}`,
    expiringSoonTotalSellingValue: `Rs ${Math.round(expiringSoonTotalSelling).toLocaleString('en-PK')}`,
    storeTotals: {
      expiredProductCount: storeExpiredProductIds.size,
      expiringSoonProductCount: storeExpiringSoonProductIds.size,
      expiredCostValue: `Rs ${Math.round(storeExpiredCost).toLocaleString('en-PK')}`,
      expiredSellingValue: `Rs ${Math.round(storeExpiredSelling).toLocaleString('en-PK')}`,
      expiringSoonCostValue: `Rs ${Math.round(storeExpiringSoonCost).toLocaleString('en-PK')}`,
      expiringSoonSellingValue: `Rs ${Math.round(storeExpiringSoonSelling).toLocaleString('en-PK')}`,
    },
    warehouseTotals: {
      expiredProductCount: warehouseExpiredProductIds.size,
      expiringSoonProductCount: warehouseExpiringSoonProductIds.size,
      expiredCostValue: `Rs ${Math.round(warehouseExpiredCost).toLocaleString('en-PK')}`,
      expiredSellingValue: `Rs ${Math.round(warehouseExpiredSelling).toLocaleString('en-PK')}`,
      expiringSoonCostValue: `Rs ${Math.round(warehouseExpiringSoonCost).toLocaleString('en-PK')}`,
      expiringSoonSellingValue: `Rs ${Math.round(warehouseExpiringSoonSelling).toLocaleString('en-PK')}`,
    },
    expiredBatches,
    expiringSoonBatches,
    expiredProductsList: expiredBatches,
    expiringSoonProductsList: expiringSoonBatches,
    byLocation,
  };
};

module.exports = { filterDuplicateTransferredBatches, buildExpirySummary };
