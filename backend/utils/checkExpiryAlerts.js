const Batch = require('../models/tenant/Batch');

const checkExpiryAlerts = async (tenantId) => {

  const today = new Date();

  // 🔔 Expiring Soon = next 6 months
  const sixMonthsLater = new Date(today);
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

  const batches = await Batch.find({
    tenantId,
    remainingQty: { $gt: 0 },
    expiryDate: { $ne: null }
  });

  const alerts = [];

  for (let batch of batches) {
    const expiry = new Date(batch.expiryDate);

    // 🔴 EXPIRED
    if (expiry < today) {
      alerts.push({
        type: 'expired',
        batchId: batch._id,
        batchNumber: batch.batchNumber,
        productId: batch.productId,
        warehouseId: batch.warehouseId
      });
    }

    // 🟠 EXPIRING SOON = within next 6 months
    if (expiry >= today && expiry <= sixMonthsLater) {
      alerts.push({
        type: 'expiring',
        batchId: batch._id,
        batchNumber: batch.batchNumber,
        productId: batch.productId,
        warehouseId: batch.warehouseId
      });
    }
  }

  return alerts;
};

module.exports = checkExpiryAlerts;