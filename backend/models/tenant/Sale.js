const mongoose = require('mongoose');

const salesSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
 invoiceId: {
    type: String,
    required: true,
    trim: true
  },
  items: [
    {
      productId: mongoose.Schema.Types.ObjectId,
      productName: String,
      quantity: Number,
      unitPrice: Number,
     
      originalLineTotal: {
        type: Number,
        default: 0
      },
      discountAmount: {
        type: Number,
        default: 0
      },
      discountPercentage: {
        type: Number,
        default: 0
      },
      discountType: {
        type: String,
        enum: ['percentage', 'fixed', null],
        default: null
      },
   
discountValue: {
  type: Number,
  default: 0
},


discountedLineTotal: {
  type: Number,
  default: 0
},
      lineTotal: Number,
      returnedQty: { type: Number, default: 0 },
      batchUsage: [{
        batchId: mongoose.Schema.Types.ObjectId,
        batchNumber: String,
        warehouseId: mongoose.Schema.Types.ObjectId,
        deductedQty: Number,
        returnedQty: { type: Number, default: 0 }
      }]
    }
  ],

  returnStatus: {
    type: String,
    enum: ['none', 'partial', 'full'],
    default: 'none'
  },

  subtotal: Number,
  storeDiscountName: String,
  storeDiscountAmount: { type: Number, default: 0 },
  appliedStoreDiscounts: [{
    name: String,
    type: { type: String, enum: ['percentage', 'fixed'] },
    value: Number,
    amount: Number,
    scopedBase: Number
  }],
  couponCode: String,
  couponDiscountAmount: { type: Number, default: 0 },
  discountTotal: { type: Number, default: 0 },
  tax: Number,
  total: Number,

  paymentMethod: {
    type: String,
    enum: ['cash', 'card'],
    default: 'cash'
  },
  cashReceived: {
    type: Number,
    default: 0
  },
  
  changeReturned: {
    type: Number,
    default: 0
  },
  receipt: {
    companyName: String,
    slug: String,
    location: String,
    phone: String,
    cashier: String,

    returnWindow: Number,
    exchangeWindow: Number,
    returnsEnabled: Boolean,
    exchangesEnabled: Boolean,
    policyNotes: String,
    taxLabel: String,
    workingHours: String,
    workingHoursFriday: String,
    receiptFooterMessage: String,
    receiptMessage: String,
    developedBy: String,
    storeDiscountName: String,
    storeDiscountLabel: String,
    storeDiscountAmount: Number,
    appliedStoreDiscounts: [{
      name: String,
      label: String,
      amount: Number
    }],
    couponCode: String,
    couponLabel: String,
    couponDiscountAmount: Number,
    discountTotal: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Invoice IDs restart per tenant (INV-000001), so uniqueness must be tenant-scoped
salesSchema.index({ tenantId: 1, invoiceId: 1 }, { unique: true });
salesSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model('Sale', salesSchema);