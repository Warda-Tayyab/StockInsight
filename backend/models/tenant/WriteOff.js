const mongoose = require('mongoose');

const writeOffSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  referenceId: { type: String, required: true },
  returnExchangeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReturnExchange'
  },
  originalSaleId: mongoose.Schema.Types.ObjectId,
  originalInvoiceId: String,
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  condition: {
    type: String,
    enum: ['damaged', 'defective'],
    required: true
  },
  reason: { type: String, default: '' },
  unitValue: { type: Number, default: 0 },
  lineValue: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

writeOffSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model('WriteOff', writeOffSchema);
