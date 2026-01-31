const mongoose = require('mongoose');
const crypto = require('crypto');

const contactSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, lowercase: true },
  phone: { type: String },
  timezone: { type: String, default: 'UTC' },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  }
}, { _id: false });

const tenantSchema = new mongoose.Schema({
  //tenantId: { type: String, unique: true, default: () => crypto.randomUUID() },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, lowercase: true },

  status: {
    type: String,
    enum: ['active', 'suspended', 'trial'],
    default: 'trial'
  },

  ownerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
   
  },

  ownerEmail: { type: String, required: true, lowercase: true },
  inviteToken: { type: String },
  inviteAccepted: { type: Boolean, default: false },

  primaryContact: { type: contactSchema },

  business: {
    verticals: [{ type: String }],
    useCases: [{ type: String }]
  }

}, { timestamps: true });

module.exports = mongoose.model('Tenant', tenantSchema);
