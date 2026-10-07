const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Plan name can only contain lowercase letters, numbers, and hyphens']
    },
    displayName: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    description: {
      type: String,
      default: ''
    },
    features: [{
      type: String,
      trim: true
    }],
    color: {
      type: String,
      default: '#0ea5e9'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    sortOrder: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Plan', planSchema);
