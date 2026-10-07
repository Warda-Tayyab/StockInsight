const mongoose = require('mongoose');

const goodsReceiptItemSchema = new mongoose.Schema(
  {
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
      min: 1,
    },
    unitCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      default: null,
    },
    batchNumber: String,
    purchaseOrderItemId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  { _id: true }
);

const goodsReceiptSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    grnNumber: {
      type: String,
      required: true,
      trim: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    purchaseOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      default: null,
    },
    /** Where goods were received (Store or Warehouse) */
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    receivedDate: {
      type: Date,
      default: Date.now,
    },
    items: {
      type: [goodsReceiptItemSchema],
      validate: [(v) => v.length > 0, 'At least one item is required'],
    },
    status: {
      type: String,
      enum: ['draft', 'posted'],
      default: 'draft',
    },
    billId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bill',
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

goodsReceiptSchema.index({ tenantId: 1, grnNumber: 1 }, { unique: true });
goodsReceiptSchema.index({ tenantId: 1, purchaseOrderId: 1 });

module.exports = mongoose.model('GoodsReceipt', goodsReceiptSchema);
