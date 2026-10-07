const mongoose = require('mongoose');

const returnExchangePolicySchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    unique: true,
    index: true
  },
  returnsEnabled: { type: Boolean, default: true },
  exchangesEnabled: { type: Boolean, default: true },
  returnWindowDays: { type: Number, default: 14, min: 0, max: 365 },
  exchangeWindowDays: { type: Number, default: 14, min: 0, max: 365 },
  requireReceipt: { type: Boolean, default: true },
  allowPartialReturn: { type: Boolean, default: true },
  allowDiscountedProductReturns: {
    type: Boolean,
    default: true
  },
  
  allowDiscountedProductExchanges: {
    type: Boolean,
    default: true
  },
  allowCouponSaleReturns: {
    type: Boolean,
    default: false
  },
  allowCouponSaleExchanges: {
    type: Boolean,
    default: false
  },
  restockingFeePercent: { type: Number, default: 0, min: 0, max: 100 },
  refundMethods: {
    type: [String],
    enum: ['cash', 'card', 'store_credit'],
    default: ['cash', 'card', 'store_credit']
  },
  collectionMethods: {
    type: [String],
    enum: ['cash', 'card'],
    default: ['cash', 'card']
  },
  defaultRefundMethod: {
    type: String,
    enum: ['cash', 'card', 'store_credit'],
    default: 'cash'
  },
  defaultCollectionMethod: {
    type: String,
    enum: ['cash', 'card'],
    default: 'cash'
  },
  exchangePricePolicy: {
    type: String,
    enum: ['same_price', 'current_price'],
    default: 'current_price'
  },
  taxRatePercent: { type: Number, default: 8, min: 0, max: 100 },
  taxLabel: { type: String, default: 'Tax' },
  workingHours: { type: String, default: '11:00 AM - 11:00 PM' },
  workingHoursFriday: { type: String, default: '3:00 PM - 11:00 PM' },
  receiptFooterMessage: { type: String, default: '' },
  allowedReasons: {
    type: [String],
    default: ['Defective product', 'Wrong item', 'Changed mind', 'Damaged packaging', 'Other']
  },
  /** Reasons that auto-mark item as written-off (not restocked) */
  autoWriteOffReasons: {
    type: [String],
    default: ['Defective product', 'Damaged packaging']
  },
  policyNotes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('ReturnExchangePolicy', returnExchangePolicySchema);
