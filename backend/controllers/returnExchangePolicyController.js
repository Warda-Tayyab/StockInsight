const { getOrCreatePolicy, DEFAULT_POLICY } = require('../utils/returnExchangeHelper');

exports.getPolicy = async (req, res) => {
  try {
    const policy = await getOrCreatePolicy(req.auth.tenantId);
    res.json({ success: true, policy });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updatePolicy = async (req, res) => {
  try {
    const ReturnExchangePolicy = require('../models/tenant/ReturnExchangePolicy');
    const tenantId = req.auth.tenantId;
    const allowed = [
      'returnsEnabled', 'exchangesEnabled', 'allowDiscountedProductReturns',
      'allowDiscountedProductExchanges','returnWindowDays', 'exchangeWindowDays',
      'requireReceipt', 'allowPartialReturn', 'restockingFeePercent', 'taxRatePercent',
      'taxLabel', 'workingHours', 'workingHoursFriday', 'receiptFooterMessage',
      'refundMethods', 'collectionMethods', 'defaultRefundMethod', 'defaultCollectionMethod',
      'exchangePricePolicy', 'allowedReasons', 'autoWriteOffReasons', 'policyNotes'
    ];

    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const policy = await ReturnExchangePolicy.findOneAndUpdate(
      { tenantId },
      { $set: updates },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, policy });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDefaultPolicy = (req, res) => {
  res.json({ success: true, policy: DEFAULT_POLICY });
};
