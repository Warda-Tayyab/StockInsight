const mongoose = require('mongoose');

const storeDiscountSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
 
  scope: {
    type: String,
    enum: ['product', 'batch'],
    required: true
  },

  productIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],

  batchIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  }],

  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

storeDiscountSchema.index({ tenantId: 1, isActive: 1 });
storeDiscountSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model('StoreDiscount', storeDiscountSchema);
