const mongoose = require('mongoose');

const backupConfigSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      unique: true,
      index: true,
    },
    autoBackupEnabled: {
      type: Boolean,
      default: true,
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly'],
      default: 'daily',
    },
    retentionDays: {
      type: Number,
      default: 14,
      min: 1,
      max: 365,
    },
    lastBackupAt: {
      type: Date,
      default: null,
    },
    lastBackupStatus: {
      type: String,
      enum: ['success', 'failed', 'never'],
      default: 'never',
    },
    lastBackupMessage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('BackupConfig', backupConfigSchema);
