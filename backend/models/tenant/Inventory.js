const mongoose = require('mongoose');
const INVENTORY_TYPES = require('../../constants/inventoryTypes');
const inventorySchema = new mongoose.Schema({

  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant id is required']
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
  type: {
  type: String,
  enum: Object.values(INVENTORY_TYPES),
  required: true
}
,
  activityText: {
  type: String,
  default: ''
},
activityIcon: {
  type: String,
  default: ''
},
batchUsage: [
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch'
    },
    batchNumber: String,
    deductedQty: Number
  }
],
batchNumber: {
  type: String
},
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be greater than 0']
  },

  previousQuantity: {
    type: Number,
    required: true
  },

  newQuantity: {
    type: Number,
    required: true
  },

  reference: {
    type: String,
    default: null
  },

  note: {
    type: String,
    default: ''
  },
  adjustmentDifference: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  productName: {
    type: String,
    required: true
  },
  sku: {
    type: String
  },
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);