const mongoose = require('mongoose');

const PROFESSIONAL_ACTIVITY_TYPES = [
  'super_admin_login',
  'tenant_user_login',
  'tenant_created',
  'tenant_status',
  'tenant_deleted',
  'user_invited',
  'plan_created',
  'plan_updated',
  'plan_deleted'
];

const adminActivitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: PROFESSIONAL_ACTIVITY_TYPES
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    entityType: {
      type: String,
      enum: ['admin', 'user', 'tenant', 'plan'],
      default: 'tenant'
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

adminActivitySchema.index({ createdAt: -1 });
adminActivitySchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('AdminActivity', adminActivitySchema);
module.exports.PROFESSIONAL_ACTIVITY_TYPES = PROFESSIONAL_ACTIVITY_TYPES;
