const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({

  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant id is required']
  },

  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true
  },

  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }

}, { timestamps: true });

/**
 * 🚀 Same tenant me duplicate category name allowed nahi
 */
categorySchema.index(
  { tenantId: 1, name: 1 },
  { unique: true }
);

module.exports = mongoose.model('Category', categorySchema);
