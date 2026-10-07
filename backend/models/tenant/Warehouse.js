const mongoose = require("mongoose");

const warehouseSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

  /**
   * store = retail / selling location (default for small businesses)
   * warehouse = bulk receiving / storage (optional for larger businesses)
   */
  locationType: {
    type: String,
    enum: ['store', 'warehouse'],
    default: 'store',
  },

  code: {
    type: String,
    required: true,
    trim: true
  },

  address: {
    type: String,
    required: true,
    trim: true
  },

  city: {
    type: String,
    required: true,
    trim: true
  },

  country: {
    type: String,
    required: true,
    trim: true
  },

  postalCode: {
    type: String,
    required: true,
    trim: true
  },

  contactPerson: {
    type: String,
    required: true,
    trim: true
  },

  phone: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    trim: true
  },

  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  description: {
    type: String,
    trim: true
  },

  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"
  },

  isDeleted: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

warehouseSchema.index({ tenantId: 1, name: 1 });
warehouseSchema.index({ tenantId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("Warehouse", warehouseSchema);