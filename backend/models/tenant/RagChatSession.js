const mongoose = require('mongoose');

const ragChatSessionSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'New Chat',
    trim: true,
    maxlength: 120
  },
  messageCount: {
    type: Number,
    default: 0
  },
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  },
  isPinned: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

ragChatSessionSchema.index({ tenantId: 1, userId: 1, isArchived: 1, isPinned: -1, updatedAt: -1 });

module.exports = mongoose.model('RagChatSession', ragChatSessionSchema);

