const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },

  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },

  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },

  batchNumber: {
    type: String,
    required: true
  },

  quantity: {
    type: Number,
    required: true
  },

  remainingQty: {
    type: Number,
    required: true
  },

  purchasePrice: Number,

  receivedDate: {
    type: Date,
    default: Date.now
  },
   expiryDate: {
    type: Date,
    default: null
  },

  reference: {
    type: String,
    default: null
  },

  /** Original batch when this row was created via transfer */
  sourceBatchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    default: null,
  },

}, { timestamps: true });

batchSchema.index({ tenantId: 1, productId: 1, warehouseId: 1, batchNumber: 1 });

module.exports = mongoose.model('Batch', batchSchema);