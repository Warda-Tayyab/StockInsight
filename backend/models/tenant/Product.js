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
    required: [true, 'Category is required']
  },
sku: {
  type: String,
  required: [true, 'SKU is required'],
  trim: true
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
    required: [true, 'Selling price is required'],
    min: [0, 'Selling price cannot be negative']
  },

  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },

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
    min: [0, 'Reorder level cannot be negative']
  },

  supplierName: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true
  },

  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'out_of_stock'],
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
module.exports = mongoose.model('Product', productSchema);
