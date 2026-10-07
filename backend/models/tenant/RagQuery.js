const mongoose = require('mongoose');

const ragQuerySchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  chatSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RagChatSession',
    index: true
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  response: {
    type: String,
    required: true
  },
  sources: {
    type: [String],
    default: []
  }
}, { timestamps: true });

ragQuerySchema.index({ tenantId: 1, createdAt: -1 });
ragQuerySchema.index({ chatSessionId: 1, createdAt: 1 });

module.exports = mongoose.model('RagQuery', ragQuerySchema);
