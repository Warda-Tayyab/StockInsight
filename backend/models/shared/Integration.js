const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Integration key can only contain lowercase letters, numbers, and hyphens']
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      enum: ['communication', 'payment', 'analytics', 'automation'],
      default: 'communication'
    },
    status: {
      type: String,
      enum: ['connected', 'disconnected'],
      default: 'disconnected'
    },
    config: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    sortOrder: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Integration', integrationSchema);
