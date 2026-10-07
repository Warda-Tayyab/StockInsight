const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    email: { type: String },
    method: {
      type: String,
      enum: ['password', 'google'],
      default: 'password',
    },
    deviceName: {
  type: String,
  default: ''
},
    ip: { type: String },
    userAgent: { type: String }
  },
  
  { timestamps: true }
);

loginHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('LoginHistory', loginHistorySchema);
