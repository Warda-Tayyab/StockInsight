const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({

  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant id is required']
  },

  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [2, 'Product name must be at least 2 characters']
  },

  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
  /**
   * pending = created from purchase, needs barcode/category/selling price before POS
   * ready = fully configured for sale
   */
  setupStatus: {
    type: String,
    enum: ['pending', 'ready'],
    default: 'ready',
  },
sku: {
  type: String,
  required: [true, 'SKU is required'],
  trim: true,
  uppercase: true
},
barcode: {
  type: String,
  trim: true,
  default: null
},
  
  description: {
    type: String,
    default: ''
  },

  costPrice: {
    type: Number,
    required: [true, 'Cost price is required'],
    min: [0, 'Cost price cannot be negative']
  },

  sellingPrice: {
    type: Number,
    default: 0,
    min: [0, 'Selling price cannot be negative']
  },

  // quantity: {
  //   type: Number,
  //   required: [true, 'Quantity is required'],
  //   min: [0, 'Quantity cannot be negative']
  // },

  unit: {
    type: String,
    enum: {
      values: ['pcs', 'kg', 'box', 'pack', 'litre', 'dozen', 'gram'],
      message: 'Invalid unit value'
    },
    required: [true, 'Unit is required']
  },

  reorderLevel: {
    type: Number,
    required: [true, 'Reorder level is required'],
    min: [1, 'Reorder level cannot be negative']
  },

  supplierName: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true
  },

  status: {
    type: String,
    enum: {
      values: ['active', 'inactive'],
      message: 'Invalid status'
    },
    default: 'active'
  },

  image: {
    type: String,
    default: null
  }

}, { timestamps: true });
// 🔑 Tenant + SKU unique
productSchema.index(
  { tenantId: 1, sku: 1 },
  { unique: true }
);
// Barcode unique per tenant (sparse — products without barcode are allowed)
productSchema.index(
  { tenantId: 1, barcode: 1 },
  { unique: true, sparse: true }
);
productSchema.pre('save', function (next) {
  if (this.sku) {
    this.sku = this.sku.trim().toUpperCase();
  }
  if (this.barcode) {
    this.barcode = this.barcode.trim();
  }
  next();
});
module.exports = mongoose.model('Product', productSchema);
