const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
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

  quantity: {
    type: Number,
    default: 0,
    min: 0
  }

}, { timestamps: true });

stockSchema.index({ tenantId: 1, productId: 1, warehouseId: 1 }, { unique: true });

module.exports = mongoose.model('Stock', stockSchema);