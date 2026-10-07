const mongoose = require('mongoose');

/**
 * Per-tenant SMTP configuration.
 * When enabled=true, outgoing emails (invites, activations, etc.)
 * are sent via this config instead of the global .env SMTP settings.
 */
const emailConfigSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      unique: true,
    },
    enabled: { type: Boolean, default: false },

    provider: {
      type: String,
      trim: true,
      default: 'custom',
    },
    
    host: { type: String, trim: true, default: '' },
    port: { type: Number, default: 587 },
    secure: { type: Boolean, default: false }, // true = port 465
    user: { type: String, trim: true, default: '' },
    pass: { type: String, default: '' },
    fromName: { type: String, trim: true, default: '' },
    fromEmail: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmailConfig', emailConfigSchema);
