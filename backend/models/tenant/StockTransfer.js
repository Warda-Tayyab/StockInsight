const mongoose = require('mongoose');

const stockTransferItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: String,
    sku: String,
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
    },
    batchNumber: String,
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    /** New batch created at destination after transfer */
    destinationBatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      default: null,
    },
  },
  { _id: true }
);

const stockTransferSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    transferNumber: {
      type: String,
      required: true,
      trim: true,
    },
    fromLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    toLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    transferDate: {
      type: Date,
      default: Date.now,
    },
    items: {
      type: [stockTransferItemSchema],
      validate: [(v) => v.length > 0, 'At least one item is required'],
    },
    status: {
      type: String,
      enum: ['draft', 'completed', 'cancelled'],
      default: 'draft',
    },
    notes: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

stockTransferSchema.index({ tenantId: 1, transferNumber: 1 }, { unique: true });
stockTransferSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model('StockTransfer', stockTransferSchema);
