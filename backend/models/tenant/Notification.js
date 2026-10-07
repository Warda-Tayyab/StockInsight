const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({

  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },

  type: {
    type: String,
    enum: [
      'stock-in',
      'stock-out',
      'adjustment',
      'low-stock',
      'out-of-stock',
      'expired',
      'expiring'
    ]
  },

  title: String,
  message: String,

  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },

  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse'
  },

  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  },

  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },

  isRead: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);