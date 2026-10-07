const mongoose = require('mongoose');

const lineItemSchema = {
  productId: mongoose.Schema.Types.ObjectId,
  productName: String,
  quantity: Number,
  unitPrice: Number,
  lineTotal: Number,
  reason: String,
  condition: {
    type: String,
    enum: ['sellable', 'damaged', 'defective'],
    default: 'sellable'
  }
};

const returnExchangeSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  referenceId: { type: String, required: true },
  type: { type: String, enum: ['return', 'exchange'], required: true },
  status: { type: String, enum: ['completed', 'cancelled'], default: 'completed' },
  originalSaleId: mongoose.Schema.Types.ObjectId,
  originalInvoiceId: String,
  returnedItems: [lineItemSchema],
  exchangeItems: [lineItemSchema],
  subtotalReturned: { type: Number, default: 0 },
  subtotalExchanged: { type: Number, default: 0 },
  restockingFee: { type: Number, default: 0 },
  returnedNet: { type: Number, default: 0 },
  priceDifference: { type: Number, default: 0 },
  settlementType: {
    type: String,
    enum: ['even', 'refund', 'collect'],
    default: 'even'
  },
  refundAmount: { type: Number, default: 0 },
  amountDue: { type: Number, default: 0 },
  amountCollected: { type: Number, default: 0 },
  refundMethod: String,
  collectionMethod: String,
  writtenOffCount: { type: Number, default: 0 },
  restockedCount: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  policySnapshot: mongoose.Schema.Types.Mixed
}, { timestamps: true });

returnExchangeSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model('ReturnExchange', returnExchangeSchema);
