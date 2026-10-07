const mongoose = require('mongoose');

const purchaseReturnItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: String,
  sku: String,
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be greater than 0'],
  },
  unitCost: {
    type: Number,
    default: 0,
  },
  originalUnitCost: {
    type: Number,
    default: 0,
  },
  batchNumber: {
    type: String,
    required: true,
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
  },
  reason: {
    type: String,
    default: '',
  },
});

const purchaseReturnSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant id is required'],
      index: true,
    },
    returnNumber: {
      type: String,
      required: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: [true, 'Supplier is required'],
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Location is required'],
    },
    purchaseOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
    },
    goodsReceiptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GoodsReceipt',
    },
    returnDate: {
      type: Date,
      default: Date.now,
    },
    items: [purchaseReturnItemSchema],
    totalAmount: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['posted', 'cancelled'],
      default: 'posted',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

purchaseReturnSchema.index({ tenantId: 1, returnNumber: 1 }, { unique: true });

module.exports = mongoose.model('PurchaseReturn', purchaseReturnSchema);
