const Batch = require('../models/tenant/Batch');

const roundMoney = (amount) => Math.round((amount + Number.EPSILON) * 100) / 100;

const getDaysUntilExpiry = (expiryDate, now = new Date()) => {
  if (!expiryDate) return null;
  return Math.ceil((new Date(expiryDate) - now) / (1000 * 60 * 60 * 24));
};

const getFifoBatchBreakdown = async (tenantId, productId, quantity) => {
  const batches = await Batch.find({
    tenantId,
    productId,
    remainingQty: { $gt: 0 }
  })
    .sort({ receivedDate: 1 })
    .lean();

  let qtyLeft = quantity;
  const breakdown = [];

  for (const batch of batches) {
    if (qtyLeft <= 0) break;

    const qty = Math.min(batch.remainingQty, qtyLeft);
    breakdown.push({
      batchId: batch._id,
      batchNumber: batch.batchNumber,
      expiryDate: batch.expiryDate,
      qty
    });
    qtyLeft -= qty;
  }

  return breakdown;
};

const enrichCartItemsWithBatchBreakdown = async (tenantId, cartItems = []) => {
  const enriched = [];

  for (const item of cartItems) {
    const quantity = Number(item.quantity) || 0;
    const lineTotal = Number(item.lineTotal) || 0;
    const unitPrice = quantity > 0 ? lineTotal / quantity : 0;
    const breakdown = await getFifoBatchBreakdown(tenantId, item.productId, quantity);

    enriched.push({
      ...item,
      batchBreakdown: breakdown.map((entry) => ({
        ...entry,
        lineTotal: roundMoney(unitPrice * entry.qty)
      }))
    });
  }

  return enriched;
};

const getExpiringLineTotal = (item, expiryWithinDays, now = new Date()) => {
  const withinDays = Number(expiryWithinDays) || 30;

  return (item.batchBreakdown || []).reduce((sum, entry) => {
    const daysLeft = getDaysUntilExpiry(entry.expiryDate, now);
    if (daysLeft == null || daysLeft < 0 || daysLeft > withinDays) {
      return sum;
    }
    return sum + (entry.lineTotal || 0);
  }, 0);
};

const getSelectedBatchLineTotal = (item, batchIds = []) => {
  const selected = new Set((batchIds || []).map((id) => String(id)));

  return (item.batchBreakdown || []).reduce((sum, entry) => {
    if (!selected.has(String(entry.batchId))) return sum;
    return sum + (entry.lineTotal || 0);
  }, 0);
};

module.exports = {
  roundMoney,
  getDaysUntilExpiry,
  getFifoBatchBreakdown,
  enrichCartItemsWithBatchBreakdown,
  getExpiringLineTotal,
  getSelectedBatchLineTotal
};
