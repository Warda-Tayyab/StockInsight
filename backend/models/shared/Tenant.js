const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  tenantId: { type: String, unique: true },
  name: String,
  slug: String,

  status: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active'
  },

  ownerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Tenant', tenantSchema);
